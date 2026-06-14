import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ControllerJoystick from './ControllerJoystick.vue'

describe('controllerJoystick', () => {
  it('渲染四个方向键，含 data-button、type 与无障碍标签', () => {
    const wrapper = mount(ControllerJoystick)
    const buttons = wrapper.findAll('button')

    expect(buttons).toHaveLength(4)
    expect(buttons.every(b => b.attributes('type') === 'button')).toBe(true)
    expect(wrapper.find('[data-button="LEFT"]').attributes('aria-label')).toBe('左')
    expect(wrapper.find('[data-button="RIGHT"]').attributes('aria-label')).toBe('右')
    expect(wrapper.find('[data-button="UP"]').attributes('aria-label')).toBe('上')
    expect(wrapper.find('[data-button="DOWN"]').attributes('aria-label')).toBe('下')
  })

  // 回归测试：原实现 RIGHT 分支缺少 break，会落入 default 而不产生倾斜
  it('按下每个方向键都会产生对应倾斜，松开后复位', async () => {
    const wrapper = mount(ControllerJoystick)
    const joystick = wrapper.find('#joystick').element as HTMLElement

    const cases: Record<string, string> = {
      UP: 'rotateX(9deg)',
      DOWN: 'rotateX(-9deg)',
      LEFT: 'rotateY(-9deg)',
      RIGHT: 'rotateY(9deg)',
    }

    for (const [dir, transform] of Object.entries(cases)) {
      await wrapper.find(`[data-button="${dir}"]`).trigger('mousedown')
      expect(joystick.style.transform).toBe(transform)
      await wrapper.find(`[data-button="${dir}"]`).trigger('mouseup')
      expect(joystick.style.transform).toBe('')
    }
  })
})
