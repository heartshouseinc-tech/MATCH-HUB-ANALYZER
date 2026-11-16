/**
 * AI 解説クライアント
 * --------------------------------------------------
 * ルールベースの診断結果をサーバー（/api/ai-explain）に送り、Gemini の解説文を受け取る。
 * ユーザーの明示的な同意後にのみ呼び出すこと。
 */
import type { AiExplainRequest, AiExplainResponse } from '../../../server/aiExplainTypes'
import { CRITERION_LABELS, type DiagnosisInput, type Recommendation } from '../scoring'
import { PURPOSE_LABELS, REGION_LABELS } from '../../data/labels'
import { formatYen } from '../format'

export type { AiExplainResponse }

/** ビルド時の環境変数 VITE_AI_ENABLED=true で AI 解説を有効化 */
export const AI_ENABLED = import.meta.env.VITE_AI_ENABLED === 'true'

const GENDER_LABELS: Record<DiagnosisInput['gender'], string> = { male: '男性', female: '女性', unspecified: '未回答' }

export function budgetLabel(budget: number) {
  return budget === 0 ? '無料のみ' : budget >= 100000 ? '上限なし' : `〜${formatYen(budget)}`
}

/** 送信内容を組み立てる（上位3件のみ。個人を特定する情報は含めない） */
export function buildExplainRequest(input: DiagnosisInput, recs: Recommendation[]): AiExplainRequest {
  return {
    conditions: {
      age: input.age,
      gender: GENDER_LABELS[input.gender],
      region: REGION_LABELS[input.region],
      partnerAge: `${input.partnerAgeMin}〜${input.partnerAgeMax}歳`,
      purpose: PURPOSE_LABELS[input.purpose],
      budget: budgetLabel(input.budget),
      priorities: input.priorities.map((p) => CRITERION_LABELS[p]),
    },
    apps: recs.slice(0, 3).map((r) => ({
      appId: r.app.id,
      name: r.app.name,
      tagline: r.app.tagline,
      score: r.score,
      rank: r.rank,
      isDemo: r.app.isDemo,
      criteria: r.criteria.map((c) => ({
        label: c.label,
        points: Math.round(c.points * 10) / 10,
        weight: Math.round(c.weight * 10) / 10,
        reason: c.reason,
        dataAvailable: c.dataAvailable,
      })),
    })),
  }
}

export async function fetchAiExplanation(input: DiagnosisInput, recs: Recommendation[], signal?: AbortSignal): Promise<AiExplainResponse> {
  const res = await fetch('/api/ai-explain', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(buildExplainRequest(input, recs)),
    signal,
  })
  if (!res.ok) {
    if (res.status === 429) throw new Error('混み合っています。少し時間をおいてお試しください。')
    if (res.status === 503) throw new Error('AI解説は現在ご利用いただけません。')
    throw new Error('AI解説の取得に失敗しました。')
  }
  return res.json()
}
