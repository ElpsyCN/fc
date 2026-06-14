<script setup lang="ts">
import pkg from '../../../package.json'

const githubUrl = pkg.repository.url
</script>

<template>
  <a
    class="joy github-link"
    :href="githubUrl"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="在 GitHub 上查看源码"
  >
    <i-mdi-github aria-hidden="true" />
  </a>
</template>

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
  transition: background-color 0.2s, color 0.2s;

  &:hover {
    background: #da4a4a;
    color: #fff;
  }
}
</style>
