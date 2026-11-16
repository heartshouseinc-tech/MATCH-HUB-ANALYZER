/**
 * 本番データのチェック: npm run data:check
 * エラーがあれば終了コード 1（CI やビルド前チェックに使える）
 */
import { VERIFIED_APPS } from '../src/data/apps.verified'
import { completeness, validateApps } from '../src/data/validate'

const issues = validateApps(VERIFIED_APPS)
let errors = 0

console.log('\n本番データ チェック結果（src/data/apps.verified.ts）\n')
for (const app of VERIFIED_APPS) {
  const c = completeness(app)
  const total = c.filled.length + c.missing.length
  const mine = issues.filter((i) => i.appId === app.id)
  const bar = '■'.repeat(c.filled.length) + '□'.repeat(c.missing.length)
  console.log(`● ${app.name}  ${bar} ${c.filled.length}/${total}`)
  if (c.missing.length) console.log(`   未入力: ${c.missing.join('、')}`)
  for (const i of mine) {
    if (i.level === 'error') errors++
    console.log(`   ${i.level === 'error' ? '✖ エラー' : '△ 注意'} [${i.field}] ${i.message}`)
  }
}
const warnings = issues.length - errors
console.log(`\nエラー ${errors} 件 / 注意 ${warnings} 件\n`)
process.exit(errors ? 1 : 0)
