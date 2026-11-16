import { useEffect, useRef, useState } from 'react'
import { AI_ENABLED, fetchAiExplanation, type AiExplainResponse } from '../lib/ai/explainer'
import type { DiagnosisInput, Recommendation } from '../lib/scoring'

type State =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'done'; data: AiExplainResponse }
  | { kind: 'error'; message: string }

/**
 * AI 解説パネル。
 * 同意ボタンを押すまで外部送信しない。結果は onResult で親へ渡し、各カードにも表示する。
 */
export function AiExplainPanel({
  input,
  results,
  onResult,
}: {
  input: DiagnosisInput
  results: Recommendation[]
  onResult: (r: AiExplainResponse | null) => void
}) {
  const [state, setState] = useState<State>({ kind: 'idle' })
  const abort = useRef<AbortController | null>(null)

  useEffect(() => () => abort.current?.abort(), [])

  if (!AI_ENABLED) return null

  const run = async () => {
    abort.current?.abort()
    const ctrl = new AbortController()
    abort.current = ctrl
    setState({ kind: 'loading' })
    try {
      const data = await fetchAiExplanation(input, results, ctrl.signal)
      setState({ kind: 'done', data })
      onResult(data)
    } catch (e) {
      if (ctrl.signal.aborted) return
      setState({ kind: 'error', message: e instanceof Error ? e.message : 'AI解説の取得に失敗しました。' })
      onResult(null)
    }
  }

  return (
    <section className="rounded-2xl bg-gradient-to-br from-violet-50 to-sky-50 p-4 ring-1 ring-violet-100">
      <div className="flex items-center gap-2">
        <span className="rounded-md bg-violet-600 px-1.5 py-0.5 text-[10px] font-bold text-white">AI</span>
        <h2 className="font-bold text-slate-900">AIによる解説</h2>
      </div>

      {state.kind === 'done' ? (
        <>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">{state.data.summary}</p>
          <p className="mt-2 text-[10px] text-slate-400">
            {state.data.model} が生成した文章です。スコアと順位には影響しません。内容に誤りが含まれる可能性があります。
          </p>
        </>
      ) : (
        <>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            上位3アプリの診断結果を、AI（Google Gemini）がわかりやすく解説します。スコアと順位は変わりません。
          </p>
          <div className="mt-2 rounded-xl bg-white/70 p-2.5 text-[11px] leading-relaxed text-slate-500">
            ボタンを押すと、診断条件（年齢・性別・地域・相手の年齢・目的・予算・重視条件）とスコア内訳が、当サイトのサーバー経由で Google
            に送信されます。氏名や連絡先などは送信しません。
          </div>
          {state.kind === 'error' && (
            <p role="alert" className="mt-2 text-xs font-bold text-red-600">
              {state.message}
            </p>
          )}
          <button
            type="button"
            onClick={run}
            disabled={state.kind === 'loading'}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-bold text-white disabled:opacity-70"
          >
            {state.kind === 'loading' ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                解説を作成中…
              </>
            ) : state.kind === 'error' ? (
              'もう一度試す'
            ) : (
              '同意してAI解説を見る'
            )}
          </button>
        </>
      )}
    </section>
  )
}
