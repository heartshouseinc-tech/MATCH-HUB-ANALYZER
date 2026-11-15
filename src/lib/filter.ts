import type { AgeBand, MatchingApp, Purpose, Region } from '../types/domain'
import { hasValue } from '../data/metric'

export type SortKey = 'recommended' | 'priceAsc' | 'usersDesc' | 'safetyDesc' | 'name'

export interface FilterState {
  query: string
  purposes: Purpose[]
  /** 月額上限（円）。null は指定なし、0 は無料のみ */
  maxPrice: number | null
  priceGender: 'male' | 'female'
  /** この年齢帯の利用者が一定以上いるアプリ */
  ageBand: AgeBand | null
  /** この地域で利用が活発（4以上）なアプリ */
  region: Region | null
  requireIdVerification: boolean
  sort: SortKey
}

export const DEFAULT_FILTER: FilterState = {
  query: '',
  purposes: [],
  maxPrice: null,
  priceGender: 'male',
  ageBand: null,
  region: null,
  requireIdVerification: false,
  sort: 'recommended',
}

/** 年齢帯フィルタの閾値（利用者構成比） */
export const AGE_BAND_THRESHOLD = 0.15
/** 地域フィルタの閾値（5段階） */
export const REGION_THRESHOLD = 4

export function countActiveFilters(f: FilterState): number {
  return (
    (f.purposes.length ? 1 : 0) +
    (f.maxPrice !== null ? 1 : 0) +
    (f.ageBand ? 1 : 0) +
    (f.region ? 1 : 0) +
    (f.requireIdVerification ? 1 : 0)
  )
}

function priceOf(app: MatchingApp, gender: 'male' | 'female') {
  const m = gender === 'female' ? app.pricing.monthlyFemale : app.pricing.monthlyMale
  return hasValue(m) ? m.value : null
}

export function filterApps(apps: MatchingApp[], f: FilterState): MatchingApp[] {
  const q = f.query.trim().toLowerCase()
  const out = apps.filter((a) => {
    if (q) {
      const hay = [a.name, a.tagline, a.description, ...a.tags].join(' ').toLowerCase()
      if (!hay.includes(q)) return false
    }
    if (f.purposes.length && !f.purposes.some((p) => a.purposes.includes(p))) return false
    if (f.maxPrice !== null) {
      const p = priceOf(a, f.priceGender)
      if (p === null || p > f.maxPrice) return false
    }
    if (f.ageBand) {
      if (!hasValue(a.ageDistribution) || a.ageDistribution.value[f.ageBand] < AGE_BAND_THRESHOLD) return false
    }
    if (f.region) {
      if (!hasValue(a.regionStrength) || a.regionStrength.value[f.region] < REGION_THRESHOLD) return false
    }
    if (f.requireIdVerification && !a.safetyFeatures.includes('identityVerification')) return false
    return true
  })

  const sorted = [...out]
  switch (f.sort) {
    case 'priceAsc':
      sorted.sort((a, b) => (priceOf(a, f.priceGender) ?? Infinity) - (priceOf(b, f.priceGender) ?? Infinity))
      break
    case 'usersDesc':
      sorted.sort(
        (a, b) => (b.performance.registeredUsers.value ?? -1) - (a.performance.registeredUsers.value ?? -1),
      )
      break
    case 'safetyDesc':
      sorted.sort((a, b) => b.safetyFeatures.length - a.safetyFeatures.length)
      break
    case 'name':
      sorted.sort((a, b) => a.name.localeCompare(b.name, 'ja'))
      break
    case 'recommended':
    default:
      break
  }
  return sorted
}
