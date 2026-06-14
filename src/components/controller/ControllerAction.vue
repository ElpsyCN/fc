<template>
  <div class="action">
    <button class="turbo-btn" type="button" data-button="TURBO_B" aria-label="连发 B 键">
      连B
    </button>
    <button class="turbo-btn" type="button" data-button="TURBO_A" aria-label="连发 A 键">
      连A
    </button>
    <button class="joy-btn b" type="button" data-button="B" aria-label="B 键">
      B
    </button>
    <button class="joy-btn a" type="button" data-button="A" aria-label="A 键">
      A
    </button>
  </div>
</template>

<style lang="scss">
.action {
  display: grid;
  grid-template-columns: auto auto;
  justify-items: center;
  align-items: center;
  align-self: flex-end;
  gap: 9px 22px;

  // 红色 A / B 大钮（FC / 小霸王标志性）
  .joy-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 58px;
    height: 58px;
    border: none;
    border-radius: 50%;
    outline: 0;
    user-select: none;
    font-family: var(--font-pixel);
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.92);
    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.45);
    background: radial-gradient(circle at 38% 30%, #ff7a6a 0%, #e23b32 46%, #b51d1d 100%);
    box-shadow:
      0 5px 0 #7c1414,
      0 7px 9px rgba(0, 0, 0, 0.45),
      inset 0 3px 4px rgba(255, 255, 255, 0.45),
      inset 0 -4px 5px rgba(0, 0, 0, 0.28);
    transition: transform 0.06s ease, box-shadow 0.06s ease;

    &:active {
      transform: translateY(4px);
      box-shadow:
        0 1px 0 #7c1414,
        0 2px 4px rgba(0, 0, 0, 0.4),
        inset 0 3px 6px rgba(0, 0, 0, 0.35);
    }
  }

  // 橙色连发（TURBO）小钮——小霸王经典
  .turbo-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border: none;
    border-radius: 50%;
    outline: 0;
    user-select: none;
    font-family: var(--font-base);
    font-size: 11px;
    font-weight: bold;
    color: rgba(255, 255, 255, 0.95);
    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.4);
    background: radial-gradient(circle at 38% 30%, #ffc97a 0%, #f59016 48%, #c96e08 100%);
    box-shadow:
      0 4px 0 #82490a,
      0 5px 7px rgba(0, 0, 0, 0.4),
      inset 0 2px 3px rgba(255, 255, 255, 0.5),
      inset 0 -3px 4px rgba(0, 0, 0, 0.25);
    transition: transform 0.06s ease, box-shadow 0.06s ease;

    &:active {
      transform: translateY(3px);
      box-shadow:
        0 1px 0 #82490a,
        inset 0 2px 5px rgba(0, 0, 0, 0.35);
    }
  }
}
</style>
