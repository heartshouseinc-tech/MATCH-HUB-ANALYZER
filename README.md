# MATCH HUB ANALYZER v0.1

国内マッチングアプリを横断比較し、年齢・地域・目的・予算などから最適なサービスを提案する Web アプリのプロトタイプです。

> ⚠ **現在のデータはすべて架空のデモデータです。** 実在のサービス・数値とは関係ありません。画面上でも「デモ」バッジとバナーで明示しています。

## 主な機能（v0.1）

| 機能 | 内容 |
| --- | --- |
| アプリ一覧・検索 | キーワード検索、目的チップ、月額上限（男性／女性料金）、年齢層、地域、本人確認の有無で絞り込み。並び替えにも対応 |
| 比較（最大3件） | 目的・年齢層・男女比・料金・地域別傾向・実績・安全対策・公式リンクを横並びで比較。4件目は追加できずトースト表示 |
| おすすめ診断 | 年齢・性別（任意）・地域・相手の年齢・目的・予算・重視する条件を入力し、100点満点の適合スコアをランキング表示 |
| スコアの透明性 | 7つの評価軸ごとに配点・獲得点・理由を表示。算出ルールも画面に掲載 |
| アプリ詳細 | 年齢分布グラフ、男女比、地域ヒートマップ、マッチング実績、安全対策 |
| 出典表示 | 数値横の ⓘ から出典・調査期間・サンプル数・集計方法を表示。値がない項目は「データ未取得」 |
| 送客リンク | 検証済み公式 URL のみリンクを有効化。広告案件があれば案件 URL を優先し、PR 表記と `rel="sponsored"` を付与 |
| プライバシー | 診断入力・比較リスト・クリック記録はブラウザの localStorage のみに保存。外部送信なし |

## 技術構成

- React 19 / TypeScript / Vite 8
- Tailwind CSS v4（`@tailwindcss/vite`）
- React Router v7
- Vitest（スコアリング・フィルタのユニットテスト）
- バックエンド・外部 API・ログインなし。グラフは外部ライブラリなしの SVG/CSS 実装

## セットアップ・起動

Node.js 20 以上を推奨します（22 で動作確認済み）。

```bash
npm install        # 依存関係のインストール
npm run dev        # 開発サーバー起動 → http://localhost:5173
```

スマートフォン実機で確認する場合は `npm run dev -- --host` で起動し、同じネットワークから表示された IP アドレスにアクセスしてください。

## ビルド・テスト

```bash
npm run build      # 型チェック + 本番ビルド（dist/ に出力）
npm run preview    # ビルド結果をローカルで確認
npm test           # ユニットテスト
npm run typecheck  # 型チェックのみ
```

## Cloudflare Pages への公開

| 設定 | 値 |
| --- | --- |
| Framework preset | Vite（または None） |
| Build command | `npm run build` |
| Build output directory | `dist` |
| 環境変数 | `NODE_VERSION=22` |

SPA のルーティング用に `public/_redirects`（`/* /index.html 200`）を同梱しています。Netlify でもそのまま動作します。

## フォルダ構成

```
├── public/
│   ├── _redirects              # SPA 用リダイレクト（Cloudflare Pages / Netlify）
│   └── favicon.svg
├── src/
│   ├── types/domain.ts         # ドメイン型（MatchingApp, Metric, SourceInfo, Campaign など）
│   ├── data/
│   │   ├── apps.demo.ts        # 架空のデモアプリ6件 ← 実データ差し替え対象
│   │   ├── campaigns.demo.ts   # 広告・アフィリエイト案件（アプリ本体と分離）
│   │   ├── repository.ts       # データ取得の窓口（AppRepository インターフェース）
│   │   ├── metric.ts           # demo() / unknown() / sourced() ヘルパー
│   │   └── labels.ts           # 表示ラベル・地域・年齢帯の定義
│   ├── lib/
│   │   ├── scoring/            # 診断エンジン（ScoringEngine インターフェース + ルールベース実装）
│   │   ├── filter.ts           # 検索・絞り込み・並び替え
│   │   ├── outbound.ts         # 送客 URL の解決（案件 > 検証済み公式URL > 無効）
│   │   ├── tracking.ts         # クリック計測（差し替え可能な TrackingSink）
│   │   ├── diagnosisStore.ts   # 診断入力の保存・バリデーション
│   │   ├── storage.ts / format.ts
│   ├── hooks/useAppData.ts     # リポジトリからの読み込み（ローディング・エラー状態）
│   ├── context/                # 比較リスト・トースト
│   ├── components/             # UI 部品（カード、チャート、出典表示、送客ボタン等）
│   ├── pages/                  # 画面（一覧・比較・診断・結果・詳細・データ方針）
│   ├── App.tsx / main.tsx / index.css
├── server/aiExplain.ts         # AI解説のサーバー処理（Gemini 呼び出し・入出力の検証）
├── functions/api/ai-explain.ts # Cloudflare Pages Functions のエンドポイント
├── .env.example                # 環境変数のサンプル
└── vite.config.ts / tsconfig*.json
```

## データの考え方

### 値はすべて `Metric<T>` で持つ

```ts
interface Metric<T> {
  value: T | null      // null → 画面では「データ未取得」
  source?: SourceInfo  // 出典・調査期間・サンプル数・集計方法・デモフラグ
}
```

- **推測値を入れない。** 確認できない値は `unknown()`（= `null`）にします。
- 実測値・公表値は `sourced(value, { name, url, periodStart, periodEnd, sampleSize, method, isDemo: false })` で出典を必ず紐づけます。
- 診断ではデータ未取得の軸を「中立（50%）」として扱い、その旨を注意点に表示します。

