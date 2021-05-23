<template>
  <GamePad />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import GamePad from "./components/GamePad.vue";

export default defineComponent({
  name: "App",
  components: {
    GamePad,
  },
});
</script>
