import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import router from './router'
import App from './App.vue'
import './styles/index.scss'

const app = createApp(App)

// Pinia
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)

// Router
app.use(router)

// Element Plus Icons - 按需注册
// 注意: 图标已通过 unplugin-vue-components 自动导入
// 如需全局注册特定图标,请在此处添加

app.mount('#app')
