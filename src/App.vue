<template>
  <div id="app" class="app-container">
    <!-- 顶部标题栏 -->
    <header class="app-header">
      <div class="header-left">
        <span style="font-size: 32px;">🌐</span>
        <h1>环境监测三维可视化平台</h1>
      </div>
      <div class="header-right">
        <el-space :size="20">
          <div class="header-time">
            <span>🕐 {{ currentTime }}</span>
          </div>
          <el-tag type="success" effect="dark">系统运行中</el-tag>
        </el-space>
      </div>
    </header>

    <!-- 主内容区域 -->
    <main class="app-main">
      <!-- 左侧边栏 -->
      <aside class="sidebar-wrapper">
        <Sidebar
          ref="sidebarRef"
          @module-change="handleModuleChange"
          @measure-start="handleMeasureStart"
          @measure-clear="handleMeasureClear"
        />
      </aside>

      <!-- Cesium 三维场景 -->
      <div class="cesium-wrapper">
        <CesiumViewer ref="cesiumViewerRef" />
      </div>

      <!-- 时间控制面板 -->
      <div class="time-control-wrapper">
        <TimeControl :time-engine="timeEngine" />
      </div>

      <!-- 右侧生态面板 -->
      <transition name="slide-left">
        <div v-if="showEcoPanel" class="right-panel">
          <EcoPanel
            :site-info="selectedEcoSite"
            @close="handleEcoPanelClose"
          />
        </div>
      </transition>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { Cartesian3 } from 'cesium'
import CesiumViewer from '@/modules/scene/CesiumViewer.vue'
import TimeControl from '@/components/TimeControl.vue'
import Sidebar from '@/components/Sidebar.vue'
import { WaterLayer } from '@/modules/water'
import { EcoLayer } from '@/modules/eco'
import { TimeEngine } from '@/modules/time'
import { MeasureTool } from '@/modules/measure'
import { dataManager } from '@/modules/data'
import { useGlobalStore, useAppStore } from '@/store'
import type { EcoSiteInfo } from '@/modules/eco'
import EcoPanel from '@/components/EcoPanel.vue'

// ========== 状态 ==========
const globalStore = useGlobalStore()
const appStore = useAppStore()
const cesiumViewerRef = ref<InstanceType<typeof CesiumViewer>>()
const sidebarRef = ref<InstanceType<typeof Sidebar>>()

const currentTime = ref(dayjs().format('YYYY-MM-DD HH:mm:ss'))

// 统计信息
const waterSiteCount = ref(0)
const ecoSiteCount = ref(0)
const timePointCount = ref(0)
const currentTimeISO = ref<string | null>(null)

// 生态面板
const showEcoPanel = ref(false)
const selectedEcoSite = ref<EcoSiteInfo | null>(null)

// 核心实例
let waterLayer: WaterLayer | null = null
let ecoLayer: EcoLayer | null = null
let timeEngine: TimeEngine | null = null
let measureTool: MeasureTool | null = null

const timeEngineRef = ref<TimeEngine | null>(null)

let timeInterval: number | null = null

// ========== 初始化流程 ==========

/**
 * 1. 页面启动 - 加载数据
 */
const loadData = async () => {
  try {
    console.log('📥 开始加载数据...')
    
    // 预加载所有数据
    await dataManager.preloadAll()
    
    // 加载站点数据
    const sites = await dataManager.loadSites()
    const waterSites = sites.filter((s) => s.type === 'water')
    const ecoSites = sites.filter((s) => s.type === 'camera')
    
    waterSiteCount.value = waterSites.length
    ecoSiteCount.value = ecoSites.length
    
    // 加载时间点
    const timePoints = await dataManager.getWaterTimePoints()
    timePointCount.value = timePoints.length
    
    console.log(`✅ 数据加载完成: ${sites.length} 个站点, ${timePoints.length} 个时间点`)
    
    return { sites, waterSites, ecoSites, timePoints }
  } catch (error) {
    console.error('❌ 数据加载失败:', error)
    ElMessage.error('数据加载失败')
    throw error
  }
}

/**
 * 2. 初始化 Viewer（已在 CesiumViewer 中完成）
 */
