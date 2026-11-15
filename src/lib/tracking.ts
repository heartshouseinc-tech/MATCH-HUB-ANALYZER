/**
 * クリック計測
 * --------------------------------------------------
 * v0.1 ではブラウザ内（localStorage）にのみ記録し、外部送信はしない。
 * 将来は TrackingSink を差し替えて自前 API / 解析ツールへ送信できる。
 */
export interface OutboundClickEvent {
  appId: string
  campaignId?: string
  url: string
  /** どの画面から遷移したか */
  placement: 'list' | 'detail' | 'compare' | 'diagnosis'
  at: string
}

export interface TrackingSink {
  record(event: OutboundClickEvent): void
}

const STORAGE_KEY = 'mha:outbound-clicks'
const MAX_EVENTS = 200

export const localStorageSink: TrackingSink = {
  record(event) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const list: OutboundClickEvent[] = raw ? JSON.parse(raw) : []
      list.push(event)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(-MAX_EVENTS)))
    } catch {
      /* ストレージが使えない環境では何もしない */
    }
  },
}

let sink: TrackingSink = localStorageSink

export function setTrackingSink(next: TrackingSink) {
  sink = next
}

export function trackOutboundClick(e: Omit<OutboundClickEvent, 'at'>) {
  sink.record({ ...e, at: new Date().toISOString() })
}

export function readLocalClicks(): OutboundClickEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}
