import { describe, expect, it } from 'bun:test'
import {
  BannergressApiError,
  getBanner,
  listBanners,
  type BannerDto,
} from './client'

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}

function recordingFetch(response: Response) {
  const calls: Array<{ input: URL; init?: RequestInit }> = []
  const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ input: input as URL, init })
    return response
  }) as typeof fetch

  return { calls, fetchImpl }
}

const banner = { title: 'Test Banner' } as BannerDto

describe('getBanner', () => {
  it('encodes the banner ID and returns the response body', async () => {
    const { calls, fetchImpl } = recordingFetch(jsonResponse(banner))

    const result = await getBanner('a b', { fetch: fetchImpl })

    expect(result).toEqual(banner)
    expect(calls[0]?.input.href).toBe(
      'https://api.bannergress.com/bnrs/a%20b',
    )
  })

  it('uses a custom base URL', async () => {
    const { calls, fetchImpl } = recordingFetch(jsonResponse(banner))

    await getBanner('id', {
      baseUrl: 'https://example.test/api/',
      fetch: fetchImpl,
    })

    expect(calls[0]?.input.href).toBe('https://example.test/bnrs/id')
  })

  it('throws a typed error on non-2xx responses', async () => {
    const { fetchImpl } = recordingFetch(
      jsonResponse(
        { message: 'not found' },
        { status: 404, statusText: 'Not Found' },
      ),
    )

    const error = await getBanner('missing', { fetch: fetchImpl }).catch(
      (error: unknown) => error,
    )

    expect(error).toBeInstanceOf(BannergressApiError)
    expect((error as BannergressApiError).response.status).toBe(404)
    expect((error as BannergressApiError).body).toEqual({
      message: 'not found',
    })
    expect((error as Error).message).toBe('HTTP 404 Not Found')
  })
})

describe('listBanners', () => {
  it('serializes query arrays and the Accept-Language header', async () => {
    const { calls, fetchImpl } = recordingFetch(jsonResponse([]))

    await listBanners(
      { listTypes: ['todo', 'done'], limit: 2 },
      { acceptLanguage: 'en', fetch: fetchImpl },
    )

    const input = calls[0]?.input
    const headers = calls[0]?.init?.headers as Headers

    expect(input?.pathname).toBe('/bnrs')
    expect(input?.searchParams.getAll('listTypes')).toEqual(['todo', 'done'])
    expect(input?.searchParams.get('limit')).toBe('2')
    expect(headers.get('Accept-Language')).toBe('en')
  })
})
