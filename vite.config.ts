/// <reference types="vitest/config" />
import vue from '@vitejs/plugin-vue'
import IconsResolver from 'unplugin-icons/resolver'
import Icons from 'unplugin-icons/vite'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // 自动按需注册组件，并通过 IconsResolver 解析 `<i-mdi-xxx />` 形式的图标组件
    Components({
      resolvers: [IconsResolver()],
      dts: 'src/components.d.ts',
    }),
    // 将 `~icons/collection/name` 编译为 Vue 组件（数据源来自 @iconify/json）
    Icons({ compiler: 'vue3' }),
  ],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.ts'],
    clearMocks: true,
  },
})
