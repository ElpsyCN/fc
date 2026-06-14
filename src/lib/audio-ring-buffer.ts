/**
 * 立体声 Float32 环形缓冲区。
 *
 * 容量必须是 2 的幂，以便用位掩码做指针回绕。用于在主线程（生产者，
 * 由 jsnes 产生音频样本）与 AudioWorklet（消费者，输出到音频设备）之间
 * 传递样本时维护低延迟缓冲语义。
 *
 * 注意：真正运行在音频线程的 worklet（public/nes-audio.worklet.js）内联了等价算法，
 * 本类作为带单元测试的参考实现，修改算法时请同步两处。
 */
export class StereoRingBuffer {
  private readonly left: Float32Array
  private readonly right: Float32Array
  private readonly mask: number
  private writeCursor = 0
  private readCursor = 0

  constructor(size: number) {
    if (size <= 0 || (size & (size - 1)) !== 0)
      throw new Error('StereoRingBuffer size 必须是正的 2 的幂')

    this.mask = size - 1
    this.left = new Float32Array(size)
    this.right = new Float32Array(size)
  }

  /** 已写入但尚未读取的样本数 */
  get available(): number {
    return (this.writeCursor - this.readCursor) & this.mask
  }

  /** 写入一批样本（左右声道等长） */
  write(left: Float32Array, right: Float32Array): void {
    const n = left.length
    for (let i = 0; i < n; i++) {
      this.left[this.writeCursor] = left[i]
      this.right[this.writeCursor] = right[i]
      this.writeCursor = (this.writeCursor + 1) & this.mask
    }
  }

  /**
   * 读取 `len` 个样本到输出声道；缓冲不足的部分填 0（静音），避免欠载爆音。
   *
   * @returns 实际读取（非静音）的样本数
   */
  read(outLeft: Float32Array, outRight: Float32Array, len: number): number {
    let read = 0
    for (let i = 0; i < len; i++) {
      if (this.readCursor === this.writeCursor) {
        outLeft[i] = 0
        outRight[i] = 0
        continue
      }
      outLeft[i] = this.left[this.readCursor]
      outRight[i] = this.right[this.readCursor]
      this.readCursor = (this.readCursor + 1) & this.mask
      read++
    }
    return read
  }
}
