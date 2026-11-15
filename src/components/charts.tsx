/**
 * 軽量 SVG / CSS チャート（外部ライブラリ不使用）
 */
import type { AgeBand, Metric, Region } from '../types/domain'
import { AGE_BANDS, AGE_BAND_LABELS, ALL_REGIONS, REGION_LABELS } from '../data/labels'
import { hasValue } from '../data/metric'
import { formatPercent } from '../lib/format'
import { NoData, SourceButton } from './MetricValue'
import type { CriterionResult } from '../lib/scoring'

export function scoreColor(score: number) {
  if (score >= 80) return '#e11d48'
  if (score >= 65) return '#f97316'
  if (score >= 50) return '#0ea5e9'
  return '#94a3b8'
}

export function scoreLabel(score: number) {
  if (score >= 80) return 'とても合う'
  if (score >= 65) return '合う'
  if (score >= 50) return 'まずまず'
  return '相性低め'
}

/** 円形スコア */
export function ScoreRing({ score, size = 72 }: { score: number; size?: number }) {
  const stroke = size * 0.11
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const color = scoreColor(score)
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`適合スコア ${score}点`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
          style={{ transition: 'stroke-dashoffset .8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="font-extrabold" style={{ color, fontSize: size * 0.32 }}>
          {score}
        </span>
        <span className="mt-0.5 text-slate-400" style={{ fontSize: Math.max(9, size * 0.13) }}>
          /100
        </span>
      </div>
    </div>
  )
}

/** 横棒（ランキング用） */
export function RankingBars({ items }: { items: { id: string; label: string; score: number; color: string }[] }) {
  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <li key={it.id} className="flex items-center gap-2 text-sm">
          <span className="w-24 shrink-0 truncate text-slate-700">{it.label}</span>
          <span className="relative h-5 flex-1 overflow-hidden rounded-full bg-slate-100">
            <span
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ width: `${it.score}%`, background: it.color, transition: 'width .8s ease' }}
            />
          </span>
          <span className="w-8 text-right font-bold tabular-nums" style={{ color: scoreColor(it.score) }}>
            {it.score}
          </span>
        </li>
      ))}
    </ul>
  )
}

/** 評価軸ごとの内訳 */
export function CriteriaBreakdown({ criteria }: { criteria: CriterionResult[] }) {
  return (
    <ul className="space-y-3">
      {criteria.map((c) => (
        <li key={c.key}>
          <div className="flex items-baseline justify-between gap-2 text-xs">
            <span className="font-bold text-slate-700">
              {c.label}
              {c.prioritized && <span className="ml-1 rounded bg-brand-50 px-1 text-[10px] text-brand-600">重視</span>}
              {!c.dataAvailable && <span className="ml-1 rounded bg-slate-100 px-1 text-[10px] text-slate-400">データ未取得</span>}
              {c.dataAvailable && c.isDemoData && (
                <span className="ml-1 rounded border border-dashed border-amber-300 px-1 text-[10px] text-amber-600">デモ値</span>
              )}
            </span>
            <span className="tabular-nums text-slate-500">
              <b className="text-slate-800">{c.points.toFixed(1)}</b> / {c.weight.toFixed(1)}点
            </span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${c.dataAvailable ? 'bg-brand-500' : 'bg-slate-300'}`}
              style={{ width: `${c.ratio * 100}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">{c.reason}</p>
        </li>
      ))}
    </ul>
  )
}

/** 年齢分布 */
export function AgeDistributionChart({ metric, highlight }: { metric: Metric<Record<AgeBand, number>>; highlight?: AgeBand }) {
  if (!hasValue(metric)) return <NoData />
  const max = Math.max(...AGE_BANDS.map((b) => metric.value[b]))
  return (
    <div>
      <div className="flex h-28 items-end gap-1.5">
        {AGE_BANDS.map((b) => {
          const v = metric.value[b]
          return (
            <div key={b} className="flex flex-1 flex-col items-center justify-end gap-1">
              <span className="text-[10px] tabular-nums text-slate-500">{formatPercent(v)}</span>
              <div
                className={`w-full rounded-t-md ${b === highlight ? 'bg-brand-500' : ''}`}
                style={{ height: `${(v / max) * 80}px`, background: b === highlight ? undefined : '#fecdd3' }}
              />
            </div>
          )
        })}
      </div>
      <div className="mt-1 flex gap-1.5">
        {AGE_BANDS.map((b) => (
          <span key={b} className="flex-1 text-center text-[10px] leading-tight text-slate-500">
            {AGE_BAND_LABELS[b].replace('歳', '')}
          </span>
        ))}
      </div>
      {metric.source && (
        <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-slate-400">
          出典 <SourceButton source={metric.source} />
        </div>
      )}
    </div>
  )
}

/** 男女比バー */
export function GenderRatioBar({ metric }: { metric: Metric<number> }) {
  if (!hasValue(metric)) return <NoData />
  const m = metric.value
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full">
        <div className="bg-sky-400" style={{ width: `${m * 100}%` }} />
        <div className="bg-pink-400" style={{ width: `${(1 - m) * 100}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-xs">
        <span className="text-sky-600">男性 {formatPercent(m)}</span>
        <span className="flex items-center gap-1 text-pink-600">
          女性 {formatPercent(1 - m)}
          {metric.source && <SourceButton source={metric.source} />}
        </span>
      </div>
    </div>
  )
}

/** 地域別の利用傾向（5段階ヒート） */
export function RegionHeat({ metric, highlight }: { metric: Metric<Record<Region, number>>; highlight?: Region }) {
  if (!hasValue(metric)) return <NoData />
  const shades = ['#f8fafc', '#ffe4e6', '#fecdd3', '#fda4af', '#fb7185', '#f43f5e']
  return (
    <div>
      <div className="grid grid-cols-4 gap-1.5">
        {ALL_REGIONS.map((r) => {
          const v = metric.value[r]
          return (
            <div
              key={r}
              className={`rounded-lg px-1 py-2 text-center ${r === highlight ? 'ring-2 ring-slate-800' : ''}`}
              style={{ background: shades[v], color: v >= 4 ? '#fff' : '#334155' }}
            >
              <div className="text-[10px] leading-tight">{REGION_LABELS[r]}</div>
              <div className="text-sm font-bold">{v}</div>
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
        <span>1（少）〜 5（活発）の相対指標</span>
        {metric.source && (
          <span className="flex items-center gap-1">
            出典 <SourceButton source={metric.source} />
          </span>
        )}
      </div>
    </div>
  )
}

/** 5段階ドット */
export function StrengthDots({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`5段階中${value}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`h-1.5 w-1.5 rounded-full ${i <= value ? 'bg-brand-500' : 'bg-slate-200'}`} />
      ))}
    </span>
  )
}
