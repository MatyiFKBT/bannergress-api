#!/usr/bin/env bun
/**
 * Re-applies the hand-maintained fixes that the OpenAPI generator cannot produce.
 *
 * The generator rewrites `apis/`, `models/`, `runtime.ts` and `index.ts` from scratch on
 * every run, so anything we fix by hand disappears. `bun run generate` calls this right
 * after generating, and fails loudly if:
 *
 * - a `before` pattern no longer exists (the generator changed shape — re-check by hand), or
 * - `tsc --noEmit` still reports errors afterwards (a new class of breakage).
 */
import { readFile, writeFile } from 'node:fs/promises'

interface Fix {
  file: string
  /** Exact generated text, as emitted by openapi-generator 7.27.0. */
  before: string
  after: string
  reason: string
}

const fixes: Fix[] = [
  {
    file: 'runtime.ts',
    before: 'return match ? decodeURIComponent(match[1]) : undefined;',
    after: 'return match ? decodeURIComponent(match[1]!) : undefined;',
    reason: 'noUncheckedIndexedAccess: match[1] is string | undefined',
  },
  {
    file: 'runtime.ts',
    before: 'const name = match[1].toLowerCase();',
    after: 'const name = match[1]!.toLowerCase();',
    reason: 'noUncheckedIndexedAccess: match[1] is string | undefined',
  },
  {
    file: 'runtime.ts',
    before: ": match[3].trim());",
    after: ": match[3]!.trim());",
    reason: 'noUncheckedIndexedAccess: match[3] is string | undefined',
  },
]

export async function fixGenerated(): Promise<void> {
  const sources = new Map<string, string>()
  let applied = 0

  for (const fix of fixes) {
    const source = sources.get(fix.file) ?? (await readFile(fix.file, 'utf8'))
    if (source.includes(fix.after)) {
      sources.set(fix.file, source)
      continue
    }
    if (!source.includes(fix.before)) {
      throw new Error(
        `${fix.file}: generated pattern not found — the generator output changed.\n` +
          `  expected: ${fix.before}\n  reason:   ${fix.reason}`,
      )
    }
    sources.set(fix.file, source.replace(fix.before, fix.after))
    applied++
  }

  for (const [file, source] of sources) {
    await writeFile(file, source)
  }
  console.log(`fix-generated: ${applied} applied, ${fixes.length - applied} already present`)
}

if (import.meta.main) {
  await fixGenerated()
}
