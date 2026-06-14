<script setup lang="ts">
import { ref } from 'vue'

const open = ref(false)
</script>

<template>
  <button class="help-trigger" type="button" aria-label="操作帮助" @click="open = true">
    <i-mdi-help />
  </button>

  <Teleport to="body">
    <Transition name="help">
      <div v-if="open" class="help-overlay" @click.self="open = false">
        <div class="help-dialog" role="dialog" aria-modal="true" aria-label="操作说明">
          <h2 class="help-title">
            操作说明
          </h2>
          <table class="help-table">
            <thead>
              <tr>
                <th>按键</th>
                <th>玩家 1</th>
                <th>玩家 2</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>方向</td>
                <td>方向键</td>
                <td>I K J L</td>
              </tr>
              <tr>
                <td>A</td>
                <td>A</td>
                <td>H</td>
              </tr>
              <tr>
                <td>B</td>
                <td>S</td>
                <td>G</td>
              </tr>
              <tr>
                <td>SELECT</td>
                <td>Space</td>
                <td>T</td>
              </tr>
              <tr>
                <td>START</td>
                <td>Enter</td>
                <td>Y</td>
              </tr>
            </tbody>
          </table>
          <ul class="help-notes">
            <li>移动端直接触摸手柄；橙色「连 A / 连 B」为连发键。</li>
            <li>功能栏：静音 · 存档 · 读档 · 重置 · 全屏。</li>
            <li>存档按游戏分别保存在浏览器本地，下次打开仍可读取。</li>
          </ul>
          <button class="help-close" type="button" @click="open = false">
            知道了
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss">
.help-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: none;
  border-radius: 5px;
  color: var(--panel);
  background: var(--btn);
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;

  &:hover {
    background: var(--case-red);
    color: #fff;
  }
}

.help-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.55);
}

.help-dialog {
  width: 100%;
  max-width: 360px;
  padding: 20px;
  border-radius: 12px;
  background: linear-gradient(165deg, #fbf6e2, #ece2c2);
  box-shadow: 0 0 0 4px var(--case-red), 0 16px 40px rgba(0, 0, 0, 0.5);
  color: #1e1b16;
}

.help-title {
  margin: 0 0 14px;
  font-family: var(--font-pixel);
  font-size: 13px;
  color: var(--case-red);
  text-align: center;
}

.help-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  th,
  td {
    padding: 5px 6px;
    text-align: center;
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  }

  th {
    color: #474f51;
  }
}

.help-notes {
  margin: 12px 0 0;
  padding-left: 18px;
  font-size: 12px;
  line-height: 1.7;
  color: #475569;
}

.help-close {
  display: block;
  width: 100%;
  margin-top: 16px;
  padding: 8px;
  border: none;
  border-radius: 8px;
  background: var(--case-red);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }
}

.help-enter-active,
.help-leave-active {
  transition: opacity 0.2s ease;
}

.help-enter-from,
.help-leave-to {
  opacity: 0;
}
</style>
