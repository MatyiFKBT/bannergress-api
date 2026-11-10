# bannergress-api

TypeScript client SDK for the [Bannergress](https://bannergress.com) public API. Runs anywhere
[`fetch`](https://developer.mozilla.org/docs/Web/API/Fetch_API) is available: Node.js 18+, browsers,
Bun, Deno and web workers. Ships ESM + CommonJS with type declarations.

## Installation

```bash
npm install bannergress-api
```

## Usage

```ts
import { BannerControllerApi } from 'bannergress-api';

const api = new BannerControllerApi();
const banners = api.list()
```

## Development 

To build the API client:

```bash
curl https://api.bannergress.com/v3/api-docs -o openapi.json
docker run --rm -v ${PWD}:/local openapitools/openapi-generator-cli generate -i /local/openapi.json -g typescript-fetch -o /local
```

Then typecheck and build the package:

```bash
bun install
bun run typecheck
bun run build
```

## Releasing

Bump the version and push to `master`; CI typechecks, builds, validates the package (`publint` + `attw`)
and publishes to npm if that version is not published yet:

```bash
npm version patch
git push --follow-tags
```

Publishing uses npm trusted publishing (OIDC), so no `NPM_TOKEN` secret is needed.
