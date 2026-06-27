declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}

// 纯 CSS 字体包（入口为 index.css），仅副作用导入，无需类型
declare module '@fontsource/press-start-2p'
