// NES 音频 AudioWorklet 处理器（自包含，无外部依赖 / 无构建步骤）。
//
// 放在 public/ 下以纯 JS 形式直接被 audioWorklet.addModule 加载——AudioWorklet
// 不能加载未编译的 TS，且经 Vite asset 处理会内联出错误 MIME 的源码。
//
// 这里内联的环形缓冲算法与 src/lib/audio-ring-buffer.ts 等价（后者有单元测试覆盖），
// 修改其一时请同步另一处。

const RING_SIZE = 16384
const MASK = RING_SIZE - 1
// 余量低于此阈值时向主线程反压请求补充样本（pull 模型）
const REQUEST_THRESHOLD = RING_SIZE / 4

class NesAudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.left = new Float32Array(RING_SIZE)
    this.right = new Float32Array(RING_SIZE)
    this.readCursor = 0
    this.writeCursor = 0
    this.requested = false

    this.port.onmessage = (event) => {
      const { left, right } = event.data
      for (let i = 0; i < left.length; i++) {
        this.left[this.writeCursor] = left[i]
        this.right[this.writeCursor] = right[i]
        this.writeCursor = (this.writeCursor + 1) & MASK
      }
      this.requested = false
    }
  }

  get available() {
    return (this.writeCursor - this.readCursor) & MASK
  }

  process(_inputs, outputs) {
    const output = outputs[0]
    const outLeft = output[0]
    const outRight = output[1] || output[0]
    const len = outLeft.length

    for (let i = 0; i < len; i++) {
      if (this.readCursor === this.writeCursor) {
        // 欠载：填 0（静音）避免爆音
        outLeft[i] = 0
        outRight[i] = 0
        continue
      }
      outLeft[i] = this.left[this.readCursor]
      outRight[i] = this.right[this.readCursor]
      this.readCursor = (this.readCursor + 1) & MASK
    }

    if (!this.requested && this.available < REQUEST_THRESHOLD) {
      this.requested = true
      this.port.postMessage({ type: 'need' })
    }

    return true
  }
}

registerProcessor('nes-audio', NesAudioProcessor)
