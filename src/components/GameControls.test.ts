import type { NesApp } from '../lib/nes'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { provideNes } from '../composables/useNes'
import GameControls from './GameControls.vue'

function mountWithNes(nesApp?: Partial<NesApp>) {
  const Parent = defineComponent({
    setup() {
      const nes = provideNes()
      if (nesApp)
        nes.value = nesApp as NesApp
      return () => h(GameControls)
    },
  })
  return mount(Parent)
}

describe('gameControls', () => {
  it('渲染静音 / 存档 / 读档 / 重置 / 全屏五个按钮', () => {
    const wrapper = mountWithNes()
    expect(wrapper.findAll('button')).toHaveLength(5)
  })

  it('点击静音调用 setMuted(true)', async () => {
    const setMuted = vi.fn()
    const wrapper = mountWithNes({ setMuted })
    await wrapper.find('[aria-label="静音"]').trigger('click')
    expect(setMuted).toHaveBeenCalledWith(true)
  })

  it('点击存档调用 saveState', async () => {
    const saveState = vi.fn()
    const wrapper = mountWithNes({ saveState })
    await wrapper.find('[aria-label="存档"]').trigger('click')
    expect(saveState).toHaveBeenCalled()
  })

  it('点击读档调用 loadState', async () => {
    const loadState = vi.fn()
    const wrapper = mountWithNes({ loadState })
    await wrapper.find('[aria-label="读档"]').trigger('click')
    expect(loadState).toHaveBeenCalled()
  })

  it('点击重置调用 reset', async () => {
    const reset = vi.fn()
    const wrapper = mountWithNes({ reset })
    await wrapper.find('[aria-label="重置游戏"]').trigger('click')
    expect(reset).toHaveBeenCalled()
  })
})
