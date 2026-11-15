/**
 * 広告・アフィリエイト案件（デモ）
 * --------------------------------------------------
 * アプリ本体データとは分離して管理する。
 * 有効な案件があるアプリは、送客 URL が案件 URL に置き換わり、PR 表記が付く。
 */
import type { Campaign } from '../types/domain'

export const DEMO_CAMPAIGNS: Campaign[] = [
  {
    id: 'cmp-harunowa-demo',
    appId: 'harunowa',
    network: 'デモASP',
    url: 'https://example.com/?ref=match-hub-demo',
    startsAt: '2026-01-01',
    endsAt: '2027-12-31',
    active: true,
    showPrLabel: true,
  },
]
