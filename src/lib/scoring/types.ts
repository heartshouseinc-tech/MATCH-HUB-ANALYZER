import type { MatchingApp, Purpose, Region } from '../../types/domain'

export type Gender = 'male' | 'female' | 'unspecified'

/** 評価軸 */
export type CriterionKey = 'purpose' | 'age' | 'region' | 'budget' | 'safety' | 'scale' | 'matchRate'

/** ユーザーが「重視する」として選べる評価軸 */
export type PriorityKey = Exclude<CriterionKey, 'purpose'>

/** 診断入力（ブラウザ内でのみ処理し、外部送信しない） */
export interface DiagnosisInput {
  age: number
  gender: Gender
  region: Region
  partnerAgeMin: number
  partnerAgeMax: number
  purpose: Purpose
  /** 月額予算の上限（円）。0 は「無料のみ」 */
  budget: number
  priorities: PriorityKey[]
}

export interface CriterionResult {
  key: CriterionKey
  label: string
  /** 配点（全評価軸の合計で 100） */
  weight: number
  /** 達成度 0〜1 */
  ratio: number
  /** 獲得点 = weight × ratio */
  points: number
  /** 理由（人が読める説明） */
  reason: string
  /** 判定に使うデータがあったか（false なら中立評価） */
  dataAvailable: boolean
  /** 判定に使ったデータがデモ値か */
  isDemoData: boolean
  /** ユーザーが重視した軸か */
  prioritized: boolean
}

export interface Recommendation {
  app: MatchingApp
  /** 0〜100 の適合スコア */
  score: number
  rank: number
  criteria: CriterionResult[]
  /** おすすめ理由（良い点） */
  highlights: string[]
  /** 注意点・データ未取得 */
  cautions: string[]
}

/**
 * スコアリングエンジン
 * v0.1 はルールベース。将来 AI 分析エンジンを同じインターフェースで追加できる。
 */
export interface ScoringEngine {
  id: string
  name: string
  description: string
  recommend(input: DiagnosisInput, apps: MatchingApp[]): Promise<Recommendation[]>
}
