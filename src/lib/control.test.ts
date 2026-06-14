import { Controller } from 'jsnes'
import { describe, expect, it, vi } from 'vitest'
import { bindKeyboard, keyToButton } from './control'

describe('keyToButton', () => {
  it('玩家 1 方向键映射正确', () => {
    expect(keyToButton('ArrowUp')).toBe(Controller.BUTTON_UP)
    expect(keyToButton('ArrowDown')).toBe(Controller.BUTTON_DOWN)
    expect(keyToButton('ArrowLeft')).toBe(Controller.BUTTON_LEFT)
    expect(keyToButton('ArrowRight')).toBe(Controller.BUTTON_RIGHT)
  })

  it('玩家 1 的 A / B 键兼容 qwerty / azerty / dvorak', () => {
    expect(keyToButton('KeyA')).toBe(Controller.BUTTON_A)
    expect(keyToButton('KeyQ')).toBe(Controller.BUTTON_A)
    expect(keyToButton('KeyS')).toBe(Controller.BUTTON_B)
    expect(keyToButton('KeyO')).toBe(Controller.BUTTON_B)
  })

  it('玩家 1 功能键映射正确', () => {
    expect(keyToButton('Space')).toBe(Controller.BUTTON_SELECT)
    expect(keyToButton('Enter')).toBe(Controller.BUTTON_START)
  })

  it('玩家 2 使用 IJKL + GHTY 键位', () => {
    expect(keyToButton('KeyI', 2)).toBe(Controller.BUTTON_UP)
    expect(keyToButton('KeyK', 2)).toBe(Controller.BUTTON_DOWN)
    expect(keyToButton('KeyJ', 2)).toBe(Controller.BUTTON_LEFT)
    expect(keyToButton('KeyL', 2)).toBe(Controller.BUTTON_RIGHT)
    expect(keyToButton('KeyH', 2)).toBe(Controller.BUTTON_A)
    expect(keyToButton('KeyG', 2)).toBe(Controller.BUTTON_B)
    expect(keyToButton('KeyT', 2)).toBe(Controller.BUTTON_SELECT)
    expect(keyToButton('KeyY', 2)).toBe(Controller.BUTTON_START)
  })

  it('两个玩家的键位互不干扰', () => {
    expect(keyToButton('KeyI')).toBeUndefined() // 玩家 2 的键对玩家 1 无效
    expect(keyToButton('ArrowUp', 2)).toBeUndefined() // 玩家 1 的键对玩家 2 无效
  })

  it('未映射的按键返回 undefined', () => {
    expect(keyToButton('KeyZ')).toBeUndefined()
    expect(keyToButton('Tab')).toBeUndefined()
    expect(keyToButton('')).toBeUndefined()
  })
})

describe('bindKeyboard', () => {
  function createNesStub() {
    return { buttonDown: vi.fn(), buttonUp: vi.fn() } as any
  }

  it('玩家 1 按下 / 抬起会驱动 nes', () => {
    const nes = createNesStub()
    const unbind = bindKeyboard(nes)

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowUp' }))
    expect(nes.buttonDown).toHaveBeenCalledWith(1, Controller.BUTTON_UP)

    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'ArrowUp' }))
    expect(nes.buttonUp).toHaveBeenCalledWith(1, Controller.BUTTON_UP)
    unbind()
  })

  it('返回的解绑函数可移除监听', () => {
    const nes = createNesStub()
    const unbind = bindKeyboard(nes)
    unbind()

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }))
    expect(nes.buttonDown).not.toHaveBeenCalled()
  })

  it('忽略未映射的按键', () => {
    const nes = createNesStub()
    const unbind = bindKeyboard(nes)

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyZ' }))
    expect(nes.buttonDown).not.toHaveBeenCalled()
    unbind()
  })

  it('玩家 2 用 IJKL / GHTY 键位驱动 nes', () => {
    const nes = createNesStub()
    const unbind = bindKeyboard(nes, 2)

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyY' }))
    expect(nes.buttonDown).toHaveBeenCalledWith(2, Controller.BUTTON_START)
    unbind()
  })
})
