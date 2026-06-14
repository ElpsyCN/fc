import type { ButtonKey, ControllerId, NES } from 'jsnes'
import { Controller } from 'jsnes'

/**
 * 键盘物理按键（KeyboardEvent.code）到 NES 手柄按键的映射。
 *
 * 使用 `code` 而非已废弃的 `keyCode`，可避免不同键盘布局 / 输入法下的差异，
 * 同时兼容 qwerty / azerty / dvorak。
 */
const KEY_MAP: Record<string, ButtonKey> = {
  ArrowUp: Controller.BUTTON_UP,
  ArrowDown: Controller.BUTTON_DOWN,
  ArrowLeft: Controller.BUTTON_LEFT,
  ArrowRight: Controller.BUTTON_RIGHT,
  KeyA: Controller.BUTTON_A, // qwerty / dvorak
  KeyQ: Controller.BUTTON_A, // azerty
  KeyS: Controller.BUTTON_B, // qwerty / azerty
  KeyO: Controller.BUTTON_B, // dvorak
  Space: Controller.BUTTON_SELECT,
  Enter: Controller.BUTTON_START,
}

/**
 * 将键盘事件的 `code` 解析为 NES 手柄按键，未匹配时返回 `undefined`。
 *
 * 抽离为纯函数以便单元测试。
 */
export function keyToButton(code: string): ButtonKey | undefined {
  return KEY_MAP[code]
}

/**
 * 为 NES 实例绑定全局键盘事件（默认玩家 1）。
 *
 * @returns 解绑函数，便于组件卸载时清理监听
 */
export function bindKeyboard(nes: NES, player: ControllerId = 1): () => void {
  const createHandler
    = (action: (controller: ControllerId, button: ButtonKey) => void) =>
      (event: KeyboardEvent) => {
        const button = keyToButton(event.code)
        if (button === undefined)
          return
        // 阻止方向键 / 空格滚动页面
        event.preventDefault()
        action(player, button)
      }

  const onKeyDown = createHandler(nes.buttonDown)
  const onKeyUp = createHandler(nes.buttonUp)

  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)

  return () => {
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
  }
}
