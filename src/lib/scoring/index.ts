/**
 * スコアリングエンジンの登録口。
 * 将来 AI 分析エンジンを追加する場合は ScoringEngine を実装し、ここで切り替える。
 */
import { ruleBasedEngine } from './ruleBased'
import type { ScoringEngine } from './types'

export const activeEngine: ScoringEngine = ruleBasedEngine

export * from './types'
export { CRITERION_LABELS, BASE_WEIGHTS, PRIORITY_MULTIPLIER, computeWeights } from './ruleBased'
