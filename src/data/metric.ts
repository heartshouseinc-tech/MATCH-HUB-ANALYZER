import type { Metric, SourceInfo } from '../types/domain'

/** デモ用架空データの出典 */
export const DEMO_SOURCE: SourceInfo = {
  name: 'デモ用架空データ（実在のサービス・数値ではありません）',
  method: 'プロトタイプの動作確認用に作成した値',
  isDemo: true,
}

/** デモ値を作る */
export function demo<T>(value: T): Metric<T> {
  return { value, source: DEMO_SOURCE }
}

/** 未取得の値（UI では「データ未取得」と表示） */
export function unknown<T>(): Metric<T> {
  return { value: null }
}

/** 出典付きの実測値・公表値を作る */
export function sourced<T>(value: T, source: SourceInfo): Metric<T> {
  return { value, source }
}

export function hasValue<T>(m: Metric<T> | undefined): m is Metric<T> & { value: T } {
  return !!m && m.value !== null && m.value !== undefined
}

/**
 * 公式サイトで確認した値を作る
 * 例: official(<金額>, { url: '<料金ページURL>', checkedAt: 'YYYY-MM-DD', note: 'Web版・クレジットカード・1ヶ月プラン' })
 */
export function official<T>(value: T, opts: OfficialOpts): Metric<T> {
  return { value, source: officialSource(opts) }
}

interface OfficialOpts {
  url: string
  checkedAt: string
  note?: string
  name?: string
}

/** 公式サイトの出典情報だけを作る（purposesSource / safetySource 用） */
export function officialSource(opts: OfficialOpts): SourceInfo {
  return {
    name: opts.name ?? '公式サイト',
    url: opts.url,
    checkedAt: opts.checkedAt,
    method: opts.note ?? '公式サイトの掲載内容を確認',
    isDemo: false,
  }
}

/** 安全対策が確認済みかどうか */
export function isSafetyVerified(app: { safetyVerified?: boolean }) {
  return app.safetyVerified !== false
}
