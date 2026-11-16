import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { PageTitle } from '../components/Layout'
import { NoData, MetricValue } from '../components/MetricValue'
import { OutboundButton } from '../components/OutboundButton'
import { StrengthDots } from '../components/charts'
import { AppLogo, DemoBadge, EmptyState, LoadingList, PurposeChips } from '../components/ui'
import { MAX_COMPARE, useCompare } from '../context/CompareContext'
import { AGE_BANDS, AGE_BAND_LABELS, ALL_REGIONS, REGION_LABELS, SAFETY_LABELS } from '../data/labels'
import { hasValue, isSafetyVerified } from '../data/metric'
import { useAppData } from '../hooks/useAppData'
import { formatCount, formatPercent, formatYen } from '../lib/format'
import type { MatchingApp } from '../types/domain'

const pct = (v: number) => formatPercent(v)

function topAgeBands(app: MatchingApp) {
  if (!hasValue(app.ageDistribution)) return null
  const d = app.ageDistribution.value
  return [...AGE_BANDS].sort((a, b) => d[b] - d[a]).slice(0, 2)
}

function topRegions(app: MatchingApp) {
  if (!hasValue(app.regionStrength)) return null
  const d = app.regionStrength.value
  const max = Math.max(...ALL_REGIONS.map((r) => d[r]))
  return ALL_REGIONS.filter((r) => d[r] === max)
}

interface RowDef {
  label: string
  render: (a: MatchingApp) => ReactNode
}

interface Group {
  title: string
  rows: RowDef[]
}

/** 安全対策の行（未確認ならデータ未取得） */
const safetyCell = (a: MatchingApp, f: MatchingApp['safetyFeatures'][number]) =>
  !isSafetyVerified(a) ? <NoData /> : a.safetyFeatures.includes(f) ? '✓' : <span className="text-slate-300">−</span>

const GROUPS: Group[] = [
  {
    title: '基本情報',
    rows: [
      {
        label: '主な利用目的',
        render: (a) => <PurposeChips purposes={a.purposes} className="justify-center" />,
      },
      {
        label: '利用者の多い年齢層',
        render: (a) => {
          const t = topAgeBands(a)
          return t ? t.map((b) => <div key={b}>{AGE_BAND_LABELS[b]}</div>) : <NoData />
        },
      },
      {
        label: '男女比（男:女）',
        render: (a) =>
          hasValue(a.maleRatio) ? (
            <span>
              {Math.round(a.maleRatio.value * 100)}:{100 - Math.round(a.maleRatio.value * 100)}
            </span>
          ) : (
            <NoData />
          ),
      },
    ],
  },
  {
    title: '料金',
    rows: [
      { label: '男性 月額', render: (a) => <MetricValue metric={a.pricing.monthlyMale} format={formatYen} /> },
      { label: '女性 月額', render: (a) => <MetricValue metric={a.pricing.monthlyFemale} format={formatYen} /> },
    ],
  },
  {
    title: '地域別の利用傾向',
    rows: [
      {
        label: '特に活発な地域',
        render: (a) => {
          const t = topRegions(a)
          return t ? <span className="text-xs">{t.map((r) => REGION_LABELS[r]).join('・')}</span> : <NoData />
        },
      },
      ...ALL_REGIONS.map<RowDef>((r) => ({
        label: REGION_LABELS[r],
        render: (a) => (hasValue(a.regionStrength) ? <StrengthDots value={a.regionStrength.value[r]} /> : <NoData />),
      })),
    ],
  },
  {
    title: '実績',
    rows: [
      { label: '登録者数', render: (a) => <MetricValue metric={a.performance.registeredUsers} format={formatCount} /> },
      { label: 'マッチング率', render: (a) => <MetricValue metric={a.performance.matchRate} format={pct} /> },
      { label: 'メッセージ返信率', render: (a) => <MetricValue metric={a.performance.replyRate} format={pct} /> },
      { label: '実際に会えた割合', render: (a) => <MetricValue metric={a.performance.meetRate} format={pct} /> },
    ],
  },
  {
    title: '安全対策・本人確認',
    rows: [
      { label: '本人確認（公的書類）', render: (a) => safetyCell(a, 'identityVerification') },
      { label: '24時間監視', render: (a) => safetyCell(a, 'monitoring24h') },
      { label: '独身証明', render: (a) => safetyCell(a, 'singleStatusCheck') },
      {
        label: '対策項目数',
        render: (a) => (isSafetyVerified(a) ? `${a.safetyFeatures.length} / ${Object.keys(SAFETY_LABELS).length}` : <NoData />),
      },
    ],
  },
]

