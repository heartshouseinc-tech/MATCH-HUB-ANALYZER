import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppCard } from '../components/AppCard'
import { FilterPanel } from '../components/FilterPanel'
import { EmptyState, ErrorState, LoadingList } from '../components/ui'
import { useAppData } from '../hooks/useAppData'
import { DEFAULT_FILTER, filterApps, type FilterState } from '../lib/filter'

export function HomePage() {
  const { apps, campaigns, loading, error } = useAppData()
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER)
  const results = useMemo(() => filterApps(apps, filter), [apps, filter])

  return (
    <div className="space-y-5">
      {/* ヒーロー */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 to-orange-400 p-5 text-white shadow-md">
        <p className="text-xs font-bold opacity-90">マッチングアプリ比較・診断</p>
        <h1 className="mt-1 text-2xl font-extrabold leading-snug">
          あなたに合うアプリを、
          <br />
          データで見つけよう。
        </h1>
        <p className="mt-2 text-xs leading-relaxed opacity-90">
          年齢・地域・目的・予算から、最適なアプリを100点満点でスコアリング。入力内容はこの端末の中だけで処理されます。
        </p>
        <Link
          to="/diagnosis"
          className="mt-4 inline-flex items-center gap-1 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-brand-600 shadow active:scale-95"
        >
          1分でおすすめ診断 →
        </Link>
      </section>

      <FilterPanel value={filter} onChange={setFilter} />

      <section aria-labelledby="list-title">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 id="list-title" className="text-base font-bold text-slate-900">
            アプリ一覧
          </h2>
          {!loading && <span className="text-xs text-slate-500">{results.length}件</span>}
        </div>

        {error ? (
          <ErrorState message={error} />
        ) : loading ? (
          <LoadingList count={4} />
        ) : results.length === 0 ? (
          <EmptyState
            title="条件に合うアプリが見つかりません"
            body="条件をゆるめるか、リセットしてお試しください。"
            action={{ label: '条件をリセット', onClick: () => setFilter(DEFAULT_FILTER) }}
          />
        ) : (
          <div className="space-y-3">
            {results.map((a) => (
              <AppCard key={a.id} app={a} campaigns={campaigns} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
