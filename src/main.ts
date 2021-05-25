import { createApp } from "vue";
import App from "./App.vue";
import { consoleAllInfo } from "./lib/console";

import "./index.scss";

createApp(App).mount("#app");
consoleAllInfo();