### 実在アプリへの差し替え手順

1. `src/data/apps.verified.ts` を作成し、`MatchingApp[]` 型でデータを記述（`isDemo: false`）
2. 公式 URL を確認したら `outbound.officialUrl` を設定し、`officialUrlVerified: true` に
3. `src/data/repository.ts` の `appRepository` に渡す配列を差し替え
4. 全アプリが実データになったら `Layout.tsx` の `DemoBanner` を外す

JSON ファイルや CMS / API から読み込む場合は、`AppRepository` を実装したクラスを作って差し替えるだけで UI 側の変更は不要です。

### 広告・アフィリエイト

`src/data/campaigns.demo.ts` に案件を追加します（アプリ本体データとは別管理）。掲載期間内かつ `active: true` の案件があると、送客先が案件 URL に切り替わり、`showPrLabel: true` なら PR 表記が付きます。

## AI解説（Google Gemini）

診断結果画面に「AIによる解説」パネルを表示し、上位3アプリについて Gemini が解説文を生成します。

- **スコア・順位はルールベースのまま。** AI は文章だけを作ります（同じ条件なら点数は毎回同じ）
- **ユーザーが「同意してAI解説を見る」を押した時だけ**送信します。送るのは診断条件とスコア内訳のみで、氏名・連絡先は送りません
- **APIキーはサーバー側だけ**に置きます（`VITE_` 接頭辞を付けないのでブラウザには出ません）
- サーバー側で入力を検証して件数・文字数を制限し、AIの応答も「送ったアプリのコメントだけ」に絞ります
- プロンプトで「データにない数値を作らない」「データ未取得は未確認と伝える」「誇大表現をしない」と指示しています

### ローカルで試す

```bash
cp .env.example .env.local
# .env.local に GEMINI_API_KEY=（あなたのキー）と VITE_AI_ENABLED=true を記入
npm run dev
```

`npm run dev` では、本番と同じ処理（`server/aiExplain.ts`）を Vite 開発サーバーが `/api/ai-explain` として動かします。

### Cloudflare Pages で有効にする

Pages プロジェクトの **Settings → Variables and Secrets** に設定します。

| 名前 | 種類 | 値 |
| --- | --- | --- |
| `GEMINI_API_KEY` | シークレット | Gemini API キー |
| `VITE_AI_ENABLED` | 変数 | `true`（ビルド時に必要） |
| `GEMINI_MODEL` | 変数（任意） | 省略時 `gemini-2.5-flash` |
| `ALLOWED_ORIGINS` | 変数（任意） | 例 `https://your-site.pages.dev`（他サイトからの呼び出しを拒否） |

`functions/api/ai-explain.ts` が Pages Functions として自動でデプロイされます。

**費用対策（推奨）**：Google Cloud 側で API の予算アラート・割り当て上限を設定し、Cloudflare の Rate Limiting ルールで `/api/ai-explain` に IP ごとの回数制限をかけてください（v0.1 のコードにはレート制限を入れていません）。

## 診断スコアの算出方法（ルールベース v1）

| 評価軸 | 基本配点 | 判定内容 |
| --- | --- | --- |
| 利用目的 | 25 | メイン目的と一致 100% / サブ目的 60% / 対象外 10% |
| 年齢層 | 25 | 希望相手の年齢帯の利用者比率（60%）＋自分の年齢帯の比率（40%） |
| 地域 | 15 | 居住地域の利用傾向（5段階）÷ 5 |
| 料金 | 15 | 無料 100% / 予算内 75〜100% / 予算超過は超過額に応じて減点 |
| 安全性 | 10 | 本人確認・届出・監視体制などの重み付き合計 |
| 会員規模 | 5 | 登録者数（対数スケールで比較対象内の相対評価） |
| マッチング率 | 5 | 比較対象内の最大値に対する比率 |

「重視する条件」に選んだ軸は配点を 2.5 倍にし、合計 100 点に再正規化します。ロジックは `src/lib/scoring/ruleBased.ts` にまとまっています。

## 今後の機能拡張案

**データ収集・品質**
- 検証済みデータの JSON / Headless CMS 化と、管理画面からの更新・承認フロー
- 項目ごとの最終確認日と、古くなったデータの自動警告
- ユーザーアンケートによる実績データ収集（同意取得・匿名化・サンプル数の表示）
- 年代別・地域別実績の集計パイプライン（`PerformanceMetrics` 構造は準備済み）

**AI 分析**
- ✅ Gemini による推薦理由の解説（v0.1 で実装済み・スコアはルールベース）
- AI 解説の結果キャッシュ（同じ条件の再生成を省いて費用削減）
- 自由記述（「休日に一緒に出かけられる人がいい」など）からの条件抽出
- AI の推薦理由も評価軸ごとに説明し、ルールベースとの差分を表示

**収益化**
- 案件管理の管理画面化、ASP 連携、案件ごとのクリック計測（`TrackingSink` を API 送信へ差し替え）
- 掲載順位に広告が影響しないことの明示（診断スコアと広告の分離を維持）
- 景品表示法（ステマ規制）に沿った PR 表記の運用ルール化

**UX**
- 診断結果の共有 URL（入力を URL に含めず、結果のみ共有）
- お気に入り・閲覧履歴、PWA 化（オフライン・ホーム画面追加）
- ダークモード、アクセシビリティ監査、E2E テスト（Playwright）の CI 化
