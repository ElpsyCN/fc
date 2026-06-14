<script setup lang="ts">
import { useToast } from '../composables/useToast'

const { message } = useToast()
</script>

<template>
  <Transition name="toast">
    <div v-if="message" class="game-toast">
      {{ message }}
    </div>
  </Transition>
</template>

<style lang="scss">
.game-toast {
  position: absolute;
  left: 50%;
  bottom: 12px;
  transform: translateX(-50%);
  z-index: 5;
  padding: 5px 12px;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  font-family: var(--font-pixel);
  font-size: 9px;
  line-height: 1.4;
  letter-spacing: 0.05em;
  border-radius: 4px;
  white-space: nowrap;
  pointer-events: none;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
}
</style>
