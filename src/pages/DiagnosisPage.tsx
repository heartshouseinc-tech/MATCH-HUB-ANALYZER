import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageTitle } from '../components/Layout'
import { AI_ENABLED } from '../lib/ai/explainer'
import { Card } from '../components/ui'
import { ALL_PURPOSES, ALL_REGIONS, PURPOSE_LABELS, REGION_LABELS } from '../data/labels'
import { DEFAULT_DIAGNOSIS, loadDiagnosis, saveDiagnosis, validateDiagnosis } from '../lib/diagnosisStore'
import { CRITERION_LABELS, type DiagnosisInput, type Gender, type PriorityKey } from '../lib/scoring'

const BUDGETS: { label: string; value: number }[] = [
  { label: '無料のみ', value: 0 },
  { label: '〜3,000円', value: 3000 },
  { label: '〜4,000円', value: 4000 },
  { label: '〜5,000円', value: 5000 },
  { label: '上限なし', value: 100000 },
]

const GENDERS: { label: string; value: Gender }[] = [
  { label: '男性', value: 'male' },
  { label: '女性', value: 'female' },
  { label: '回答しない', value: 'unspecified' },
]

const PRIORITIES: PriorityKey[] = ['safety', 'budget', 'scale', 'matchRate', 'region', 'age']

const AGE_OPTIONS = Array.from({ length: 52 }, (_, i) => i + 18) // 18〜69

function Step({ n, title, hint, children }: { n: number; title: string; hint?: string; children: ReactNode }) {
  return (
    <Card>
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">{n}</span>
        <h2 className="font-bold text-slate-900">{title}</h2>
      </div>
      {hint && <p className="-mt-2 mb-3 text-xs text-slate-500">{hint}</p>}
      {children}
    </Card>
  )
}

function Seg<T extends string | number>({
  options,
  value,
  onChange,
  cols,
}: {
  options: { label: string; value: T }[]
  value: T
  onChange: (v: T) => void
  cols: number
}) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }} role="radiogroup">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-xl border px-2 py-2.5 text-sm font-bold transition ${
            value === o.value ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-slate-200 bg-white text-slate-600'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

const selectCls = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold'

export function DiagnosisPage() {
  const navigate = useNavigate()
  const [v, setV] = useState<DiagnosisInput>(() => loadDiagnosis() ?? DEFAULT_DIAGNOSIS)
  const [errors, setErrors] = useState<string[]>([])
  const set = <K extends keyof DiagnosisInput>(k: K, val: DiagnosisInput[K]) => setV((cur) => ({ ...cur, [k]: val }))

  const submit = () => {
    const errs = validateDiagnosis(v)
    setErrors(errs)
    if (errs.length) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    saveDiagnosis(v)
    navigate('/diagnosis/result')
  }

  return (
    <div className="space-y-3">
      <PageTitle title="おすすめ診断" sub="6つの質問に答えると、各アプリとの適合度を100点満点で算出します。" />

      <div className="flex items-start gap-2 rounded-xl bg-sky-50 p-3 text-xs text-sky-800">
        <span aria-hidden>🔒</span>
        <span>
          入力内容はこの端末のブラウザ内だけで処理・保存されます。
          {AI_ENABLED && '結果画面でAI解説に同意した場合のみ、条件がAI（Google Gemini）へ送信されます。'}
        </span>
      </div>

      {errors.length > 0 && (
        <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {errors.map((e) => (
            <p key={e}>・{e}</p>
          ))}
        </div>
      )}

      <Step n={1} title="あなたについて">
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-slate-500">年齢</span>
            <select className={selectCls} value={v.age} onChange={(e) => set('age', Number(e.target.value))}>
              {AGE_OPTIONS.map((a) => (
                <option key={a} value={a}>
                  {a}歳
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-slate-500">居住地域</span>
            <select className={selectCls} value={v.region} onChange={(e) => set('region', e.target.value as DiagnosisInput['region'])}>
              {ALL_REGIONS.map((r) => (
                <option key={r} value={r}>
                  {REGION_LABELS[r]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="mb-1 mt-3 text-xs font-bold text-slate-500">性別（料金の判定に使用・任意）</p>
        <Seg options={GENDERS} value={v.gender} onChange={(g) => set('gender', g)} cols={3} />
      </Step>

      <Step n={2} title="希望する相手の年齢">
        <div className="flex items-center gap-2">
          <select className={selectCls} value={v.partnerAgeMin} onChange={(e) => set('partnerAgeMin', Number(e.target.value))} aria-label="下限">
            {AGE_OPTIONS.map((a) => (
              <option key={a} value={a}>
                {a}歳
              </option>
            ))}
          </select>
          <span className="text-slate-400">〜</span>
          <select className={selectCls} value={v.partnerAgeMax} onChange={(e) => set('partnerAgeMax', Number(e.target.value))} aria-label="上限">
            {AGE_OPTIONS.map((a) => (
              <option key={a} value={a}>
                {a}歳
              </option>
            ))}
          </select>
        </div>
      </Step>

      <Step n={3} title="利用目的">
        <Seg
          options={ALL_PURPOSES.map((p) => ({ label: PURPOSE_LABELS[p], value: p }))}
          value={v.purpose}
          onChange={(p) => set('purpose', p)}
          cols={2}
        />
      </Step>

      <Step n={4} title="月額予算">
        <Seg options={BUDGETS} value={v.budget} onChange={(b) => set('budget', b)} cols={3} />
      </Step>

      <Step n={5} title="重視する条件" hint="選んだ項目は配点が2.5倍になります（複数選択可・任意）">
        <div className="flex flex-wrap gap-2">
          {PRIORITIES.map((p) => {
            const on = v.priorities.includes(p)
            return (
              <button
                key={p}
                type="button"
                aria-pressed={on}
                onClick={() => set('priorities', on ? v.priorities.filter((x) => x !== p) : [...v.priorities, p])}
                className={`rounded-full border px-3.5 py-2 text-sm font-bold transition ${
                  on ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                {on ? '✓ ' : ''}
                {CRITERION_LABELS[p]}
              </button>
            )
          })}
        </div>
      </Step>

      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 pt-2">
        <button
          type="button"
          onClick={submit}
          className="w-full rounded-2xl bg-brand-500 py-4 text-base font-extrabold text-white shadow-lg active:scale-[0.99] active:bg-brand-600"
        >
          診断する
        </button>
      </div>
    </div>
  )
}
