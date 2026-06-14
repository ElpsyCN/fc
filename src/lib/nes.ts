import type { ButtonKey } from 'jsnes'
import { Controller, NES } from 'jsnes'

// 屏幕宽高（NES 标准分辨率）
const SCREEN_WIDTH = 256
const SCREEN_HEIGHT = 240
const FRAMEBUFFER_SIZE = SCREEN_WIDTH * SCREEN_HEIGHT

// 每次收到 worklet 请求时补充的样本目标。刻意取较小值（约 2~3 帧），
// 避免单次同步跑过多帧形成主线程长任务（移动端会表现为页面卡顿 / 无响应）。
const REFILL_TARGET = 2048
// 单次补充最多驱动的帧数上限，作为兜底防止 frame() 不产样本时陷入死循环
const MAX_FRAMES_PER_REFILL = 6
// 目标帧率（jsnes 以 60fps 为基准产生音频样本）
const FRAME_INTERVAL = 1000 / 60
// 存档 localStorage key 前缀
const SAVE_KEY_PREFIX = 'fc-save:'

/** 手柄方向 / 功能按键名称（TURBO_A / TURBO_B 为小霸王经典连发键） */
export type ButtonName = 'A' | 'B' | 'SELECT' | 'START' | 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'TURBO_A' | 'TURBO_B'

/** 按键名称到 jsnes 按键编码的映射 */
const BUTTON_CODE: Record<ButtonName, ButtonKey> = {
  A: Controller.BUTTON_A,
  B: Controller.BUTTON_B,
  SELECT: Controller.BUTTON_SELECT,
  START: Controller.BUTTON_START,
  UP: Controller.BUTTON_UP,
  DOWN: Controller.BUTTON_DOWN,
  LEFT: Controller.BUTTON_LEFT,
  RIGHT: Controller.BUTTON_RIGHT,
  TURBO_A: Controller.BUTTON_TURBO_A,
  TURBO_B: Controller.BUTTON_TURBO_B,
}

export interface NesApp {
  /** jsnes 实例 */
  instance: NES
  /** 将页面上 `[data-button="NAME"]` 元素与手柄按键绑定 */
  bindButton: (name: ButtonName) => void
  /** 通过 URL 加载并启动 ROM */
  load: (url: string) => Promise<void>
  /** 直接以二进制数据启动 ROM */
  boot: (romData: Uint8Array) => void
  /** 静音 / 取消静音 */
  setMuted: (muted: boolean) => void
  /** 重置当前游戏 */
  reset: () => void
  /** 保存当前游戏状态到本地，返回是否成功 */
  saveState: () => boolean
  /** 从本地读取当前游戏存档，返回是否成功 */
  loadState: () => boolean
}

/**
 * 创建 JSNES 实例并接管指定 canvas 的渲染与音频。
 *
 * 音频通过 AudioWorklet 在独立的音频线程输出（替代已废弃的 ScriptProcessorNode）：
 * worklet 维护环形缓冲并在余量不足时反压请求，主线程按需驱动 `nes.frame()`
 * 产生少量样本并零拷贝回传（pull 模型，兼容无 SharedArrayBuffer 的部署环境）。
 *
 * @param canvasId 画布元素 id
 * @returns NES 应用句柄；当画布不存在时返回 `undefined`
 */
