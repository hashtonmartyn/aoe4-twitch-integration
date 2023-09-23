import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import axios from "axios";
import PrimeVue from 'primevue/config';
import "primevue/resources/themes/bootstrap4-dark-blue/theme.css";
import "primeflex/primeflex.css"
import 'primeicons/primeicons.css';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import config from "./config";
import Chart from 'chart.js/auto'
import axiosRetry from 'axios-retry';


const app = createApp(App)

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(pinia)
app.use(router)
app.use(PrimeVue)

Chart.defaults.color = "#FFF"
Chart.defaults.borderColor = "#FFF"

axiosRetry(axios, { retryDelay: (retryCount) => {
  return retryCount * retryCount * 1000
}});

axios.defaults.baseURL = config.backendApiBaseUri;  // the FastAPI backend

app.mount('#app')
