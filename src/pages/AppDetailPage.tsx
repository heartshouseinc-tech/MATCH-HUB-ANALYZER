import { Link, useParams } from 'react-router-dom'
import { CompareToggle } from '../components/AppCard'
import { AgeDistributionChart, GenderRatioBar, RegionHeat } from '../components/charts'
import { OutboundButton } from '../components/OutboundButton'
import { AppLogo, Card, DemoBadge, EmptyState, LoadingList, PrBadge, PurposeChips, SectionTitle } from '../components/ui'
import { MetricValue, NoData, SourceDetails } from '../components/MetricValue'
import { isSafetyVerified } from '../data/metric'
import { completeness } from '../data/validate'
import { AGE_BANDS, AGE_BAND_LABELS, ALL_REGIONS, ALL_SAFETY_FEATURES, REGION_LABELS, SAFETY_LABELS } from '../data/labels'
import { useAppData } from '../hooks/useAppData'
import { formatCount, formatPercent, formatYen } from '../lib/format'
import { findActiveCampaign } from '../lib/outbound'
import type { Metric } from '../types/domain'

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-2.5 text-sm last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-bold text-slate-800">{children}</span>
    </div>
  )
}

const pct = (v: number) => formatPercent(v)

function CompletenessMeter({ app }: { app: Parameters<typeof completeness>[0] }) {
  const c = completeness(app)
  const total = c.filled.length + c.missing.length
  return (
    <div className="mt-3 rounded-xl bg-slate-50 p-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-slate-600">掲載情報の確認状況</span>
        <span className="tabular-nums text-slate-500">
          {c.filled.length} / {total} 項目
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(c.filled.length / total) * 100}%` }} />
      </div>
      <p className="mt-1.5 text-[11px] text-slate-400">公式情報などで確認できた項目のみ掲載しています。</p>
    </div>
  )
}

export function AppDetailPage() {
  const { id } = useParams()
  const { apps, campaigns, loading } = useAppData()
  if (loading) return <LoadingList count={2} />
  const app = apps.find((a) => a.id === id)
  if (!app) {
    return <EmptyState icon="🤔" title="アプリが見つかりません" body="URLが正しいかご確認ください。" action={{ label: 'アプリ一覧へ', to: '/' }} />
  }
  const promoted = findActiveCampaign(app.id, campaigns)?.showPrLabel
  const perf = app.performance
  const ageRows = AGE_BANDS.filter((b) => perf.byAgeBand[b]) as (keyof typeof perf.byAgeBand)[]
  const regionRows = ALL_REGIONS.filter((r) => perf.byRegion[r])

  return (
    <div className="space-y-4">
      <Link to="/" className="inline-block text-xs font-bold text-slate-500">
        ← 一覧へ戻る
      </Link>

      <Card>
        <div className="flex gap-4">
          <AppLogo app={app} size={64} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h1 className="text-xl font-extrabold text-slate-900">{app.name}</h1>
              {app.isDemo && <DemoBadge />}
              {promoted && <PrBadge />}
            </div>
            <p className="mt-0.5 text-sm text-slate-600">{app.tagline}</p>
            <PurposeChips purposes={app.purposes} className="mt-2" />
          </div>
        </div>
        {app.description && <p className="mt-3 text-sm leading-relaxed text-slate-600">{app.description}</p>}
        {!app.isDemo && <CompletenessMeter app={app} />}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {app.tags.map((t) => (
            <span key={t} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
              #{t}
            </span>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
          <OutboundButton app={app} campaigns={campaigns} placement="detail" />
          <div>
            <CompareToggle app={app} />
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle>料金</SectionTitle>
        <Row label="男性 月額">
          <MetricValue metric={app.pricing.monthlyMale} format={formatYen} />
        </Row>
        <Row label="女性 月額">
          <MetricValue metric={app.pricing.monthlyFemale} format={formatYen} />
        </Row>
        {app.pricing.note && <p className="mt-2 text-xs text-slate-400">{app.pricing.note}</p>}
      </Card>

      <Card>
        <SectionTitle>利用者の傾向</SectionTitle>
        <p className="mb-2 text-xs font-bold text-slate-500">年齢層</p>
        <AgeDistributionChart metric={app.ageDistribution} />
        <p className="mb-2 mt-5 text-xs font-bold text-slate-500">男女比</p>
        <GenderRatioBar metric={app.maleRatio} />
        <p className="mb-2 mt-5 text-xs font-bold text-slate-500">地域別の利用傾向</p>
        <RegionHeat metric={app.regionStrength} />
      </Card>

      <Card>
        <SectionTitle sub="出典のない数値は掲載せず「データ未取得」と表示します">マッチング実績</SectionTitle>
        <Row label="登録者数">
          <MetricValue metric={perf.registeredUsers} format={formatCount} />
        </Row>
        <Row label="マッチング成立率">
          <MetricValue metric={perf.matchRate} format={pct} />
        </Row>
        <Row label="メッセージ返信率">
          <MetricValue metric={perf.replyRate} format={pct} />
        </Row>
        <Row label="実際に会えた割合">
          <MetricValue metric={perf.meetRate} format={pct} />
        </Row>

        <p className="mb-1 mt-4 text-xs font-bold text-slate-500">年代別マッチング成立率</p>
        {ageRows.length ? (
          ageRows.map((b) => (
            <Row key={b} label={AGE_BAND_LABELS[b]}>
              <MetricValue metric={perf.byAgeBand[b] as Metric<number>} format={pct} />
            </Row>
          ))
        ) : (
          <p className="text-xs text-slate-400">データ未取得</p>
        )}

        <p className="mb-1 mt-4 text-xs font-bold text-slate-500">地域別マッチング成立率</p>
        {regionRows.length ? (
          regionRows.map((r) => (
            <Row key={r} label={REGION_LABELS[r]}>
              <MetricValue metric={perf.byRegion[r] as Metric<number>} format={pct} />
            </Row>
          ))
        ) : (
          <p className="text-xs text-slate-400">データ未取得</p>
        )}
      </Card>

      <Card>
        <SectionTitle>安全対策・本人確認</SectionTitle>
        {!isSafetyVerified(app) ? (
          <p className="text-sm">
            <NoData />
            <span className="ml-2 text-xs text-slate-400">公式情報を確認中です</span>
          </p>
        ) : (
        <ul className="space-y-2">
          {ALL_SAFETY_FEATURES.map((f) => {
            const ok = app.safetyFeatures.includes(f)
            return (
              <li key={f} className="flex items-center gap-2 text-sm">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    ok ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {ok ? '✓' : '−'}
                </span>
                <span className={ok ? 'text-slate-700' : 'text-slate-400'}>{SAFETY_LABELS[f]}</span>
              </li>
            )
          })}
        </ul>
        )}
        {isSafetyVerified(app) && <p className="mt-3 text-[11px] text-slate-400">「−」は公式情報で確認できなかった項目です。</p>}
        {app.safetySource && !app.safetySource.isDemo && (
          <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
            <SourceDetails source={app.safetySource} />
          </div>
        )}
      </Card>

      {app.lastVerifiedAt && <p className="text-center text-[11px] text-slate-400">情報確認日：{app.lastVerifiedAt}</p>}
    </div>
  )
}
