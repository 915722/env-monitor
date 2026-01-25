<template>
  <div class="cesium-viewer-wrapper">
    <!-- Cesium 容器 -->
    <div id="cesiumContainer" ref="cesiumContainer" class="cesium-container"></div>

    <!-- 底图切换控制面板（右上角） -->
    <div class="basemap-control">
      <el-dropdown @command="handleBaseMapChange" trigger="click">
        <el-button type="primary" size="small">
          <span style="margin-left: 6px;">🗺️ {{ currentBaseMapLabel }}</span>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              v-for="(config, key) in BASE_MAP_CONFIGS"
              :key="key"
              :command="config.type"
              :disabled="config.requiresToken && !hasToken(config.type)"
            >
              <div class="basemap-item">
                <strong>{{ config.label }}</strong>
                <small style="display: block; color: #999;">{{ config.description }}</small>
                <el-tag v-if="config.requiresToken && !hasToken(config.type)" type="warning" size="small" style="margin-top: 4px;">
                  需要配置 Token
                </el-tag>
              </div>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- 加载提示 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner">⏳</div>
      <p>正在初始化三维场景...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, provide, computed } from 'vue'
import {
  Viewer,
  Ion,
  Cartesian3,
  Math as CesiumMath,
  UrlTemplateImageryProvider,
  ArcGisMapServerImageryProvider,
  Credit
} from 'cesium'
import { ElMessage, ElIcon } from 'element-plus'
import { useGlobalStore } from '@/store'
import {
  BASE_MAP_CONFIGS,
  DEFAULT_BASE_MAP,
  CESIUM_ION_TOKEN,
  TIANDITU_TOKEN,
  CHINA_VIEW,
  VIEWER_OPTIONS
} from './config'
import type { BaseMapType } from './types'

// ========== 状态管理 ==========
const globalStore = useGlobalStore()

// ========== 组件状态 ==========
const cesiumContainer = ref<HTMLDivElement>()
const loading = ref(true)
const currentBaseMap = ref<BaseMapType>(DEFAULT_BASE_MAP)

// Cesium Viewer 实例
let viewer: Viewer | null = null

// ========== 计算属性 ==========
const currentBaseMapLabel = computed(() => {
  return BASE_MAP_CONFIGS[currentBaseMap.value]?.label || '底图'
})

/**
 * 检查是否配置了对应的 Token
 */
const hasToken = (type: BaseMapType): boolean => {
  if (type === 'tianditu') return !!TIANDITU_TOKEN
  return true
}

// ========== 底图加载函数 ==========

/**
 * 加载 Cesium 默认底图（Cesium Ion）
 */
const loadDefaultBaseMap = () => {
  if (!viewer) return

  // 使用 Cesium Ion 默认影像（无需额外配置）
  // Viewer 创建时已自动加载
  console.log('✅ 使用 Cesium 默认底图')
}

/**
 * 加载天地图底图
 */
const loadTiandituBaseMap = () => {
  if (!viewer) return

  if (!TIANDITU_TOKEN) {
    ElMessage.warning('天地图需要配置 Token，请在 config.ts 中设置 TIANDITU_TOKEN')
    return
  }

  try {
    // 天地图影像底图
    const imageryLayer = new UrlTemplateImageryProvider({
      url: `https://t{s}.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={TileMatrix}&TILEROW={TileRow}&TILECOL={TileCol}&tk=${TIANDITU_TOKEN}`,
      subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
      credit: new Credit('天地图')
    })

    // 天地图注记图层
    const labelLayer = new UrlTemplateImageryProvider({
      url: `https://t{s}.tianditu.gov.cn/cia_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cia&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={TileMatrix}&TILEROW={TileRow}&TILECOL={TileCol}&tk=${TIANDITU_TOKEN}`,
      subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
      credit: new Credit('天地图注记')
    })

    // 移除旧图层
    viewer.imageryLayers.removeAll()

    // 添加新图层
    viewer.imageryLayers.addImageryProvider(imageryLayer)
    viewer.imageryLayers.addImageryProvider(labelLayer)

    console.log('✅ 天地图底图加载完成')
  } catch (error) {
    console.error('❌ 天地图加载失败:', error)
    ElMessage.error('天地图加载失败')
  }
}

/**
 * 加载 ArcGIS 底图
 */
