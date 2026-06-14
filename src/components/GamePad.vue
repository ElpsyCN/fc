<script setup lang="ts">
import type { ButtonName } from '../lib/nes'
import { nextTick, onBeforeUnmount, onMounted } from 'vue'
import { provideNes } from '../composables/useNes'
import { useYlfAuth } from '../composables/useYlfAuth'
import { bindKeyboard } from '../lib/control'
import { createNes } from '../lib/nes'
import ControllerAction from './controller/ControllerAction.vue'
import ControllerFunction from './controller/ControllerFunction.vue'
import ControllerJoystick from './controller/ControllerJoystick.vue'
import GithubLink from './controller/GithubLink.vue'
import GameAccount from './GameAccount.vue'
import GameControls from './GameControls.vue'
import GameHelp from './GameHelp.vue'
import GameMenu from './GameMenu.vue'
import GameToast from './GameToast.vue'

const DEFAULT_ROM = 'roms/Super Mario Bros. (JU) (PRG0) [!].nes'
const BUTTONS: ButtonName[] = ['LEFT', 'RIGHT', 'UP', 'DOWN', 'SELECT', 'START', 'A', 'B', 'TURBO_A', 'TURBO_B']

const nesApp = provideNes()
const { initAuth } = useYlfAuth()
const unbinders: Array<() => void> = []

onMounted(async () => {
  await nextTick()
  const app = await createNes('nes-canvas')
  if (!app) {
    console.error('NES 初始化失败！')
    return
  }
  nesApp.value = app
  // 开发环境下暴露实例，便于调试与自动化验证
  if (import.meta.env.DEV)
    Object.assign(globalThis, { __nesApp: app })
  app.load(DEFAULT_ROM)
  BUTTONS.forEach(name => app.bindButton(name))
  // 玩家 1（方向键 + A/S）与玩家 2（IJKL + GHTY）键盘
  unbinders.push(bindKeyboard(app.instance, 1), bindKeyboard(app.instance, 2))

  // 进站静默登录：延迟到游戏加载后再懒加载云乐坊 SDK，静默复用主站登录态
  setTimeout(() => void initAuth(), 1500)
})

onBeforeUnmount(() => {
  unbinders.forEach(fn => fn())
})
</script>

<template>
  <!-- 阻止整机区域的右键菜单 / 长按选中，贴近真实手柄操作 -->
  <div class="main" @contextmenu.prevent>
    <div class="panel">
      <span class="screw screw-tl" aria-hidden="true" />
      <span class="screw screw-tr" aria-hidden="true" />
      <span class="screw screw-bl" aria-hidden="true" />
      <span class="screw screw-br" aria-hidden="true" />
      <div class="controller-area">
        <ControllerJoystick />
        <GithubLink />
        <div class="power-indicator" aria-hidden="true">
          <span class="power-led" />
          <span class="power-text">POWER</span>
        </div>
        <div class="speaker" aria-hidden="true" />
      </div>
      <div class="function-area">
        <div class="screen">
          <div id="emulator" class="emulator">
            <div class="screen-inner">
              <canvas
                id="nes-canvas"
                width="256"
                height="240"
                aria-label="游戏画面"
              />
              <GameToast />
            </div>
            <div class="emulator-bar">
              <GameAccount />
              <GameMenu />
              <GameControls />
              <GameHelp />
            </div>
          </div>
        </div>
        <ControllerFunction />
      </div>
      <div class="action-area">
        <ControllerAction />
      </div>
      <div class="sign">
        FAMILY <br>
        COMPUTER
      </div>
    </div>
  </div>
</template>
