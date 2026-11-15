import { useEffect, useState } from 'react'
import { appRepository } from '../data/repository'
import type { Campaign, MatchingApp } from '../types/domain'

interface AppDataState {
  apps: MatchingApp[]
  campaigns: Campaign[]
  loading: boolean
  error: string | null
}

let cache: { apps: MatchingApp[]; campaigns: Campaign[] } | null = null

/** アプリ一覧と広告案件を取得する（リポジトリ経由・メモリキャッシュ付き） */
export function useAppData(): AppDataState {
  const [state, setState] = useState<AppDataState>(() =>
    cache ? { ...cache, loading: false, error: null } : { apps: [], campaigns: [], loading: true, error: null },
  )

  useEffect(() => {
    if (cache) return
    let cancelled = false
    Promise.all([appRepository.listApps(), appRepository.listCampaigns()])
      .then(([apps, campaigns]) => {
        cache = { apps, campaigns }
        if (!cancelled) setState({ apps, campaigns, loading: false, error: null })
      })
      .catch(() => {
        if (!cancelled) setState((s) => ({ ...s, loading: false, error: 'データの読み込みに失敗しました' }))
      })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
