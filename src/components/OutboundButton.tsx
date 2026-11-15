import type { Campaign, MatchingApp } from '../types/domain'
import { resolveOutbound } from '../lib/outbound'
import { trackOutboundClick, type OutboundClickEvent } from '../lib/tracking'
import { PrBadge } from './ui'

/**
 * 公式サイトへの送客ボタン。
 * URL 未確認時は無効化し、広告案件があれば PR 表記と rel="sponsored" を付与する。
 */
export function OutboundButton({
  app,
  campaigns,
  placement,
  size = 'md',
}: {
  app: MatchingApp
  campaigns: Campaign[]
  placement: OutboundClickEvent['placement']
  size?: 'sm' | 'md'
}) {
  const r = resolveOutbound(app, campaigns)
  const cls =
    size === 'sm'
      ? 'px-2 py-2 text-xs whitespace-nowrap'
      : 'px-4 py-3 text-sm'

  if (!r.url) {
    return (
      <div className="flex flex-col items-stretch">
        <button
          type="button"
          disabled
          aria-disabled
          className={`flex w-full cursor-not-allowed items-center justify-center gap-1 rounded-xl bg-slate-100 font-bold text-slate-400 ${cls}`}
        >
          {size === 'sm' ? '準備中' : '公式サイト（準備中）'}
        </button>
        {size === 'md' && <span className="mt-1 text-center text-[11px] text-slate-400">{r.disabledReason}</span>}
      </div>
    )
  }

  const url = r.url
  return (
    <div className="flex flex-col items-stretch">
      <a
        href={url}
        target="_blank"
        rel={`noopener noreferrer${r.isAffiliate ? ' sponsored' : ''}`}
        onClick={() => trackOutboundClick({ appId: app.id, campaignId: r.campaignId, url, placement })}
        className={`flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-500 font-bold text-white shadow-sm transition active:scale-[0.98] active:bg-brand-600 ${cls}`}
      >
        {r.isPromoted && <PrBadge className="bg-white/25 text-white" />}
        {size === 'sm' ? '公式サイト' : '公式サイトへ'}
        <svg viewBox="0 0 20 20" fill="currentColor" className={`h-3.5 w-3.5 ${size === 'sm' ? 'hidden min-[400px]:block' : ''}`} aria-hidden>
          <path d="M11 3a1 1 0 100 2h2.59l-6.3 6.29a1 1 0 101.42 1.42L15 6.41V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
          <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
        </svg>
      </a>
      {size === 'md' && r.isPromoted && (
        <span className="mt-1 text-center text-[11px] text-slate-400">本リンクは広告（アフィリエイト）を含みます</span>
      )}
    </div>
  )
}
