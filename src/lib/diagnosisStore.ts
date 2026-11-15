/**
 * 診断入力の保存（ブラウザ内のみ。外部送信はしない）
 */
import type { DiagnosisInput } from './scoring'
import { loadJSON, removeKey, saveJSON } from './storage'

const KEY = 'mha:diagnosis-input'

export const DEFAULT_DIAGNOSIS: DiagnosisInput = {
  age: 28,
  gender: 'unspecified',
  region: 'kanto',
  partnerAgeMin: 25,
  partnerAgeMax: 32,
  purpose: 'love',
  budget: 5000,
  priorities: [],
}

export const loadDiagnosis = () => loadJSON<DiagnosisInput | null>(KEY, null)
export const saveDiagnosis = (v: DiagnosisInput) => saveJSON(KEY, v)
export const clearDiagnosis = () => removeKey(KEY)

export function validateDiagnosis(v: DiagnosisInput): string[] {
  const errors: string[] = []
  if (!Number.isFinite(v.age) || v.age < 18 || v.age > 99) errors.push('年齢は18〜99歳で入力してください')
  if (v.partnerAgeMin < 18) errors.push('希望する相手の年齢は18歳以上にしてください')
  if (v.partnerAgeMin > v.partnerAgeMax) errors.push('希望する相手の年齢の下限が上限を超えています')
  return errors
}
