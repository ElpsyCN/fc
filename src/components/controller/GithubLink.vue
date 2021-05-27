<template>
  <a class="joy" :href="githubUrl" target="_blank">
    <icon-github />
    <i-mdi-github />
  </a>
</template>

<script lang="ts">
import pkg from "../../../package.json";
import { defineComponent } from "vue";
export default defineComponent({
  data() {
    return {
      githubUrl: pkg.repository.url,
    };
  },
});
</script>


<style lang="scss">
.joy {
  position: absolute;
  left: 0;
  top: 0;
  width: 50px;
  height: 50px;
  background: #857b7a;
  border-radius: 5px;
  color: #f8f1d7;

  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 2rem;
}
</style>
