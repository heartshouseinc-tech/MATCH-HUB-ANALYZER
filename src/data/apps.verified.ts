/**
 * 本番用アプリデータ（入力テンプレート）
 * ==================================================
 * 入力方法は docs/DATA_ENTRY.md を参照。
 *
 * ルール
 *  - 公式サイト等で確認できた値だけを入れる。確認できない値は unknown() のまま
 *  - 値を入れるときは official(値, { url, checkedAt, note }) で出典と確認日を必ず付ける
 *  - 公式URLは実際に開いて確認してから officialUrlVerified を true にする
 *  - 入力後は `npm run data:check` でチェックする
 *
 * 現在はすべて未確認の状態です（画面では「データ未取得」・リンク無効）。
 * ロゴ画像は権利確認が済むまで使わず、イニシャル表示にしています。
 */
import type { MatchingApp } from '../types/domain'
import { unknown } from './metric'
// 値を入力するときに使う: import { official, officialSource, unknown } from './metric'

/** 未確認の実績データ（全項目データ未取得） */
const emptyPerformance = (): MatchingApp['performance'] => ({
  registeredUsers: unknown(),
  matchRate: unknown(),
  replyRate: unknown(),
  meetRate: unknown(),
  byAgeBand: {},
  byRegion: {},
})

export const VERIFIED_APPS: MatchingApp[] = [
  // ------------------------------------------------------------------
  // Pairs（ペアーズ）
  // ------------------------------------------------------------------
  {
    id: 'pairs',
    name: 'Pairs（ペアーズ）',
    logo: { initials: 'P', color: '#64748b' },
    tagline: '公式情報を確認中',
    description: '',
    // 例: purposes: ['marriage', 'love'], purposesSource: officialSource({ url: '…', checkedAt: 'YYYY-MM-DD' })
    purposes: [],
    ageDistribution: unknown(),
    maleRatio: unknown(),
    pricing: {
      // 例: monthlyMale: official(<金額>, { url: '<料金ページURL>', checkedAt: 'YYYY-MM-DD', note: 'Web版・クレジットカード・1ヶ月プラン' }),
      monthlyMale: unknown(),
      monthlyFemale: unknown(),
      note: undefined,
    },
    regionStrength: unknown(),
    // 確認できたら safetyVerified: true、safetySource: officialSource({...}) にし、該当項目を並べる
    safetyFeatures: [],
    safetyVerified: false,
    performance: emptyPerformance(),
    // URL は候補（未確認）。実際に開いて運営元を確認してから officialUrlVerified: true に
    outbound: { officialUrl: 'https://www.pairs.lv/', officialUrlVerified: false },
    tags: [],
    isDemo: false,
    lastVerifiedAt: undefined,
  },
  // ------------------------------------------------------------------
  // タップル
  // ------------------------------------------------------------------
  {
    id: 'tapple',
    name: 'タップル',
    logo: { initials: 'タ', color: '#64748b' },
    tagline: '公式情報を確認中',
    description: '',
    // 例: purposes: ['marriage', 'love'], purposesSource: officialSource({ url: '…', checkedAt: 'YYYY-MM-DD' })
    purposes: [],
    ageDistribution: unknown(),
    maleRatio: unknown(),
    pricing: {
      // 例: monthlyMale: official(<金額>, { url: '<料金ページURL>', checkedAt: 'YYYY-MM-DD', note: 'Web版・クレジットカード・1ヶ月プラン' }),
      monthlyMale: unknown(),
      monthlyFemale: unknown(),
      note: undefined,
    },
    regionStrength: unknown(),
    // 確認できたら safetyVerified: true、safetySource: officialSource({...}) にし、該当項目を並べる
    safetyFeatures: [],
    safetyVerified: false,
    performance: emptyPerformance(),
    // URL は候補（未確認）。実際に開いて運営元を確認してから officialUrlVerified: true に
    outbound: { officialUrl: 'https://tapple.me/', officialUrlVerified: false },
    tags: [],
    isDemo: false,
    lastVerifiedAt: undefined,
  },
  // ------------------------------------------------------------------
  // Omiai
  // ------------------------------------------------------------------
  {
    id: 'omiai',
    name: 'Omiai',
    logo: { initials: 'O', color: '#64748b' },
    tagline: '公式情報を確認中',
    description: '',
    // 例: purposes: ['marriage', 'love'], purposesSource: officialSource({ url: '…', checkedAt: 'YYYY-MM-DD' })
    purposes: [],
    ageDistribution: unknown(),
    maleRatio: unknown(),
    pricing: {
      // 例: monthlyMale: official(<金額>, { url: '<料金ページURL>', checkedAt: 'YYYY-MM-DD', note: 'Web版・クレジットカード・1ヶ月プラン' }),
      monthlyMale: unknown(),
      monthlyFemale: unknown(),
      note: undefined,
    },
    regionStrength: unknown(),
    // 確認できたら safetyVerified: true、safetySource: officialSource({...}) にし、該当項目を並べる
    safetyFeatures: [],
    safetyVerified: false,
    performance: emptyPerformance(),
    // URL は候補（未確認）。実際に開いて運営元を確認してから officialUrlVerified: true に
    outbound: { officialUrl: 'https://fb.omiai-jp.com/', officialUrlVerified: false },
    tags: [],
    isDemo: false,
    lastVerifiedAt: undefined,
  },
  // ------------------------------------------------------------------
  // with
  // ------------------------------------------------------------------
  {
    id: 'with',
    name: 'with',
    logo: { initials: 'w', color: '#64748b' },
    tagline: '公式情報を確認中',
    description: '',
    // 例: purposes: ['marriage', 'love'], purposesSource: officialSource({ url: '…', checkedAt: 'YYYY-MM-DD' })
    purposes: [],
    ageDistribution: unknown(),
    maleRatio: unknown(),
    pricing: {
      // 例: monthlyMale: official(<金額>, { url: '<料金ページURL>', checkedAt: 'YYYY-MM-DD', note: 'Web版・クレジットカード・1ヶ月プラン' }),
      monthlyMale: unknown(),
      monthlyFemale: unknown(),
      note: undefined,
    },
    regionStrength: unknown(),
    // 確認できたら safetyVerified: true、safetySource: officialSource({...}) にし、該当項目を並べる
    safetyFeatures: [],
    safetyVerified: false,
    performance: emptyPerformance(),
    // URL は候補（未確認）。実際に開いて運営元を確認してから officialUrlVerified: true に
    outbound: { officialUrl: 'https://with.is/', officialUrlVerified: false },
    tags: [],
    isDemo: false,
    lastVerifiedAt: undefined,
  },
  // ------------------------------------------------------------------
  // ゼクシィ縁結び
  // ------------------------------------------------------------------
  {
    id: 'zexy-enmusubi',
    name: 'ゼクシィ縁結び',
    logo: { initials: 'ゼ', color: '#64748b' },
    tagline: '公式情報を確認中',
    description: '',
    // 例: purposes: ['marriage', 'love'], purposesSource: officialSource({ url: '…', checkedAt: 'YYYY-MM-DD' })
    purposes: [],
    ageDistribution: unknown(),
    maleRatio: unknown(),
    pricing: {
      // 例: monthlyMale: official(<金額>, { url: '<料金ページURL>', checkedAt: 'YYYY-MM-DD', note: 'Web版・クレジットカード・1ヶ月プラン' }),
      monthlyMale: unknown(),
      monthlyFemale: unknown(),
      note: undefined,
    },
    regionStrength: unknown(),
    // 確認できたら safetyVerified: true、safetySource: officialSource({...}) にし、該当項目を並べる
    safetyFeatures: [],
    safetyVerified: false,
    performance: emptyPerformance(),
    // URL は候補（未確認）。実際に開いて運営元を確認してから officialUrlVerified: true に
    outbound: { officialUrl: 'https://zexy-enmusubi.net/', officialUrlVerified: false },
    tags: [],
    isDemo: false,
    lastVerifiedAt: undefined,
  },
  // ------------------------------------------------------------------
  // ブライダルネット
  // ------------------------------------------------------------------
  {
    id: 'bridalnet',
    name: 'ブライダルネット',
    logo: { initials: 'ブ', color: '#64748b' },
    tagline: '公式情報を確認中',
    description: '',
    // 例: purposes: ['marriage', 'love'], purposesSource: officialSource({ url: '…', checkedAt: 'YYYY-MM-DD' })
    purposes: [],
    ageDistribution: unknown(),
    maleRatio: unknown(),
    pricing: {
      // 例: monthlyMale: official(<金額>, { url: '<料金ページURL>', checkedAt: 'YYYY-MM-DD', note: 'Web版・クレジットカード・1ヶ月プラン' }),
      monthlyMale: unknown(),
      monthlyFemale: unknown(),
      note: undefined,
    },
    regionStrength: unknown(),
    // 確認できたら safetyVerified: true、safetySource: officialSource({...}) にし、該当項目を並べる
    safetyFeatures: [],
    safetyVerified: false,
    performance: emptyPerformance(),
    // URL は候補（未確認）。実際に開いて運営元を確認してから officialUrlVerified: true に
    outbound: { officialUrl: 'https://www.bridalnet.co.jp/', officialUrlVerified: false },
    tags: [],
    isDemo: false,
    lastVerifiedAt: undefined,
  },
  // ------------------------------------------------------------------
  // マリッシュ
  // ------------------------------------------------------------------
  {
    id: 'marrish',
    name: 'マリッシュ',
    logo: { initials: 'マ', color: '#64748b' },
    tagline: '公式情報を確認中',
    description: '',
    // 例: purposes: ['marriage', 'love'], purposesSource: officialSource({ url: '…', checkedAt: 'YYYY-MM-DD' })
    purposes: [],
    ageDistribution: unknown(),
    maleRatio: unknown(),
    pricing: {
      // 例: monthlyMale: official(<金額>, { url: '<料金ページURL>', checkedAt: 'YYYY-MM-DD', note: 'Web版・クレジットカード・1ヶ月プラン' }),
      monthlyMale: unknown(),
      monthlyFemale: unknown(),
      note: undefined,
    },
    regionStrength: unknown(),
    // 確認できたら safetyVerified: true、safetySource: officialSource({...}) にし、該当項目を並べる
    safetyFeatures: [],
    safetyVerified: false,
    performance: emptyPerformance(),
    // URL は候補（未確認）。実際に開いて運営元を確認してから officialUrlVerified: true に
    outbound: { officialUrl: 'https://marrish.com/', officialUrlVerified: false },
    tags: [],
    isDemo: false,
    lastVerifiedAt: undefined,
  },
]
