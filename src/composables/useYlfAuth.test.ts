import { beforeEach, describe, expect, it, vi } from 'vitest'

const sdk = vi.hoisted(() => {
  const auth = {
    getSession: vi.fn().mockResolvedValue({ data: { session: undefined } }),
    signOut: vi.fn().mockResolvedValue(undefined),
  }
  const get = vi.fn().mockResolvedValue({ data: [] })
  const collection = vi.fn(() => ({
    where: vi.fn(() => ({
      limit: vi.fn(() => ({ get })),
    })),
  }))
  const database = { collection }
  const authFactory = vi.fn(() => auth)
  const databaseFactory = vi.fn(() => database)
  const app: {
    auth?: typeof authFactory
    database?: typeof databaseFactory
  } = {}
  const core = {
    init: vi.fn(() => app),
  }
  const registerAuth = vi.fn(() => {
    app.auth = authFactory
  })
  const registerDatabase = vi.fn(() => {
    app.database = databaseFactory
  })

  return {
    app,
    auth,
    authFactory,
    collection,
    core,
    databaseFactory,
    databaseModuleLoads: 0,
    get,
    registerAuth,
    registerDatabase,
    signInWithSso: vi.fn().mockResolvedValue({ ok: false, reason: 'not_authenticated' }),
  }
})

vi.mock('@cloudbase/js-sdk/app', () => ({
  default: sdk.core,
}))

vi.mock('@cloudbase/js-sdk/auth', () => ({
  registerAuth: sdk.registerAuth,
}))

vi.mock('@cloudbase/js-sdk/database', () => {
  sdk.databaseModuleLoads += 1
  return { registerDatabase: sdk.registerDatabase }
})

vi.mock('@yunlefun/sso', () => ({
  signInWithSso: sdk.signInWithSso,
}))

describe('useYlfAuth CloudBase 模块加载', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    sdk.databaseModuleLoads = 0
    delete sdk.app.auth
    delete sdk.app.database
  })

  it('并发初始化时仅注册一次 App/Auth，且不提前加载 Database', async () => {
    const { useYlfAuth } = await import('./useYlfAuth')
    const first = useYlfAuth()
    const second = useYlfAuth()

    await Promise.all([first.ensureAuth(), second.ensureAuth()])

    expect(sdk.registerAuth).toHaveBeenCalledOnce()
    expect(sdk.core.init).toHaveBeenCalledOnce()
    expect(sdk.authFactory).toHaveBeenCalledOnce()
    expect(sdk.databaseModuleLoads).toBe(0)
    expect(sdk.registerDatabase).not.toHaveBeenCalled()
  })

  it('未找到本地凭据时按未登录处理，不误报静默登录失败', async () => {
    sdk.auth.getSession.mockResolvedValueOnce({
      data: {},
      error: new Error('credentials not found'),
    })
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { useYlfAuth } = await import('./useYlfAuth')
    const authState = useYlfAuth()

    await authState.initAuth()

    expect(authState.ready.value).toBe(true)
    expect(authState.user.value).toBeNull()
    expect(consoleError).not.toHaveBeenCalled()
    consoleError.mockRestore()
  })

  it('首次使用云存档数据库时才加载并注册 Database', async () => {
    const { useYlfAuth } = await import('./useYlfAuth')
    const { useSaveSync } = await import('./useSaveSync')
    const authState = useYlfAuth()

    await authState.ensureAuth()
    expect(sdk.databaseModuleLoads).toBe(0)

    authState.user.value = { uid: 'user-1', name: 'Tester' }
    await useSaveSync().checkMember()

    expect(sdk.databaseModuleLoads).toBe(1)
    expect(sdk.registerDatabase).toHaveBeenCalledOnce()
    expect(sdk.databaseFactory).toHaveBeenCalledOnce()
    expect(sdk.collection).toHaveBeenCalledWith('user_memberships')
  })

  it('子模块已自动注册时不重复调用注册函数', async () => {
    sdk.app.auth = sdk.authFactory
    sdk.app.database = sdk.databaseFactory
    const { useYlfAuth } = await import('./useYlfAuth')

    await useYlfAuth().ensureDatabase()

    expect(sdk.registerAuth).not.toHaveBeenCalled()
    expect(sdk.registerDatabase).not.toHaveBeenCalled()
  })
})
