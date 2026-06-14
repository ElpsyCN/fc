import { describe, expect, it, vi } from 'vitest'
import { useToast } from './useToast'

describe('useToast', () => {
  it('showToast 设置消息并在超时后清空', () => {
    vi.useFakeTimers()
    const { message, showToast } = useToast()

    showToast('已存档', 1000)
    expect(message.value).toBe('已存档')

    vi.advanceTimersByTime(1000)
    expect(message.value).toBe('')

    vi.useRealTimers()
  })

  it('再次 showToast 会重置计时', () => {
    vi.useFakeTimers()
    const { message, showToast } = useToast()

    showToast('已读取存档', 1000)
    vi.advanceTimersByTime(600)
    showToast('已重置游戏', 1000)
    expect(message.value).toBe('已重置游戏')

    // 旧计时被清除，600ms 后仍显示
    vi.advanceTimersByTime(600)
    expect(message.value).toBe('已重置游戏')

    vi.advanceTimersByTime(400)
    expect(message.value).toBe('')

    vi.useRealTimers()
  })
})
