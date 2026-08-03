// @vitest-environment node

import http from 'node:http'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import app from './app.js'

const { createApiHandler } = app

const SESSION_TOKEN = 's'.repeat(43)
const ORIGIN = 'https://fc.yunle.fun'
const LEGACY_ORIGIN = 'https://fc.elpsy.cn'

class IdentityError extends Error {}

function runtime() {
  return {
    allowedOrigins: [ORIGIN, LEGACY_ORIGIN],
    deriveCsrfToken: vi.fn(() => 'csrf-token'),
    identityError: IdentityError,
    maximumSaves: 20,
    repository: {
      createSave: vi.fn(async (_userId, input) => ({
        _id: 'save-1',
        name: input.name,
        rom: input.rom,
        updatedAt: 1,
      })),
      getSave: vi.fn(async () => ({ state: '{"cpu":[]}', userId: 'user-1' })),
      getUserProfile: vi.fn(async () => ({ name: 'Tester', uid: 'user-1' })),
      isMember: vi.fn(async () => true),
      listSaves: vi.fn(async () => [{
        _id: 'save-1',
        name: 'Mario',
        rom: 'roms/mario.nes',
        updatedAt: 1,
      }]),
      removeSave: vi.fn(async () => true),
    },
    sessions: {
      create: vi.fn(async () => ({
        revokedSessionIds: [],
        session: { appId: 'fc', userId: 'user-1' },
        token: SESSION_TOKEN,
      })),
      revoke: vi.fn(async () => true),
      rotate: vi.fn(),
      validate: vi.fn(async () => ({
        ok: true,
        session: { appId: 'fc', userId: 'user-1' },
        shouldRotate: false,
      })),
    },
    verifyCsrfToken: vi.fn(token => token === 'csrf-token'),
    verifyIdentity: vi.fn(async () => ({
      accountStatus: 'active',
      displayName: 'Tester',
      phoneVerified: true,
      userId: 'user-1',
    })),
  }
}

describe('fc-api HTTP Function', () => {
  let server
  let baseUrl
  let deps

  beforeEach(async () => {
    deps = runtime()
    server = http.createServer(createApiHandler(deps))
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
    const address = server.address()
    baseUrl = `http://127.0.0.1:${address.port}`
  })

  afterEach(async () => {
    await new Promise(resolve => server.close(resolve))
  })

  it('用双证明创建 host-only 会话', async () => {
    const response = await fetch(`${baseUrl}/session/login`, {
      body: JSON.stringify({ accessToken: 'proof', identityAssertion: 'assertion', nonce: 'nonce' }),
      headers: [['content-type', 'application/json'], ['origin', ORIGIN]],
      method: 'POST',
    })
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(response.headers.get('set-cookie')).toContain('__Host-fc-session=')
    expect(response.headers.get('set-cookie')).toContain('HttpOnly; Secure; SameSite=Lax')
    expect(payload).toMatchObject({ authenticated: true, csrfToken: 'csrf-token' })
  })

  it('拒绝非登记 Origin 的登录请求', async () => {
    const response = await fetch(`${baseUrl}/session/login`, {
      body: '{}',
      headers: [['content-type', 'application/json'], ['origin', 'https://evil.example']],
      method: 'POST',
    })
    expect(response.status).toBe(403)
    expect(await response.json()).toMatchObject({ reason: 'origin_not_allowed' })
    expect(deps.verifyIdentity).not.toHaveBeenCalled()
  })

  it('列表不返回大状态，读取单条存档时才返回 state', async () => {
    const headers = { cookie: `${SESSION_TOKEN ? '__Host-fc-session=' : ''}${SESSION_TOKEN}` }
    const listResponse = await fetch(`${baseUrl}/saves`, { headers })
    const list = await listResponse.json()
    expect(list.saves[0]).not.toHaveProperty('state')

    const stateResponse = await fetch(`${baseUrl}/saves/save-1`, { headers })
    expect(await stateResponse.json()).toMatchObject({ state: '{"cpu":[]}' })
  })

  it('只在 session 恢复接口轮换令牌并同步新 CSRF', async () => {
    deps.sessions.validate.mockResolvedValue({
      ok: true,
      session: { appId: 'fc', userId: 'user-1' },
      shouldRotate: true,
    })
    deps.sessions.rotate.mockResolvedValue({
      revokedSessionIds: [],
      session: { appId: 'fc', userId: 'user-1' },
      token: 'r'.repeat(43),
    })
    const headers = { cookie: `__Host-fc-session=${SESSION_TOKEN}` }

    await fetch(`${baseUrl}/saves`, { headers })
    expect(deps.sessions.rotate).not.toHaveBeenCalled()

    const response = await fetch(`${baseUrl}/session`, { headers })
    expect(deps.sessions.rotate).toHaveBeenCalledOnce()
    expect(response.headers.get('set-cookie')).toContain(`__Host-fc-session=${'r'.repeat(43)}`)
    expect(await response.json()).toMatchObject({ csrfToken: 'csrf-token' })
  })

  it('写入存档要求精确 Origin 和 session-bound CSRF', async () => {
    const response = await fetch(`${baseUrl}/saves`, {
      body: JSON.stringify({ name: 'Mario', rom: 'roms/mario.nes', state: '{}' }),
      headers: [
        ['content-type', 'application/json'],
        ['cookie', `__Host-fc-session=${SESSION_TOKEN}`],
        ['origin', ORIGIN],
      ],
      method: 'POST',
    })
    expect(response.status).toBe(403)
    expect(await response.json()).toMatchObject({ reason: 'csrf_invalid' })
    expect(deps.repository.createSave).not.toHaveBeenCalled()
  })
})
