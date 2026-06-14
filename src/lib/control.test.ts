import { Controller } from 'jsnes'
import { describe, expect, it, vi } from 'vitest'
import { bindKeyboard, keyToButton } from './control'

describe('keyToButton', () => {
  it('方向键映射正确', () => {
    expect(keyToButton('ArrowUp')).toBe(Controller.BUTTON_UP)
    expect(keyToButton('ArrowDown')).toBe(Controller.BUTTON_DOWN)
    expect(keyToButton('ArrowLeft')).toBe(Controller.BUTTON_LEFT)
    expect(keyToButton('ArrowRight')).toBe(Controller.BUTTON_RIGHT)
  })

  it('a / B 键兼容 qwerty / azerty / dvorak', () => {
    expect(keyToButton('KeyA')).toBe(Controller.BUTTON_A)
    expect(keyToButton('KeyQ')).toBe(Controller.BUTTON_A)
    expect(keyToButton('KeyS')).toBe(Controller.BUTTON_B)
    expect(keyToButton('KeyO')).toBe(Controller.BUTTON_B)
  })

  it('功能键映射正确', () => {
    expect(keyToButton('Space')).toBe(Controller.BUTTON_SELECT)
    expect(keyToButton('Enter')).toBe(Controller.BUTTON_START)
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

  it('按下 / 抬起会驱动 nes', () => {
    const nes = createNesStub()
    bindKeyboard(nes)

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowUp' }))
    expect(nes.buttonDown).toHaveBeenCalledWith(1, Controller.BUTTON_UP)

    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'ArrowUp' }))
    expect(nes.buttonUp).toHaveBeenCalledWith(1, Controller.BUTTON_UP)
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

  it('支持指定玩家 2', () => {
    const nes = createNesStub()
    const unbind = bindKeyboard(nes, 2)

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }))
    expect(nes.buttonDown).toHaveBeenCalledWith(2, Controller.BUTTON_START)
    unbind()
  })
})
