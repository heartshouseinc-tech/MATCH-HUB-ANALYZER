import { EmptyState } from '../components/ui'

export function NotFoundPage() {
  return <EmptyState icon="🧭" title="ページが見つかりません" action={{ label: 'トップへ戻る', to: '/' }} />
}
