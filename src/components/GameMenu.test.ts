import type { NesApp } from '../lib/nes'
import { DOMWrapper, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import romsList from '../assets/roms-list.json'
import { provideNes } from '../composables/useNes'
import GameMenu from './GameMenu.vue'

const mountedWrappers: Array<ReturnType<typeof mount>> = []

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
  const wrapper = mount(Parent, { attachTo: document.body })
  mountedWrappers.push(wrapper)
  return wrapper
}

async function openMenu(wrapper: ReturnType<typeof mountWithNes>) {
  await wrapper.find('[aria-label="选择游戏"]').trigger('keydown', { key: 'Enter' })
  await nextTick()
}

async function openMenuByPointer(wrapper: ReturnType<typeof mountWithNes>) {
  const trigger = wrapper.find('[aria-label="选择游戏"]').element as HTMLElement
  trigger.hasPointerCapture = () => false
  trigger.releasePointerCapture = () => {}
  trigger.dispatchEvent(new MouseEvent('pointerdown', {
    bubbles: true,
    button: 0,
    ctrlKey: false,
  }))
  await nextTick()
}

async function openMenuByClick(wrapper: ReturnType<typeof mountWithNes>) {
  await wrapper.find('[aria-label="选择游戏"]').trigger('click')
  await nextTick()
}

function createTouchPointerEvent(type: string) {
  const event = new MouseEvent(type, {
    bubbles: true,
    button: 0,
    clientX: 20,
    clientY: 20,
  })
  Object.defineProperties(event, {
    pointerId: { value: 1 },
    pointerType: { value: 'touch' },
    isPrimary: { value: true },
  })
  return event
}

describe('gameMenu', () => {
  afterEach(() => {
    mountedWrappers.splice(0).forEach(wrapper => wrapper.unmount())
    document.body.innerHTML = ''
  })

  it('打开菜单后根据 romsList 渲染游戏选项', async () => {
    const wrapper = mountWithNes()
    await openMenu(wrapper)

    const options = document.body.querySelectorAll('[role="option"]')
    expect(options).toHaveLength(romsList.length)
    expect(document.body.textContent).toContain(romsList[0].name)
  })

  it('选择游戏时加载对应 ROM', async () => {
    const load = vi.fn()
    const wrapper = mountWithNes({ load })
    await openMenu(wrapper)

    const option = document.body.querySelectorAll<HTMLElement>('[role="option"]')[0]
    await new DOMWrapper(option).trigger('keydown', { key: 'Enter' })
    await nextTick()
    expect(load).toHaveBeenCalledWith(`roms/${romsList[0].path}`)
  })

  it('仅打开菜单时不加载游戏', async () => {
    const load = vi.fn()
    const wrapper = mountWithNes({ load })

    await openMenu(wrapper)
    expect(load).not.toHaveBeenCalled()
  })

  it('指针点击选择入口可以打开游戏列表', async () => {
    const wrapper = mountWithNes()

    await openMenuByPointer(wrapper)
    expect(document.body.querySelectorAll('[role="option"]')).toHaveLength(romsList.length)
  })

  it('仅触发 click 时也可以打开列表并选择游戏', async () => {
    const load = vi.fn()
    const wrapper = mountWithNes({ load })

    await openMenuByClick(wrapper)
    const options = document.body.querySelectorAll<HTMLElement>('[role="option"]')
    expect(options).toHaveLength(romsList.length)

    await new DOMWrapper(options[0]).trigger('click')
    await nextTick()
    expect(load).toHaveBeenCalledWith(`roms/${romsList[0].path}`)
  })

  it('触摸按下即可打开列表并通过触摸抬起选择游戏', async () => {
    const load = vi.fn()
    const wrapper = mountWithNes({ load })
    const trigger = wrapper.find('[aria-label="选择游戏"]').element

    trigger.dispatchEvent(createTouchPointerEvent('pointerdown'))
    await nextTick()

    const options = document.body.querySelectorAll<HTMLElement>('[role="option"]')
    expect(options).toHaveLength(romsList.length)

    options[0].dispatchEvent(createTouchPointerEvent('pointerdown'))
    options[0].dispatchEvent(createTouchPointerEvent('pointerup'))
    await nextTick()
    await nextTick()
    expect(load).toHaveBeenCalledWith(`roms/${romsList[0].path}`)
  })
})
