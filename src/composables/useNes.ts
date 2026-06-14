import type { InjectionKey, Ref } from 'vue'
import type { NesApp } from '../lib/nes'
import { inject, provide, ref } from 'vue'

const NES_KEY: InjectionKey<Ref<NesApp | undefined>> = Symbol('nes-app')

/**
 * 在祖先组件创建并提供 NES 实例引用。
 *
 * 替代旧的全局 `window.nesApp`，让后代组件可类型安全地访问。
 */
export function provideNes(): Ref<NesApp | undefined> {
  const nesApp = ref<NesApp>()
  provide(NES_KEY, nesApp)
  return nesApp
}

/** 在后代组件注入 NES 实例引用 */
export function useNes(): Ref<NesApp | undefined> {
  const nesApp = inject(NES_KEY)
  if (!nesApp)
    throw new Error('useNes() 必须在 provideNes() 的后代组件中使用')
  return nesApp
}
