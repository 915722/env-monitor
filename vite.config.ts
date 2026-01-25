import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import cesium from 'vite-plugin-cesium'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  // GitHub Pages 部署配置 - 由 GitHub Actions 在部署时处理
  base: '/env-monitor/',
  
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
          'echarts-vendor': ['echarts']
        }
      }
    }
  }
})

