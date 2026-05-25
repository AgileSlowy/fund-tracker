import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import "./styles/global.css";

const savedTheme = localStorage.getItem("fund_theme") || "light";
document.documentElement.dataset.theme = savedTheme;

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.mount("#app");
