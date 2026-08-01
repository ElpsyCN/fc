// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_UPSTREAM_BASE_URL, proxyRequest, upstreamUrl } from './_proxy.js'

function createContext(request, env = {}) {
  return {
    env,
    request,
    server: { requestId: 'request-1' },
  }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('edgeOne API proxy', () => {
  it('maps the same-origin API path to the CloudBase gateway', () => {
    const target = upstreamUrl(new URL('https://fc.elpsy.cn/api/saves/save-1?full=1'))
    expect(target.href).toBe(`${DEFAULT_UPSTREAM_BASE_URL}/saves/save-1?full=1`)
  })

  it('streams cookies, origin and request bodies to the upstream', async () => {
    const fetchMock = vi.fn(async () => new Response('{"ok":true}', {
      headers: {
        'content-type': 'application/json',
        'set-cookie': '__Host-fc-session=token; Path=/; HttpOnly; Secure; SameSite=Lax',
      },
    }))
    vi.stubGlobal('fetch', fetchMock)

    const request = new Request('https://fc.elpsy.cn/api/saves?slot=1', {
      body: '{"state":"save"}',
      headers: {
        'cookie': '__Host-fc-session=old-token',
        'origin': 'https://fc.elpsy.cn',
        'x-forwarded-host': 'attacker.example',
      },
      method: 'POST',
    })
    const response = await proxyRequest(createContext(request))

    expect(fetchMock).toHaveBeenCalledOnce()
    const [target, init] = fetchMock.mock.calls[0]
    expect(target.href).toBe(`${DEFAULT_UPSTREAM_BASE_URL}/saves?slot=1`)
    expect(init.headers.get('cookie')).toBe('__Host-fc-session=old-token')
    expect(init.headers.get('origin')).toBe('https://fc.elpsy.cn')
    expect(init.headers.get('x-forwarded-host')).toBe('fc.elpsy.cn')
    expect(init.headers.get('x-forwarded-proto')).toBe('https')
    expect(await new Request(target, init).text()).toBe('{"state":"save"}')
    expect(response.headers.get('set-cookie')).toContain('__Host-fc-session=token')
    expect(response.headers.get('cache-control')).toBe('no-store')
  })

  it('rejects non-HTTPS upstream configuration without forwarding the request', async () => {
    const fetchMock = vi.fn()
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubGlobal('fetch', fetchMock)

    const response = await proxyRequest(createContext(
      new Request('https://fc.elpsy.cn/api/session'),
      { FC_API_UPSTREAM_URL: 'http://127.0.0.1:9000/fc-api' },
    ))

    expect(response.status).toBe(502)
    expect(await response.json()).toEqual({ ok: false, reason: 'upstream_unavailable' })
    expect(fetchMock).not.toHaveBeenCalled()
    expect(consoleError).toHaveBeenCalledOnce()
  })

  it('does not proxy paths outside the API namespace', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const response = await proxyRequest(createContext(new Request('https://fc.elpsy.cn/roms/game.nes')))

    expect(response.status).toBe(404)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
