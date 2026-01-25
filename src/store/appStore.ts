/**
 * 应用状态管理 - Pinia Store
 * 管理应用级别的全局状态
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 应用模式类型
 */
export type AppMode = 'water' | 'eco' | null

/**
 * 应用状态 Store
 */
export const useAppStore = defineStore('app', () => {
  // ========== 图层可见性 ==========
  
  /**
   * 水质图层是否可见
   */
  const waterLayerVisible = ref(true)

  /**
   * 生态图层是否可见
   */
  const ecoLayerVisible = ref(true)

  // ========== 时间状态 ==========

  /**
   * 当前选择的时间（ISO 8601格式）
   */
  const currentTimeISO = ref<string | null>(null)

  /**
   * 是否正在播放时间轴
   */
  const isPlaying = ref(false)

  /**
   * 播放速度（毫秒/帧）
   */
  const playSpeed = ref(2000)

  // ========== 应用模式 ==========

  /**
   * 当前应用模式
   * - 'water': 水质监测模式
   * - 'eco': 生态监测模式
   * - null: 无模式（默认状态）
   */
  const currentMode = ref<AppMode>(null)

  // ========== 侧边栏状态 ==========

  /**
   * 侧边栏是否展开
   */
  const sidebarExpanded = ref(true)

  /**
   * 当前展开的面板
   */
  const activePanel = ref<string | null>(null)

  // ========== 选中站点 ==========

  /**
   * 当前选中的站点ID
   */
  const selectedSiteId = ref<string | null>(null)

  /**
   * 当前选中的站点类型
   */
  const selectedSiteType = ref<'water' | 'eco' | null>(null)

  // ========== 计算属性 ==========

  /**
   * 是否处于水质监测模式
   */
  const isWaterMode = computed(() => currentMode.value === 'water')

  /**
   * 是否处于生态监测模式
   */
  const isEcoMode = computed(() => currentMode.value === 'eco')

  /**
   * 是否有选择的时间
   */
  const hasSelectedTime = computed(() => currentTimeISO.value !== null)

  /**
   * 是否有选中的站点
   */
  const hasSelectedSite = computed(() => selectedSiteId.value !== null)

  /**
   * 格式化的当前时间（用于显示）
   */
  const formattedTime = computed(() => {
    if (!currentTimeISO.value) return '--'
    try {
      return new Date(currentTimeISO.value).toLocaleString('zh-CN')
    } catch {
      return '--'
    }
  })

  // ========== 图层可见性操作 ==========

  /**
   * 设置水质图层可见性
   */
  const setWaterLayerVisible = (visible: boolean) => {
    waterLayerVisible.value = visible
  }

  /**
   * 设置生态图层可见性
   */
  const setEcoLayerVisible = (visible: boolean) => {
    ecoLayerVisible.value = visible
  }

  /**
   * 切换水质图层可见性
   */
  const toggleWaterLayer = () => {
    waterLayerVisible.value = !waterLayerVisible.value
  }

  /**
   * 切换生态图层可见性
   */
  const toggleEcoLayer = () => {
    ecoLayerVisible.value = !ecoLayerVisible.value
  }

  /**
   * 显示所有图层
   */
  const showAllLayers = () => {
    waterLayerVisible.value = true
    ecoLayerVisible.value = true
  }

  /**
   * 隐藏所有图层
   */
  const hideAllLayers = () => {
    waterLayerVisible.value = false
    ecoLayerVisible.value = false
  }

  // ========== 时间操作 ==========

  /**
   * 设置当前时间
   */
  const setCurrentTime = (timeISO: string | null) => {
    currentTimeISO.value = timeISO
  }

  /**
   * 清除当前时间
   */
  const clearCurrentTime = () => {
    currentTimeISO.value = null
  }

  /**
   * 设置播放状态
   */
  const setPlaying = (playing: boolean) => {
    isPlaying.value = playing
  }

  /**
   * 设置播放速度
   */
  const setPlaySpeed = (speed: number) => {
    playSpeed.value = speed
  }

  // ========== 模式操作 ==========

  /**
   * 设置应用模式
   */
  const setMode = (mode: AppMode) => {
    currentMode.value = mode
    console.log(`🔄 切换到模式: ${mode || '默认'}`)
  }

  /**
   * 切换到水质监测模式
   */
  const enterWaterMode = () => {
    setMode('water')
    // 自动显示水质图层，隐藏生态图层
    waterLayerVisible.value = true
    ecoLayerVisible.value = false
  }

  /**
   * 切换到生态监测模式
   */
  const enterEcoMode = () => {
    setMode('eco')
    // 自动显示生态图层，隐藏水质图层
    waterLayerVisible.value = false
    ecoLayerVisible.value = true
  }

  /**
   * 退出当前模式（回到默认状态）
   */
  const exitMode = () => {
    setMode(null)
    // 显示所有图层
    showAllLayers()
    // 清除时间选择
    clearCurrentTime()
  }

  // ========== 侧边栏操作 ==========

  /**
   * 切换侧边栏展开状态
   */
  const toggleSidebar = () => {
    sidebarExpanded.value = !sidebarExpanded.value
  }

  /**
   * 设置活动面板
   */
  const setActivePanel = (panel: string | null) => {
    activePanel.value = panel
  }

  // ========== 站点选择操作 ==========

  /**
   * 设置选中的站点
   */
  const setSelectedSite = (siteId: string | null, siteType?: 'water' | 'eco') => {
    selectedSiteId.value = siteId
    selectedSiteType.value = siteType || null
    console.log('🎯 选中站点:', siteId, siteType)
  }

  /**
   * 清除选中的站点
   */
  const clearSelectedSite = () => {
    selectedSiteId.value = null
    selectedSiteType.value = null
  }

  // ========== 重置操作 ==========

  /**
   * 重置所有状态
   */
  const resetAll = () => {
    waterLayerVisible.value = true
    ecoLayerVisible.value = true
    currentTimeISO.value = null
    isPlaying.value = false
    playSpeed.value = 2000
    currentMode.value = null
    activePanel.value = null
    selectedSiteId.value = null
    selectedSiteType.value = null
    console.log('🔄 应用状态已重置')
  }

  return {
    // 状态
    waterLayerVisible,
    ecoLayerVisible,
    currentTimeISO,
    isPlaying,
    playSpeed,
    currentMode,
    sidebarExpanded,
    activePanel,
    selectedSiteId,
    selectedSiteType,

    // 计算属性
    isWaterMode,
    isEcoMode,
    hasSelectedTime,
    hasSelectedSite,
    formattedTime,

    // 方法
    setWaterLayerVisible,
    setEcoLayerVisible,
    toggleWaterLayer,
    toggleEcoLayer,
    showAllLayers,
    hideAllLayers,
    setCurrentTime,
    clearCurrentTime,
    setPlaying,
    setPlaySpeed,
    setMode,
    enterWaterMode,
    enterEcoMode,
    exitMode,
    toggleSidebar,
    setActivePanel,
    setSelectedSite,
    clearSelectedSite,
    resetAll
  }
})

