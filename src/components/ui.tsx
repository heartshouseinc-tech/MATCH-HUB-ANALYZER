import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { MatchingApp, Purpose } from '../types/domain'
import { PURPOSE_LABELS } from '../data/labels'

export function AppLogo({ app, size = 48 }: { app: MatchingApp; size?: number }) {
  if (app.logo.imageUrl) {
    return <img src={app.logo.imageUrl} alt={`${app.name} ロゴ`} width={size} height={size} className="rounded-2xl object-cover" />
  }
  return (
    <div
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-2xl font-bold text-white shadow-sm"
      style={{ width: size, height: size, background: app.logo.color, fontSize: size * 0.42 }}
    >
      {app.logo.initials}
    </div>
  )
}

export function DemoBadge({ className = '' }: { className?: string }) {
  return (
    <span
      title="架空のデモ用データです"
      className={`inline-flex items-center rounded border border-dashed border-amber-400 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold leading-none text-amber-700 ${className}`}
    >
      デモ
    </span>
  )
}

export function PrBadge({ className = '' }: { className?: string }) {
  return (
    <span
      title="広告・アフィリエイトリンクを含みます"
      className={`inline-flex items-center rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold leading-none text-slate-600 ${className}`}
    >
      PR
    </span>
  )
}

export function PurposeChip({ purpose, primary }: { purpose: Purpose; primary?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        primary ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-600'
      }`}
    >
      {PURPOSE_LABELS[purpose]}
    </span>
  )
}

/** 利用目的のチップ一覧（未確認ならデータ未取得） */
export function PurposeChips({ purposes, className = '' }: { purposes: Purpose[]; className?: string }) {
  if (purposes.length === 0) {
    return (
      <span className={`inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-400 ${className}`}>
        目的：データ未取得
      </span>
    )
  }
  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {purposes.map((p, i) => (
        <PurposeChip key={p} purpose={p} primary={i === 0} />
      ))}
    </div>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 ${className}`}>{children}</section>
}

export function SectionTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-3">
      <h2 className="text-base font-bold text-slate-900">{children}</h2>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    </div>
  )
}

export function EmptyState({
  icon = '🔍',
  title,
  body,
  action,
}: {
  icon?: string
  title: string
  body?: ReactNode
  action?: { label: string; to?: string; onClick?: () => void }
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center">
      <div className="mb-3 text-4xl" aria-hidden>
        {icon}
      </div>
      <p className="font-bold text-slate-800">{title}</p>
      {body && <p className="mt-1 text-sm text-slate-500">{body}</p>}
      {action &&
        (action.to ? (
          <Link to={action.to} className="mt-4 rounded-full bg-brand-500 px-5 py-2 text-sm font-bold text-white">
            {action.label}
          </Link>
        ) : (
          <button onClick={action.onClick} className="mt-4 rounded-full bg-brand-500 px-5 py-2 text-sm font-bold text-white">
            {action.label}
          </button>
        ))}
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100" aria-hidden>
      <div className="flex gap-3">
        <div className="skeleton h-12 w-12 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-1/3 rounded" />
          <div className="skeleton h-3 w-2/3 rounded" />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="skeleton h-10 rounded-lg" />
        <div className="skeleton h-10 rounded-lg" />
        <div className="skeleton h-10 rounded-lg" />
      </div>
    </div>
  )
}

export function LoadingList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="読み込み中">
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

export function ErrorState({ message }: { message: string }) {
  return <EmptyState icon="⚠️" title={message} body="時間をおいて再度お試しください。" action={{ label: '再読み込み', onClick: () => location.reload() }} />
}
