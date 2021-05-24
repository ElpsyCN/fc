export function buttonDown(button: string) {
  // @ts-ignore
  nes.buttonDown(1, jsnes.Controller["BUTTON_" + button]);
}

export function buttonUp(button: string) {
  // @ts-ignore
  nes.buttonUp(1, jsnes.Controller["BUTTON_" + button]);
}
