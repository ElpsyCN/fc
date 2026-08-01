import { beforeEach, describe, expect, it, vi } from 'vitest'

const sdk = vi.hoisted(() => {
  const auth = {
    signOut: vi.fn().mockResolvedValue(undefined),
  }
  const authFactory = vi.fn(() => auth)
  const app: { auth?: typeof authFactory } = {}
  const core = { init: vi.fn(() => app) }
  const registerAuth = vi.fn(() => {
    app.auth = authFactory
  })
  return {
    adoptSsoIdentityProof: vi.fn().mockResolvedValue({
      accessToken: 'access-token-proof',
      identityAssertion: 'identity-assertion-proof',
      nonce: 'n'.repeat(43),
    }),
    app,
    auth,
    authFactory,
    consumeSsoRedirect: vi.fn(),
    core,
    registerAuth,
    startSsoRedirect: vi.fn().mockResolvedValue(undefined),
  }
})

vi.mock('@cloudbase/js-sdk/app', () => ({ default: sdk.core }))
vi.mock('@cloudbase/js-sdk/auth', () => ({ registerAuth: sdk.registerAuth }))
vi.mock('@yunlefun/sso', () => ({
  consumeSsoRedirect: sdk.consumeSsoRedirect,
  startSsoRedirect: sdk.startSsoRedirect,
}))
vi.mock('@yunlefun/sso/browser', () => ({
  adoptSsoIdentityProof: sdk.adoptSsoIdentityProof,
}))

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    headers: { 'content-type': 'application/json' },
    status,
  })
}

describe('useYlfAuth SSO v3 会话', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    delete sdk.app.auth
    window.location.hash = ''
    localStorage.clear()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({
      authenticated: false,
      ok: true,
    })))
  })

  it('普通访问只恢复 BFF 会话，不加载 CloudBase SDK', async () => {
    const { useYlfAuth } = await import('./useYlfAuth')
    const state = useYlfAuth()

    await Promise.all([state.initAuth(), state.initAuth()])

    expect(fetch).toHaveBeenCalledOnce()
    expect(fetch).toHaveBeenCalledWith('/api/session', expect.objectContaining({
      credentials: 'include',
    }))
    expect(sdk.core.init).not.toHaveBeenCalled()
    expect(sdk.consumeSsoRedirect).not.toHaveBeenCalled()
    expect(state.ready.value).toBe(true)
    expect(state.user.value).toBeNull()
  })

  it('sSO 回跳使用 memory-only Auth 换取 BFF 会话后立即退出临时 Auth', async () => {
    window.location.hash = '#ylf_sso=test'
    sdk.consumeSsoRedirect.mockReturnValueOnce({
      clientId: 'fc-web',
      code: 'c'.repeat(43),
      codeVerifier: 'v'.repeat(43),
      issuer: 'https://www.yunle.fun',
      nonce: 'n'.repeat(43),
      ok: true,
      redirectUri: 'https://fc.elpsy.cn/',
      scope: ['identity:bootstrap'],
    })
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({
        authenticated: true,
        csrfToken: 'csrf-token',
        member: true,
        ok: true,
        user: { uid: 'user-1', name: 'Tester' },
      }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }))

    const { useYlfAuth } = await import('./useYlfAuth')
    const state = useYlfAuth()
    await state.initAuth()

    expect(sdk.authFactory).toHaveBeenCalledWith({ persistence: 'none' })
    expect(sdk.adoptSsoIdentityProof).toHaveBeenCalledOnce()
    expect(fetch).toHaveBeenCalledWith('/api/session/login', expect.objectContaining({ method: 'POST' }))
    expect(sdk.auth.signOut).toHaveBeenCalledOnce()
    expect(state.user.value).toEqual({ uid: 'user-1', name: 'Tester' })
    expect(state.member.value).toBe(true)

    await state.logout()
    const logoutInit = vi.mocked(fetch).mock.calls[1]?.[1]
    expect(new Headers(logoutInit?.headers).get('x-csrf-token')).toBe('csrf-token')
    expect(state.user.value).toBeNull()
  })

  it('登录按钮发起顶层 PKCE redirect，不再创建弹窗', async () => {
    const { useYlfAuth } = await import('./useYlfAuth')
    const result = await useYlfAuth().login()

    expect(result).toEqual({ ok: true, redirecting: true })
    expect(sdk.startSsoRedirect).toHaveBeenCalledWith({
      clientId: 'fc-web',
      redirectUri: 'http://localhost:3000/',
      scope: ['identity:bootstrap'],
    })
  })
})