const loadArcGISBaseMap = async () => {
  if (!viewer) return

  try {
    const imageryProvider = await ArcGisMapServerImageryProvider.fromUrl(
      'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
      {
        enablePickFeatures: false
      }
    )

    // 移除旧图层
    viewer.imageryLayers.removeAll()

    // 添加新图层
    viewer.imageryLayers.addImageryProvider(imageryProvider)

    console.log('✅ ArcGIS 底图加载完成')
  } catch (error) {
    console.error('❌ ArcGIS 底图加载失败:', error)
    ElMessage.error('ArcGIS 底图加载失败')
  }
}

/**
 * 切换底图
 */
const switchBaseMap = async (type: BaseMapType) => {
  currentBaseMap.value = type

  switch (type) {
    case 'default':
      loadDefaultBaseMap()
      break
    case 'tianditu':
      loadTiandituBaseMap()
      break
    case 'arcgis':
      await loadArcGISBaseMap()
      break
  }

  ElMessage.success(`已切换至：${BASE_MAP_CONFIGS[type].label}`)
}

/**
 * 底图切换处理
 */
const handleBaseMapChange = (command: BaseMapType) => {
  switchBaseMap(command)
}

// ========== Cesium 初始化 ==========

/**
 * 初始化 Cesium Viewer
 */
const initCesium = () => {
  if (!cesiumContainer.value) return

  try {
    // 设置 Cesium Ion Token（如果有）
    if (CESIUM_ION_TOKEN) {
      Ion.defaultAccessToken = CESIUM_ION_TOKEN
    }

    // 创建 Viewer 实例
    viewer = new Viewer(cesiumContainer.value, VIEWER_OPTIONS)

    // 设置初始相机视角（中国区域）
    viewer.camera.setView({
      destination: Cartesian3.fromDegrees(
        CHINA_VIEW.longitude,
        CHINA_VIEW.latitude,
        CHINA_VIEW.height
      ),
      orientation: {
        heading: CesiumMath.toRadians(CHINA_VIEW.heading || 0),
        pitch: CesiumMath.toRadians(CHINA_VIEW.pitch || -90),
        roll: CesiumMath.toRadians(CHINA_VIEW.roll || 0)
      }
    })

    // 隐藏 Cesium Logo 和版权信息（根据需要）
    const creditContainer = viewer.cesiumWidget.creditContainer as HTMLElement
    if (creditContainer) {
      creditContainer.style.display = 'none'
    }

    // 保存到全局状态
    globalStore.setCesiumViewer(viewer)

    // 通过 provide 提供给子组件
    provide('cesiumViewer', viewer)

    console.log('✅ Cesium Viewer 初始化成功')
    loading.value = false

    // 加载默认底图
    loadDefaultBaseMap()
  } catch (error) {
    console.error('❌ Cesium 初始化失败:', error)
    ElMessage.error('三维场景初始化失败')
    loading.value = false
  }
}

/**
 * 定位到中国区域
 */
const flyToChina = () => {
  if (!viewer) return

  viewer.camera.flyTo({
    destination: Cartesian3.fromDegrees(
      CHINA_VIEW.longitude,
      CHINA_VIEW.latitude,
      CHINA_VIEW.height
    ),
    orientation: {
      heading: CesiumMath.toRadians(CHINA_VIEW.heading || 0),
      pitch: CesiumMath.toRadians(CHINA_VIEW.pitch || -90),
      roll: CesiumMath.toRadians(CHINA_VIEW.roll || 0)
    },
    duration: 2 // 飞行时间 2 秒
  })
}

// ========== 生命周期 ==========

onMounted(() => {
  initCesium()
})

onUnmounted(() => {
  if (viewer) {
    viewer.destroy()
    viewer = null
  }
  globalStore.setCesiumViewer(null)
})

// ========== 暴露方法给父组件 ==========
defineExpose({
  viewer,
  flyToChina,
  switchBaseMap
})
</script>

<style scoped>
.cesium-viewer-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

.cesium-container {
  width: 100%;
  height: 100%;
}

/* 底图切换控制 */
.basemap-control {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 100;
}

.basemap-item {
  padding: 4px 0;
  min-width: 200px;
}

.basemap-item strong {
  font-size: 14px;
  color: #333;
}

.basemap-item small {
  font-size: 12px;
  margin-top: 2px;
}

/* 加载遮罩 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  z-index: 1000;
}

.loading-overlay p {
  margin-top: 16px;
  font-size: 16px;
}

.loading-spinner {
  font-size: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 隐藏 Cesium 默认控件样式优化 */
:deep(.cesium-viewer-bottom) {
  display: none !important;
}

:deep(.cesium-viewer-toolbar) {
  top: 16px;
  right: 16px;
}
</style>

