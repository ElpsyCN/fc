<template>
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
