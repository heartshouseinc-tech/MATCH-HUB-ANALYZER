/**
 * 送客（外部リンク）ロジック
 * --------------------------------------------------
 * - 有効なアフィリエイト案件があれば案件 URL を優先
 * - なければ検証済みの公式 URL
 * - どちらもなければリンク無効（null）
 */
import type { Campaign, MatchingApp } from '../types/domain'

export interface ResolvedOutbound {
  url: string | null
  /** 広告（PR）表記が必要か */
  isPromoted: boolean
  /** アフィリエイトリンクか（rel="sponsored" を付与） */
  isAffiliate: boolean
  campaignId?: string
  /** リンク無効時の理由 */
  disabledReason?: string
}

export function isActiveCampaign(c: Campaign, now = new Date()): boolean {
  if (!c.active) return false
  const start = new Date(c.startsAt + 'T00:00:00')
  const end = new Date(c.endsAt + 'T23:59:59')
  return now >= start && now <= end
}

export function findActiveCampaign(appId: string, campaigns: Campaign[], now = new Date()) {
  return campaigns.find((c) => c.appId === appId && isActiveCampaign(c, now))
}

function isSafeHttpUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.protocol === 'https:' || u.protocol === 'http:'
  } catch {
    return false
  }
}

export function resolveOutbound(app: MatchingApp, campaigns: Campaign[], now = new Date()): ResolvedOutbound {
  const campaign = findActiveCampaign(app.id, campaigns, now)
  if (campaign && isSafeHttpUrl(campaign.url)) {
    return {
      url: campaign.url,
      isPromoted: campaign.showPrLabel,
      isAffiliate: true,
      campaignId: campaign.id,
    }
  }
  const { officialUrl, officialUrlVerified } = app.outbound
  if (officialUrl && officialUrlVerified && isSafeHttpUrl(officialUrl)) {
    return { url: officialUrl, isPromoted: false, isAffiliate: false }
  }
  return {
    url: null,
    isPromoted: false,
    isAffiliate: false,
    disabledReason: officialUrl ? '公式URLを確認中です' : '公式URLは未確認です',
  }
}
