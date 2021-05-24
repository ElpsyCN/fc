<template>
  <div class="nes-roms">
    <select class="nes-select" v-model="currentGame" @change="selectGame">
      <option disabled selected value="default">选择游戏...</option>
      <optgroup label="经典">
        <option
          v-for="(rom, i) in romsList"
          :key="i"
          :value="'roms/' + rom.path"
        >
          {{ rom.name }}
        </option>
      </optgroup>
      <optgroup label="本页面由公众号(华趣实验室)提供"></optgroup>
    </select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import romsList from "../assets/roms-list.json";

export default defineComponent({
  data() {
    return {
      currentGame: "default",
      romsList,
    };
  },
  methods: {
    /**
     * 选择游戏
     */
    selectGame() {
      const rom = this.currentGame;
      // @ts-ignore
      nesApp.load(rom);
    },
  },
});
</script>

<style lang="scss">
.nes-select {
  outline: none;
  border: none;
  height: 1.5rem;
  padding: 0.2rem;
  border-radius: 2px;
}
</style>
