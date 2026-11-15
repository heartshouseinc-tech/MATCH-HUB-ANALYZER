import type { AgeBand, Purpose, Region, SafetyFeature } from '../types/domain'

export const PURPOSE_LABELS: Record<Purpose, string> = {
  love: '恋活',
  marriage: '婚活',
  friends: '友達探し',
  casual: '気軽な出会い',
}

export const REGION_LABELS: Record<Region, string> = {
  hokkaido: '北海道',
  tohoku: '東北',
  kanto: '関東',
  chubu: '中部',
  kinki: '近畿',
  chugoku: '中国',
  shikoku: '四国',
  kyushu: '九州・沖縄',
}

export const AGE_BANDS: AgeBand[] = ['18-24', '25-29', '30-34', '35-39', '40-49', '50+']

export const AGE_BAND_LABELS: Record<AgeBand, string> = {
  '18-24': '18〜24歳',
  '25-29': '25〜29歳',
  '30-34': '30〜34歳',
  '35-39': '35〜39歳',
  '40-49': '40代',
  '50+': '50代以上',
}

/** 年齢帯の下限・上限（上限は含む） */
export const AGE_BAND_RANGES: Record<AgeBand, [number, number]> = {
  '18-24': [18, 24],
  '25-29': [25, 29],
  '30-34': [30, 34],
  '35-39': [35, 39],
  '40-49': [40, 49],
  '50+': [50, 69],
}

export const SAFETY_LABELS: Record<SafetyFeature, string> = {
  identityVerification: '公的書類による本人確認',
  ageVerification: '年齢確認',
  monitoring24h: '24時間監視体制',
  reportBlock: '通報・ブロック機能',
  legalNotification: 'インターネット異性紹介事業 届出',
  singleStatusCheck: '独身証明書の提出',
  incomeVerification: '収入証明の提出',
}

export const ALL_SAFETY_FEATURES = Object.keys(SAFETY_LABELS) as SafetyFeature[]
export const ALL_REGIONS = Object.keys(REGION_LABELS) as Region[]
export const ALL_PURPOSES = Object.keys(PURPOSE_LABELS) as Purpose[]

export function ageToBand(age: number): AgeBand {
  if (age < 25) return '18-24'
  if (age < 30) return '25-29'
  if (age < 35) return '30-34'
  if (age < 40) return '35-39'
  if (age < 50) return '40-49'
  return '50+'
}
