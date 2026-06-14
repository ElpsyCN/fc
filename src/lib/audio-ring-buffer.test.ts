import { describe, expect, it } from 'vitest'
import { StereoRingBuffer } from './audio-ring-buffer'

describe('stereoRingBuffer', () => {
  it('容量必须是正的 2 的幂', () => {
    expect(() => new StereoRingBuffer(7)).toThrow()
    expect(() => new StereoRingBuffer(0)).toThrow()
    expect(() => new StereoRingBuffer(-4)).toThrow()
    expect(() => new StereoRingBuffer(8)).not.toThrow()
  })

  it('写入后按序读取，available 正确', () => {
    const ring = new StereoRingBuffer(8)
    ring.write(Float32Array.from([1, 2, 3]), Float32Array.from([-1, -2, -3]))
    expect(ring.available).toBe(3)

    const l = new Float32Array(3)
    const r = new Float32Array(3)
    const read = ring.read(l, r, 3)

    expect(read).toBe(3)
    expect([...l]).toEqual([1, 2, 3])
    expect([...r]).toEqual([-1, -2, -3])
    expect(ring.available).toBe(0)
  })

  it('欠载时多余部分填 0 并返回实际读取数', () => {
    const ring = new StereoRingBuffer(8)
    ring.write(Float32Array.from([0.5]), Float32Array.from([0.5]))

    const l = new Float32Array(4)
    const r = new Float32Array(4)
    const read = ring.read(l, r, 4)

    expect(read).toBe(1)
    expect([...l]).toEqual([0.5, 0, 0, 0])
    expect([...r]).toEqual([0.5, 0, 0, 0])
  })

  it('指针回绕后仍能正确读写', () => {
    const ring = new StereoRingBuffer(4)
    const three = Float32Array.from([1, 2, 3])

    ring.write(three, three)
    ring.read(new Float32Array(3), new Float32Array(3), 3)

    // 再写 3 个，写指针越过容量边界回绕
    ring.write(Float32Array.from([4, 5, 6]), Float32Array.from([4, 5, 6]))
    expect(ring.available).toBe(3)

    const l = new Float32Array(3)
    ring.read(l, new Float32Array(3), 3)
    expect([...l]).toEqual([4, 5, 6])
  })
})
