import { ref } from 'vue'

// 全局共享的提示文本
const message = ref('')
let timer: ReturnType<typeof setTimeout> | undefined

/** 轻量的全局操作提示（toast） */
export function useToast() {
  function showToast(text: string, duration = 1800) {
    message.value = text
    if (timer)
      clearTimeout(timer)
    timer = setTimeout(() => {
      message.value = ''
    }, duration)
  }

  return { message, showToast }
}
