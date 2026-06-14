import { describe, expect, it, vi } from 'vitest'
import { createNes } from './nes'

describe('createNes', () => {
  it('画布不存在 / 不可用时解析为 undefined 而非抛错', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await expect(createNes('not-exist')).resolves.toBeUndefined()
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})
