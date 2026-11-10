#!/usr/bin/env node
/**
 * Fails the build when the published tarball grows past its budget.
 *
 * Run after `bun run build`. Budgets are deliberately close to the current size so
 * a regression (e.g. re-adding sourcemaps, sources, or a second module format)
 * trips CI instead of quietly shipping a fat package.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const budgets = {
  size: 16_000, // compressed .tgz
  unpackedSize: 72_000, // extracted bytes users have on disk
  files: 32, // file count
}

if (!existsSync('dist/index.js')) {
  console.error('dist/index.js missing — run `bun run build` first')
  process.exit(1)
}

const dir = mkdtempSync(join(tmpdir(), 'pkg-size-'))
let report
try {
  const out = execFileSync(
    'npm',
    ['pack', '--silent', '--json', '--pack-destination', dir],
    { encoding: 'utf8' },
  )
  report = JSON.parse(out)[0]
} finally {
  rmSync(dir, { recursive: true, force: true })
}

const actual = {
  size: report.size,
  unpackedSize: report.unpackedSize,
  files: report.files.length,
}

const kb = (n) => `${(n / 1024).toFixed(1)} kB`
const rows = Object.entries(budgets).map(([key, budget]) => {
  const value = actual[key]
  const format = key === 'files' ? (n) => String(n) : kb
  const used = Math.round((value / budget) * 100)
  return {
    key,
    value: `${format(value)} / ${format(budget)} (${used}%)`,
    ok: value <= budget,
  }
})

console.log(`\n${report.name}@${report.version} — ${report.files.length} files`)
for (const row of rows) {
  console.log(`  ${row.ok ? '✔' : '✖'} ${row.key.padEnd(13)} ${row.value}`)
}

const heaviest = [...report.files]
  .sort((a, b) => b.size - a.size)
  .slice(0, 5)
  .map((f) => `      ${kb(f.size).padStart(8)}  ${f.path}`)
console.log('  heaviest files:')
console.log(heaviest.join('\n'))

const maps = report.files.filter((f) => f.path.endsWith('.map'))
if (maps.length > 0) {
  console.error(`\n✖ ${maps.length} sourcemap(s) shipped: ${maps.map((f) => f.path).join(', ')}`)
}

if (!rows.every((row) => row.ok) || maps.length > 0) {
  console.error('\n✖ package exceeds its size budget')
  process.exit(1)
}

console.log('\n✔ package is within budget')
