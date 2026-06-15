import { ref } from 'vue'
import { useYlfAuth } from './useYlfAuth'

/** 会员集合名（云乐坊会员数据所在 CloudBase 集合，可用 env 覆盖；字段约定见下方 MemberDoc） */
const MEMBER_COLLECTION = import.meta.env.VITE_YLF_MEMBER_COLLECTION ?? 'ylf_members'
/** 云存档集合名 */
const SAVE_COLLECTION = 'fc_saves'
/** 云存档总数上限（所有游戏合计；可用 env 覆盖） */
const MAX_CLOUD_SAVES = Number(import.meta.env.VITE_FC_MAX_SAVES ?? 20)

/** 云存档记录 */
export interface CloudSave {
  _id: string
  rom: string
  name: string
  state: string
  updatedAt: number
}

/** 会员文档约定字段（任一为真即视为会员，便于兼容不同后端命名） */
interface MemberDoc {
  isMember?: boolean
  isVip?: boolean
  vip?: boolean
  level?: number
}

const isMember = ref(false)
const cloudSaves = ref<CloudSave[]>([])
const syncing = ref(false)

export function useSaveSync() {
  const { user, isLoggedIn, ensureAuth, getApp } = useYlfAuth()

  async function getDb() {
    await ensureAuth()
    const app = getApp()
    if (!app)
      throw new Error('CloudBase 未初始化')
    return app.database()
  }

  /** 查询当前用户是否云乐坊会员 */
  async function checkMember(): Promise<boolean> {
    if (!user.value) {
      isMember.value = false
      return false
    }
    try {
      const db = await getDb()
      // 按 uid 查会员集合（集合若配「仅创建者可读」也会自动按 _openid 过滤）
      const { data } = await db.collection(MEMBER_COLLECTION)
        .where({ uid: user.value.uid })
        .limit(1)
        .get()
      const doc = (data?.[0] ?? {}) as MemberDoc
      isMember.value = Boolean(doc.isMember || doc.isVip || doc.vip || (doc.level ?? 0) > 0)
    }
    catch (error) {
      console.error('查询云乐坊会员状态失败', error)
      isMember.value = false
    }
    return isMember.value
  }

  /** 拉取当前用户的云存档列表（按更新时间倒序） */
  async function refreshCloudSaves(): Promise<void> {
    if (!isLoggedIn.value) {
      cloudSaves.value = []
      return
    }
    try {
      const db = await getDb()
      const { data } = await db.collection(SAVE_COLLECTION).get()
      cloudSaves.value = ((data ?? []) as CloudSave[]).sort((a, b) => b.updatedAt - a.updatedAt)
    }
    catch (error) {
      console.error('拉取云存档失败', error)
      cloudSaves.value = []
    }
  }

  /** 上传一个云存档（会员 + 总数上限校验） */
  async function pushSave(rom: string, name: string, state: string): Promise<{ ok: boolean, reason?: string }> {
    if (!isLoggedIn.value)
      return { ok: false, reason: '请先登录' }
    if (!isMember.value)
      return { ok: false, reason: '云存档为会员专享' }
    if (cloudSaves.value.length >= MAX_CLOUD_SAVES)
      return { ok: false, reason: `云存档已达上限（${MAX_CLOUD_SAVES}）` }
    syncing.value = true
    try {
      const db = await getDb()
      await db.collection(SAVE_COLLECTION).add({ rom, name, state, updatedAt: Date.now() })
      await refreshCloudSaves()
      return { ok: true }
    }
    catch (error) {
      console.error('上传云存档失败', error)
      return { ok: false, reason: '同步失败' }
    }
    finally {
      syncing.value = false
    }
  }

  /** 取某条云存档的存档数据，供模拟器读取 */
  function getSaveState(id: string): string | undefined {
    return cloudSaves.value.find(s => s._id === id)?.state
  }

  /** 删除一条云存档 */
  async function removeSave(id: string): Promise<boolean> {
    syncing.value = true
    try {
      const db = await getDb()
      await db.collection(SAVE_COLLECTION).doc(id).remove()
      await refreshCloudSaves()
      return true
    }
    catch (error) {
      console.error('删除云存档失败', error)
      return false
    }
    finally {
      syncing.value = false
    }
  }

  return {
    isMember,
    cloudSaves,
    syncing,
    max: MAX_CLOUD_SAVES,
    checkMember,
    refreshCloudSaves,
    pushSave,
    getSaveState,
    removeSave,
  }
}
