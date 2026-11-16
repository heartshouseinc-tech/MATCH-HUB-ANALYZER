/**
 * AI 解説（Gemini）サーバー側ロジック
 * --------------------------------------------------
 * - スコアはルールベースで算出済み。AI は文章のみを生成し、スコアは変更しない
 * - API キーはサーバー側の環境変数 GEMINI_API_KEY のみで扱う
 * - Cloudflare Pages Functions（functions/api/ai-explain.ts）と
 *   Vite 開発サーバー（vite.config.ts）の両方からこの関数を呼ぶ
 */
import type { AiExplainApp, AiExplainRequest, AiExplainResponse } from './aiExplainTypes'

export interface AiEnv {
  GEMINI_API_KEY?: string
  /** 使用モデル（未指定時は DEFAULT_MODEL） */
  GEMINI_MODEL?: string
  /** 許可する Origin（カンマ区切り）。未指定なら制限しない */
  ALLOWED_ORIGINS?: string
}

export const DEFAULT_MODEL = 'gemini-2.5-flash'
const MAX_BODY_BYTES = 20_000
const MAX_APPS = 3
const MAX_COMMENT = 160
const MAX_SUMMARY = 240

const SYSTEM_PROMPT = `あなたはマッチングアプリ比較サービスの解説担当です。
与えられた「診断条件」と「ルールベースで算出済みのスコア・評価軸ごとの理由」だけを根拠に、日本語でわかりやすく解説してください。

厳守するルール:
- 与えられたデータにない数値・事実（会員数、料金、成功率など）を作らない・推測しない
- 「データ未取得」の項目は、未確認であることをそのまま伝える。良い・悪いと決めつけない
- スコアや順位を変更・否定しない。点数の数値を言い換えない
- 誇大表現（「必ず出会える」「No.1」など）や断定的な勧誘をしない
- isDemo が true のアプリは架空のデモデータである前提で書く（実在サービスとして語らない）
- 安全面の注意（本人確認の有無など）は省略しない
- summary は全体の傾向を${MAX_SUMMARY}文字以内、各 comment は${MAX_COMMENT}文字以内`

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    summary: { type: 'STRING' },
    comments: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: { appId: { type: 'STRING' }, comment: { type: 'STRING' } },
        required: ['appId', 'comment'],
      },
    },
  },
  required: ['summary', 'comments'],
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
  }
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '')
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

/** クライアントからの入力を検証・正規化する（想定外のフィールドは捨てる） */
export function sanitizeRequest(raw: unknown): AiExplainRequest {
  if (!raw || typeof raw !== 'object') throw new HttpError(400, 'invalid body')
  const r = raw as Record<string, unknown>
  const c = (r.conditions ?? {}) as Record<string, unknown>
  if (!Array.isArray(r.apps) || r.apps.length === 0) throw new HttpError(400, 'apps is required')

  const apps: AiExplainApp[] = r.apps.slice(0, MAX_APPS).map((a: Record<string, unknown>) => ({
    appId: str(a.appId, 40),
    name: str(a.name, 40),
    tagline: str(a.tagline, 80),
    score: num(a.score),
    rank: num(a.rank),
    isDemo: a.isDemo !== false,
    criteria: (Array.isArray(a.criteria) ? a.criteria : []).slice(0, 10).map((x: Record<string, unknown>) => ({
      label: str(x.label, 20),
      points: num(x.points),
      weight: num(x.weight),
      reason: str(x.reason, 120),
      dataAvailable: x.dataAvailable === true,
    })),
  }))
  if (apps.some((a) => !a.appId)) throw new HttpError(400, 'appId is required')

  return {
    conditions: {
      age: num(c.age),
      gender: str(c.gender, 10),
      region: str(c.region, 10),
      partnerAge: str(c.partnerAge, 20),
      purpose: str(c.purpose, 10),
      budget: str(c.budget, 20),
      priorities: (Array.isArray(c.priorities) ? c.priorities : []).slice(0, 7).map((p) => str(p, 20)),
    },
    apps,
  }
}

export function buildPrompt(req: AiExplainRequest): string {
  return `以下のデータをもとに、summary と各アプリ（appId ごと）の comment を JSON で返してください。

# 診断条件
${JSON.stringify(req.conditions, null, 2)}

# スコア上位のアプリ（スコアはルールベースで算出済み・変更不可）
${JSON.stringify(req.apps, null, 2)}`
}

/** Gemini の応答を検証し、許可された appId・文字数に整える */
export function parseModelOutput(text: string, req: AiExplainRequest, model: string): AiExplainResponse {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new HttpError(502, 'AI response was not valid JSON')
  }
  const d = data as Record<string, unknown>
  const allowed = new Set(req.apps.map((a) => a.appId))
  const comments = (Array.isArray(d.comments) ? d.comments : [])
    .map((c: Record<string, unknown>) => ({ appId: str(c.appId, 40), comment: str(c.comment, MAX_COMMENT) }))
    .filter((c) => allowed.has(c.appId) && c.comment)
  return { summary: str(d.summary, MAX_SUMMARY), comments, model }
}

export async function explainWithGemini(
  raw: unknown,
  env: AiEnv,
  fetchImpl: typeof fetch = fetch,
): Promise<AiExplainResponse> {
  if (!env.GEMINI_API_KEY) throw new HttpError(503, 'AI is not configured')
  const req = sanitizeRequest(raw)
  const model = env.GEMINI_MODEL || DEFAULT_MODEL

  const generationConfig: Record<string, unknown> = {
    temperature: 0.4,
    maxOutputTokens: 1024,
    responseMimeType: 'application/json',
    responseSchema: RESPONSE_SCHEMA,
  }
  // 2.5 Flash は思考トークンを無効化してコストと待ち時間を抑える
  if (model.startsWith('gemini-2.5-flash')) generationConfig.thinkingConfig = { thinkingBudget: 0 }

  const res = await fetchImpl(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: buildPrompt(req) }] }],
        generationConfig,
      }),
    },
  )
  if (!res.ok) {
    const status = res.status === 429 ? 429 : 502
    throw new HttpError(status, `Gemini API error (${res.status})`)
  }
  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }
  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? ''
  if (!text) throw new HttpError(502, 'AI returned empty response')
  return parseModelOutput(text, req, model)
}

/** Request → Response のハンドラ（Pages Functions / 開発サーバー共通） */
export async function handleAiExplain(request: Request, env: AiEnv, fetchImpl: typeof fetch = fetch): Promise<Response> {
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
    })

  try {
    if (request.method !== 'POST') throw new HttpError(405, 'method not allowed')
    if (env.ALLOWED_ORIGINS) {
      const origin = request.headers.get('origin') ?? ''
      const allowed = env.ALLOWED_ORIGINS.split(',').map((s) => s.trim())
      if (!allowed.includes(origin)) throw new HttpError(403, 'origin not allowed')
    }
    const body = await request.text()
    if (body.length > MAX_BODY_BYTES) throw new HttpError(413, 'payload too large')
    let parsed: unknown
    try {
      parsed = JSON.parse(body)
    } catch {
      throw new HttpError(400, 'invalid json')
    }
    return json(200, await explainWithGemini(parsed, env, fetchImpl))
  } catch (e) {
    if (e instanceof HttpError) return json(e.status, { error: e.message })
    return json(500, { error: 'internal error' })
  }
}
