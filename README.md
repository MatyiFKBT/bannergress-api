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
import { BannerControllerApi, Configuration } from 'bannergress-api';

// the generated base path is http://, which the server 301-redirects to https://
const api = new BannerControllerApi(new Configuration({ basePath: 'https://api.bannergress.com' }));

// list banners: { id, title, missions, … }
const banners = await api.list({ limit: 20, orderBy: 'relevance' });

// one banner by id, with its missions expanded
const banner = await api.get({ id: banners[0]!.id });
console.log(banner.title, Object.keys(banner.missions ?? {}).length);
```

`get` targets `GET /bnrs/{id}`, which the server exposes but leaves out of the published
OpenAPI document (see `bun run generate` below). The response also carries `owner`, a flag
for "on the authenticated user's own list".

## Development

The client is generated from `openapi.json` (a snapshot of
`https://api.bannergress.com/v3/api-docs`):

```bash
bun install
bun run generate          # refresh the spec, regenerate, re-apply fixes, typecheck
bun run generate:offline  # regenerate from the committed spec, no network
bun run build             # tsdown -> dist/
```

`scripts/sync-openapi.ts` refreshes the spec and re-adds the two things the published document
is missing (`GET /bnrs/{id}` and the `owner` field), so a refresh doesn't silently drop them.
`scripts/fix-generated.ts` re-applies the hand fixes the generator cannot produce — the
generator rewrites `apis/`, `models/`, `runtime.ts` and `index.ts` from scratch, and the
`noUncheckedIndexedAccess` fixes in `runtime.ts` would otherwise vanish. `bun run generate`
runs it automatically and ends with `tsc --noEmit`, so a regeneration cannot leave the tree
with a red typecheck.

## Releasing

Bump the version and push to `master`; CI typechecks, builds, validates the package (`publint` + `attw`)
and publishes to npm if that version is not published yet:

```bash
npm version patch
git push --follow-tags
```

Publishing uses npm trusted publishing (OIDC), so no `NPM_TOKEN` secret is needed.
