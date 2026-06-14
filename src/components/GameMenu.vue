<script setup lang="ts">
import { ref } from 'vue'
import romsList from '../assets/roms-list.json'
import { useNes } from '../composables/useNes'

const nesApp = useNes()
const currentGame = ref('default')

/** 切换游戏：加载所选 ROM */
function selectGame() {
  if (currentGame.value !== 'default')
    nesApp.value?.load(currentGame.value)
}
</script>

<template>
  <div class="nes-roms">
    <select
      v-model="currentGame"
      class="nes-select"
      aria-label="选择游戏"
      @change="selectGame"
    >
      <option disabled value="default">
        选择游戏...
      </option>
      <optgroup label="经典">
        <option
          v-for="rom in romsList"
          :key="rom.path"
          :value="`roms/${rom.path}`"
        >
          {{ rom.name }}
        </option>
      </optgroup>
      <optgroup label="本页面由公众号(华趣实验室)提供" />
    </select>
  </div>
</template>

<style lang="scss">
.nes-roms {
  margin: 0 auto;
  text-align: center;
}

.nes-select {
  width: 200px;
  max-width: 100%;
  height: 1.6rem;
  padding: 0.2rem 0.4rem;
  color: #1e1b16;
  background: #f8f1d7;
  border: 2px solid #474f51;
  border-radius: 4px;
  outline: none;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.8rem;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:hover {
    border-color: #da4a4a;
  }

  &:focus-visible {
    border-color: #da4a4a;
    box-shadow: 0 0 0 3px rgba(218, 74, 74, 0.4);
  }
}
</style>
