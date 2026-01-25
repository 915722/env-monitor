import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import cesium from 'vite-plugin-cesium'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  // 开发环境使用根路径，生产环境使用 GitHub Pages 路径
  base: command === 'build' ? '/env-monitor/' : '/',
  
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
}))