export function ComparePage() {
  const { ids, remove, clear } = useCompare()
  const { apps, campaigns, loading } = useAppData()

  if (loading) return <LoadingList count={2} />

  const selected = ids.map((id) => apps.find((a) => a.id === id)).filter((a): a is MatchingApp => !!a)

  if (selected.length === 0) {
    return (
      <div>
        <PageTitle title="アプリ比較" sub={`最大${MAX_COMPARE}アプリを横並びで比較できます`} />
        <EmptyState
          icon="📊"
          title="比較するアプリが選ばれていません"
          body="一覧の「＋ 比較」ボタンから、最大3つまで選んでください。"
          action={{ label: 'アプリを選ぶ', to: '/' }}
        />
      </div>
    )
  }

  const cols = selected.length
  const grid = { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }

  return (
    <div>
      <PageTitle title="アプリ比較" sub={`${cols} / ${MAX_COMPARE} アプリを比較中`}>
        <button onClick={clear} className="text-xs font-bold text-slate-400">
          すべて解除
        </button>
      </PageTitle>

      <div className="overflow-clip rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
        {/* ヘッダー（スクロール追従） */}
        <div className="sticky top-[76px] z-20 grid gap-px border-b border-slate-100 bg-white" style={grid}>
          {selected.map((a) => (
            <div key={a.id} className="relative flex flex-col items-center px-1 py-3 text-center">
              <button
                onClick={() => remove(a.id)}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-500"
                aria-label={`${a.name}を比較から外す`}
              >
                ×
              </button>
              <Link to={`/apps/${a.id}`}>
                <AppLogo app={a} size={40} />
              </Link>
              <Link to={`/apps/${a.id}`} className="mt-1 line-clamp-1 text-xs font-bold text-slate-900">
                {a.name}
              </Link>
              {a.isDemo && <DemoBadge className="mt-0.5" />}
            </div>
          ))}
        </div>

        {GROUPS.map((g) => (
          <div key={g.title}>
            <div className="bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-500">{g.title}</div>
            {g.rows.map((row) => (
              <div key={row.label} className="border-b border-slate-50 last:border-0">
                <div className="px-3 pt-2 text-[10px] font-bold text-slate-400">{row.label}</div>
                <div className="grid gap-px" style={grid}>
                  {selected.map((a) => (
                    <div key={a.id} className="flex min-h-9 flex-col items-center justify-center px-1 pb-2 pt-1 text-center text-sm font-bold text-slate-800">
                      {row.render(a)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}

        <div className="bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-500">公式サイト</div>
        <div className="grid gap-2 p-2" style={grid}>
          {selected.map((a) => (
            <OutboundButton key={a.id} app={a} campaigns={campaigns} placement="compare" size="sm" />
          ))}
        </div>
      </div>

      {cols < MAX_COMPARE && (
        <Link
          to="/"
          className="mt-4 flex items-center justify-center rounded-2xl border border-dashed border-slate-300 py-3 text-sm font-bold text-slate-500"
        >
          ＋ アプリを追加（あと{MAX_COMPARE - cols}つ）
        </Link>
      )}
      <p className="mt-3 text-center text-[11px] text-slate-400">ⓘ ボタンで各数値の出典を確認できます</p>
    </div>
  )
}
