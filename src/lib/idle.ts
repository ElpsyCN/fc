export interface IdleTaskOptions {
  /** 即使持续繁忙，也必须在该时间内调度（requestIdleCallback） */
  timeout?: number
  /** 不支持 requestIdleCallback 时的兼容延迟 */
  fallbackDelay?: number
}

/**
 * 在浏览器空闲阶段执行非关键任务。
 * Safari 等不支持 requestIdleCallback 的浏览器回退到延时任务。
 */
export function scheduleIdleTask(
  task: () => void,
  { timeout = 5000, fallbackDelay = 1500 }: IdleTaskOptions = {},
): () => void {
  if (
    typeof globalThis.requestIdleCallback === 'function'
    && typeof globalThis.cancelIdleCallback === 'function'
  ) {
    const handle = globalThis.requestIdleCallback(() => task(), { timeout })
    return () => globalThis.cancelIdleCallback(handle)
  }

  const handle = globalThis.setTimeout(task, fallbackDelay)
  return () => globalThis.clearTimeout(handle)
}
