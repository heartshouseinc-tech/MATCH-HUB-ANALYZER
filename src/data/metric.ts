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
