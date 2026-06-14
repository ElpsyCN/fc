<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useNes } from '../composables/useNes'
import { useToast } from '../composables/useToast'

const nesApp = useNes()
const { showToast } = useToast()
const muted = ref(false)
const isFullscreen = ref(false)

function syncFullscreen() {
  isFullscreen.value = !!document.fullscreenElement
}

function toggleFullscreen() {
  if (document.fullscreenElement)
    void document.exitFullscreen()
  else
    void document.documentElement.requestFullscreen?.()
}

function toggleMute() {
  muted.value = !muted.value
  nesApp.value?.setMuted(muted.value)
  showToast(muted.value ? '已静音' : '已开启声音')
}

function reset() {
  nesApp.value?.reset()
  showToast('已重置游戏')
}

function saveState() {
  const ok = nesApp.value?.saveState()
  showToast(ok ? '已存档' : '存档失败')
}

function loadState() {
  const ok = nesApp.value?.loadState()
  showToast(ok ? '已读取存档' : '暂无存档，请先存档')
}

onMounted(() => document.addEventListener('fullscreenchange', syncFullscreen))
onUnmounted(() => document.removeEventListener('fullscreenchange', syncFullscreen))
</script>

<template>
  <div class="game-controls">
    <button
      type="button"
      :aria-label="muted ? '取消静音' : '静音'"
      :aria-pressed="muted"
      @click="toggleMute"
    >
      <i-mdi-volume-off v-if="muted" />
      <i-mdi-volume-high v-else />
    </button>
    <button type="button" aria-label="存档" @click="saveState">
      <i-mdi-content-save />
    </button>
    <button type="button" aria-label="读档" @click="loadState">
      <i-mdi-history />
    </button>
    <button type="button" aria-label="重置游戏" @click="reset">
      <i-mdi-restart />
    </button>
    <button
      type="button"
      :aria-label="isFullscreen ? '退出全屏' : '全屏'"
      :aria-pressed="isFullscreen"
      @click="toggleFullscreen"
    >
      <i-mdi-fullscreen-exit v-if="isFullscreen" />
      <i-mdi-fullscreen v-else />
    </button>
  </div>
</template>

<style lang="scss">
.game-controls {
  display: flex;
  align-items: center;
  gap: 6px;

  button {
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
    transition: background-color 0.2s, color 0.2s;

    &:hover {
      background: var(--case-red);
      color: #fff;
    }
  }
}
</style>
