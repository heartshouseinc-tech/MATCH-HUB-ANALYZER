/**
 * データ検証・充足度チェック
 * --------------------------------------------------
 * `npm run data:check` から呼ばれる。テストでも使用。
 *  - error   : 公開してはいけない問題（出典なしの数値、範囲外の値など）
 *  - warning : 公開前に見直したい点
 *  - missing : 未入力（データ未取得）の項目。エラーではない
 */
import type { MatchingApp, Metric, SourceInfo } from '../types/domain'
import { AGE_BANDS, ALL_REGIONS } from './labels'
import { hasValue, isSafetyVerified } from './metric'

export type IssueLevel = 'error' | 'warning'
export interface Issue {
  appId: string
  level: IssueLevel
  field: string
  message: string
}

export interface Completeness {
  filled: string[]
  missing: string[]
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** 充足度の対象項目（ラベル → 入力済みか） */
export function completeness(app: MatchingApp): Completeness {
  const items: [string, boolean][] = [
    ['公式URL', app.outbound.officialUrlVerified],
    ['利用目的', app.purposes.length > 0],
    ['男性 月額', hasValue(app.pricing.monthlyMale)],
    ['女性 月額', hasValue(app.pricing.monthlyFemale)],
    ['安全対策', isSafetyVerified(app)],
    ['年齢層', hasValue(app.ageDistribution)],
    ['男女比', hasValue(app.maleRatio)],
    ['地域別傾向', hasValue(app.regionStrength)],
    ['登録者数', hasValue(app.performance.registeredUsers)],
    ['マッチング率', hasValue(app.performance.matchRate)],
    ['返信率', hasValue(app.performance.replyRate)],
    ['会えた割合', hasValue(app.performance.meetRate)],
  ]
  return {
    filled: items.filter(([, ok]) => ok).map(([k]) => k),
    missing: items.filter(([, ok]) => !ok).map(([k]) => k),
  }
}

function checkSource(app: MatchingApp, field: string, source: SourceInfo | undefined, issues: Issue[]) {
  const push = (level: IssueLevel, message: string) => issues.push({ appId: app.id, level, field, message })
  if (!source) return push('error', '値があるのに出典（source）がありません')
  if (app.isDemo) {
    if (!source.isDemo) push('warning', 'デモアプリに非デモの出典が付いています')
    return
  }
  if (source.isDemo) return push('error', '本番アプリにデモ用の出典が付いています')
  if (!source.name) push('error', '出典名がありません')
  if (!source.url) push('error', '出典URLがありません')
  else if (!/^https:\/\//.test(source.url)) push('warning', '出典URLが https ではありません')
  const date = source.checkedAt ?? source.periodEnd
  if (!date) push('error', '確認日（checkedAt）または調査期間がありません')
  else if (!DATE_RE.test(date)) push('error', `日付の形式が不正です: ${date}（YYYY-MM-DD）`)
}

function checkMetric<T>(
  app: MatchingApp,
  field: string,
  m: Metric<T> | undefined,
  issues: Issue[],
  range?: (v: T) => string | null,
) {
  if (!m || !hasValue(m)) return
  checkSource(app, field, m.source, issues)
  const bad = range?.(m.value)
  if (bad) issues.push({ appId: app.id, level: 'error', field, message: bad })
}

const rate = (v: number) => (v >= 0 && v <= 1 ? null : `0〜1 の割合で入力してください（現在 ${v}）`)
const yen = (v: number) => (Number.isInteger(v) && v >= 0 && v < 100000 ? null : `月額の値が不正です（${v}）`)

export function validateApps(apps: MatchingApp[]): Issue[] {
  const issues: Issue[] = []
  const ids = new Set<string>()

  for (const app of apps) {
    const push = (level: IssueLevel, field: string, message: string) => issues.push({ appId: app.id, level, field, message })

    if (!/^[a-z0-9-]+$/.test(app.id)) push('error', 'id', 'id は半角英小文字・数字・ハイフンのみ')
    if (ids.has(app.id)) push('error', 'id', 'id が重複しています')
    ids.add(app.id)

    // 公式URL
    const { officialUrl, officialUrlVerified } = app.outbound
    if (officialUrlVerified && !officialUrl) push('error', 'outbound', '確認済みなのに公式URLが空です')
    if (officialUrl && !/^https:\/\//.test(officialUrl)) push('error', 'outbound', '公式URLは https で始めてください')

    // 目的・安全対策
    if (app.purposes.length && !app.isDemo) checkSource(app, 'purposes', app.purposesSource, issues)
    if (new Set(app.purposes).size !== app.purposes.length) push('error', 'purposes', '利用目的が重複しています')
    if (isSafetyVerified(app) && !app.isDemo) checkSource(app, 'safetyFeatures', app.safetySource, issues)
    if (!isSafetyVerified(app) && app.safetyFeatures.length) {
      push('warning', 'safetyFeatures', '未確認（safetyVerified: false）なのに項目が入っています')
    }

    // 数値
    checkMetric(app, 'pricing.monthlyMale', app.pricing.monthlyMale, issues, yen)
    checkMetric(app, 'pricing.monthlyFemale', app.pricing.monthlyFemale, issues, yen)
    checkMetric(app, 'maleRatio', app.maleRatio, issues, rate)
    checkMetric(app, 'ageDistribution', app.ageDistribution, issues, (d) => {
      const sum = AGE_BANDS.reduce((s, b) => s + (d[b] ?? 0), 0)
      return Math.abs(sum - 1) > 0.02 ? `年齢層の合計が 1 になっていません（${sum.toFixed(2)}）` : null
    })
    checkMetric(app, 'regionStrength', app.regionStrength, issues, (d) =>
      ALL_REGIONS.every((r) => Number.isInteger(d[r]) && d[r] >= 1 && d[r] <= 5) ? null : '地域は全地域 1〜5 の整数で入力してください',
    )
    const p = app.performance
    checkMetric(app, 'performance.registeredUsers', p.registeredUsers, issues, (v) =>
      Number.isInteger(v) && v >= 0 ? null : '登録者数は 0 以上の整数',
    )
    checkMetric(app, 'performance.matchRate', p.matchRate, issues, rate)
    checkMetric(app, 'performance.replyRate', p.replyRate, issues, rate)
    checkMetric(app, 'performance.meetRate', p.meetRate, issues, rate)
    for (const [k, m] of Object.entries(p.byAgeBand)) checkMetric(app, `performance.byAgeBand.${k}`, m, issues, rate)
    for (const [k, m] of Object.entries(p.byRegion)) checkMetric(app, `performance.byRegion.${k}`, m, issues, rate)

    // 実績値は調査条件が必須
    for (const [field, m] of [
      ['performance.matchRate', p.matchRate],
      ['performance.replyRate', p.replyRate],
      ['performance.meetRate', p.meetRate],
    ] as const) {
      if (!app.isDemo && hasValue(m) && (m.source?.sampleSize == null || !m.source?.method)) {
        push('error', field, '実績値にはサンプル数（sampleSize）と集計方法（method）が必要です')
      }
    }

    // 確認日
    const anyFilled = completeness(app).filled.length > 0
    if (!app.isDemo && anyFilled && !app.lastVerifiedAt) push('warning', 'lastVerifiedAt', '情報確認日（lastVerifiedAt）を入れてください')
    if (app.lastVerifiedAt && !DATE_RE.test(app.lastVerifiedAt)) push('error', 'lastVerifiedAt', '日付は YYYY-MM-DD 形式')
    if (!app.isDemo && app.tagline === '公式情報を確認中' && anyFilled) push('warning', 'tagline', 'キャッチコピーが仮のままです')
  }
  return issues
}
