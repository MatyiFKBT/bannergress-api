#!/usr/bin/env bun
/**
 * Regenerates the client from `openapi.json` and leaves the tree typechecking.
 *
 *    bun run generate            # refresh the spec from the live API, then generate
 *    bun run generate:offline    # generate from the committed openapi.json only
 *
 * The generator runs into a temp directory: emitting in place would also drop `docs/`,
 * `.openapi-generator-ignore` and friends into the repo. Only the files we actually
 * ship are copied over, then `scripts/fix-generated.ts` re-applies our fixes and
 * `tsc --noEmit` proves the result still compiles.
 */
import { $ } from 'bun'
import { cp, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fixGenerated } from './fix-generated'
import { syncOpenApi } from './sync-openapi'

const generatedEntries = ['apis', 'models', 'runtime.ts', 'index.ts'] as const

if (!process.argv.includes('--offline')) {
  await syncOpenApi()
}

const out = await mkdtemp(join(tmpdir(), 'bannergress-api-gen-'))
try {
  console.log('generate: running openapi-generator (typescript-fetch)…')
  await $`node_modules/.bin/openapi-generator-cli generate -i openapi.json -g typescript-fetch -o ${out}`.quiet()

  for (const entry of generatedEntries) {
    await rm(entry, { recursive: true, force: true })
    await cp(join(out, entry), entry, { recursive: true })
  }
} finally {
  await rm(out, { recursive: true, force: true })
}

await fixGenerated()

console.log('generate: typechecking the generated client…')
await $`bun run typecheck`
console.log('generate: done')