export async function createNes(canvasId: string): Promise<NesApp | undefined> {
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null
  const ctx = canvas?.getContext('2d')
  if (!ctx) {
    console.error('画布不存在')
    return
  }

  const imageData = ctx.getImageData(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)
  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)

  // 帧缓冲：u8 视图写回 canvas，u32 视图供 jsnes 按像素填充（共享同一 buffer）
  const buffer = new ArrayBuffer(imageData.data.length)
  const framebufferU8 = new Uint8ClampedArray(buffer)
  const framebufferU32 = new Uint32Array(buffer)

  // ===== 音频 =====
  const audioCtx = new AudioContext()

  // 主线程攒批缓冲：jsnes 通过 onAudioSample 持续产生样本
  const pendingLeft: number[] = []
  const pendingRight: number[] = []

  const nes = new NES({
    // 让 jsnes 采样率与音频输出上下文一致，避免音高 / 速度偏差
    sampleRate: audioCtx.sampleRate,
    onFrame(frameBuffer) {
      for (let i = 0; i < FRAMEBUFFER_SIZE; i++)
        framebufferU32[i] = 0xFF000000 | frameBuffer[i]
    },
    onAudioSample(left, right) {
      pendingLeft.push(left)
      pendingRight.push(right)
    },
  })

  let romLoaded = false
  // 当前 ROM 路径（作为存档 key）
  let currentRom = ''
  // 模拟器崩溃后停止驱动，避免反复抛错刷屏
  let stopped = false
  // worklet 不可用时退化为由动画帧驱动模拟器（无声）
  let audioDriven = false
  let lastDrive = 0
  // 输出增益节点（用于静音控制）
  let gainNode: GainNode | undefined

  /** 安全地驱动一帧；返回是否成功产生了一帧 */
  function driveFrame(): boolean {
    if (!romLoaded || stopped)
      return false
    try {
      nes.frame()
      return true
    }
    catch (error) {
      stopped = true
      console.error('模拟器运行出错', error)
      return false
    }
  }

  function onAnimationFrame(now: number) {
    window.requestAnimationFrame(onAnimationFrame)
    // 无音频驱动时退化为由动画帧驱动模拟器，并节流到 ~60fps（兼容高刷新率屏幕）
    if (!audioDriven && now - lastDrive >= FRAME_INTERVAL - 1) {
      lastDrive = now
      driveFrame()
      pendingLeft.length = 0
      pendingRight.length = 0
    }
    imageData.data.set(framebufferU8)
    ctx.putImageData(imageData, 0, 0)
  }

  // 尝试启用 AudioWorklet 音频管线
  try {
    // worklet 为 public/ 下的自包含纯 JS（见该文件注释），用 BASE_URL 适配部署子路径
    await audioCtx.audioWorklet.addModule(
      `${import.meta.env.BASE_URL}nes-audio.worklet.js`,
    )
    const audioNode = new AudioWorkletNode(audioCtx, 'nes-audio', {
      outputChannelCount: [2],
    })
    // 经 GainNode 输出，便于静音控制
    gainNode = audioCtx.createGain()
    audioNode.connect(gainNode)
    gainNode.connect(audioCtx.destination)

    audioNode.port.onmessage = (event: MessageEvent<{ type?: string }>) => {
      if (event.data?.type !== 'need')
        return
      // 小批量按需驱动；帧数上限兜底，避免 ROM 未就绪 / 崩溃时死循环卡死主线程
      let frames = 0
      while (pendingLeft.length < REFILL_TARGET && frames < MAX_FRAMES_PER_REFILL) {
        if (!driveFrame())
          break
        frames++
      }
      const left = Float32Array.from(pendingLeft)
      const right = Float32Array.from(pendingRight)
      pendingLeft.length = 0
      pendingRight.length = 0
      audioNode.port.postMessage({ left, right }, [left.buffer, right.buffer])
    }

    audioDriven = true
  }
  catch (error) {
    console.error('AudioWorklet 初始化失败，降级为无声模式', error)
  }

  // 浏览器在用户首次交互前会挂起 AudioContext，需在交互时恢复。
  // 持续监听（而非 once）以保证即使首次 resume 因缺少用户激活而失败，
  // 后续任意交互仍可恢复音频与游戏运行。
  const resume = () => {
    if (audioCtx.state === 'suspended')
      void audioCtx.resume()
  }
  for (const type of ['pointerdown', 'keydown', 'touchstart'] as const)
    window.addEventListener(type, resume)

  function boot(romData: Uint8Array) {
    nes.loadROM(romData)
    romLoaded = true
    stopped = false
    window.requestAnimationFrame(onAnimationFrame)
  }

  return {
    instance: nes,

    bindButton(name) {
      const btn = document.querySelector<HTMLElement>(`[data-button="${name}"]`)
      if (!btn)
        return
      const code = BUTTON_CODE[name]
      const onDown = () => nes.buttonDown(1, code)
      const onUp = () => nes.buttonUp(1, code)
      btn.addEventListener('touchstart', onDown, { passive: true })
      btn.addEventListener('mousedown', onDown)
      btn.addEventListener('touchend', onUp)
      btn.addEventListener('mouseup', onUp)
      // 指针移出按钮时也视为抬起，避免“按住”卡死
      btn.addEventListener('mouseleave', onUp)
    },

    async load(url) {
      const res = await fetch(url)
      if (!res.ok) {
        console.error(`加载 ROM 失败 ${url}: ${res.status} ${res.statusText}`)
        return
      }
      const data = new Uint8Array(await res.arrayBuffer())
      currentRom = url
      boot(data)
    },

    boot,

    setMuted(muted) {
      if (gainNode)
        gainNode.gain.value = muted ? 0 : 1
    },

    reset() {
      if (romLoaded)
        nes.reloadROM()
    },

    saveState() {
      if (!romLoaded || !currentRom)
        return false
      try {
        localStorage.setItem(`${SAVE_KEY_PREFIX}${currentRom}`, JSON.stringify(nes.toJSON()))
        return true
      }
      catch (error) {
        console.error('存档失败', error)
        return false
      }
    },

    loadState() {
      if (!currentRom)
        return false
      const raw = localStorage.getItem(`${SAVE_KEY_PREFIX}${currentRom}`)
      if (!raw)
        return false
      try {
        nes.fromJSON(JSON.parse(raw))
        return true
      }
      catch (error) {
        console.error('读档失败', error)
        return false
      }
    },
  }
}
