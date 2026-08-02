import { describe, expect, it } from 'vitest'
import { decodeCloudSaveState, encodeCloudSaveState } from './cloud-save-state'

describe('cloud save state codec', () => {
  it('压缩并还原大型状态', async () => {
    const state = JSON.stringify({ ram: Array.from({ length: 10000 }, (_, index) => index % 256) })
    const encoded = await encodeCloudSaveState(state)

    expect(encoded).toMatch(/^fc:gzip:v1:/)
    expect(encoded.length).toBeLessThan(state.length)
    await expect(decodeCloudSaveState(encoded)).resolves.toBe(state)
  })

  it('兼容已有未压缩存档', async () => {
    const state = JSON.stringify({ legacy: true })
    await expect(decodeCloudSaveState(state)).resolves.toBe(state)
  })
})
