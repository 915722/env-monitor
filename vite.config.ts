import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import cesium from 'vite-plugin-cesium'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  // GitHub Pages 部署配置
  // 如果部署到 https://<USERNAME>.github.io/<REPO>/
  // 则设置 base 为 '/<REPO>/'
  // 如果部署到自定义域名或根路径，设置为 '/'
  base: process.env.NODE_ENV === 'production' ? '/env-monitor/' : '/',
  
  plugins: [
    vue(),
    cesium() // Cesium 静态资源自动处理
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 5173,
    open: true
  },
  build: {
    // Cesium 打包优化
    chunkSizeWarningLimit: 5000,
    rollupOptions: {
      output: {
        manualChunks: {
          'cesium-vendor': ['cesium'],
          'echarts-vendor': ['echarts']
        }
      }
    }
  }
})

