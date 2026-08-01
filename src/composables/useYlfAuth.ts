import type { SsoFailureReason } from '@yunlefun/sso'
import { computed, ref } from 'vue'
import { FcApiError, requestFcApi, setFcApiCsrfToken } from '../lib/fc-api'

const ENV_ID = import.meta.env.VITE_CLOUDBASE_ENV ?? 'yunlefun-8g7ybcxc7345c490'
const ACCESS_KEY = import.meta.env.VITE_CLOUDBASE_KEY as string | undefined
const SSO_CLIENT_ID = import.meta.env.VITE_YLF_SSO_CLIENT_ID ?? 'fc-web'
const PROFILE_CACHE_KEY = 'fc:ylf:profile'

export interface YlfUser {
  uid: string
  name: string
  avatar?: string
}

interface SessionPayload {
  ok: true
  authenticated: boolean
  csrfToken?: string
  member?: boolean
  user?: YlfUser
}

export interface LoginResult {
  ok: boolean
  reason?: SsoFailureReason | 'error' | 'invalid_redirect' | 'server_error'
  redirecting?: boolean
}

type CloudbaseModule = typeof import('@cloudbase/js-sdk')
type CloudbaseApp = ReturnType<CloudbaseModule['init']>
type CloudbaseAuth = ReturnType<CloudbaseApp['auth']>

let proofAuth: CloudbaseAuth | undefined
let proofAuthInitialization: Promise<CloudbaseAuth> | undefined
let authRegistered = false
let sessionInitialization: Promise<void> | undefined
let initialized = false

const user = ref<YlfUser | null>(null)
const member = ref(false)
const ready = ref(false)
const loading = ref(false)
const isLoggedIn = computed(() => !!user.value)

export function hasPendingSsoRedirect(): boolean {
  return typeof window !== 'undefined' && /(?:^#|&)ylf_sso=/.test(window.location.hash)
}

function readCachedProfile(uid: string): YlfUser | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(PROFILE_CACHE_KEY) ?? 'null') as Partial<YlfUser> | null
    return parsed?.uid === uid && typeof parsed.name === 'string'
      ? { uid, name: parsed.name, ...(typeof parsed.avatar === 'string' ? { avatar: parsed.avatar } : {}) }
      : null
  }
  catch {
    return null
  }
}

function cacheProfile(profile: YlfUser | null): void {
  try {
    if (profile)
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile))
    else
      localStorage.removeItem(PROFILE_CACHE_KEY)
  }
  catch {
    // 浏览器禁用持久存储时仅影响头像/昵称缓存，不影响 HttpOnly 会话。
  }
}

function applySession(payload: SessionPayload): void {
  setFcApiCsrfToken(payload.csrfToken)
  member.value = payload.authenticated && payload.member === true
  if (!payload.authenticated || !payload.user) {
    user.value = null
    return
  }
  const cached = readCachedProfile(payload.user.uid)
  user.value = payload.user.name === '云乐坊用户' ? cached ?? payload.user : payload.user
  cacheProfile(user.value)
}

async function initializeProofAuth(): Promise<CloudbaseAuth> {
  const [{ default: cloudbase }, { registerAuth }] = await Promise.all([
    import('@cloudbase/js-sdk/app'),
    import('@cloudbase/js-sdk/auth'),
  ])
  const initializedApp = cloudbase.init(ACCESS_KEY ? { env: ENV_ID, accessKey: ACCESS_KEY } : { env: ENV_ID })
  if (!authRegistered) {
    if (typeof initializedApp.auth !== 'function')
      registerAuth(cloudbase)
    authRegistered = true
  }
  const initializedAuth = initializedApp.auth({ persistence: 'none' })
  proofAuth = initializedAuth
  return initializedAuth
}

function ensureProofAuth(): Promise<CloudbaseAuth> {
  if (proofAuth)
    return Promise.resolve(proofAuth)
  if (!proofAuthInitialization) {
    proofAuthInitialization = initializeProofAuth().catch((error: unknown) => {
      proofAuthInitialization = undefined
      throw error
    })
  }
  return proofAuthInitialization
}

async function restoreSession(): Promise<void> {
  applySession(await requestFcApi<SessionPayload>('/session'))
}

async function consumeRedirect(): Promise<LoginResult | null> {
  if (!hasPendingSsoRedirect())
    return null
  const { consumeSsoRedirect } = await import('@yunlefun/sso')
  const authorization = consumeSsoRedirect()
  if (!authorization)
    return { ok: false, reason: 'invalid_redirect' }
  if (!authorization.ok)
    return { ok: false, reason: authorization.reason }

  const auth = await ensureProofAuth()
  try {
    const { adoptSsoIdentityProof } = await import('@yunlefun/sso/browser')
    const proof = await adoptSsoIdentityProof(auth, authorization)
    const payload = await requestFcApi<SessionPayload>('/session/login', {
      body: JSON.stringify(proof),
      method: 'POST',
    })
    applySession(payload)
    return { ok: true }
  }
  finally {
    await auth.signOut()
    proofAuth = undefined
    proofAuthInitialization = undefined
  }
}

async function initializeSession(): Promise<void> {
  try {
    const redirect = await consumeRedirect()
    if (!redirect?.ok)
      await restoreSession()
    if (redirect && !redirect.ok && redirect.reason !== 'access_denied')
      console.warn('[ylf-auth] SSO 回跳未建立会话：', redirect.reason)
  }
  catch (error) {
    console.error('云乐坊会话初始化失败', error)
    user.value = null
    member.value = false
    setFcApiCsrfToken()
  }
  finally {
    initialized = true
    ready.value = true
  }
}

async function initAuth(): Promise<void> {
  if (initialized)
    return
  if (!sessionInitialization)
    sessionInitialization = initializeSession()
  return sessionInitialization
}

async function refreshSession(): Promise<void> {
  await restoreSession()
  initialized = true
  ready.value = true
}

async function login(): Promise<LoginResult> {
  loading.value = true
  try {
    const { startSsoRedirect } = await import('@yunlefun/sso')
    await startSsoRedirect({
      clientId: SSO_CLIENT_ID,
      redirectUri: new URL('/', window.location.origin).href,
      scope: ['identity:bootstrap'],
    })
    return { ok: true, redirecting: true }
  }
  catch (error) {
    console.error('云乐坊登录跳转失败', error)
    return {
      ok: false,
      reason: error instanceof TypeError ? 'invalid_redirect' : 'error',
    }
  }
  finally {
    loading.value = false
  }
}

async function logout(): Promise<void> {
  try {
    if (user.value) {
      await requestFcApi<{ ok: true }>('/session/logout', {
        body: '{}',
        method: 'POST',
      })
    }
  }
  catch (error) {
    if (!(error instanceof FcApiError && error.status === 401))
      throw error
  }
  finally {
    user.value = null
    member.value = false
    setFcApiCsrfToken()
    cacheProfile(null)
  }
}

export function useYlfAuth() {
  return {
    user,
    member,
    isLoggedIn,
    ready,
    loading,
    initAuth,
    refreshSession,
    login,
    logout,
  }
}
