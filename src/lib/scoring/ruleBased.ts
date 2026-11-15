/**
 * ルールベース・スコアリングエンジン（v0.1）
 * --------------------------------------------------
 * 透明性を重視し、各評価軸の「配点」「達成度」「理由」をすべて返す。
 *
 * 配点の決め方:
 *   1. BASE_WEIGHTS を基準とする（合計 100）
 *   2. ユーザーが重視した軸は PRIORITY_MULTIPLIER 倍
 *   3. 合計が 100 になるよう正規化
 *
 * データ未取得の軸は達成度 50%（中立）として扱い、その旨を理由に明記する。
 */
import type { AgeBand, MatchingApp, SafetyFeature } from '../../types/domain'
import { AGE_BANDS, AGE_BAND_RANGES, PURPOSE_LABELS, REGION_LABELS, SAFETY_LABELS, ageToBand } from '../../data/labels'
import { hasValue } from '../../data/metric'
import { formatCount, formatPercent, formatYen } from '../format'
import type { CriterionKey, CriterionResult, DiagnosisInput, Recommendation, ScoringEngine } from './types'

export const CRITERION_LABELS: Record<CriterionKey, string> = {
  purpose: '利用目的',
  age: '年齢層',
  region: '地域',
  budget: '料金',
  safety: '安全性',
  scale: '会員規模',
  matchRate: 'マッチング率',
}

export const BASE_WEIGHTS: Record<CriterionKey, number> = {
  purpose: 25,
  age: 25,
  region: 15,
  budget: 15,
  safety: 10,
  scale: 5,
  matchRate: 5,
}

export const PRIORITY_MULTIPLIER = 2.5
const NEUTRAL = 0.5

