#!/usr/bin/env bun
/**
 * Regenerates `schema.d.ts` from `openapi.json`.
 *
 *    bun run generate            # refresh the spec from the live API, then generate
 *    bun run generate:offline    # generate from the committed openapi.json only
 *    bun run generate:check      # fail if schema.d.ts is out of date
 *
 * openapi-typescript only emits types; the runtime client lives in `client.ts`.
 */
import { $ } from 'bun'
import { syncOpenApi } from './sync-openapi'

const offline = process.argv.includes('--offline')
const check = process.argv.includes('--check')

if (!offline) {
  await syncOpenApi()
}

if (check) {
  console.log('generate: checking schema.d.ts…')
  await $`node_modules/.bin/openapi-typescript openapi.json -o schema.d.ts --check`
  console.log('generate: schema is up to date')
} else {
  console.log('generate: running openapi-typescript…')
  await $`node_modules/.bin/openapi-typescript openapi.json -o schema.d.ts`

  console.log('generate: typechecking…')
  await $`bun run typecheck`
  console.log('generate: done')
}
