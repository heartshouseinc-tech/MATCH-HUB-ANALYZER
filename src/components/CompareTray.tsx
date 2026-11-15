import { Link } from 'react-router-dom'
import { MAX_COMPARE, useCompare } from '../context/CompareContext'
import { useAppData } from '../hooks/useAppData'
import { AppLogo } from './ui'

/** 比較対象を選択中に表示されるトレイ */
export function CompareTray() {
  const { ids, remove } = useCompare()
  const { apps } = useAppData()
  if (ids.length === 0) return null
  const selected = ids.map((id) => apps.find((a) => a.id === id)).filter((a) => !!a)

  return (
    <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 px-3 pb-2">
      <div className="mx-auto flex max-w-2xl items-center gap-2 rounded-2xl bg-slate-900 p-2 pl-3 text-white shadow-xl">
        <div className="flex flex-1 items-center gap-1.5 overflow-hidden">
          {selected.map((a) => (
            <button key={a.id} onClick={() => remove(a.id)} className="relative" aria-label={`${a.name}を比較から外す`}>
              <AppLogo app={a} size={32} />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-slate-900">
                ×
              </span>
            </button>
          ))}
          {Array.from({ length: MAX_COMPARE - selected.length }, (_, i) => (
            <span key={i} className="h-8 w-8 rounded-2xl border border-dashed border-slate-500" aria-hidden />
          ))}
          <span className="ml-1 text-xs text-slate-300">
            {ids.length}/{MAX_COMPARE}
          </span>
        </div>
        <Link
          to="/compare"
          className={`rounded-xl px-4 py-2 text-sm font-bold ${ids.length >= 2 ? 'bg-brand-500 text-white' : 'bg-slate-700 text-slate-300'}`}
        >
          比較する
        </Link>
      </div>
    </div>
  )
}
