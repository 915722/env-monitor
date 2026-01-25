/**
 * Pinia 状态管理 - 导出入口
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Viewer } from 'cesium'

/**
 * 全局状态 Store（Cesium 相关）
 */
export const useGlobalStore = defineStore('global', () => {
  // Cesium Viewer 实例（全局共享）
  const cesiumViewer = ref<Viewer | null>(null)

  // 当前激活的模块
  const activeModule = ref<'water' | 'ecology' | 'layer' | 'measure' | null>(null)

  // 侧边栏是否折叠
  const sidebarCollapsed = ref(false)

  // 设置 Cesium Viewer
  const setCesiumViewer = (viewer: Viewer | null) => {
    cesiumViewer.value = viewer
  }

  // 设置激活模块
  const setActiveModule = (module: typeof activeModule.value) => {
    activeModule.value = module
  }

  // 切换侧边栏折叠状态
  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  return {
    cesiumViewer,
    activeModule,
    sidebarCollapsed,
    setCesiumViewer,
    setActiveModule,
    toggleSidebar
  }
})

// 导出应用状态 Store
export { useAppStore } from './appStore'

