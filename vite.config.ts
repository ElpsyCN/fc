/// <reference types="vitest/config" />
import vue from '@vitejs/plugin-vue'
import IconsResolver from 'unplugin-icons/resolver'
import Icons from 'unplugin-icons/vite'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

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
    // PWA：离线可安装
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: '怀旧游戏机 · 在线 FC/NES 模拟器',
        short_name: '怀旧游戏机',
        description: '可在手机电脑上在线玩 FC 游戏的模拟器',
        lang: 'zh-CN',
        theme_color: '#da4a4a',
        background_color: '#1a1a2e',
        display: 'standalone',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2}'],
        globIgnores: ['**/preview.png'],
        // 玩过的 ROM 与背景音乐运行时缓存，离线可重玩
        runtimeCaching: [
          {
            urlPattern: /\/roms\/.*\.nes$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fc-roms',
              expiration: { maxEntries: 40 },
            },
          },
          {
            urlPattern: /\/media\/.*\.mp3$/,
            handler: 'CacheFirst',
            options: { cacheName: 'fc-media' },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.ts'],
    clearMocks: true,
  },
})
