import { afterEach, describe, expect, it, vi } from 'vitest'
import { scheduleIdleTask } from './idle'

describe('scheduleIdleTask', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('优先使用 requestIdleCallback 调度任务', () => {
    let idleCallback: IdleRequestCallback | undefined
    const requestIdleCallback = vi.fn((callback: IdleRequestCallback) => {
      idleCallback = callback
      return 7
    })
    const cancelIdleCallback = vi.fn()
    vi.stubGlobal('requestIdleCallback', requestIdleCallback)
    vi.stubGlobal('cancelIdleCallback', cancelIdleCallback)

    const task = vi.fn()
    const cancel = scheduleIdleTask(task, { timeout: 5000 })

    expect(requestIdleCallback).toHaveBeenCalledWith(expect.any(Function), { timeout: 5000 })
    expect(task).not.toHaveBeenCalled()

    idleCallback?.({ didTimeout: false, timeRemaining: () => 10 })
    expect(task).toHaveBeenCalledOnce()

    cancel()
    expect(cancelIdleCallback).toHaveBeenCalledWith(7)
  })

  it('不支持 requestIdleCallback 时延迟执行且可取消', () => {
    vi.useFakeTimers()
    vi.stubGlobal('requestIdleCallback', undefined)
    vi.stubGlobal('cancelIdleCallback', undefined)

    const task = vi.fn()
    const cancel = scheduleIdleTask(task, { fallbackDelay: 1500 })

    vi.advanceTimersByTime(1499)
    expect(task).not.toHaveBeenCalled()

    cancel()
    vi.runAllTimers()
    expect(task).not.toHaveBeenCalled()
  })
})
