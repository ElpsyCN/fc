const API_PREFIX = '/api'
const DEFAULT_UPSTREAM_BASE_URL = 'https://api.yunle.fun/fc-api'
const HOP_BY_HOP_HEADERS = [
  'connection',
  'host',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]

function jsonResponse(payload, status) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'cache-control': 'no-store',
      'content-type': 'application/json; charset=utf-8',
      'referrer-policy': 'no-referrer',
      'x-content-type-options': 'nosniff',
    },
  })
}

function cleanHopByHopHeaders(headers) {
  for (const name of HOP_BY_HOP_HEADERS)
    headers.delete(name)
}

export function upstreamUrl(requestUrl, configuredBaseUrl = DEFAULT_UPSTREAM_BASE_URL) {
  const base = new URL(configuredBaseUrl)
  if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash)
    throw new TypeError('FC_API_UPSTREAM_URL must be a clean HTTPS base URL')

  const suffix = requestUrl.pathname.slice(API_PREFIX.length) || '/'
  base.pathname = `${base.pathname.replace(/\/$/, '')}${suffix}`
  base.search = requestUrl.search
  return base
}

export async function proxyRequest(context) {
  const request = context.request
  const requestUrl = new URL(request.url)
  if (requestUrl.pathname !== API_PREFIX && !requestUrl.pathname.startsWith(`${API_PREFIX}/`))
    return jsonResponse({ ok: false, reason: 'not_found' }, 404)

  try {
    const target = upstreamUrl(
      requestUrl,
      context.env?.FC_API_UPSTREAM_URL || DEFAULT_UPSTREAM_BASE_URL,
    )
    const headers = new Headers(request.headers)
    cleanHopByHopHeaders(headers)
    headers.set('accept-encoding', 'identity')
    headers.set('x-forwarded-host', requestUrl.host)
    headers.set('x-forwarded-proto', requestUrl.protocol.replace(':', ''))

    const init = {
      headers,
      method: request.method,
      redirect: 'manual',
      signal: request.signal,
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      init.body = request.body
      init.duplex = 'half'
    }

    const upstream = await fetch(target, init)
    const responseHeaders = new Headers(upstream.headers)
    cleanHopByHopHeaders(responseHeaders)
    responseHeaders.delete('content-length')
    responseHeaders.set('cache-control', 'no-store')
    responseHeaders.set('x-content-type-options', 'nosniff')

    return new Response(upstream.body, {
      headers: responseHeaders,
      status: upstream.status,
      statusText: upstream.statusText,
    })
  }
  catch (error) {
    console.error(JSON.stringify({
      error: error instanceof Error ? error.message : String(error),
      message: 'fc api proxy failed',
      path: requestUrl.pathname,
      requestId: context.server?.requestId || context.uuid,
    }))
    return jsonResponse({ ok: false, reason: 'upstream_unavailable' }, 502)
  }
}

export { DEFAULT_UPSTREAM_BASE_URL }
