<template>
  <audio
    style="display: none; height: 0"
    id="bg-music"
    preload="auto"
    src="media/bgm.mp3"
  ></audio>
  <!--<embed src="bgm.mp3" hidden="true" autostart="true"/>-->
  <div class="main">
    <div class="panel">
      <div class="controller-area">
        <div class="controller">
          <div id="controls-direction">
            <button
              role="BUTTON_UP"
              class="up joydirection"
              id="joystick_btn_up"
              @mousedown="buttonDown('UP')"
              @mouseup="buttonUp('UP')"
            >
              up
            </button>
            <button
              role="BUTTON_RIGHT"
              class="right joydirection"
              id="joystick_btn_right"
              @mousedown="buttonDown('RIGHT')"
              @mouseup="buttonUp('RIGHT')"
            >
              right
            </button>
            <button
              role="BUTTON_DOWN"
              class="down joydirection"
              id="joystick_btn_down"
              @mousedown="buttonDown('DOWN')"
              @mouseup="buttonUp('DOWN')"
            >
              down
            </button>
            <button
              role="BUTTON_LEFT"
              class="left joydirection"
              id="joystick_btn_left"
              @mousedown="buttonDown('LEFT')"
              @mouseup="buttonUp('LEFT')"
            >
              left
            </button>
          </div>
        </div>
        <div class="joy">I</div>
        <div>
          <a
            href="https://upyun.yunyoujun.cn/images/tackout-assistant-qrcode.jpg!/format/jpg"
            target="_blank"
            class="readme"
            >瓜子饮料</a
          >
        </div>
      </div>
      <div class="function-area">
        <div class="screen">
          <div id="emulator" style="width: 100%; height: 100%">
            <div style="margin: auto; width: 75%; height: 90%">
              <canvas
                id="nes-canvas"
                width="256"
                height="240"
                style="width: 100%"
              />
            </div>

            <game-menu />
          </div>
        </div>
        <div class="function">
          <button
            class="controls-center-select joybtn"
            id="joystick_btn_select"
            role="BUTTON_SELECT"
            @mousedown="buttonDown('SELECT')"
            @mouseup="buttonUp('SELECT')"
          >
            Select
          </button>
          <button
            class="controls-center-start joybtn"
            id="joystick_btn_start"
            role="BUTTON_START"
            @mousedown="buttonDown('START')"
            @mouseup="buttonUp('START')"
          >
            Pause
          </button>
        </div>
      </div>
      <div class="action-area">
        <div class="action">
          <div id="controls-fire">
            <button
              class="a joybtn"
              role="BUTTON_A"
              id="joystick_btn_A"
              @mousedown="buttonDown('A')"
              @mouseup="buttonUp('A')"
            >
              A
            </button>
            <button
              class="b joybtn"
              role="BUTTON_B"
              id="joystick_btn_B"
              @mousedown="buttonDown('B')"
              @mouseup="buttonUp('B')"
            >
              B
            </button>
          </div>
        </div>
      </div>
      <div class="sign">
        FAMILY <br />
        COMPUTER
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import GameMenu from "./GameMenu.vue";

export default defineComponent({
  components: {
    GameMenu,
  },
  mounted() {
    window.onload = function () {
      // @ts-ignore
      nes_load_url("nes-canvas", "roms/Super Mario Bros. (JU) (PRG0) [!].nes");
    };
  },
  methods: {
    buttonDown(button: string) {
      // @ts-ignore
      nes.buttonDown(1, jsnes.Controller["BUTTON_" + button]);
    },
    buttonUp(button: string) {
      // @ts-ignore
      nes.buttonUp(1, jsnes.Controller["BUTTON_" + button]);
    },
  },
});
</script>
