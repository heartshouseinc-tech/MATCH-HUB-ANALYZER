import { describe, expect, it } from 'vitest'
import { DEMO_APPS } from './apps.demo'
import { VERIFIED_APPS } from './apps.verified'
import { official, officialSource } from './metric'
import { completeness, validateApps } from './validate'
import { rankApps } from '../lib/scoring/ruleBased'
import type { MatchingApp } from '../types/domain'

describe('本番データ', () => {
  it('エラーがない（出典のない数値などを含まない）', () => {
    expect(validateApps(VERIFIED_APPS).filter((i) => i.level === 'error')).toEqual([])
  })
  it('デモデータにもエラーがない', () => {
    expect(validateApps(DEMO_APPS).filter((i) => i.level === 'error')).toEqual([])
  })
  it('未確認のアプリでも診断が動き、未確認の軸は中立評価', () => {
    const r = rankApps(
      { age: 30, gender: 'male', region: 'kanto', partnerAgeMin: 25, partnerAgeMax: 32, purpose: 'marriage', budget: 5000, priorities: [] },
      VERIFIED_APPS,
    )
    expect(r).toHaveLength(VERIFIED_APPS.length)
    for (const rec of r) {
      expect(rec.criteria.every((c) => !c.dataAvailable && c.ratio === 0.5)).toBe(true)
      expect(rec.score).toBe(50)
    }
  })
})

describe('validateApps', () => {
  const base = VERIFIED_APPS[0]
  const src = { url: 'https://example.com/price', checkedAt: '2026-11-20' }

  it('出典なしの値はエラー', () => {
    const app: MatchingApp = { ...base, pricing: { ...base.pricing, monthlyMale: { value: 1000 } } }
    expect(validateApps([app]).some((i) => i.level === 'error' && i.field === 'pricing.monthlyMale')).toBe(true)
  })
  it('公式出典付きの値は通り、充足度に反映される', () => {
    const app: MatchingApp = {
      ...base,
      purposes: ['marriage'],
      purposesSource: officialSource(src),
      pricing: { ...base.pricing, monthlyMale: official(1000, src) },
      lastVerifiedAt: '2026-11-20',
      tagline: 'テスト',
    }
    expect(validateApps([app]).filter((i) => i.level === 'error')).toEqual([])
    expect(completeness(app).filled).toEqual(['利用目的', '男性 月額'])
  })
  it('実績値はサンプル数がないとエラー', () => {
    const app: MatchingApp = { ...base, performance: { ...base.performance, matchRate: official(0.2, src) } }
    expect(validateApps([app]).some((i) => i.field === 'performance.matchRate' && i.message.includes('サンプル数'))).toBe(true)
  })
  it('範囲外の割合はエラー', () => {
    const app: MatchingApp = { ...base, maleRatio: official(55, src) }
    expect(validateApps([app]).some((i) => i.field === 'maleRatio')).toBe(true)
  })
})
