import { useState } from 'react'
import type { Metric, SourceInfo } from '../types/domain'
import { hasValue } from '../data/metric'

export const NO_DATA_LABEL = 'データ未取得'

export function NoData({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-400 ${className}`}>
      {NO_DATA_LABEL}
    </span>
  )
}

/**
 * 出典付きの値を表示する。
 * 値が null の場合は「データ未取得」、値がある場合は出典を確認できるボタンを添える。
 */
export function MetricValue<T>({
  metric,
  format,
  className = '',
  showSource = true,
}: {
  metric: Metric<T>
  format: (v: T) => string
  className?: string
  showSource?: boolean
}) {
  if (!hasValue(metric)) return <NoData />
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span>{format(metric.value)}</span>
      {showSource && metric.source && <SourceButton source={metric.source} />}
    </span>
  )
}

export function SourceButton({ source }: { source: SourceInfo }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        aria-expanded={open}
        aria-label="出典を表示"
        className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
          source.isDemo ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'
        }`}
      >
        i
      </button>
      {open && (
        <span
          role="dialog"
          className="absolute left-1/2 top-5 z-30 block w-60 -translate-x-1/2 rounded-xl bg-white p-3 text-left text-xs font-normal text-slate-600 shadow-xl ring-1 ring-slate-200"
        >
          <SourceDetails source={source} />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setOpen(false)
            }}
            className="mt-2 w-full rounded-lg bg-slate-100 py-1 text-slate-600"
          >
            閉じる
          </button>
        </span>
      )}
    </span>
  )
}

export function SourceDetails({ source }: { source: SourceInfo }) {
  const period =
    source.periodStart || source.periodEnd ? `${source.periodStart ?? '?'} 〜 ${source.periodEnd ?? '?'}` : '記載なし'
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1">
      <dt className="font-bold text-slate-500">出典</dt>
      <dd>
        {source.url ? (
          <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-sky-600 underline">
            {source.name}
          </a>
        ) : (
          source.name
        )}
      </dd>
      <dt className="font-bold text-slate-500">調査期間</dt>
      <dd>{period}</dd>
      <dt className="font-bold text-slate-500">サンプル数</dt>
      <dd>{source.sampleSize != null ? source.sampleSize.toLocaleString('ja-JP') : '記載なし'}</dd>
      <dt className="font-bold text-slate-500">集計方法</dt>
      <dd>{source.method ?? '記載なし'}</dd>
    </dl>
  )
}
