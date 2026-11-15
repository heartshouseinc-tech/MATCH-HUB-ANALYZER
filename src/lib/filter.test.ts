import { describe, expect, it } from 'vitest'
import { DEMO_APPS } from '../data/apps.demo'
import { DEFAULT_FILTER, filterApps } from './filter'

describe('filterApps', () => {
  it('条件なしで全件', () => {
    expect(filterApps(DEMO_APPS, DEFAULT_FILTER)).toHaveLength(DEMO_APPS.length)
  })
  it('目的で絞り込み', () => {
    const r = filterApps(DEMO_APPS, { ...DEFAULT_FILTER, purposes: ['marriage'] })
    expect(r.every((a) => a.purposes.includes('marriage'))).toBe(true)
  })
  it('無料のみ（男性料金）', () => {
    const r = filterApps(DEMO_APPS, { ...DEFAULT_FILTER, maxPrice: 0 })
    expect(r.map((a) => a.id)).toEqual(['tomori'])
  })
  it('地域データ未取得のアプリは地域フィルタで除外', () => {
    const r = filterApps(DEMO_APPS, { ...DEFAULT_FILTER, region: 'kanto' })
    expect(r.find((a) => a.id === 'fuwari')).toBeUndefined()
  })
  it('キーワード検索', () => {
    const r = filterApps(DEMO_APPS, { ...DEFAULT_FILTER, query: '再婚' })
    expect(r.map((a) => a.id)).toEqual(['otonari'])
  })
})
