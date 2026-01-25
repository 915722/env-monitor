/**
 * 应用入口文件
 */
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'cesium/Build/Cesium/Widgets/widgets.css'

import App from './App.vue'
import './styles/index.css'

// 创建 Vue 应用实例
const app = createApp(App)

// 安装 Pinia 状态管理
app.use(createPinia())

// 安装 Element Plus UI 框架
app.use(ElementPlus)

// 挂载应用
app.mount('#app')

console.log('🚀 环境监测三维可视化平台已启动')

