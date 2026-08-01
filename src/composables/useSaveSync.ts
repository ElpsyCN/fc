import { ref } from 'vue'
import { FcApiError, requestFcApi } from '../lib/fc-api'
import { useYlfAuth } from './useYlfAuth'

const DEFAULT_MAX_CLOUD_SAVES = Number(import.meta.env.VITE_FC_MAX_SAVES ?? 20)

export interface CloudSave {
  _id: string
  rom: string
  name: string
  updatedAt: number
}

interface MembershipPayload {
  ok: true
  member: boolean
}

interface SaveListPayload {
  ok: true
  max: number
  saves: CloudSave[]
}

const cloudSaves = ref<CloudSave[]>([])
const syncing = ref(false)
const maximumSaves = ref(DEFAULT_MAX_CLOUD_SAVES)

function apiReason(error: unknown, fallback: string): string {
  if (!(error instanceof FcApiError))
    return fallback
  const reasons: Record<string, string> = {
    auth_required: '请先登录',
    invalid_save: '存档数据无效',
    membership_required: '云存档为会员专享',
    payload_too_large: '存档过大，无法上传',
    save_limit_reached: `云存档已达上限（${maximumSaves.value}）`,
  }
  return reasons[error.reason] ?? fallback
}

export function useSaveSync() {
  const { member: isMember, isLoggedIn } = useYlfAuth()

  async function checkMember(): Promise<boolean> {
    if (!isLoggedIn.value) {
      isMember.value = false
      return false
    }
    try {
      const payload = await requestFcApi<MembershipPayload>('/membership')
      isMember.value = payload.member
    }
    catch (error) {
      console.error('查询云乐坊会员状态失败', error)
      isMember.value = false
    }
    return isMember.value
  }

  async function refreshCloudSaves(): Promise<void> {
    if (!isLoggedIn.value) {
      cloudSaves.value = []
      return
    }
    try {
      const payload = await requestFcApi<SaveListPayload>('/saves')
      maximumSaves.value = payload.max
      cloudSaves.value = payload.saves
    }
    catch (error) {
      console.error('拉取云存档失败', error)
      cloudSaves.value = []
    }
  }

  async function pushSave(rom: string, name: string, state: string): Promise<{ ok: boolean, reason?: string }> {
    if (!isLoggedIn.value)
      return { ok: false, reason: '请先登录' }
    if (!isMember.value)
      return { ok: false, reason: '云存档为会员专享' }
    syncing.value = true
    try {
      await requestFcApi<{ ok: true }>('/saves', {
        body: JSON.stringify({ name, rom, state }),
        method: 'POST',
      })
      await refreshCloudSaves()
      return { ok: true }
    }
    catch (error) {
      console.error('上传云存档失败', error)
      return { ok: false, reason: apiReason(error, '同步失败') }
    }
    finally {
      syncing.value = false
    }
  }

  async function loadSaveState(id: string): Promise<string | undefined> {
    try {
      const payload = await requestFcApi<{ ok: true, state: string }>(`/saves/${encodeURIComponent(id)}`)
      return payload.state
    }
    catch (error) {
      console.error('读取云存档失败', error)
      return undefined
    }
  }

  async function removeSave(id: string): Promise<boolean> {
    syncing.value = true
    try {
      await requestFcApi<{ ok: true }>(`/saves/${encodeURIComponent(id)}`, { method: 'DELETE' })
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
    max: maximumSaves,
    checkMember,
    refreshCloudSaves,
    pushSave,
    loadSaveState,
    removeSave,
  }
}
