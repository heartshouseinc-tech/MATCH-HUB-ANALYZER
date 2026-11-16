import { describe, expect, it, vi } from 'vitest'
import { handleAiExplain, sanitizeRequest } from './aiExplain'

const body = {
  conditions: { age: 30, gender: '男性', region: '関東', partnerAge: '25〜32歳', purpose: '婚活', budget: '〜¥5,000', priorities: [] },
  apps: [
    { appId: 'a', name: 'A', tagline: 't', score: 80, rank: 1, isDemo: true, criteria: [] },
    { appId: 'b', name: 'B', tagline: 't', score: 60, rank: 2, isDemo: true, criteria: [] },
  ],
  extra: 'ignored',
}

const req = (b: unknown) => new Request('http://x/api/ai-explain', { method: 'POST', body: JSON.stringify(b) })

function geminiReply(text: string) {
  return vi.fn(async () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] })))
}

describe('aiExplain', () => {
  it('APIキー未設定なら503', async () => {
    const res = await handleAiExplain(req(body), {})
    expect(res.status).toBe(503)
  })

  it('不正な入力は400', async () => {
    const res = await handleAiExplain(req({ apps: [] }), { GEMINI_API_KEY: 'k' })
    expect(res.status).toBe(400)
  })

  it('入力を正規化し、上限件数に切り詰める', () => {
    const r = sanitizeRequest({ ...body, apps: [...body.apps, ...body.apps, ...body.apps] })
    expect(r.apps).toHaveLength(3)
    expect('extra' in r).toBe(false)
  })

  it('Gemini応答から許可されたappIdのコメントだけ返す', async () => {
    const fetchMock = geminiReply(
      JSON.stringify({ summary: 'まとめ', comments: [{ appId: 'a', comment: 'よい' }, { appId: 'zzz', comment: '捏造' }] }),
    )
    const res = await handleAiExplain(req(body), { GEMINI_API_KEY: 'SECRET-KEY-123' }, fetchMock as unknown as typeof fetch)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.comments).toEqual([{ appId: 'a', comment: 'よい' }])
    expect(json.model).toBe('gemini-2.5-flash')
    // キーはヘッダーで送り、URLに含めない
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).not.toContain('SECRET-KEY-123')
    expect((init.headers as Record<string, string>)['x-goog-api-key']).toBe('SECRET-KEY-123')
  })

  it('レート制限は429で返す', async () => {
    const fetchMock = vi.fn(async () => new Response('', { status: 429 }))
    const res = await handleAiExplain(req(body), { GEMINI_API_KEY: 'SECRET-KEY-123' }, fetchMock as unknown as typeof fetch)
    expect(res.status).toBe(429)
  })

  it('Originを制限できる', async () => {
    const res = await handleAiExplain(req(body), { GEMINI_API_KEY: 'k', ALLOWED_ORIGINS: 'https://ok.example' })
    expect(res.status).toBe(403)
  })
})
