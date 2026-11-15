import { useEffect, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useCompare } from '../context/CompareContext'
import { CompareTray } from './CompareTray'

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden>
      <path d={d} />
    </svg>
  )
}

const NAV = [
  { to: '/', label: 'さがす', icon: 'M21 21l-4.35-4.35M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z', end: true },
  { to: '/compare', label: '比較', icon: 'M9 3v18M15 3v18M3 9h18M3 15h18', end: false },
  { to: '/diagnosis', label: '診断', icon: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11', end: false },
  { to: '/about', label: 'データ', icon: 'M12 16v-4M12 8h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z', end: false },
]

export function DemoBanner() {
  return (
    <div className="flex h-7 items-center justify-center truncate border-b border-amber-200 bg-amber-50 px-4 text-[11px] text-amber-800">
      <span className="truncate">
        ⚠ 表示中のアプリ・数値は<b>すべて架空のデモデータ</b>です
      </span>
    </div>
  )
}

export function Layout() {
  const { ids } = useCompare()
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col bg-slate-50">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur">
        <div className="flex h-12 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/favicon.svg" alt="" className="h-7 w-7" />
            <span className="text-sm font-extrabold tracking-tight text-slate-900">
              MATCH HUB <span className="text-brand-500">ANALYZER</span>
            </span>
          </Link>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">v0.1 β</span>
        </div>
        <DemoBanner />
      </header>

      <main className="flex-1 px-4 pb-40 pt-4">
        <Outlet />
      </main>

      {(pathname === '/' || pathname.startsWith('/apps/')) && <CompareTray />}

      <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur" aria-label="メインナビゲーション">
        <ul className="mx-auto grid max-w-2xl grid-cols-4">
          {NAV.map((n) => (
            <li key={n.to}>
              <NavLink
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `relative flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-bold ${
                    isActive ? 'text-brand-500' : 'text-slate-400'
                  }`
                }
              >
                <Icon d={n.icon} />
                {n.label}
                {n.to === '/compare' && ids.length > 0 && (
                  <span className="absolute right-[calc(50%-20px)] top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] text-white">
                    {ids.length}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

export function PageTitle({ title, sub, children }: { title: string; sub?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-2">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900">{title}</h1>
        {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
      </div>
      {children}
    </div>
  )
}
