<template>
  <div class="main">
    <div class="panel">
      <div class="controller-area">
        <div class="controller">
          <game-controller />
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
        <controller-function />
      </div>
      <div class="action-area">
        <controller-action />
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
import GameController from "./GameController.vue";
import GameMenu from "./GameMenu.vue";
import { createNes } from "../lib/nes";
import { buttonDown, buttonUp } from "../lib/helper";
import ControllerAction from "./controller/ControllerAction.vue";
import ControllerFunction from "./controller/ControllerFunction.vue";

export default defineComponent({
  components: {
    GameController,
    GameMenu,
    ControllerAction,
    ControllerFunction,
  },
  mounted() {
    this.$nextTick(() => {
      const defaultRom = "roms/Super Mario Bros. (JU) (PRG0) [!].nes";
      const nesApp = createNes("nes-canvas");
      nesApp?.load(defaultRom);

      // @ts-ignore
      window.nesApp = nesApp;
    });
  },
  methods: {
    buttonDown,
    buttonUp,
  },
});
</script>
