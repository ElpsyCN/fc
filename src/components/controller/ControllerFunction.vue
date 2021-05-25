<template>
  <div class="function">
    <button class="controls-center-select joy-btn" role="BUTTON_SELECT">
      SELECT
    </button>
    <button class="controls-center-start joy-btn" role="BUTTON_START">
      START
    </button>
  </div>
</template>

<style lang="scss">
.function {
  button {
    user-select: none;
    margin: 10px;
    height: 24px;
    width: 60px;
    outline: 0;
    /*border: 8px solid #474f51;莫*/
    box-shadow: 0 0 0 8px rgba(255, 255, 255, 0.1),
      inset 4px 4px 0 0px rgba(255, 255, 255, 0.4);
    background: #857b7a;
    /*color: transparent;莫*/
    color: #000000;
    border-radius: 15px;
  }

  .joy-btn {
    text-align: center;
    font-size: 12px;
    font-weight: bold;
  }
}
</style>
