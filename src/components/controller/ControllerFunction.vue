<template>
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
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { buttonDown, buttonUp } from "../../lib/helper";

export default defineComponent({
  methods: {
    buttonDown,
    buttonUp,
  },
});
</script>
