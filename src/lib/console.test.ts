import { afterEach, describe, expect, it, vi } from 'vitest'
import { consoleAllInfo } from './console'

describe('consoleAllInfo', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('输出项目与作者两条信息', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    consoleAllInfo()
    expect(spy).toHaveBeenCalledTimes(2)
  })
})
