/**
 * ドメイン型定義
 * --------------------------------------------------
 * UI からは独立した「データの形」を定義する。
 * 実在アプリの検証済みデータへ差し替える際も、この型に合わせて
 * データを用意すれば UI 側の修正は不要。
 */

/** 利用目的 */
export type Purpose = 'love' | 'marriage' | 'friends' | 'casual'

/** 地域区分 */
export type Region =
  | 'hokkaido'
  | 'tohoku'
  | 'kanto'
  | 'chubu'
  | 'kinki'
  | 'chugoku'
  | 'shikoku'
  | 'kyushu'

/** 年齢帯 */
export type AgeBand = '18-24' | '25-29' | '30-34' | '35-39' | '40-49' | '50+'

/** 安全対策の種類 */
export type SafetyFeature =
  | 'identityVerification' // 公的書類による本人確認
  | 'ageVerification' // 年齢確認
  | 'monitoring24h' // 24時間監視
  | 'reportBlock' // 通報・ブロック機能
  | 'legalNotification' // インターネット異性紹介事業の届出
  | 'singleStatusCheck' // 独身証明書の提出
  | 'incomeVerification' // 収入証明

/**
 * 出典情報
 * 実測値・公表値を掲載する場合は必ず紐づける。
 */
export interface SourceInfo {
  /** 出典名（例: ○○社 公式発表 / 自社アンケート） */
  name: string
  /** 出典 URL（任意） */
  url?: string
  /** 調査期間 開始（YYYY-MM-DD） */
  periodStart?: string
  /** 調査期間 終了（YYYY-MM-DD） */
  periodEnd?: string
  /** サンプル数 */
  sampleSize?: number
  /** 集計方法 */
  method?: string
  /** デモ用の架空データかどうか */
  isDemo: boolean
}

/**
 * 出典付きの値。
 * value が null の場合は UI 上で「データ未取得」と表示する。
 * 推測値を事実として格納しないこと。
 */
export interface Metric<T> {
  value: T | null
  source?: SourceInfo
}

/** 料金プラン */
export interface Pricing {
  /** 男性の月額（円・税込、1ヶ月プラン） */
  monthlyMale: Metric<number>
  /** 女性の月額（円・税込、1ヶ月プラン）。無料なら 0 */
  monthlyFemale: Metric<number>
  /** 補足 */
  note?: string
}

/** 外部リンク・送客設定 */
export interface OutboundConfig {
  /** 公式サイト URL。未確認なら null */
  officialUrl: string | null
  /** 公式 URL が検証済みか。false の場合リンクは無効化される */
  officialUrlVerified: boolean
}

/**
 * マッチング実績（将来の集計用データ構造）
 * 各項目は Metric で保持し、出典を必須で紐づける。
 */
export interface PerformanceMetrics {
  /** 登録者数（累計） */
  registeredUsers: Metric<number>
  /** マッチング成立率（0-1） */
  matchRate: Metric<number>
  /** メッセージ返信率（0-1） */
  replyRate: Metric<number>
  /** 実際に会えた割合（0-1） */
  meetRate: Metric<number>
  /** 年代別のマッチング成立率 */
  byAgeBand: Partial<Record<AgeBand, Metric<number>>>
  /** 地域別のマッチング成立率 */
  byRegion: Partial<Record<Region, Metric<number>>>
}

/** マッチングアプリ */
export interface MatchingApp {
  id: string
  name: string
  /** ロゴ（画像 URL がなければイニシャル表示） */
  logo: { initials: string; color: string; imageUrl?: string }
  /** キャッチコピー */
  tagline: string
  description: string
  /** 利用目的（先頭がメイン目的） */
  purposes: Purpose[]
  /** 年齢帯ごとの利用者構成比（合計 1） */
  ageDistribution: Metric<Record<AgeBand, number>>
  /** 男女比（男性の割合 0-1） */
  maleRatio: Metric<number>
  pricing: Pricing
  /** 地域別の利用傾向（1〜5 の相対指標） */
  regionStrength: Metric<Record<Region, number>>
  safetyFeatures: SafetyFeature[]
  performance: PerformanceMetrics
  outbound: OutboundConfig
  tags: string[]
  /** デモ用架空アプリかどうか（UI 上で明示する） */
  isDemo: boolean
  /** データの最終確認日 */
  lastVerifiedAt?: string
}

/** 広告・アフィリエイト案件 */
export interface Campaign {
  id: string
  appId: string
  /** ASP名など */
  network: string
  /** 送客先 URL（アフィリエイトURL） */
  url: string
  /** 掲載期間 */
  startsAt: string
  endsAt: string
  /** 有効フラグ */
  active: boolean
  /** PR 表記を出すか（広告掲載時は true） */
  showPrLabel: boolean
}
