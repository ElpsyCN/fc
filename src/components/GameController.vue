<template>
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
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { buttonDown, buttonUp } from "../lib/helper";

export default defineComponent({
  methods: {
    buttonDown,
    buttonUp,
  },
});
</script>
