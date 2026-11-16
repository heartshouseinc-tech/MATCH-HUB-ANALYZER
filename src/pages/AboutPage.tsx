import { PageTitle } from '../components/Layout'
import { Card, DemoBadge, PrBadge, SectionTitle } from '../components/ui'
import { NoData } from '../components/MetricValue'
import { clearDiagnosis } from '../lib/diagnosisStore'
import { readLocalClicks } from '../lib/tracking'
import { useState } from 'react'
import { AI_ENABLED } from '../lib/ai/explainer'

export function AboutPage() {
  const [cleared, setCleared] = useState(false)
  const clicks = readLocalClicks()

  return (
    <div className="space-y-4">
      <PageTitle title="データと掲載方針" sub="MATCH HUB ANALYZER の情報の扱いについて" />

      <Card>
        <SectionTitle>表示ラベルの意味</SectionTitle>
        <ul className="space-y-3 text-sm">
          <li className="flex items-start gap-2">
            <DemoBadge className="mt-0.5" />
            <span>架空のデモ用データです。実在のサービス・数値ではありません。</span>
          </li>
          <li className="flex items-start gap-2">
            <NoData className="mt-0.5 shrink-0" />
            <span>出典を確認できていない項目です。推測値を事実として表示しないため、空欄扱いにしています。</span>
          </li>
          <li className="flex items-start gap-2">
            <PrBadge className="mt-0.5" />
            <span>広告・アフィリエイトリンクを含む掲載です。</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-700">i</span>
            <span>タップすると出典・調査期間・サンプル数・集計方法を確認できます。</span>
          </li>
        </ul>
      </Card>

      <Card>
        <SectionTitle>掲載データの方針</SectionTitle>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-600">
          <li>各社の非公開数値を推測して掲載することはありません。</li>
          <li>実測値・公表値を掲載する場合は、出典・調査期間・サンプル数・集計方法を併記します。</li>
          <li>公式URLが確認できないアプリは、外部リンクを無効にしています。</li>
          <li>広告掲載時は「PR」表記を行い、リンクに rel="sponsored" を付与します。</li>
        </ul>
      </Card>

      <Card>
        <SectionTitle>プライバシー</SectionTitle>
        <p className="text-sm text-slate-600">
          診断の入力内容や比較リストは、お使いのブラウザ内（localStorage）にのみ保存され、通常は外部サーバーへ送信されません。
        </p>
        {AI_ENABLED && (
          <p className="mt-2 text-sm text-slate-600">
            例外として、診断結果画面で「同意してAI解説を見る」を押した場合に限り、診断条件（年齢・性別・地域・相手の年齢・目的・予算・重視条件）と上位3アプリのスコア内訳を、当サイトのサーバー経由で
            Google（Gemini API）へ送信します。氏名や連絡先は送信しません。
          </p>
        )}
        <p className="mt-2 text-xs text-slate-400">この端末に記録された外部リンクのクリック数：{clicks.length}件（端末内のみ）</p>
        <button
          type="button"
          onClick={() => {
            clearDiagnosis()
            try {
              localStorage.removeItem('mha:outbound-clicks')
            } catch {
              /* noop */
            }
            setCleared(true)
          }}
          className="mt-3 w-full rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600"
        >
          {cleared ? '削除しました' : '診断データ・クリック記録を削除'}
        </button>
      </Card>

      <p className="text-center text-[11px] text-slate-400">MATCH HUB ANALYZER v0.1（プロトタイプ）</p>
    </div>
  )
}
