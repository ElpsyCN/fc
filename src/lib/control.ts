import jsnes from "jsnes";

/**
 *
 * @param callback
 * @param event
 */
function keyboard(callback: Function, event: any) {
  var player = 1;
  switch (event.keyCode) {
    case 38: // UP
      callback(player, jsnes.Controller.BUTTON_UP);
      break;
    case 40: // Down
      callback(player, jsnes.Controller.BUTTON_DOWN);
      break;
    case 37: // Left
      callback(player, jsnes.Controller.BUTTON_LEFT);
      break;
    case 39: // Right
      callback(player, jsnes.Controller.BUTTON_RIGHT);
      break;
    case 65: // 'a' - qwerty, dvorak
    case 81: // 'q' - azerty
      callback(player, jsnes.Controller.BUTTON_A);
      break;
    case 83: // 's' - qwerty, azerty
    case 79: // 'o' - dvorak
      callback(player, jsnes.Controller.BUTTON_B);
      break;
    // case 9: // Tab
    case 32:
      callback(player, jsnes.Controller.BUTTON_SELECT);
      break;
    case 13: // Return
      callback(player, jsnes.Controller.BUTTON_START);
      break;
    default:
      break;
  }
}

/**
 * 为 nes 绑定时间
 * @param nes JSNES 实例
 */
export function bindKeyboard(nes: any) {
  // 绑定全局键盘按键
  document.addEventListener("keydown", (event) => {
    keyboard(nes.buttonDown, event);
  });

  document.addEventListener("keyup", (event) => {
    keyboard(nes.buttonUp, event);
  });
}
