import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AiExplainPanel } from '../components/AiExplainPanel'
import { CompareToggle } from '../components/AppCard'
import { CriteriaBreakdown, RankingBars, ScoreRing, scoreColor, scoreLabel } from '../components/charts'
import { PageTitle } from '../components/Layout'
import { OutboundButton } from '../components/OutboundButton'
import { AppLogo, Card, DemoBadge, EmptyState, ErrorState, PrBadge, SectionTitle } from '../components/ui'
import { useCompare } from '../context/CompareContext'
import { PURPOSE_LABELS, REGION_LABELS } from '../data/labels'
import { useAppData } from '../hooks/useAppData'
import { DATA_SOURCE } from '../data/repository'
import { loadDiagnosis } from '../lib/diagnosisStore'
import type { AiExplainResponse } from '../lib/ai/explainer'
import { budgetLabel } from '../lib/ai/explainer'
import { findActiveCampaign } from '../lib/outbound'
import { activeEngine, BASE_WEIGHTS, CRITERION_LABELS, PRIORITY_MULTIPLIER, type CriterionKey, type DiagnosisInput, type Recommendation } from '../lib/scoring'
import type { Campaign } from '../types/domain'

function ConditionSummary({ input }: { input: DiagnosisInput }) {
  const items = [
    `${input.age}歳`,
    REGION_LABELS[input.region],
    `相手 ${input.partnerAgeMin}〜${input.partnerAgeMax}歳`,
    PURPOSE_LABELS[input.purpose],
    input.budget >= 100000 ? '予算上限なし' : budgetLabel(input.budget),
    ...input.priorities.map((p) => `重視：${CRITERION_LABELS[p]}`),
  ]
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((t) => (
        <span key={t} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 ring-1 ring-slate-200">
          {t}
        </span>
      ))}
    </div>
  )
}

