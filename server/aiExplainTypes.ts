/**
 * AI 解説 API の入出力型（クライアント・サーバー共通）
 */
export interface AiExplainCriterion {
  label: string
  points: number
  weight: number
  reason: string
  dataAvailable: boolean
}

export interface AiExplainApp {
  appId: string
  name: string
  tagline: string
  score: number
  rank: number
  isDemo: boolean
  criteria: AiExplainCriterion[]
}

/** 送信する診断条件（氏名・連絡先など個人を特定する情報は含めない） */
export interface AiExplainConditions {
  age: number
  gender: string
  region: string
  partnerAge: string
  purpose: string
  budget: string
  priorities: string[]
}

export interface AiExplainRequest {
  conditions: AiExplainConditions
  apps: AiExplainApp[]
}

export interface AiExplainResponse {
  summary: string
  comments: { appId: string; comment: string }[]
  model: string
}
