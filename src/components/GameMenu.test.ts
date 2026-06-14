import type { NesApp } from '../lib/nes'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import romsList from '../assets/roms-list.json'
import { provideNes } from '../composables/useNes'
import GameMenu from './GameMenu.vue'

/** 用一个提供 NES 实例的父组件包裹 GameMenu（避免 inject 报错） */
function mountWithNes(nesApp?: Partial<NesApp>) {
  const Parent = defineComponent({
    setup() {
      const nes = provideNes()
      if (nesApp)
        nes.value = nesApp as NesApp
      return () => h(GameMenu)
    },
  })
  return mount(Parent)
}

describe('gameMenu', () => {
  it('根据 romsList 渲染游戏选项', () => {
    const wrapper = mountWithNes()
    const options = wrapper.findAll('optgroup[label="经典"] option')

    expect(options).toHaveLength(romsList.length)
    expect(wrapper.text()).toContain(romsList[0].name)
  })

  it('选择游戏时加载对应 ROM', async () => {
    const load = vi.fn()
    const wrapper = mountWithNes({ load })

    await wrapper.find('select').setValue(`roms/${romsList[0].path}`)
    expect(load).toHaveBeenCalledWith(`roms/${romsList[0].path}`)
  })

  it('保持在占位项时不加载', async () => {
    const load = vi.fn()
    const wrapper = mountWithNes({ load })

    await wrapper.find('select').trigger('change')
    expect(load).not.toHaveBeenCalled()
  })
})
