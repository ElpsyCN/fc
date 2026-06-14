<template>
  <div class="function">
    <button
      class="controls-center-select joy-btn"
      type="button"
      data-button="SELECT"
      aria-label="SELECT 键"
    >
      SELECT
    </button>
    <button
      class="controls-center-start joy-btn"
      type="button"
      data-button="START"
      aria-label="START 键"
    >
      START
    </button>
  </div>
</template>

<style lang="scss">
.function {
  // 深色塑料胶囊按钮，斜向放置、按下下沉
  button {
    user-select: none;
    margin: 9px;
    height: 22px;
    width: 62px;
    outline: 0;
    border: none;
    border-radius: 11px;
    color: rgba(255, 255, 255, 0.85);
    background: linear-gradient(180deg, #5a5a5a 0%, #333 60%, #222 100%);
    box-shadow:
      0 3px 0 #151515,
      0 4px 5px rgba(0, 0, 0, 0.4),
      inset 0 1px 1px rgba(255, 255, 255, 0.28);
    transition: transform 0.06s ease, box-shadow 0.06s ease;

    &:active {
      transform: translateY(2px);
      box-shadow:
        0 1px 0 #151515,
        inset 0 2px 4px rgba(0, 0, 0, 0.45);
    }
  }

  .joy-btn {
    text-align: center;
    font-size: 11px;
    font-weight: bold;
    letter-spacing: 0.06em;
  }
}
</style>
