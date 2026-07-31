<script setup lang="ts">
import {
  SelectContent,
  SelectGroup,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectLabel,
  SelectPortal,
  SelectRoot,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from 'reka-ui'
import { ref } from 'vue'
import romsList from '../assets/roms-list.json'
import { useNes } from '../composables/useNes'

const nesApp = useNes()
const currentGame = ref<string>()
const menuOpen = ref(false)
let loadedGame: string | undefined

/** 切换游戏：加载所选 ROM */
function selectGame(game: string | undefined) {
  const app = nesApp.value
  if (!game || !app || game === loadedGame)
    return

  app.load(game)
  loadedGame = game
}

/** 兼容只派发 click、缺少完整 PointerEvent 序列的移动端 WebView */
function openMenuByClick() {
  menuOpen.value = true
}

function openMenuByPointer(event: PointerEvent) {
  if (event.isPrimary !== false && event.button === 0 && event.pointerType !== 'mouse')
    menuOpen.value = true
}

function selectGameByClick(game: string) {
  if (currentGame.value !== game) {
    currentGame.value = game
    selectGame(game)
  }
  menuOpen.value = false
}
</script>

<template>
  <div class="nes-roms">
    <SelectRoot
      v-model="currentGame"
      v-model:open="menuOpen"
      @update:model-value="selectGame"
    >
      <SelectTrigger as-child>
        <button
          type="button"
          class="nes-select"
          aria-label="选择游戏"
          @click="openMenuByClick"
          @pointerdown.capture="openMenuByPointer"
          @touchstart.passive="openMenuByClick"
        >
          <SelectValue class="nes-select-value" placeholder="选择游戏..." />
          <SelectIcon class="nes-select-icon">
            <i-mdi-chevron-down aria-hidden="true" />
          </SelectIcon>
        </button>
      </SelectTrigger>

      <SelectPortal>
        <SelectContent
          class="nes-select-content"
          position="popper"
          side="top"
          align="center"
          :side-offset="6"
          :collision-padding="8"
        >
          <SelectScrollUpButton class="nes-select-scroll-button" aria-label="向上滚动">
            <i-mdi-chevron-up aria-hidden="true" />
          </SelectScrollUpButton>

          <SelectViewport class="nes-select-viewport">
            <SelectGroup>
              <SelectLabel class="nes-select-label">
                经典
              </SelectLabel>
              <SelectItem
                v-for="rom in romsList"
                :key="`${rom.path}-${rom.name}`"
                class="nes-select-item"
                :value="`roms/${rom.path}`"
                @click="selectGameByClick(`roms/${rom.path}`)"
              >
                <SelectItemText>{{ rom.name }}</SelectItemText>
                <SelectItemIndicator class="nes-select-indicator">
                  <i-mdi-check aria-hidden="true" />
                </SelectItemIndicator>
              </SelectItem>
            </SelectGroup>
          </SelectViewport>

          <SelectScrollDownButton class="nes-select-scroll-button" aria-label="向下滚动">
            <i-mdi-chevron-down aria-hidden="true" />
          </SelectScrollDownButton>
        </SelectContent>
      </SelectPortal>
    </SelectRoot>
  </div>
</template>

<style lang="scss">
.nes-roms {
  margin: 0 auto;
  text-align: center;
}

.nes-select {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.3rem;
  width: 200px;
  max-width: 100%;
  height: 1.6rem;
  padding: 0.2rem 0.4rem;
  color: #1e1b16;
  background: #f8f1d7;
  border: 2px solid #474f51;
  border-radius: 4px;
  outline: none;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.8rem;
  line-height: 1;
  text-align: left;
  white-space: nowrap;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:hover {
    border-color: #da4a4a;
  }

  &[data-placeholder] {
    color: #5f5a4e;
  }

  &[data-state="open"] {
    border-color: #da4a4a;
  }

  &:focus-visible {
    border-color: #da4a4a;
    box-shadow: 0 0 0 3px rgba(218, 74, 74, 0.4);
  }
}

.nes-select-value {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nes-select-icon {
  display: inline-flex;
  flex: 0 0 auto;
  font-size: 1rem;
  transition: transform 0.15s ease;

  .nes-select[data-state="open"] & {
    transform: rotate(180deg);
  }
}

.nes-select-content {
  z-index: 200;
  width: min(260px, calc(100vw - 16px));
  max-height: min(360px, var(--reka-select-content-available-height));
  overflow: hidden;
  color: #1e1b16;
  background: #f8f1d7;
  border: 2px solid #474f51;
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
  font-family: inherit;
  font-size: 0.82rem;
  transform-origin: var(--reka-select-content-transform-origin);
  animation: nes-select-in 0.12s ease-out;
}

.nes-select-viewport {
  padding: 4px;
}

.nes-select-label {
  padding: 6px 10px;
  color: #6b665a;
  font-size: 0.7rem;
  font-weight: 700;
  text-align: left;
}

.nes-select-item {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 40px;
  padding: 7px 34px 7px 10px;
  border-radius: 4px;
  outline: none;
  cursor: pointer;
  text-align: left;
  touch-action: manipulation;

  &[data-state="checked"] {
    color: #8f2727;
    background: rgba(218, 74, 74, 0.12);
    font-weight: 700;
  }

  &[data-highlighted] {
    color: #fff;
    background: #da4a4a;
  }
}

.nes-select-indicator {
  position: absolute;
  right: 10px;
  display: inline-flex;
  align-items: center;
  font-size: 1rem;
}

.nes-select-scroll-button {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  color: #474f51;
  background: #eee5c8;
  cursor: default;
}

@media (max-width: 640px), (hover: none) and (pointer: coarse) {
  .nes-select {
    height: 26px;
    padding-inline: 0.65rem;
    font-size: 0.85rem;

    &::after {
      position: absolute;
      content: "";
      inset: -10px 0;
    }
  }

  .nes-select-content {
    width: min(
      320px,
      calc(
        100vw - 24px - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px)
      )
    );
    max-height: min(420px, var(--reka-select-content-available-height));
    max-height: min(68dvh, var(--reka-select-content-available-height));
    border-radius: 10px;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.55);
    font-size: 0.9rem;
  }

  .nes-select-viewport {
    padding: 6px;
    overflow-y: auto;
    overscroll-behavior: contain;
    scroll-padding-block: 52px;
    touch-action: pan-y;
    -webkit-overflow-scrolling: touch;
  }

  .nes-select-label {
    position: sticky;
    z-index: 1;
    top: 0;
    padding: 8px 12px;
    background: #f8f1d7;
  }

  .nes-select-item {
    box-sizing: border-box;
    min-height: 48px;
    padding: 10px 42px 10px 12px;
    border-radius: 7px;
    touch-action: pan-y;
  }

  .nes-select-indicator {
    right: 12px;
    font-size: 1.15rem;
  }

  .nes-select-scroll-button {
    height: 36px;
    font-size: 1.1rem;
    touch-action: none;
  }

}

@keyframes nes-select-in {
  from {
    opacity: 0;
    transform: scale(0.98);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .nes-select-content {
    animation: none;
  }

  .nes-select-icon {
    transition: none;
  }
}
</style>
