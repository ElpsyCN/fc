import { Buffer } from 'node:buffer'
import { request as httpsRequest } from 'node:https'

const API_PREFIX = '/api'
const DEFAULT_UPSTREAM_BASE_URL = 'https://api.yunle.fun/fc-api'
const UPSTREAM_TIMEOUT_MS = 25_000
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

export function requestUpstream(target, init) {
  return new Promise((resolve, reject) => {
    const request = httpsRequest(target, {
      headers: Object.fromEntries(init.headers.entries()),
      method: init.method,
      timeout: UPSTREAM_TIMEOUT_MS,
    }, (incoming) => {
      const chunks = []
      incoming.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
      incoming.on('error', reject)
      incoming.on('end', () => {
        const responseHeaders = new Headers()
        for (let index = 0; index < incoming.rawHeaders.length; index += 2)
          responseHeaders.append(incoming.rawHeaders[index], incoming.rawHeaders[index + 1])

        resolve(new Response(Buffer.concat(chunks), {
          headers: responseHeaders,
          status: incoming.statusCode || 502,
          statusText: incoming.statusMessage,
        }))
      })
    })

    request.on('error', reject)
    request.on('timeout', () => request.destroy(new Error('fc api upstream timed out')))
    request.end(init.body)
  })
}

export async function proxyRequest(context, transport = requestUpstream) {
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
    // The FC API accepts JSON payloads only. Buffering avoids forwarding the
    // incoming Web ReadableStream into Node's HTTPS client.
    headers.delete('content-length')
    headers.set('accept-encoding', 'identity')
    headers.set('x-forwarded-host', requestUrl.host)
    headers.set('x-forwarded-proto', requestUrl.protocol.replace(':', ''))

    const init = {
      headers,
      method: request.method,
      signal: request.signal,
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      init.body = await request.text()
      headers.set('content-length', String(Buffer.byteLength(init.body)))
    }

    // EdgeOne's global fetch has returned synthetic redirects and has stalled
    // on browser POSTs. Node's HTTPS client is stable in the Pages Node runtime
    // and cannot follow the fixed upstream onto another host.
    const upstream = await transport(target, init)
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
