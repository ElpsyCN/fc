<template>
  <div id="joystick" class="controller joystick">
    <div id="controls-direction">
      <button
        v-for="(direction, i) in directions"
        :key="i"
        :role="'BUTTON_' + direction"
        :class="['joystick-btn', direction.toLowerCase()]"
        @touchstart="onButtonDown(direction)"
        @touchend="onButtonUp"
      >
        {{ direction }}
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  data() {
    return {
      directions: ["LEFT", "RIGHT", "UP", "DOWN"],
    };
  },
  mounted() {},
  methods: {
    onButtonDown(direction: string) {
      const joystick = document.getElementById("joystick");
      if (!joystick) {
        return;
      }

      let axis = "X";
      let deg = 8;
      let isNeagtive = false;
      switch (direction) {
        case "UP":
          axis = "X";
          isNeagtive = false;
          break;
        case "DOWN":
          axis = "X";
          isNeagtive = true;
          break;
        case "LEFT":
          axis = "Y";
          isNeagtive = true;
          break;
        case "RIGHT":
          axis = "Y";
          isNeagtive = false;
        default:
          break;
      }
      joystick.style.transform = `rotate${axis}(${
        isNeagtive ? "-" : ""
      }${deg}deg)`;
    },

    /**
     * 恢复样式
     */
    onButtonUp() {
      const joystick = document.getElementById("joystick");
      if (joystick) {
        joystick.style.transform = "";
      }
    },
  },
});
</script>


<style lang="scss">
#joystick {
  filter: drop-shadow(2px 2px 2px black);
}

.joystick-btn {
  &.up {
    top: 0;
    transform: translate(-50%, 0);
    border-bottom: 0;
    height: 50px;
    border-bottom-right-radius: 0;
    border-bottom-left-radius: 0;
    box-shadow: inset 0px 8px 0 0px rgba(255, 255, 255, 0.5);
  }

  &.right {
    left: auto;
    right: 0;
    transform: translate(0, -50%);
    border-left: 0;
    width: 50px;
    border-bottom-left-radius: 0;
    border-top-left-radius: 0;
    box-shadow: inset 8px 0 0 0px #857b7a,
      inset 6px 6px 0 0px rgba(255, 255, 255, 0.4),
      inset 8px -8px 0 0px rgba(0, 0, 0, 0.1);
  }

  &.down {
    top: auto;
    transform: translate(-50%, 0);
    bottom: 0;
    border-top: 0;
    height: 50px;
    border-top-right-radius: 0;
    border-top-left-radius: 0;
    box-shadow: inset 0px -8px 0 0px rgba(0, 0, 0, 0.1);
  }

  &.left {
    left: 0;
    transform: translate(0, -50%);
    border-right: 0;
    width: 50px;
    border-bottom-right-radius: 0;
    border-top-right-radius: 0;
    box-shadow: inset 0px 8px 0 0px rgba(255, 255, 255, 0.4),
      inset -8px 0px 0 0px #857b7a, inset -8px -8px 0 0px rgba(0, 0, 0, 0.1);
  }
}

.controller {
  position: relative;
  width: 140px;
  height: 140px;
  align-self: flex-end;
  filter: drop-shadow(5px 5px 0px rgba(255, 255, 255, 0.8));

  button {
    position: absolute;
    z-index: 1;
    border: 8px solid #474f51;
    background: #857b7a;
    color: transparent;
    border-radius: 15px;
    box-sizing: border-box;
    outline: 0;
    width: 56px;
    height: 56px;
    left: 50%;
    top: 50%;
    user-select: none;
    transform: translate(-50%, -50%);
    transition: 0.2s;
  }

  &::before {
    content: "";
    position: absolute;
    z-index: 0;
    pointer-events: none;
    box-sizing: border-box;
    left: 50%;
    top: 50%;
    width: 56px;
    height: 56px;
    background: #857b7a;
    transform: translate(-50%, -50%);
  }

  &::after {
    content: "";
    z-index: 2;
    position: absolute;
    pointer-events: none;
    box-sizing: border-box;
    width: 42px;
    height: 42px;
    border: 8px solid #474f51;
    border-radius: 50%;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    box-shadow: inset 0px 8px 0 0px #736a6d,
      inset 0px -8px 0 0px rgba(255, 255, 255, 0.4);
  }
}
</style>
