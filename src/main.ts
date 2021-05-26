import { createApp } from "vue";
import App from "./App.vue";
import { consoleAllInfo } from "./lib/console";

import VueGtag from "vue-gtag";

import "./index.scss";

const app = createApp(App);
app.use(VueGtag, {
  config: {
    id: "G-XMGX6YJVP8",
  },
});
app.mount("#app");

consoleAllInfo();
