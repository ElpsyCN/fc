import jsnes from "jsnes";

// 屏幕宽度
const SCREEN_WIDTH = 256;
// 屏幕高度
const SCREEN_HEIGHT = 240;
const FRAMEBUFFER_SIZE = SCREEN_WIDTH * SCREEN_HEIGHT;

/**
 * 创建 JSNES 实例
 * @param canvasId 画布 ID
 * @returns
 */
export function createNes(canvasId: string) {
  // init
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.log("画布不存在");
    return;
  }
  const imageData = ctx.getImageData(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

  // Allocate framebuffer array.
  const buffer = new ArrayBuffer(imageData.data.length);
  const framebuffer_u8 = new Uint8ClampedArray(buffer);
  const framebuffer_u32 = new Uint32Array(buffer);

  // Setup audio.
  const AUDIO_BUFFERING = 512;
  const audioCtx = new window.AudioContext();
  const script_processor = audioCtx.createScriptProcessor(
    AUDIO_BUFFERING,
    0,
    2
  );
  script_processor.onaudioprocess = audio_callback;
  script_processor.connect(audioCtx.destination);

  const SAMPLE_COUNT = 4 * 1024;
  const SAMPLE_MASK = SAMPLE_COUNT - 1;
  const audio_samples_L = new Float32Array(SAMPLE_COUNT);
  const audio_samples_R = new Float32Array(SAMPLE_COUNT);

  let audio_write_cursor = 0;
  let audio_read_cursor = 0;

  const nes = new jsnes.NES({
    onFrame(framebuffer_24: Uint32Array) {
      for (let i = 0; i < FRAMEBUFFER_SIZE; i++)
        framebuffer_u32[i] = 0xff000000 | framebuffer_24[i];
    },
    onAudioSample(l: any, r: any) {
      audio_samples_L[audio_write_cursor] = l;
      audio_samples_R[audio_write_cursor] = r;
      audio_write_cursor = (audio_write_cursor + 1) & SAMPLE_MASK;
    },
  });

  function onAnimationFrame() {
    if (!ctx) {
      return;
    }

    window.requestAnimationFrame(onAnimationFrame);

    imageData.data.set(framebuffer_u8);
    ctx.putImageData(imageData, 0, 0);
  }

  function audio_remain() {
    return (audio_write_cursor - audio_read_cursor) & SAMPLE_MASK;
  }

  function audio_callback(event: any) {
    const dst = event.outputBuffer;
    const len = dst.length;

    // Attempt to avoid buffer underruns.
    if (audio_remain() < AUDIO_BUFFERING) nes.frame();

    let dst_l = dst.getChannelData(0);
    let dst_r = dst.getChannelData(1);
    for (let i = 0; i < len; i++) {
      const src_idx = (audio_read_cursor + i) & SAMPLE_MASK;
      dst_l[i] = audio_samples_L[src_idx];
      dst_r[i] = audio_samples_R[src_idx];
    }

    audio_read_cursor = (audio_read_cursor + len) & SAMPLE_MASK;
  }

  return {
    /**
     * 实例
     */
    instance: nes,

    /**
     * 绑定按钮
     * @param button
     * @returns
     */
    bindButton(name: string) {
      const buttonName = "BUTTON_" + name;
      const btn = document.querySelector(
        `[role="${buttonName}"]`
      ) as HTMLElement;
      if (!btn) {
        return;
      }

      const onButtonDown = () => {
        nes.buttonDown(1, jsnes.Controller[buttonName]);
      };

      const onButtonUp = () => {
        nes.buttonUp(1, jsnes.Controller[buttonName]);
      };

      btn.ontouchstart = onButtonDown;
      btn.onmousedown = onButtonDown;
      btn.ontouchend = onButtonUp;
      btn.onmouseup = onButtonUp;
    },

    /**
     * 加载 ROM
     * @param url 路径
     */
    async load(url: string) {
      const req = new XMLHttpRequest();
      req.open("GET", url);
      req.overrideMimeType("text/plain; charset=x-user-defined");
      req.onload = () => {
        if (req.status === 200) {
          // console.log(this.responseText);
          // nes_boot();
          this.boot(req.responseText);
        } else if (req.status === 0) {
          // Aborted, so ignore error
        } else {
          console.log(`Error loading ${url}: ${req.statusText}`);
        }
      };
      req.send();
      return req.responseText;
    },

    /**
     * 启动 ROM
     * @param rom_data
     */
    boot(rom_data: string) {
      nes.loadROM(rom_data);
      window.requestAnimationFrame(onAnimationFrame);
    },
  };
}
