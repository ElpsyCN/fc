import { createApp } from 'vue'
import { createGtag } from 'vue-gtag'
import App from './App.vue'
import { consoleAllInfo } from './lib/console'

// 复古像素字体（自托管，不依赖外部 CDN）
import '@fontsource/press-start-2p'
import './index.scss'

const app = createApp(App)

// Google Analytics（vue-gtag v3 API）
app.use(
  createGtag({
    tagId: 'G-XMGX6YJVP8',
  }),
)

app.mount('#app')

consoleAllInfo()
