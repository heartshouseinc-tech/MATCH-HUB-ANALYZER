/**
 * データリポジトリ
 * --------------------------------------------------
 * UI はこのインターフェース経由でのみデータを取得する。
 * 将来、検証済みデータ（JSON / CMS / API）へ差し替える場合は
 * AppRepository を実装した別クラスを作り、`appRepository` を差し替えるだけでよい。
 */
import type { Campaign, MatchingApp } from '../types/domain'
import { DEMO_APPS } from './apps.demo'
import { DEMO_CAMPAIGNS } from './campaigns.demo'

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

export const appRepository: AppRepository = new StaticAppRepository(DEMO_APPS, DEMO_CAMPAIGNS, 350)
