import { computed, ref } from 'vue'

/** 云乐坊 CloudBase 环境（见 @yunlefun/sso 文档；可用 VITE_CLOUDBASE_ENV 覆盖） */
const ENV_ID = import.meta.env.VITE_CLOUDBASE_ENV ?? 'yunlefun-8g7ybcxc7345c490'
/** 可选 publishable key（匿名/初始 session 用，SSO 注入登录态时非必需） */
const ACCESS_KEY = import.meta.env.VITE_CLOUDBASE_KEY as string | undefined

/** 暴露给 UI 的用户信息 */
export interface YlfUser {
  uid: string
  name: string
  avatar?: string
}

/** CloudBase Auth 会话用户（Supabase 风格的所需子集） */
interface CbSessionUser {
  id: string
  is_anonymous?: boolean
  user_metadata?: {
    name?: string
    nickname?: string
    avatar_url?: string
    picture?: string
  }
}

// 仅用于类型推断，不打进首屏 bundle（实际值由动态 import 懒加载）
type CloudbaseModule = typeof import('@cloudbase/js-sdk')
export type CloudbaseApp = ReturnType<CloudbaseModule['default']['init']>
type CloudbaseAuth = ReturnType<CloudbaseApp['auth']>

let app: CloudbaseApp | undefined
let auth: CloudbaseAuth | undefined

const user = ref<YlfUser | null>(null)
const ready = ref(false)
const loading = ref(false)
const isLoggedIn = computed(() => !!user.value)

/** 懒加载 CloudBase SDK 并初始化（重型 SDK 不进首屏，登录时才加载） */
async function ensureAuth(): Promise<CloudbaseAuth> {
  if (!auth) {
    const cloudbase = (await import('@cloudbase/js-sdk')).default
    app = cloudbase.init(ACCESS_KEY ? { env: ENV_ID, accessKey: ACCESS_KEY } : { env: ENV_ID })
    auth = app.auth({ persistence: 'local' })
  }
  return auth
}

function toYlfUser(u: CbSessionUser | undefined | null): YlfUser | null {
  // 匿名会话按未登录处理
  if (!u || u.is_anonymous)
    return null
  const meta = u.user_metadata ?? {}
  return {
    uid: u.id,
    name: meta.nickname || meta.name || '云乐坊用户',
    avatar: meta.avatar_url || meta.picture,
  }
}

async function syncSession(): Promise<void> {
  // getSession() 是可靠的登录态判断（getLoginState 在带 accessKey 时会误报已登录）
  const { data } = await (await ensureAuth()).getSession()
  user.value = toYlfUser(data?.session?.user as CbSessionUser | undefined)
}

/** 进站静默登录：主站 www.yunle.fun 已登录则自动复用登录态 */
async function initAuth(): Promise<void> {
  try {
    const { signInWithSso } = await import('@yunlefun/sso')
    const res = await signInWithSso(await ensureAuth(), { mode: 'silent' })
    // 'not_authenticated' 是「主站未登录」的正常结果；其余（如 invalid_request 未加白名单）值得记录便于排查
    if (!res.ok && res.reason !== 'not_authenticated')
      console.warn('[ylf-auth] 静默登录未建立会话：', res.reason)
  }
  catch (error) {
    console.error('云乐坊静默登录失败', error)
  }
  await syncSession()
  ready.value = true
}

/** 主动登录（弹窗引导） */
async function login(): Promise<{ ok: boolean, reason?: string }> {
  loading.value = true
  try {
    const { signInWithSso } = await import('@yunlefun/sso')
    const res = await signInWithSso(await ensureAuth(), { mode: 'interactive' })
    await syncSession()
    if (!res.ok)
      console.warn('[ylf-auth] SSO 登录失败：', res.reason)
    return res.ok ? { ok: true } : { ok: false, reason: res.reason }
  }
  catch (error) {
    console.error('云乐坊登录失败', error)
    return { ok: false, reason: 'error' }
  }
  finally {
    loading.value = false
  }
}

async function logout(): Promise<void> {
  try {
    if (auth)
      await auth.signOut()
  }
  finally {
    user.value = null
  }
}

export function useYlfAuth() {
  return {
    user,
    isLoggedIn,
    ready,
    loading,
    initAuth,
    login,
    logout,
    /** 供存档同步等模块复用同一个已初始化的 CloudBase auth/app */
    ensureAuth,
    getApp: () => app,
  }
}