/** 安全対策ごとの重み（合計 1） */
export const SAFETY_WEIGHTS: Record<SafetyFeature, number> = {
  identityVerification: 0.25,
  legalNotification: 0.2,
  ageVerification: 0.15,
  monitoring24h: 0.15,
  reportBlock: 0.1,
  singleStatusCheck: 0.1,
  incomeVerification: 0.05,
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

export function computeWeights(priorities: DiagnosisInput['priorities']): Record<CriterionKey, number> {
  const raw = { ...BASE_WEIGHTS }
  for (const p of priorities) raw[p] = BASE_WEIGHTS[p] * PRIORITY_MULTIPLIER
  const total = Object.values(raw).reduce((a, b) => a + b, 0)
  const out = {} as Record<CriterionKey, number>
  for (const k of Object.keys(raw) as CriterionKey[]) out[k] = (raw[k] / total) * 100
  return out
}

/** 年齢帯のうち、指定範囲と重なる割合 */
function bandOverlap(band: AgeBand, min: number, max: number): number {
  const [lo, hi] = AGE_BAND_RANGES[band]
  const overlap = Math.min(hi, max) - Math.max(lo, min) + 1
  if (overlap <= 0) return 0
  return overlap / (hi - lo + 1)
}

export function partnerAgeShare(dist: Record<AgeBand, number>, min: number, max: number): number {
  return AGE_BANDS.reduce((sum, b) => sum + (dist[b] ?? 0) * bandOverlap(b, min, max), 0)
}

interface Partial {
  ratio: number
  reason: string
  dataAvailable: boolean
  isDemoData: boolean
}

interface Context {
  maxUsers: number | null
  minUsers: number | null
  maxMatchRate: number | null
}

function buildContext(apps: MatchingApp[]): Context {
  const users = apps.map((a) => a.performance.registeredUsers).filter(hasValue).map((m) => m.value)
  const rates = apps.map((a) => a.performance.matchRate).filter(hasValue).map((m) => m.value)
  return {
    maxUsers: users.length ? Math.max(...users) : null,
    minUsers: users.length ? Math.min(...users) : null,
    maxMatchRate: rates.length ? Math.max(...rates) : null,
  }
}

const missing = (label: string): Partial => ({
  ratio: NEUTRAL,
  reason: `${label}のデータ未取得のため中立（50%）で評価`,
  dataAvailable: false,
  isDemoData: false,
})

function evalPurpose(app: MatchingApp, input: DiagnosisInput): Partial {
  const target = PURPOSE_LABELS[input.purpose]
  const idx = app.purposes.indexOf(input.purpose)
  const base = { dataAvailable: true, isDemoData: app.isDemo }
  if (idx === 0) return { ...base, ratio: 1, reason: `メインの利用目的が「${target}」で一致` }
  if (idx > 0) return { ...base, ratio: 0.6, reason: `「${target}」にも対応（メインは「${PURPOSE_LABELS[app.purposes[0]]}」）` }
  return { ...base, ratio: 0.1, reason: `主な目的は「${app.purposes.map((p) => PURPOSE_LABELS[p]).join('・')}」で、「${target}」向けではありません` }
}

function evalAge(app: MatchingApp, input: DiagnosisInput): Partial {
  const m = app.ageDistribution
  if (!hasValue(m)) return missing('年齢層')
  const partner = partnerAgeShare(m.value, input.partnerAgeMin, input.partnerAgeMax)
  const own = m.value[ageToBand(input.age)] ?? 0
  const ratio = clamp01(0.6 * Math.min(1, partner / 0.6) + 0.4 * Math.min(1, own / 0.35))
  const range = `${input.partnerAgeMin}〜${input.partnerAgeMax}歳`
  const level = partner >= 0.45 ? '多い' : partner >= 0.25 ? '一定数いる' : '少なめ'
  return {
    ratio,
    reason: `希望する相手（${range}）の利用者が約${formatPercent(partner)}で${level}`,
    dataAvailable: true,
    isDemoData: !!m.source?.isDemo,
  }
}

function evalRegion(app: MatchingApp, input: DiagnosisInput): Partial {
  const m = app.regionStrength
  if (!hasValue(m)) return missing('地域別傾向')
  const v = m.value[input.region]
  const name = REGION_LABELS[input.region]
  const desc = v >= 4 ? '利用が活発' : v === 3 ? '標準的な利用' : '利用者が少なめ'
  return {
    ratio: clamp01(v / 5),
    reason: `${name}エリアは${desc}（5段階中${v}）`,
    dataAvailable: true,
    isDemoData: !!m.source?.isDemo,
  }
}

function evalBudget(app: MatchingApp, input: DiagnosisInput): Partial {
  const m = input.gender === 'female' ? app.pricing.monthlyFemale : app.pricing.monthlyMale
  if (!hasValue(m)) return missing('料金')
  const price = m.value
  const note = input.gender === 'unspecified' ? '（性別未指定のため男性料金で判定）' : ''
  const isDemoData = !!m.source?.isDemo
  if (price === 0) return { ratio: 1, reason: `無料で利用できます${note}`, dataAvailable: true, isDemoData }
  if (input.budget === 0) {
    return { ratio: 0, reason: `月額${formatYen(price)}の有料で、「無料のみ」の希望に合いません${note}`, dataAvailable: true, isDemoData }
  }
  if (price <= input.budget) {
    return {
      ratio: clamp01(1 - 0.25 * (price / input.budget)),
      reason: `月額${formatYen(price)}で予算（${formatYen(input.budget)}）内${note}`,
      dataAvailable: true,
      isDemoData,
    }
  }
  const over = price - input.budget
  return {
    ratio: clamp01(0.5 - over / input.budget),
    reason: `月額${formatYen(price)}で予算を${formatYen(over)}超過${note}`,
    dataAvailable: true,
    isDemoData,
  }
}

function evalSafety(app: MatchingApp): Partial {
  const score = app.safetyFeatures.reduce((s, f) => s + SAFETY_WEIGHTS[f], 0)
  const hasId = app.safetyFeatures.includes('identityVerification')
  const reason = hasId
    ? `${app.safetyFeatures.length}項目の安全対策（${SAFETY_LABELS.identityVerification}など）`
    : `安全対策${app.safetyFeatures.length}項目。公的書類による本人確認の記載なし`
  return { ratio: clamp01(score), reason, dataAvailable: true, isDemoData: app.isDemo }
}

function evalScale(app: MatchingApp, ctx: Context): Partial {
  const m = app.performance.registeredUsers
  if (!hasValue(m) || ctx.maxUsers === null || ctx.minUsers === null) return missing('登録者数')
  const v = m.value
  let ratio = 1
  if (ctx.maxUsers > ctx.minUsers) {
    ratio = 0.3 + (0.7 * (Math.log(v) - Math.log(ctx.minUsers))) / (Math.log(ctx.maxUsers) - Math.log(ctx.minUsers))
  }
  const top = v === ctx.maxUsers ? '（比較対象中で最多）' : ''
  return { ratio: clamp01(ratio), reason: `登録者数 ${formatCount(v)}${top}`, dataAvailable: true, isDemoData: !!m.source?.isDemo }
}

function evalMatchRate(app: MatchingApp, ctx: Context): Partial {
  const m = app.performance.matchRate
  if (!hasValue(m) || !ctx.maxMatchRate) return missing('マッチング率')
  return {
    ratio: clamp01(m.value / ctx.maxMatchRate),
    reason: `マッチング成立率 ${formatPercent(m.value)}`,
    dataAvailable: true,
    isDemoData: !!m.source?.isDemo,
  }
}

export function scoreApp(app: MatchingApp, input: DiagnosisInput, ctx: Context): Omit<Recommendation, 'rank'> {
  const weights = computeWeights(input.priorities)
  const partials: Record<CriterionKey, Partial> = {
    purpose: evalPurpose(app, input),
    age: evalAge(app, input),
    region: evalRegion(app, input),
    budget: evalBudget(app, input),
    safety: evalSafety(app),
    scale: evalScale(app, ctx),
    matchRate: evalMatchRate(app, ctx),
  }
  const criteria: CriterionResult[] = (Object.keys(partials) as CriterionKey[]).map((key) => {
    const p = partials[key]
    return {
      key,
      label: CRITERION_LABELS[key],
      weight: weights[key],
      ratio: p.ratio,
      points: weights[key] * p.ratio,
      reason: p.reason,
      dataAvailable: p.dataAvailable,
      isDemoData: p.isDemoData,
      prioritized: key !== 'purpose' && input.priorities.includes(key),
    }
  })
  const score = Math.round(criteria.reduce((s, c) => s + c.points, 0))

  const byImpact = [...criteria].sort((a, b) => b.weight - a.weight)
  const highlights = byImpact.filter((c) => c.dataAvailable && c.ratio >= 0.75).map((c) => c.reason)
  const cautions = [
    ...byImpact.filter((c) => c.dataAvailable && c.ratio < 0.4).map((c) => c.reason),
    ...byImpact.filter((c) => !c.dataAvailable).map((c) => c.reason),
  ]
  return { app, score: Math.max(0, Math.min(100, score)), criteria, highlights, cautions }
}

export function rankApps(input: DiagnosisInput, apps: MatchingApp[]): Recommendation[] {
  const ctx = buildContext(apps)
  return apps
    .map((a) => scoreApp(a, input, ctx))
    .sort((a, b) => b.score - a.score || a.app.name.localeCompare(b.app.name, 'ja'))
    .map((r, i) => ({ ...r, rank: i + 1 }))
}

export const ruleBasedEngine: ScoringEngine = {
  id: 'rule-based-v1',
  name: 'ルールベース診断 v1',
  description: '利用目的・年齢層・地域・料金・安全性・会員規模・マッチング率の7軸を、公開した配点ルールで採点します。',
  async recommend(input, apps) {
    return rankApps(input, apps)
  },
}
