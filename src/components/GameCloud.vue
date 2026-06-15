<script setup lang="ts">
import { ref } from 'vue'
import { useNes } from '../composables/useNes'
import { useSaveSync } from '../composables/useSaveSync'
import { useToast } from '../composables/useToast'
import { useYlfAuth } from '../composables/useYlfAuth'

const nesApp = useNes()
const { isLoggedIn, login } = useYlfAuth()
const {
  isMember,
  cloudSaves,
  syncing,
  max,
  checkMember,
  refreshCloudSaves,
  pushSave,
  getSaveState,
  removeSave,
} = useSaveSync()
const { showToast } = useToast()

const open = ref(false)

async function openDialog() {
  open.value = true
  if (isLoggedIn.value) {
    await checkMember()
    await refreshCloudSaves()
  }
}

function romName(rom: string): string {
  return rom.replace(/^roms\//, '').replace(/\.nes$/i, '')
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getMonth() + 1}/${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}`
}

async function onUpload() {
  const app = nesApp.value
  if (!app)
    return
  const rom = app.getRom()
  if (!rom) {
    showToast('请先开始游戏')
    return
  }
  const state = JSON.stringify(app.instance.toJSON())
  const res = await pushSave(rom, `${romName(rom)} ${formatTime(Date.now())}`, state)
  showToast(res.ok ? '已上传到云存档' : res.reason ?? '上传失败')
}

function onLoad(id: string) {
  const app = nesApp.value
  const state = getSaveState(id)
  if (!app || !state)
    return
  try {
    app.instance.fromJSON(JSON.parse(state) as Parameters<typeof app.instance.fromJSON>[0])
    showToast('已读取云存档')
    open.value = false
  }
  catch {
    showToast('读取失败')
  }
}

async function onRemove(id: string) {
  showToast((await removeSave(id)) ? '已删除' : '删除失败')
}

async function onLogin() {
  const res = await login()
  if (res.ok) {
    await checkMember()
    await refreshCloudSaves()
  }
}
</script>

<template>
  <button v-if="isLoggedIn" class="cloud-trigger" type="button" aria-label="云存档" @click="openDialog">
    <i-mdi-cloud-outline />
  </button>

  <Teleport to="body">
    <Transition name="help">
      <div v-if="open" class="help-overlay" @click.self="open = false">
        <div class="help-dialog" role="dialog" aria-label="云存档">
          <h2 class="help-title">
            云存档
          </h2>

          <p v-if="!isLoggedIn" class="cloud-tip">
            登录云乐坊账号后，会员可将游戏存档同步到云端。
            <button class="help-close" type="button" @click="onLogin">
              用云乐坊账号登录
            </button>
          </p>
          <p v-else-if="!isMember" class="cloud-tip">
            云存档为云乐坊会员专享。开通会员后即可跨设备同步游戏进度。
          </p>
          <template v-else>
            <div class="cloud-actions">
              <button class="cloud-upload" type="button" :disabled="syncing" @click="onUpload">
                <i-mdi-cloud-upload /> 上传当前进度
              </button>
              <span class="cloud-count">{{ cloudSaves.length }} / {{ max }}</span>
            </div>
            <ul v-if="cloudSaves.length" class="cloud-list">
              <li v-for="save in cloudSaves" :key="save._id">
                <span class="cloud-name">{{ save.name }}</span>
                <span class="cloud-ops">
                  <button type="button" aria-label="读取此存档" @click="onLoad(save._id)">
                    <i-mdi-tray-arrow-down />
                  </button>
                  <button type="button" aria-label="删除此存档" @click="onRemove(save._id)">
                    <i-mdi-delete-outline />
                  </button>
                </span>
              </li>
            </ul>
            <p v-else class="cloud-tip">
              还没有云存档，点上方按钮上传当前进度。
            </p>
          </template>

          <button class="help-close" type="button" @click="open = false">
            关闭
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss">
.cloud-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: none;
  border-radius: 5px;
  color: var(--panel);
  background: var(--btn);
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;

  &:hover {
    background: var(--case-red);
    color: #fff;
  }
}

.cloud-tip {
  margin: 8px 0;
  font-size: 13px;
  line-height: 1.7;
  color: #475569;
  text-align: center;
}

.cloud-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.cloud-upload {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 7px 12px;
  border: none;
  border-radius: 8px;
  background: var(--case-red);
  color: #fff;
  font-size: 13px;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
}

.cloud-count {
  font-size: 12px;
  color: #475569;
}

.cloud-list {
  max-height: 220px;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;

  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 7px 4px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    font-size: 13px;
  }
}

.cloud-name {
  color: #1e1b16;
}

.cloud-ops {
  display: inline-flex;
  gap: 6px;

  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border: none;
    border-radius: 5px;
    background: var(--btn);
    color: var(--panel);
    font-size: 15px;
    cursor: pointer;

    &:hover {
      background: var(--case-red);
      color: #fff;
    }
  }
}
</style>
