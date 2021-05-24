<template>
  <div class="action">
    <div id="controls-fire">
      <button class="a joy-btn" role="BUTTON_A">A</button>
      <button class="b joy-btn" role="BUTTON_B">B</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({});
</script>

<style lang="scss">
.action {
  display: flex;
  align-self: flex-end;
}

.action button:first-child {
  margin-right: 24px;
}

.action {
  button:first-child {
    margin-right: 20px;
  }

  .joy-btn {
    font-weight: bold;

    user-select: none;
    width: 56px;
    height: 56px;
    background: #857b7a;
    border-radius: 50%;
    outline: 0;
    /*color: transparent;莫*/
    color: #000000;
    border: 8px solid #474f51;
    box-shadow: 0 0 0 5px rgba(255, 255, 255, 0.8),
      inset 2px 4px 0 0px rgba(255, 255, 255, 0.4),
      inset -5px -8px 0 0px rgba(0, 0, 0, 0.1);

    &:active {
      box-shadow: 0 0 0 5px rgba(255, 255, 255, 0.8),
        inset 2px 2px 0 0 rgba(0, 0, 0, 0.2);
    }
  }
}
</style>
