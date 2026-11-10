# bannergress-api

TypeScript client SDK for the [Bannergress](https://bannergress.com) public API. Runs anywhere
[`fetch`](https://developer.mozilla.org/docs/Web/API/Fetch_API) is available: Node.js 18+, browsers,
Bun, Deno and web workers. Ships as ESM with type declarations and no runtime dependencies.

## Installation

```bash
npm install bannergress-api
```

## Usage

```ts
import { getBanner, listBanners } from 'bannergress-api';

// list banners: { id, title, missions, … }
const banners = await listBanners({ limit: 20, orderBy: 'relevance' });

// one banner by id, with its missions expanded
const banner = await getBanner(banners[0]!.id);
console.log(banner.title, Object.keys(banner.missions ?? {}).length);
```

`getBanner` targets `GET /bnrs/{id}`, which the server exposes but leaves out of the published
OpenAPI document (see `bun run generate` below). The response also carries `owner`, a flag
for "on the authenticated user's own list".

Both functions accept optional request overrides:

```ts
await getBanner(id, {
  baseUrl: 'https://api.bannergress.com',
  headers: { Authorization: '…' },
  signal: abortController.signal,
  fetch: customFetch,
});
```

`listBanners` also accepts `acceptLanguage`, which is sent as the `Accept-Language` header.

Errors throw `BannergressApiError`, which exposes the original `Response` and any parsed error body:

```ts
import { BannergressApiError } from 'bannergress-api';

try {
  await getBanner(id);
} catch (error) {
  if (error instanceof BannergressApiError) {
    console.error(error.response.status, error.body);
  }
}
```

All date fields in the generated types are strings, matching the JSON returned by the API. This
package does not convert them to `Date`.

## Development

The types are generated from `openapi.json` (a snapshot of
`https://api.bannergress.com/v3/api-docs`):

```bash
bun install
bun run generate          # refresh the spec, regenerate schema.d.ts, typecheck
bun run generate:offline  # regenerate from the committed spec, no network
bun run generate:check    # fail if schema.d.ts is out of date
bun run test              # bun test
bun run build             # tsdown -> dist/
```

`scripts/sync-openapi.ts` refreshes the spec and re-adds the two things the published document
is missing (`GET /bnrs/{id}` and the `owner` field), so a refresh doesn't silently drop them.
`openapi-typescript` generates `schema.d.ts`; the runtime client in `client.ts` is hand-written.

## Releasing

Bump the version and push to `master`; CI typechecks, tests, builds, validates the package
(`publint` + `attw`) and publishes to npm if that version is not published yet:

```bash
npm version patch
git push --follow-tags
```

Publishing uses npm trusted publishing (OIDC), so no `NPM_TOKEN` secret is needed.
