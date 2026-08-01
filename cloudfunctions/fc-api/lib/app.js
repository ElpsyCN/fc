'use strict'

const { Buffer } = require('node:buffer')
const { SaveLimitError } = require('./repository')

const SESSION_COOKIE = '__Host-fc-session'
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60
const JSON_HEADERS = {
  'cache-control': 'no-store',
  'content-type': 'application/json; charset=utf-8',
  'referrer-policy': 'no-referrer',
  'x-content-type-options': 'nosniff',
}

class ApiError extends Error {
  constructor(statusCode, reason, message = reason) {
    super(message)
    this.name = 'ApiError'
    this.reason = reason
    this.statusCode = statusCode
  }
}

function sendJson(response, statusCode, payload, headers = {}) {
  response.writeHead(statusCode, { ...JSON_HEADERS, ...headers })
  response.end(JSON.stringify(payload))
}

function readCookie(request, name) {
  const header = request.headers.cookie
  if (!header)
    return undefined
  for (const pair of header.split(';')) {
    const separator = pair.indexOf('=')
    if (separator < 0 || pair.slice(0, separator).trim() !== name)
      continue
    const value = pair.slice(separator + 1).trim()
    return /^[\w-]{43}$/.test(value) ? value : undefined
  }
}

function sessionCookie(token) {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_SECONDS}`
}

function expiredSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
}

function exactOrigin(request, allowedOrigins) {
  const origin = request.headers.origin
  if (!origin || !allowedOrigins.includes(origin))
    throw new ApiError(403, 'origin_not_allowed')
  return origin
}

function parseRoute(rawUrl) {
  const pathname = new URL(rawUrl || '/', 'http://127.0.0.1').pathname
  for (const prefix of ['/fc-api', '/api']) {
    if (pathname === prefix)
      return '/'
    if (pathname.startsWith(`${prefix}/`))
      return pathname.slice(prefix.length)
  }
  return pathname
}

async function readJsonBody(request, maximumBytes) {
  const chunks = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.length
    if (size > maximumBytes)
      throw new ApiError(413, 'payload_too_large')
    chunks.push(chunk)
  }
  if (!chunks.length)
    return {}
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  }
  catch {
    throw new ApiError(400, 'invalid_json')
  }
}

function safeProfile(identity) {
  return {
    uid: identity.userId,
    name: identity.displayName || identity.handle || '云乐坊用户',
    ...(identity.avatarUrl ? { avatar: identity.avatarUrl } : {}),
  }
}

function validSaveInput(input) {
  return input
    && typeof input === 'object'
    && typeof input.rom === 'string'
    && input.rom.length > 0
    && input.rom.length <= 256
    && typeof input.name === 'string'
    && input.name.length > 0
    && input.name.length <= 256
    && typeof input.state === 'string'
    && input.state.length > 0
    && Buffer.byteLength(input.state, 'utf8') <= 1_500_000
}

function saveIdFromRoute(route) {
  const match = route.match(/^\/saves\/([^/]+)$/)
  if (!match)
    return null
  try {
    const id = decodeURIComponent(match[1])
    return /^[\w-]{1,128}$/.test(id) ? id : null
  }
  catch {
    return null
  }
}

async function resolveSession(request, response, runtime, rotate = false) {
  const currentToken = readCookie(request, SESSION_COOKIE)
  if (!currentToken)
    return null

  const validation = await runtime.sessions.validate(currentToken)
  if (!validation.ok) {
    response.setHeader('set-cookie', expiredSessionCookie())
    return null
  }

  if (!validation.shouldRotate || !rotate) {
    return {
      session: validation.session,
      token: currentToken,
    }
  }

  const rotated = await runtime.sessions.rotate(currentToken)
  if (!('token' in rotated)) {
    response.setHeader('set-cookie', expiredSessionCookie())
    return null
  }
  response.setHeader('set-cookie', sessionCookie(rotated.token))
  return {
    session: rotated.session,
    token: rotated.token,
  }
}

async function requireSession(request, response, runtime) {
  const active = await resolveSession(request, response, runtime)
  if (!active)
    throw new ApiError(401, 'auth_required')
  return active
}

function requireCsrf(request, active, runtime) {
  const csrfToken = request.headers['x-csrf-token']
  if (typeof csrfToken !== 'string' || !runtime.verifyCsrfToken(csrfToken, active.token))
    throw new ApiError(403, 'csrf_invalid')
}

function createApiHandler(runtime) {
  return async function handleRequest(request, response) {
    const route = parseRoute(request.url)
    try {
      if (request.method === 'GET' && route === '/health') {
        sendJson(response, 200, { ok: true })
        return
      }

      if (request.method === 'POST' && route === '/session/login') {
        exactOrigin(request, runtime.allowedOrigins)
        const proof = await readJsonBody(request, 32 * 1024)
        const identity = await runtime.verifyIdentity(proof)
        const issued = await runtime.sessions.create({ appId: 'fc', userId: identity.userId })
        const member = await runtime.repository.isMember(identity.userId)
        sendJson(response, 200, {
          authenticated: true,
          csrfToken: runtime.deriveCsrfToken(issued.token),
          member,
          ok: true,
          user: safeProfile(identity),
        }, { 'set-cookie': sessionCookie(issued.token) })
        return
      }

      if (request.method === 'GET' && route === '/session') {
        const active = await resolveSession(request, response, runtime, true)
        if (!active) {
          sendJson(response, 200, { authenticated: false, ok: true })
          return
        }
        sendJson(response, 200, {
          authenticated: true,
          csrfToken: runtime.deriveCsrfToken(active.token),
          member: await runtime.repository.isMember(active.session.userId),
          ok: true,
          user: await runtime.repository.getUserProfile(active.session.userId),
        })
        return
      }

      if (request.method === 'POST' && route === '/session/logout') {
        exactOrigin(request, runtime.allowedOrigins)
        const token = readCookie(request, SESSION_COOKIE)
        if (token) {
          const active = await requireSession(request, response, runtime)
          requireCsrf(request, active, runtime)
          await runtime.sessions.revoke(active.token)
        }
        sendJson(response, 200, { ok: true }, { 'set-cookie': expiredSessionCookie() })
        return
      }

      if (request.method === 'GET' && route === '/membership') {
        const active = await requireSession(request, response, runtime)
        sendJson(response, 200, {
          member: await runtime.repository.isMember(active.session.userId),
          ok: true,
        })
        return
      }

      if (request.method === 'GET' && route === '/saves') {
        const active = await requireSession(request, response, runtime)
        if (!await runtime.repository.isMember(active.session.userId))
          throw new ApiError(403, 'membership_required')
        sendJson(response, 200, {
          max: runtime.maximumSaves,
          ok: true,
          saves: await runtime.repository.listSaves(active.session.userId),
        })
        return
      }

      if (request.method === 'POST' && route === '/saves') {
        exactOrigin(request, runtime.allowedOrigins)
        const active = await requireSession(request, response, runtime)
        requireCsrf(request, active, runtime)
        if (!await runtime.repository.isMember(active.session.userId))
          throw new ApiError(403, 'membership_required')
        const input = await readJsonBody(request, 1_600_000)
        if (!validSaveInput(input))
          throw new ApiError(400, 'invalid_save')
        const save = await runtime.repository.createSave(active.session.userId, input)
        sendJson(response, 201, { ok: true, save })
        return
      }

      const saveId = saveIdFromRoute(route)
      if (saveId && request.method === 'GET') {
        const active = await requireSession(request, response, runtime)
        if (!await runtime.repository.isMember(active.session.userId))
          throw new ApiError(403, 'membership_required')
        const save = await runtime.repository.getSave(active.session.userId, saveId)
        if (!save)
          throw new ApiError(404, 'save_not_found')
        sendJson(response, 200, { ok: true, state: save.state })
        return
      }

      if (saveId && request.method === 'DELETE') {
        exactOrigin(request, runtime.allowedOrigins)
        const active = await requireSession(request, response, runtime)
        requireCsrf(request, active, runtime)
        if (!await runtime.repository.removeSave(active.session.userId, saveId))
          throw new ApiError(404, 'save_not_found')
        sendJson(response, 200, { ok: true })
        return
      }

      if (['/session', '/session/login', '/session/logout', '/membership', '/saves'].includes(route) || saveId)
        throw new ApiError(405, 'method_not_allowed')
      throw new ApiError(404, 'not_found')
    }
    catch (error) {
      if (error instanceof runtime.identityError) {
        sendJson(response, error.statusCode, { ok: false, reason: error.code.toLowerCase() })
        return
      }
      if (error instanceof SaveLimitError) {
        sendJson(response, 409, { ok: false, reason: 'save_limit_reached' })
        return
      }
      if (error instanceof ApiError) {
        sendJson(response, error.statusCode, { ok: false, reason: error.reason })
        return
      }
      console.error(JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
        message: 'fc-api request failed',
        route,
      }))
      sendJson(response, 500, { ok: false, reason: 'server_error' })
    }
  }
}

module.exports = {
  ApiError,
  createApiHandler,
  expiredSessionCookie,
  readCookie,
  sessionCookie,
}
