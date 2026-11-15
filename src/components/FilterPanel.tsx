import { useState, type ReactNode } from 'react'
import { AGE_BANDS, AGE_BAND_LABELS, ALL_PURPOSES, ALL_REGIONS, PURPOSE_LABELS, REGION_LABELS } from '../data/labels'
import { countActiveFilters, DEFAULT_FILTER, type FilterState, type SortKey } from '../lib/filter'

const PRICE_OPTIONS: { label: string; value: number | null }[] = [
  { label: '指定なし', value: null },
  { label: '無料のみ', value: 0 },
  { label: '〜3,000円', value: 3000 },
  { label: '〜4,000円', value: 4000 },
  { label: '〜5,000円', value: 5000 },
]

const SORT_OPTIONS: { label: string; value: SortKey }[] = [
  { label: '標準', value: 'recommended' },
  { label: '料金が安い順', value: 'priceAsc' },
  { label: '登録者数が多い順', value: 'usersDesc' },
  { label: '安全対策が多い順', value: 'safetyDesc' },
  { label: '名前順', value: 'name' },
]

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
        active ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-200 bg-white text-slate-600'
      }`}
    >
      {children}
    </button>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-bold text-slate-500">{label}</p>
      {children}
    </div>
  )
}

const selectCls = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm'

export function FilterPanel({ value, onChange }: { value: FilterState; onChange: (f: FilterState) => void }) {
  const [open, setOpen] = useState(false)
  const set = <K extends keyof FilterState>(k: K, v: FilterState[K]) => onChange({ ...value, [k]: v })
  const active = countActiveFilters(value)

  return (
    <div className="space-y-3">
      {/* 検索 */}
      <div className="relative">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden>
          <path d="M21 21l-4.35-4.35M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z" />
        </svg>
        <input
          type="search"
          value={value.query}
          onChange={(e) => set('query', e.target.value)}
          placeholder="アプリ名・特徴で検索（例：婚活、無料）"
          aria-label="アプリを検索"
          className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-9 pr-3 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </div>

      {/* 目的チップ（常時表示） */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        <Chip active={value.purposes.length === 0} onClick={() => set('purposes', [])}>
          すべて
        </Chip>
        {ALL_PURPOSES.map((p) => (
          <Chip
            key={p}
            active={value.purposes.includes(p)}
            onClick={() =>
              set('purposes', value.purposes.includes(p) ? value.purposes.filter((x) => x !== p) : [...value.purposes, p])
            }
          >
            {PURPOSE_LABELS[p]}
          </Chip>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4" aria-hidden>
            <path d="M4 6h16M7 12h10M10 18h4" />
          </svg>
          詳細条件
          {active > 0 && <span className="rounded-full bg-brand-500 px-1.5 text-[10px] text-white">{active}</span>}
        </button>
        <select
          value={value.sort}
          onChange={(e) => set('sort', e.target.value as SortKey)}
          aria-label="並び替え"
          className="ml-auto rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-bold text-slate-600"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {open && (
        <div className="space-y-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <Field label="月額料金">
            <div className="flex gap-2">
              <select
                className={selectCls}
                value={value.maxPrice ?? ''}
                onChange={(e) => set('maxPrice', e.target.value === '' ? null : Number(e.target.value))}
                aria-label="月額料金の上限"
              >
                {PRICE_OPTIONS.map((o) => (
                  <option key={o.label} value={o.value ?? ''}>
                    {o.label}
                  </option>
                ))}
              </select>
              <select
                className={`${selectCls} w-28 shrink-0`}
                value={value.priceGender}
                onChange={(e) => set('priceGender', e.target.value as 'male' | 'female')}
                aria-label="料金の基準"
              >
                <option value="male">男性料金</option>
                <option value="female">女性料金</option>
              </select>
            </div>
          </Field>
          <Field label="利用者の多い年齢層">
            <select
              className={selectCls}
              value={value.ageBand ?? ''}
              onChange={(e) => set('ageBand', (e.target.value || null) as FilterState['ageBand'])}
              aria-label="年齢層"
            >
              <option value="">指定なし</option>
              {AGE_BANDS.map((b) => (
                <option key={b} value={b}>
                  {AGE_BAND_LABELS[b]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="利用が活発な地域">
            <select
              className={selectCls}
              value={value.region ?? ''}
              onChange={(e) => set('region', (e.target.value || null) as FilterState['region'])}
              aria-label="地域"
            >
              <option value="">指定なし</option>
              {ALL_REGIONS.map((r) => (
                <option key={r} value={r}>
                  {REGION_LABELS[r]}
                </option>
              ))}
            </select>
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={value.requireIdVerification}
              onChange={(e) => set('requireIdVerification', e.target.checked)}
              className="h-4 w-4 accent-brand-500"
            />
            公的書類による本人確認があるアプリのみ
          </label>
          <p className="text-[11px] text-slate-400">※ 該当項目のデータが未取得のアプリは、その条件の絞り込み結果から除外されます。</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onChange({ ...DEFAULT_FILTER, query: value.query, sort: value.sort })}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600"
            >
              条件をリセット
            </button>
            <button type="button" onClick={() => setOpen(false)} className="flex-1 rounded-xl bg-slate-900 py-2.5 text-sm font-bold text-white">
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
