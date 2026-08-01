const API_BASE = (import.meta.env.VITE_FC_API_BASE ?? '/api').replace(/\/$/, '')

let csrfToken = ''

interface ApiFailure {
  ok?: false
  reason?: string
}

export class FcApiError extends Error {
  constructor(
    readonly status: number,
    readonly reason: string,
  ) {
    super(reason)
    this.name = 'FcApiError'
  }
}

export function setFcApiCsrfToken(token?: string): void {
  csrfToken = token ?? ''
}

export async function requestFcApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase()
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('content-type'))
    headers.set('content-type', 'application/json')
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && csrfToken)
    headers.set('x-csrf-token', csrfToken)

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    cache: 'no-store',
    credentials: 'include',
    headers,
  })
  const payload = await response.json().catch(() => null) as (T & ApiFailure) | null
  if (!response.ok)
    throw new FcApiError(response.status, payload?.reason ?? 'request_failed')
  if (!payload)
    throw new FcApiError(response.status, 'invalid_response')
  return payload
}
