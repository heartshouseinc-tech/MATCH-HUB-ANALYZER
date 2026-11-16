/**
 * データリポジトリ
 * --------------------------------------------------
 * UI はこのインターフェース経由でのみデータを取得する。
 * 将来、検証済みデータ（JSON / CMS / API）へ差し替える場合は
 * AppRepository を実装した別クラスを作り、`appRepository` を差し替えるだけでよい。
 */
import type { Campaign, MatchingApp } from '../types/domain'
import { DEMO_APPS } from './apps.demo'
import { VERIFIED_APPS } from './apps.verified'
import { DEMO_CAMPAIGNS } from './campaigns.demo'
import { PRODUCTION_CAMPAIGNS } from './campaigns.production'

export interface AppRepository {
  listApps(): Promise<MatchingApp[]>
  getApp(id: string): Promise<MatchingApp | undefined>
  listCampaigns(): Promise<Campaign[]>
}

/** 静的データを返すリポジトリ（v0.1） */
export class StaticAppRepository implements AppRepository {
  constructor(
    private readonly apps: MatchingApp[],
    private readonly campaigns: Campaign[],
    /** ローディング表示確認用の擬似遅延（ms） */
    private readonly latencyMs = 0,
  ) {}

  private wait<T>(value: T): Promise<T> {
    if (this.latencyMs <= 0) return Promise.resolve(value)
    return new Promise((resolve) => setTimeout(() => resolve(value), this.latencyMs))
  }

  listApps() {
    return this.wait(this.apps)
  }

  getApp(id: string) {
    return this.wait(this.apps.find((a) => a.id === id))
  }

  listCampaigns() {
    return this.wait(this.campaigns)
  }
}

/**
 * データソースの切り替え（ビルド時の環境変数）
 *   VITE_DATA_SOURCE=demo     … 架空のデモデータ（既定）
 *   VITE_DATA_SOURCE=verified … 本番用データ（src/data/apps.verified.ts）
 */
export type DataSource = 'demo' | 'verified'
export const DATA_SOURCE: DataSource = import.meta.env.VITE_DATA_SOURCE === 'verified' ? 'verified' : 'demo'

export const appRepository: AppRepository =
  DATA_SOURCE === 'verified'
    ? new StaticAppRepository(VERIFIED_APPS, PRODUCTION_CAMPAIGNS)
    : new StaticAppRepository(DEMO_APPS, DEMO_CAMPAIGNS, 350)
