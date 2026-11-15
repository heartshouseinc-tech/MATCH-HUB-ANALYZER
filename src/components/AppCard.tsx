import { Link } from 'react-router-dom'
import type { Campaign, MatchingApp } from '../types/domain'
import { useCompare } from '../context/CompareContext'
import { useToast } from '../context/ToastContext'
import { formatCount, formatPercent, formatYen } from '../lib/format'
import { findActiveCampaign } from '../lib/outbound'
import { MetricValue } from './MetricValue'
import { AppLogo, DemoBadge, PrBadge, PurposeChip } from './ui'

export function CompareToggle({ app, compact }: { app: MatchingApp; compact?: boolean }) {
  const { has, toggle } = useCompare()
  const toast = useToast()
  const active = has(app.id)
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        const r = toggle(app.id)
        if (r === 'full') toast('比較できるのは最大3アプリまでです')
        else if (r === 'added') toast(`${app.name}を比較に追加しました`)
      }}
      className={`flex items-center justify-center gap-1 rounded-xl border font-bold transition ${
        compact ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-sm'
      } ${active ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-slate-200 bg-white text-slate-600'}`}
    >
      {active ? '✓ 比較中' : '＋ 比較'}
    </button>
  )
}

export function AppCard({ app, campaigns }: { app: MatchingApp; campaigns: Campaign[] }) {
  const promoted = findActiveCampaign(app.id, campaigns)?.showPrLabel
  return (
    <article className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 transition active:scale-[0.99]">
      <Link to={`/apps/${app.id}`} className="block p-4 pb-3">
        <div className="flex gap-3">
          <AppLogo app={app} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate font-bold text-slate-900">{app.name}</h3>
              {app.isDemo && <DemoBadge />}
              {promoted && <PrBadge />}
            </div>
            <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{app.tagline}</p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {app.purposes.map((p, i) => (
                <PurposeChip key={p} purpose={p} primary={i === 0} />
              ))}
            </div>
          </div>
        </div>
        <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-slate-50 px-1 py-2">
            <dt className="text-[10px] text-slate-500">男性月額</dt>
            <dd className="mt-0.5 text-sm font-bold">
              <MetricValue metric={app.pricing.monthlyMale} format={formatYen} showSource={false} />
            </dd>
          </div>
          <div className="rounded-xl bg-slate-50 px-1 py-2">
            <dt className="text-[10px] text-slate-500">登録者数</dt>
            <dd className="mt-0.5 text-sm font-bold">
              <MetricValue metric={app.performance.registeredUsers} format={formatCount} showSource={false} />
            </dd>
          </div>
          <div className="rounded-xl bg-slate-50 px-1 py-2">
            <dt className="text-[10px] text-slate-500">マッチング率</dt>
            <dd className="mt-0.5 text-sm font-bold">
              <MetricValue metric={app.performance.matchRate} format={(v) => formatPercent(v)} showSource={false} />
            </dd>
          </div>
        </dl>
      </Link>
      <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-4 py-2.5">
        <Link to={`/apps/${app.id}`} className="text-xs font-bold text-slate-500">
          詳細を見る →
        </Link>
        <CompareToggle app={app} compact />
      </div>
    </article>
  )
}