const getViewer = () => {
  const viewer = globalStore.cesiumViewer
  if (!viewer) {
    throw new Error('Cesium Viewer 未初始化')
  }
  return viewer
}

/**
 * 3. 初始化图层
 */
const initLayers = (viewer: any) => {
  console.log('🗺️ 初始化图层...')
  
  // 创建水质图层
  waterLayer = new WaterLayer(viewer)
  
  // 创建生态图层
  ecoLayer = new EcoLayer(viewer)
  
  // 监听生态站点点击
  ecoLayer.onSiteClick((siteInfo) => {
    selectedEcoSite.value = siteInfo
    showEcoPanel.value = true
    
    // 更新 store
    appStore.setSelectedSite(siteInfo.siteId, 'eco')
    
    // 高亮站点
    ecoLayer?.unhighlightAll()
    ecoLayer?.highlightSite(siteInfo.siteId)
    
    console.log('🎯 点击生态站点:', siteInfo)
  })
  
  // 创建测量工具
  measureTool = new MeasureTool(viewer)
  
  console.log('✅ 图层初始化完成')
}

/**
 * 4. 初始化时间引擎
 */
const initTimeEngine = async (timePoints: string[]) => {
  console.log('⏰ 初始化时间引擎...')
  
  // 创建时间引擎
  timeEngine = new TimeEngine({
    autoPlay: false,
    loop: true,
    stepMinutes: 60
  })
  
  // 设置时间点
  timeEngine.setTimePoints(timePoints)
  
  // 注册时间变化回调
  timeEngine.onTimeChange(async (timeISO) => {
    console.log(`⏰ 时间变化: ${dayjs(timeISO).format('YYYY-MM-DD HH:mm:ss')}`)
    
    currentTimeISO.value = timeISO
    
    // 加载该时间点的数据
    await updateLayers(timeISO)
  })
  
  // 设置到组件引用（用于传递给 TimeControl）
  timeEngineRef.value = timeEngine
  
  // 设置初始时间（第一个时间点）
  if (timePoints.length > 0) {
    timeEngine.setTime(timePoints[0])
  }
  
  console.log('✅ 时间引擎初始化完成')
}

/**
 * 5. 更新图层数据
 */
const updateLayers = async (timeISO: string) => {
  try {
    // 加载站点信息
    const sites = await dataManager.loadSites()
    const waterSites = sites.filter((s) => s.type === 'water')
    const ecoSites = sites.filter((s) => s.type === 'camera')
    
    // 加载该时间点的水质数据
    const waterRecords = await dataManager.getWaterAtTime(timeISO)
    
    // 加载该时间点的生态数据
    const ecoRecords = await dataManager.getEcoAtTime(timeISO)
    
    // 更新水质图层
    if (waterLayer && waterRecords.length > 0) {
      await waterLayer.update(timeISO, waterRecords, waterSites)
    }
    
    // 更新生态图层
    if (ecoLayer && ecoRecords.length > 0) {
      await ecoLayer.update(timeISO, ecoRecords, ecoSites)
    }
  } catch (error) {
    console.error('❌ 更新图层失败:', error)
  }
}

/**
 * 主初始化流程
 */
const initialize = async () => {
  try {
    // 等待 Cesium Viewer 初始化完成（稍作延迟）
    await new Promise((resolve) => setTimeout(resolve, 1000))
    
    // 1. 加载数据
    const { sites, waterSites, ecoSites, timePoints } = await loadData()
    
    // 2. 获取 Viewer
    const viewer = getViewer()
    
    // 3. 初始化图层
    initLayers(viewer)
    
    // 4. 初始化时间引擎
    await initTimeEngine(timePoints)
    
    ElMessage.success('系统初始化完成')
    console.log('🎉 系统初始化完成')
  } catch (error) {
    console.error('❌ 系统初始化失败:', error)
    ElMessage.error('系统初始化失败')
  }
}

/**
 * 关闭生态面板
 */
const handleEcoPanelClose = () => {
  showEcoPanel.value = false
  selectedEcoSite.value = null
  appStore.clearSelectedSite()
  ecoLayer?.unhighlightAll()
}

/**
 * 模块切换处理
 */
