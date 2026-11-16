# 本番データ入力ガイド

`src/data/apps.verified.ts` に、実在アプリの情報を入力するための手順です。

## 大原則

1. **公式に確認できたことだけを書く。** 比較サイト・口コミ・SNS・記憶の数字は使わない
2. **確認できない項目は `unknown()` のまま。** 画面には「データ未取得」と出る。それで正しい
3. **値には必ず出典URLと確認日を付ける。** `official()` を使えば自動で付く
4. **入力したら `npm run data:check`。** エラーが 0 件になるまで公開しない

## 作業の流れ（1アプリ 15〜20分が目安）

```
① 公式サイトを開く → ② 下のチェックリストを埋める → ③ apps.verified.ts に書く
→ ④ npm run data:check → ⑤ VITE_DATA_SOURCE=verified npm run dev で画面確認 → ⑥ コミット
```

## チェックリスト（1アプリ分）

コピーしてメモに使ってください。

```
アプリ名：
確認日：YYYY-MM-DD

[ ] 公式URL         … 実際に開いた URL：
                      運営会社名が公式サイトに書かれているか：
[ ] 利用目的        … 公式の表記（例「恋活・婚活」）：          ページURL：
[ ] 男性 月額       … 金額：      プラン条件（Web/アプリ内・決済方法・1ヶ月プラン）：   ページURL：
[ ] 女性 月額       … 金額（無料なら 0）：                       ページURL：
[ ] 安全対策        … 公式に書かれているものに ✓                 ページURL：
    [ ] 公的書類による本人確認   [ ] 年齢確認        [ ] 24時間監視
    [ ] 通報・ブロック機能       [ ] 異性紹介事業の届出（届出番号：            ）
    [ ] 独身証明書               [ ] 収入証明
[ ] 登録者数        … 公式の表記そのまま（例「累計会員数○万人」）と注記（※ の条件・時点）：
[ ] キャッチコピー  … 自分の言葉で 1 行（公式の宣伝文句をそのまま使わない）
```

### 料金の注意

- 同じアプリでも **Web版とアプリ内課金（App Store / Google Play）で金額が違う** ことが多い
- このサイトでは「**1ヶ月プランの月額**」を入れ、条件を `note` に必ず書く
  例：`note: 'Web版・クレジットカード決済・1ヶ月プラン（税込）'`
- キャンペーン価格は入れない

### 登録者数の注意

- 公式の数字は「**累計**登録数」が多い（今いる人数ではない）。注記の条件を `note` に書く
- 時点が書かれていれば `checkedAt` とは別に `periodEnd` に入れる

### 入れないもの

- 年齢層の割合・男女比・地域別傾向・マッチング率・返信率・会えた割合は、**公式に数値と調査条件が出ていない限り入れない**
- マッチング率などの実績値は、サンプル数（`sampleSize`）と集計方法（`method`）がないと `data:check` がエラーにする
- ロゴ画像は各社の許諾を確認するまで使わない（イニシャル表示のまま）

## 書き方の例

> 下の数字はすべて **書き方の例** です。実際の値ではありません。

```ts
import { official, officialSource, unknown } from './metric'

const CHECKED = '2026-11-20' // 確認日
const PRICE_URL = 'https://<公式サイト>/<料金ページ>'

{
  id: 'example',
  name: 'サンプルアプリ',
  tagline: '30代の婚活向け、価値観重視のマッチング',
  description: '公式サイトの説明をもとに、自分の言葉で 2〜3 文',
  purposes: ['marriage', 'love'],                 // 先頭がメイン
  purposesSource: officialSource({ url: 'https://<公式サイト>/', checkedAt: CHECKED }),
  pricing: {
    monthlyMale: official(9999, { url: PRICE_URL, checkedAt: CHECKED, note: 'Web版・クレジットカード・1ヶ月プラン（税込）' }),
    monthlyFemale: official(0, { url: PRICE_URL, checkedAt: CHECKED, note: '女性は無料' }),
    note: 'アプリ内課金の場合は金額が異なります',
  },
  safetyFeatures: ['identityVerification', 'ageVerification', 'reportBlock', 'legalNotification'],
  safetyVerified: true,
  safetySource: officialSource({ url: 'https://<公式サイト>/<安心安全ページ>', checkedAt: CHECKED }),
  performance: {
    ...emptyPerformance(),
    registeredUsers: official(9_999_999, {
      url: 'https://<公式サイト>/',
      checkedAt: CHECKED,
      note: '公式サイト記載の累計登録数（※ 公式の注記をここに転記）',
    }),
  },
  outbound: { officialUrl: 'https://<公式サイト>/', officialUrlVerified: true },
  lastVerifiedAt: CHECKED,
  // 年齢層・男女比・地域・各種率は unknown() のまま
}
```

## 画面で確認する

```bash
VITE_DATA_SOURCE=verified npm run dev
```

- 上部の帯が「公式情報などで確認できた項目のみ掲載しています」に変わる
- アプリ詳細に「掲載情報の確認状況 ○/12 項目」が出る
- ⓘ を押すと出典URL・確認日が見られる

## 公開時

Cloudflare Pages の環境変数に `VITE_DATA_SOURCE=verified` を設定してビルドします。

## 定期メンテナンス

- **3ヶ月に1回**は料金と安全対策を確認し直し、`checkedAt` / `lastVerifiedAt` を更新する
- 料金改定のニュースを見たら、その都度更新する
