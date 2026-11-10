#!/usr/bin/env bun
/**
 * Refreshes `openapi.json` from the live Bannergress API and re-adds what the published
 * spec is missing.
 *
 * `GET /bnrs/{id}` exists on the server (verified: 200, single BannerDto with `missions`
 * expanded) but does not appear in https://api.bannergress.com/v3/api-docs, so a plain
 * `curl` would silently drop it on every refresh. Same for the `owner` flag the route
 * returns. Keeping both here makes the snapshot reproducible instead of hand-edited.
 */
import { writeFile } from 'node:fs/promises'

export const SPEC_URL = 'https://api.bannergress.com/v3/api-docs'

export const SINGLE_BANNER_PATH = '/bnrs/{id}'

const singleBannerPath = {
  get: {
    tags: ['banner-controller'], // same controller as `/bnrs`, so it lands in BannerControllerApi
    operationId: 'get',
    summary: 'Get a single banner by ID',
    description:
      'Undocumented route: present on the live API but missing from the published spec.',
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        description: 'Banner ID, as returned by `list`. URL-encode it (IDs may be non-ASCII).',
        schema: { type: 'string' },
      },
    ],
    responses: {
      200: {
        description: 'OK',
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/BannerDto' } },
        },
      },
    },
  },
}

export async function syncOpenApi(): Promise<void> {
  const response = await fetch(SPEC_URL, { headers: { Accept: 'application/json' } })
  if (!response.ok) {
    throw new Error(`GET ${SPEC_URL} -> ${response.status} ${response.statusText}`)
  }
  const spec = await response.json()

  // Insert the undocumented route next to `/bnrs` rather than at the end, so the diff stays
  // readable between refreshes.
  const paths: Record<string, any> = {}
  for (const [path, item] of Object.entries(spec.paths ?? {})) {
    paths[path] = item
    if (path === '/bnrs') {
      paths[SINGLE_BANNER_PATH] = singleBannerPath
    }
  }
  if (!(SINGLE_BANNER_PATH in paths)) {
    paths[SINGLE_BANNER_PATH] = singleBannerPath
  }
  spec.paths = paths

  // The published spec declares the Accept-Language header parameter without `schema` or
  // `content`, which fails openapi-generator's spec validation. It is a plain string.
  const listParameters: any[] | undefined = paths['/bnrs']?.get?.parameters
  for (const parameter of listParameters ?? []) {
    if (!parameter.schema && !parameter.content) {
      parameter.schema = { type: 'string' }
    }
  }

  // `owner` is only returned by the single-banner route; the published BannerDto omits it.
  const banner = spec.components?.schemas?.BannerDto
  if (!banner?.properties) {
    throw new Error('openapi.json: components.schemas.BannerDto.properties is missing')
  }
  banner.properties.owner = {
    type: 'boolean',
    description: 'Whether the banner is on the authenticated user’s own list.',
  }

  await writeFile('openapi.json', `${JSON.stringify(spec, null, 2)}\n`)
  console.log(`openapi.json: ${Object.keys(paths).length} path(s), patched ${SPEC_URL}`)
}

if (import.meta.main) {
  await syncOpenApi()
}