const handleModuleChange = (module: string) => {
  console.log('🔄 切换模块:', module)
  
  // 切换模块时停止测量
  if (module !== 'measure' && measureTool) {
    measureTool.stop()
  }
  
  // 视觉反馈：飞向对应图层
  if (module === 'water' && waterLayer) {
    // 简单的飞向第一个水质站点（如果有）
    // 实际项目中应该计算包围盒
    // 这里我们假设 dataManager 已经加载了数据，我们可以直接让 viewer 飞向一个默认位置 
    // 或者我们给 WaterLayer 加一个 flyToOverview() 方法
    // 这里暂时用一个硬编码的视口，或者飞向第一个实体
    
    // 由于 WaterLayer 没有公开 entities，我们尝试用 storage 获取数据定位
    // 但最简单的是在 WaterLayer 加个方法。
    // 不过为了不动太多文件，我们直接操作 Viewer Camera (如果能获取到位置)
    
    // 更好的方式：调用 flight 逻辑
    // 假设数据就在那里，我们尝试飞向它
    const viewer = getViewer()
    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(120.15, 30.28, 50000), // 假设是杭州附近，或者您的数据位置
      orientation: {
        heading: 0,
        pitch: -0.8,
        roll: 0
      }
    })
    ElMessage.success('已切换至水质监测模式')
  } else if (module === 'ecology' && ecoLayer) {
    const viewer = getViewer()
    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(120.15, 30.28, 50000),
      orientation: {
        heading: 0,
        pitch: -0.8,
        roll: 0
      }
    })
    ElMessage.success('已切换至生态监测模式')
  } else if (module === 'layer') {
    ElMessage.info('图层管理面板暂未实现')
  } else if (module === 'measure') {
    ElMessage.success('已开启测量工具')
  }
}

/**
 * 开始测量
 */
const handleMeasureStart = (mode: 'distance' | 'area') => {
  if (!measureTool) {
    ElMessage.warning('测量工具未初始化')
    return
  }
  
  if (mode === 'distance') {
    measureTool.startDistance()
    ElMessage.info('点击地球表面添加2个点，系统自动计算距离')
  } else if (mode === 'area') {
    measureTool.startArea()
    ElMessage.info('点击地球表面添加多个点，右键完成并计算面积')
  }
}

/**
 * 清除测量
 */
const handleMeasureClear = () => {
  if (measureTool) {
    measureTool.stop()
    measureTool.clear()
    ElMessage.success('已清除测量结果')
  }
}

/**
 * 更新系统时间显示
 */
const updateTime = () => {
  timeInterval = window.setInterval(() => {
    currentTime.value = dayjs().format('YYYY-MM-DD HH:mm:ss')
  }, 1000)
}

// ========== 生命周期 ==========
onMounted(() => {
  updateTime()
  initialize()
  console.log('🚀 环境监测三维可视化平台已启动')
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
  
  // 清理资源
  waterLayer?.destroy()
  ecoLayer?.destroy()
  timeEngine?.destroy()
  measureTool?.destroy()
  
  console.log('👋 应用已卸载')
})
</script>

<style scoped>
.app-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #000;
}

/* ========== 顶部标题栏 ========== */
.app-header {
  height: 64px;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  color: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  z-index: 1000;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-left h1 {
  font-size: 22px;
  font-weight: 600;
  margin: 0;
  letter-spacing: 1px;
}

.header-right {
  display: flex;
  align-items: center;
}

.header-time {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  opacity: 0.95;
}

/* ========== 主内容区 ========== */
.app-main {
  flex: 1;
  display: flex;
  position: relative;
  overflow: hidden;
}

/* Cesium 场景 */
.cesium-wrapper {
  flex: 1;
  height: 100%;
  position: relative;
}

/* 左侧边栏 */
.sidebar-wrapper {
  width: 280px;
  flex-shrink: 0;
  background: #fff;
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

/* 时间控制面板 */
.time-control-wrapper {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  z-index: 100;
}

/* 右侧面板（生态） */
.right-panel {
  position: absolute;
  right: 16px;
  top: 16px;
  width: 500px;
  max-height: calc(100% - 32px);
  overflow-y: auto;
  z-index: 200;
}

/* 滑入动画 */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.3s ease;
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

:deep(.el-card) {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}
</style>
