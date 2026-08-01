import { createApp } from 'vue'
import { createGtag } from 'vue-gtag'
import App from './App.vue'
import { hasPendingSsoRedirect, useYlfAuth } from './composables/useYlfAuth'
import { consoleAllInfo } from './lib/console'

// 复古像素字体（自托管，不依赖外部 CDN）
import '@fontsource/press-start-2p'
import './index.scss'

const app = createApp(App)

// SSO 授权码只有很短的有效期；仅在回跳时立即兑换，普通访问仍延迟恢复会话。
if (hasPendingSsoRedirect())
  void useYlfAuth().initAuth()

// Google Analytics（vue-gtag v3 API）
app.use(
  createGtag({
    tagId: 'G-XMGX6YJVP8',
  }),
)

app.mount('#app')

consoleAllInfo()
