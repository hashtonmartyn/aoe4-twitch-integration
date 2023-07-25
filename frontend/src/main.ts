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


const app = createApp(App)

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(pinia)
app.use(router)
app.use(PrimeVue)

axios.defaults.baseURL = 'http://localhost:8000/';  // the FastAPI backend

app.mount('#app')
