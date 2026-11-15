export function formatYen(v: number): string {
  if (v === 0) return '無料'
  return `¥${v.toLocaleString('ja-JP')}`
}

export function formatPercent(v: number, digits = 0): string {
  return `${(v * 100).toFixed(digits)}%`
}

export function formatCount(v: number): string {
  if (v >= 10_000) {
    const man = v / 10_000
    return `${man >= 100 ? Math.round(man).toLocaleString('ja-JP') : man.toFixed(1).replace(/\.0$/, '')}万人`
  }
  return `${v.toLocaleString('ja-JP')}人`
}
