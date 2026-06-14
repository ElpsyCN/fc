import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ControllerAction from './ControllerAction.vue'

describe('controllerAction', () => {
  it('渲染 A / B 与连发 A / B 共四个按键，含 data-button、type 与无障碍标签', () => {
    const wrapper = mount(ControllerAction)
    const buttons = wrapper.findAll('button')

    expect(buttons).toHaveLength(4)
    expect(buttons.every(b => b.attributes('type') === 'button')).toBe(true)
    expect(wrapper.find('[data-button="A"]').attributes('aria-label')).toBe('A 键')
    expect(wrapper.find('[data-button="B"]').attributes('aria-label')).toBe('B 键')
    expect(wrapper.find('[data-button="TURBO_A"]').attributes('aria-label')).toContain('连发')
    expect(wrapper.find('[data-button="TURBO_B"]').attributes('aria-label')).toContain('连发')
  })
})
