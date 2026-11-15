import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { loadJSON, saveJSON } from '../lib/storage'

export const MAX_COMPARE = 3
const KEY = 'mha:compare'

interface CompareState {
  ids: string[]
  has(id: string): boolean
  toggle(id: string): 'added' | 'removed' | 'full'
  remove(id: string): void
  clear(): void
  replace(ids: string[]): void
  isFull: boolean
}

const Ctx = createContext<CompareState | null>(null)

export function CompareProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>(() => loadJSON<string[]>(KEY, []).slice(0, MAX_COMPARE))

  useEffect(() => saveJSON(KEY, ids), [ids])

  const toggle = useCallback(
    (id: string) => {
      if (ids.includes(id)) {
        setIds((cur) => cur.filter((x) => x !== id))
        return 'removed' as const
      }
      if (ids.length >= MAX_COMPARE) return 'full' as const
      setIds((cur) => [...cur, id])
      return 'added' as const
    },
    [ids],
  )

  const value = useMemo<CompareState>(
    () => ({
      ids,
      has: (id) => ids.includes(id),
      toggle,
      remove: (id) => setIds((cur) => cur.filter((x) => x !== id)),
      clear: () => setIds([]),
      replace: (next) => setIds(next.slice(0, MAX_COMPARE)),
      isFull: ids.length >= MAX_COMPARE,
    }),
    [ids, toggle],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCompare() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useCompare must be used within CompareProvider')
  return v
}
