<script setup lang="ts">
import { ref } from 'vue'

const directions = ['LEFT', 'RIGHT', 'UP', 'DOWN'] as const

type Direction = (typeof directions)[number]

const DIRECTION_LABEL: Record<Direction, string> = {
  UP: '上',
  DOWN: '下',
  LEFT: '左',
  RIGHT: '右',
}

// 按下方向键时摇杆的倾斜效果（修复了原先 RIGHT 分支缺少 break 的问题）
const TILT: Record<Direction, string> = {
  UP: 'rotateX(9deg)',
  DOWN: 'rotateX(-9deg)',
  LEFT: 'rotateY(-9deg)',
  RIGHT: 'rotateY(9deg)',
}

const joystick = ref<HTMLElement>()

function onButtonDown(direction: Direction) {
  if (joystick.value)
    joystick.value.style.transform = TILT[direction]
}

function onButtonUp() {
  if (joystick.value)
    joystick.value.style.transform = ''
}
</script>

<template>
  <div id="joystick" ref="joystick" class="controller joystick">
    <div class="controls-direction">
      <button
        v-for="direction in directions"
        :key="direction"
        type="button"
        :data-button="direction"
        class="joystick-btn" :class="[direction.toLowerCase()]"
        :aria-label="DIRECTION_LABEL[direction]"
        @mousedown="onButtonDown(direction)"
        @touchstart.passive="onButtonDown(direction)"
        @mouseup="onButtonUp"
        @mouseleave="onButtonUp"
        @touchend="onButtonUp"
      >
        {{ direction }}
      </button>
    </div>
  </div>
</template>

<style lang="scss">
#joystick {
  filter: drop-shadow(3px 5px 5px rgba(0, 0, 0, 0.45));
  transition: transform 0.12s ease;
}

.controller {
  position: relative;
  width: 140px;
  height: 140px;
  align-self: flex-end;

  // 黑色塑料十字键四臂
  button {
    position: absolute;
    z-index: 1;
    border: none;
    box-sizing: border-box;
    outline: 0;
    width: 50px;
    height: 50px;
    left: 50%;
    top: 50%;
    color: transparent;
    user-select: none;
    border-radius: 7px;
    background: linear-gradient(150deg, #4a4a4a 0%, #2a2a2a 55%, #151515 100%);
    transform: translate(-50%, -50%);
    transition: 0.1s;
  }

  // 十字中心方块（连接四臂）
  &::before {
    content: "";
    position: absolute;
    z-index: 0;
    pointer-events: none;
    box-sizing: border-box;
    left: 50%;
    top: 50%;
    width: 50px;
    height: 50px;
    background: linear-gradient(150deg, #4a4a4a 0%, #2a2a2a 55%, #151515 100%);
    transform: translate(-50%, -50%);
  }

  // 中心圆点凹陷
  &::after {
    content: "";
    z-index: 2;
    position: absolute;
    pointer-events: none;
    box-sizing: border-box;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    background: radial-gradient(circle at 50% 38%, #333 0%, #0d0d0d 100%);
    box-shadow:
      inset 0 3px 5px rgba(0, 0, 0, 0.85),
      inset 0 -2px 3px rgba(255, 255, 255, 0.08);
  }
}

// 各方向臂的立体高光 / 阴影
.joystick-btn {
  &.up {
    top: 0;
    transform: translate(-50%, 0);
    height: 52px;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    box-shadow:
      inset 0 4px 3px rgba(255, 255, 255, 0.2),
      inset 0 -2px 5px rgba(0, 0, 0, 0.55);
  }

  &.right {
    left: auto;
    right: 0;
    transform: translate(0, -50%);
    width: 52px;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    box-shadow:
      inset -3px 0 3px rgba(255, 255, 255, 0.12),
      inset 4px 0 5px rgba(0, 0, 0, 0.5);
  }

  &.down {
    top: auto;
    bottom: 0;
    transform: translate(-50%, 0);
    height: 52px;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    box-shadow:
      inset 0 -4px 4px rgba(0, 0, 0, 0.6),
      inset 0 3px 4px rgba(255, 255, 255, 0.12);
  }

  &.left {
    left: 0;
    transform: translate(0, -50%);
    width: 52px;
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    box-shadow:
      inset 3px 0 3px rgba(255, 255, 255, 0.16),
      inset -4px 0 5px rgba(0, 0, 0, 0.5);
  }

  &:active {
    background: linear-gradient(150deg, #2e2e2e, #0d0d0d);
  }
}
</style>
