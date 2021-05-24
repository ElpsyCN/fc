<template>
  <game-bgm />
  <game-pad />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import GameBgm from "./components/GameBgm.vue";
import GamePad from "./components/GamePad.vue";

export default defineComponent({
  name: "App",
  components: {
    GamePad,
    GameBgm,
  },
});
</script>
