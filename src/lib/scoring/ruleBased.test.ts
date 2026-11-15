import { describe, expect, it } from 'vitest'
import { DEMO_APPS } from '../../data/apps.demo'
import { computeWeights, partnerAgeShare, rankApps } from './ruleBased'
import type { DiagnosisInput } from './types'

const base: DiagnosisInput = {
  age: 32,
  gender: 'male',
  region: 'kanto',
  partnerAgeMin: 28,
  partnerAgeMax: 36,
  purpose: 'marriage',
  budget: 5000,
  priorities: [],
}

describe('computeWeights', () => {
  it('合計が100になる', () => {
    const sum = (w: Record<string, number>) => Object.values(w).reduce((a, b) => a + b, 0)
    expect(sum(computeWeights([]))).toBeCloseTo(100)
    expect(sum(computeWeights(['safety', 'budget']))).toBeCloseTo(100)
  })
  it('重視した軸の配点が上がる', () => {
    expect(computeWeights(['safety']).safety).toBeGreaterThan(computeWeights([]).safety)
  })
})

describe('partnerAgeShare', () => {
  it('全年齢を指定すると1になる', () => {
    const d = { '18-24': 0.2, '25-29': 0.2, '30-34': 0.2, '35-39': 0.2, '40-49': 0.1, '50+': 0.1 }
    expect(partnerAgeShare(d, 18, 69)).toBeCloseTo(1)
  })
})

describe('rankApps', () => {
  it('30代の婚活では婚活特化アプリが1位', () => {
    const r = rankApps(base, DEMO_APPS)
    expect(r[0].app.id).toBe('engage-note')
    expect(r.map((x) => x.rank)).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('スコアは0〜100で、配点の合計は100', () => {
    for (const rec of rankApps(base, DEMO_APPS)) {
      expect(rec.score).toBeGreaterThanOrEqual(0)
      expect(rec.score).toBeLessThanOrEqual(100)
      expect(rec.criteria.reduce((s, c) => s + c.weight, 0)).toBeCloseTo(100)
    }
  })

  it('無料のみ希望では有料アプリの料金評価が0', () => {
    const r = rankApps({ ...base, budget: 0 }, DEMO_APPS)
    const engage = r.find((x) => x.app.id === 'engage-note')!
    expect(engage.criteria.find((c) => c.key === 'budget')!.ratio).toBe(0)
  })

  it('データ未取得の軸は中立評価で注意点に記載', () => {
    const r = rankApps(base, DEMO_APPS)
    const fuwari = r.find((x) => x.app.id === 'fuwari')!
    const region = fuwari.criteria.find((c) => c.key === 'region')!
    expect(region.dataAvailable).toBe(false)
    expect(region.ratio).toBe(0.5)
    expect(fuwari.cautions.some((c) => c.includes('データ未取得'))).toBe(true)
  })

  it('20代前半の友達探しでは友達系アプリが1位', () => {
    const r = rankApps(
      { ...base, age: 21, partnerAgeMin: 18, partnerAgeMax: 25, purpose: 'friends', budget: 0 },
      DEMO_APPS,
    )
    expect(r[0].app.id).toBe('tomori')
  })
})