function ResultCard({
  rec,
  campaigns,
  defaultOpen,
  aiComment,
}: {
  rec: Recommendation
  campaigns: Campaign[]
  defaultOpen: boolean
  aiComment?: string
}) {
  const [open, setOpen] = useState(defaultOpen)
  const { app, score, rank } = rec
  const promoted = findActiveCampaign(app.id, campaigns)?.showPrLabel
  const medal = ['🥇', '🥈', '🥉'][rank - 1]

  return (
    <article className={`rounded-2xl bg-white p-4 shadow-sm ring-1 ${rank === 1 ? 'ring-2 ring-brand-200' : 'ring-slate-100'}`}>
      <div className="flex items-center gap-3">
        <div className="w-7 text-center text-lg font-extrabold text-slate-400">{medal ?? rank}</div>
        <AppLogo app={app} size={44} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Link to={`/apps/${app.id}`} className="truncate font-bold text-slate-900">
              {app.name}
            </Link>
            {app.isDemo && <DemoBadge />}
            {promoted && <PrBadge />}
          </div>
          <p className="text-xs font-bold" style={{ color: scoreColor(score) }}>
            {scoreLabel(score)}
          </p>
        </div>
        <ScoreRing score={score} size={64} />
      </div>

      {aiComment && (
        <div className="mt-3 rounded-xl bg-violet-50 p-3 text-sm leading-relaxed text-slate-700">
          <span className="mr-1 rounded bg-violet-600 px-1 py-0.5 text-[10px] font-bold text-white">AI</span>
          {aiComment}
        </div>
      )}

      {rec.highlights.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-bold text-slate-500">おすすめの理由</p>
          <ul className="mt-1 space-y-1">
            {rec.highlights.slice(0, 3).map((h) => (
              <li key={h} className="flex gap-1.5 text-sm text-slate-700">
                <span className="text-emerald-500">✓</span>
                {h}
              </li>
            ))}
          </ul>
        </div>
      )}
      {rec.cautions.length > 0 && (
        <div className="mt-2">
          <p className="text-xs font-bold text-slate-500">注意点</p>
          <ul className="mt-1 space-y-1">
            {rec.cautions.slice(0, 3).map((h) => (
              <li key={h} className="flex gap-1.5 text-xs text-slate-500">
                <span className="text-amber-500">!</span>
                {h}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mt-3 w-full rounded-xl bg-slate-50 py-2 text-xs font-bold text-slate-500"
      >
        {open ? 'スコア内訳を閉じる ▲' : 'スコア内訳を見る ▼'}
      </button>
      {open && (
        <div className="mt-3">
          <CriteriaBreakdown criteria={rec.criteria} />
        </div>
      )}

      <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
        <OutboundButton app={app} campaigns={campaigns} placement="diagnosis" size="sm" />
        <CompareToggle app={app} compact />
      </div>
    </article>
  )
}

export function DiagnosisResultPage() {
  const navigate = useNavigate()
  const { apps, campaigns, loading, error } = useAppData()
  const [input] = useState(() => loadDiagnosis())
  const [results, setResults] = useState<Recommendation[] | null>(null)
  const { replace } = useCompare()
  const [ai, setAi] = useState<AiExplainResponse | null>(null)

  useEffect(() => {
    if (!input || loading || apps.length === 0) return
    let cancelled = false
    // 演出用の短い待機（AI エンジン導入時の非同期処理にも対応できる構成）
    Promise.all([activeEngine.recommend(input, apps), new Promise((r) => setTimeout(r, 600))]).then(([r]) => {
      if (!cancelled) setResults(r)
    })
    return () => {
      cancelled = true
    }
  }, [input, apps, loading])

  if (!input) {
    return <EmptyState icon="📝" title="まだ診断していません" body="条件を入力して診断してください。" action={{ label: '診断をはじめる', to: '/diagnosis' }} />
  }
  if (error) return <ErrorState message={error} />

  if (!results) {
    return (
      <div className="flex flex-col items-center py-20" role="status">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-100 border-t-brand-500" />
        <p className="mt-4 text-sm font-bold text-slate-600">あなたに合うアプリを分析中…</p>
      </div>
    )
  }

  const compareTop3 = () => {
    replace(results.slice(0, 3).map((r) => r.app.id))
    navigate('/compare')
  }

  const top = results[0]

  return (
    <div className="space-y-4">
      <PageTitle title="診断結果" sub={`${activeEngine.name}による適合スコア`}>
        <Link to="/diagnosis" className="text-xs font-bold text-brand-600">
          条件を変更
        </Link>
      </PageTitle>

      <ConditionSummary input={input} />

      {top && (
        <section className="rounded-3xl bg-gradient-to-br from-brand-500 to-orange-400 p-5 text-white shadow-md">
          <p className="text-xs font-bold opacity-90">あなたに最もおすすめ</p>
          <div className="mt-2 flex items-center gap-3">
            <AppLogo app={top.app} size={52} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xl font-extrabold">{top.app.name}</p>
              <p className="truncate text-xs opacity-90">{top.app.tagline}</p>
            </div>
            <div className="text-right">
              <span className="text-4xl font-extrabold leading-none">{top.score}</span>
              <span className="text-xs opacity-80">/100</span>
            </div>
          </div>
        </section>
      )}

      <AiExplainPanel input={input} results={results} onResult={setAi} />

      <Card>
        <SectionTitle sub="全アプリの適合スコア">スコアランキング</SectionTitle>
        <RankingBars items={results.map((r) => ({ id: r.app.id, label: r.app.name, score: r.score, color: r.app.logo.color }))} />
      </Card>

      <button
        type="button"
        onClick={compareTop3}
        className="w-full rounded-2xl border border-brand-500 bg-white py-3 text-sm font-bold text-brand-600"
      >
        上位3アプリを比較する
      </button>

      <div className="space-y-3">
        {results.map((r) => (
          <ResultCard
            key={r.app.id}
            rec={r}
            campaigns={campaigns}
            defaultOpen={r.rank === 1}
            aiComment={ai?.comments.find((c) => c.appId === r.app.id)?.comment}
          />
        ))}
      </div>

      <Card>
        <SectionTitle sub={activeEngine.description}>スコアの算出方法</SectionTitle>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-slate-400">
              <th className="py-1 text-left font-bold">評価軸</th>
              <th className="py-1 text-right font-bold">基本配点</th>
            </tr>
          </thead>
          <tbody>
            {(Object.keys(BASE_WEIGHTS) as CriterionKey[]).map((k) => (
              <tr key={k} className="border-t border-slate-100">
                <td className="py-1.5">{CRITERION_LABELS[k]}</td>
                <td className="py-1.5 text-right tabular-nums">{BASE_WEIGHTS[k]}点</td>
              </tr>
            ))}
          </tbody>
        </table>
        <ul className="mt-3 space-y-1 text-[11px] leading-relaxed text-slate-500">
          <li>・「重視する条件」に選んだ軸は配点を{PRIORITY_MULTIPLIER}倍にし、合計が100点になるよう再配分します。</li>
          <li>・データ未取得の軸は達成度50%（中立）として扱い、注意点に明記します。</li>
          {DATA_SOURCE === 'demo' && <li>・現在の算出結果は架空のデモデータに基づくもので、実在サービスの評価ではありません。</li>}
          <li>・診断結果は判断材料のひとつです。最新の料金・条件は各公式サイトでご確認ください。</li>
        </ul>
      </Card>
    </div>
  )
}
