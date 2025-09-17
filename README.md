# bannergress-api

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
docker run --rm -v ${PWD}:/local openapitools/openapi-generator-cli generate -i /local/openapi.json -g typescript-fetch -o /local/api
```
