import type { components, operations } from './schema';

export type BannerDto = components['schemas']['BannerDto'];
export type MissionDto = components['schemas']['MissionDto'];
export type MissionStepDto = components['schemas']['MissionStepDto'];
export type PoiDto = components['schemas']['PoiDto'];
export type NamedAgentDto = components['schemas']['NamedAgentDto'];
export type BannerListType = components['schemas']['BannerListType'];
export type BannerSortOrder = components['schemas']['BannerSortOrder'];
export type Faction = components['schemas']['Faction'];
export type Objective = components['schemas']['Objective'];
export type POIType = components['schemas']['POIType'];

export type ListBannersParams = NonNullable<
  operations['list']['parameters']['query']
>;

export interface RequestOptions {
  baseUrl?: string;
  fetch?: typeof fetch;
  headers?: HeadersInit;
  signal?: AbortSignal;
}

export interface ListBannersOptions extends RequestOptions {
  acceptLanguage?: string;
}

export class BannergressApiError extends Error {
  override name = 'BannergressApiError';

  constructor(
    readonly response: Response,
    readonly body?: unknown,
  ) {
    super(`HTTP ${response.status} ${response.statusText}`);
  }
}

const DEFAULT_BASE_URL = 'https://api.bannergress.com';

async function request<T>(
  path: string,
  query: URLSearchParams | undefined,
  options: RequestOptions,
): Promise<T> {
  const url = new URL(path, options.baseUrl ?? DEFAULT_BASE_URL);
  const search = query?.toString();
  if (search) {
    url.search = search;
  }

  const response = await (options.fetch ?? fetch)(url, {
    headers: options.headers,
    signal: options.signal,
  });

  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      // The error response did not contain JSON.
    }
    throw new BannergressApiError(response, body);
  }

  return (await response.json()) as T;
}

/**
 * Get a single banner by ID, with its missions expanded.
 */
export function getBanner(
  id: string,
  options: RequestOptions = {},
): Promise<BannerDto> {
  return request(`/bnrs/${encodeURIComponent(id)}`, undefined, options);
}

/**
 * List banners matching the given filters.
 */
export function listBanners(
  params: ListBannersParams = {},
  options: ListBannersOptions = {},
): Promise<BannerDto[]> {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        query.append(key, String(item));
      }
    } else {
      query.set(key, String(value));
    }
  }

  const headers = new Headers(options.headers);
  if (options.acceptLanguage) {
    headers.set('Accept-Language', options.acceptLanguage);
  }

  return request('/bnrs', query, { ...options, headers });
}
