<template>
  <div class="main">
    <div class="panel">
      <div class="controller-area">
        <controller-joystick />
        <div class="joy">I</div>
        <sponsor-adsense />
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
import GameMenu from "./GameMenu.vue";
import { createNes } from "../lib/nes";
import ControllerAction from "./controller/ControllerAction.vue";
import ControllerFunction from "./controller/ControllerFunction.vue";
import ControllerJoystick from "./controller/ControllerJoystick.vue";
import SponsorAdsense from "./SponsorAdsense.vue";

export default defineComponent({
  components: {
    GameMenu,
    ControllerAction,
    ControllerFunction,
    ControllerJoystick,
    SponsorAdsense,
  },
  mounted() {
    this.$nextTick(() => {
      const defaultRom = "roms/Super Mario Bros. (JU) (PRG0) [!].nes";
      const nesApp = createNes("nes-canvas");
      // @ts-ignore
      window.nesApp = nesApp;
      if (!nesApp) {
        console.log("NES 初始化失败！");
        return;
      }
      nesApp.load(defaultRom);

      nesApp.bindButton("LEFT");
      nesApp.bindButton("RIGHT");
      nesApp.bindButton("UP");
      nesApp.bindButton("DOWN");
      nesApp.bindButton("SELECT");
      nesApp.bindButton("START");
      nesApp.bindButton("A");
      nesApp.bindButton("B");

      document.querySelectorAll("button").forEach((el) => {
        el.addEventListener("contextmenu", (e) => {
          e.preventDefault();
        });
      });
    });
  },
});
</script>
