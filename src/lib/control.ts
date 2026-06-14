import type { ButtonKey, ControllerId, NES } from 'jsnes'
import { Controller } from 'jsnes'

/**
 * 各玩家的键盘物理按键（KeyboardEvent.code）到 NES 手柄按键的映射。
 *
 * 使用 `code` 而非已废弃的 `keyCode`，可避免不同键盘布局 / 输入法下的差异。
 * - 玩家 1：方向键 + A/S（兼容 azerty 的 Q、dvorak 的 O）+ Space/Enter
 * - 玩家 2：IJKL（方向）+ H/G（A/B）+ T/Y（Select/Start）
 */
const PLAYER_KEYS: Record<ControllerId, Record<string, ButtonKey>> = {
  1: {
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
  },
  2: {
    KeyI: Controller.BUTTON_UP,
    KeyK: Controller.BUTTON_DOWN,
    KeyJ: Controller.BUTTON_LEFT,
    KeyL: Controller.BUTTON_RIGHT,
    KeyH: Controller.BUTTON_A,
    KeyG: Controller.BUTTON_B,
    KeyT: Controller.BUTTON_SELECT,
    KeyY: Controller.BUTTON_START,
  },
}

/**
 * 将键盘事件的 `code` 解析为指定玩家的 NES 手柄按键，未匹配时返回 `undefined`。
 *
 * 抽离为纯函数以便单元测试。
 */
export function keyToButton(code: string, player: ControllerId = 1): ButtonKey | undefined {
  return PLAYER_KEYS[player][code]
}

/**
 * 为 NES 实例绑定指定玩家的全局键盘事件。
 *
 * @returns 解绑函数，便于组件卸载时清理监听
 */
export function bindKeyboard(nes: NES, player: ControllerId = 1): () => void {
  const createHandler
    = (action: (controller: ControllerId, button: ButtonKey) => void) =>
      (event: KeyboardEvent) => {
        const button = keyToButton(event.code, player)
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
