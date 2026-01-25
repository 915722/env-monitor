<template>
  <div class="water-module">
    <!-- 自定义弹窗 -->
    <WaterPopup
      :visible="popupVisible"
      :site-info="selectedSiteInfo"
      @close="handlePopupClose"
      @view-chart="handleViewChart"
    />

    <!-- 右侧图表面板 -->
    <transition name="slide-left">
      <div v-if="chartVisible" class="chart-panel-wrapper">
        <WaterChartPanel
          :site-id="appStore.selectedSiteId"
          @close="handleChartClose"
        />
      </div>
    </transition>

    <!-- 左侧控制面板 -->
    <div class="control-panel">
      <el-card>
        <template #header>
          <div class="panel-header">
            <el-icon><Droplet /></el-icon>
            <span>水质监测</span>
          </div>
        </template>

        <el-space direction="vertical" :size="16" style="width: 100%;">
          <!-- 时间选择 -->
          <div>
            <label class="control-label">选择时间：</label>
            <el-select
              v-model="selectedTime"
              placeholder="请选择时间"
              style="width: 100%;"
              @change="handleTimeChange"
            >
              <el-option
                v-for="time in timePoints"
                :key="time"
                :label="formatTime(time)"
                :value="time"
              />
            </el-select>
          </div>

          <!-- 操作按钮 -->
          <el-button
            type="primary"
            :loading="loading"
            style="width: 100%;"
            @click="loadWaterData"
          >
            <el-icon><RefreshRight /></el-icon>
            加载水质数据
          </el-button>

          <!-- 统计信息 -->
          <el-divider content-position="left">站点统计</el-divider>
          <el-descriptions :column="1" size="small" border>
            <el-descriptions-item label="站点数量">
              {{ siteCount }}
            </el-descriptions-item>
            <el-descriptions-item label="优良率">
              {{ goodRate }}
            </el-descriptions-item>
            <el-descriptions-item label="当前时间">
              {{ currentTimeDisplay }}
            </el-descriptions-item>
          </el-descriptions>

          <!-- 图例说明 -->
          <el-divider content-position="left">水质等级</el-divider>
          <div class="legend-list">
            <div v-for="item in legendItems" :key="item.grade" class="legend-item">
              <div class="legend-color" :style="{ background: item.color }"></div>
              <span>{{ item.text }}</span>
            </div>
          </div>

          <!-- 帮助提示 -->
          <el-alert
            title="提示"
            type="info"
            :closable="false"
            show-icon
          >
            点击地图上的水质站点查看详细信息
          </el-alert>
        </el-space>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, inject } from 'vue'

import { ElMessage } from 'element-plus'
import type { Viewer } from 'cesium'
import { WaterLayer } from './WaterLayer'
import WaterPopup from '@/components/WaterPopup.vue'
import WaterChartPanel from '@/components/WaterChartPanel.vue'
import { dataManager } from '@/modules/data'
import { useAppStore } from '@/store/appStore'
import type { WaterSiteInfo } from './types'
import type { WaterRecord } from '@/modules/data'
import dayjs from 'dayjs'

// ========== 状态 ==========
const appStore = useAppStore()
const viewer = inject<Viewer>('cesiumViewer')

const loading = ref(false)
const timePoints = ref<string[]>([])
const selectedTime = ref<string>('')
const siteCount = ref(0)
const currentData = ref<WaterRecord[]>([])

// 弹窗相关
const popupVisible = ref(false)
const selectedSiteInfo = ref<WaterSiteInfo | null>(null)

// 图表面板
const chartVisible = ref(false)

let waterLayer: WaterLayer | null = null

// ========== 计算属性 ==========

/**
 * 优良率（等级1-2的比例）
 */
const goodRate = computed(() => {
  if (currentData.value.length === 0) return '--'
  const goodCount = currentData.value.filter((d) => d.grade <= 2).length
  const rate = (goodCount / currentData.value.length) * 100
  return `${rate.toFixed(1)}%`
})

/**
 * 当前时间显示
 */
const currentTimeDisplay = computed(() => {
  if (!selectedTime.value) return '--'
  return dayjs(selectedTime.value).format('HH:mm:ss')
})

/**
 * 图例项
 */
const legendItems = [
  { grade: 1, color: '#0066ff', text: 'Ⅰ类 优' },
  { grade: 2, color: '#00cc66', text: 'Ⅱ类 良' },
  { grade: 3, color: '#ffcc00', text: 'Ⅲ类 中' },
  { grade: 4, color: '#ff6600', text: 'Ⅳ类 差' },
  { grade: 5, color: '#ff0000', text: 'Ⅴ类 劣' }
]

// ========== 方法 ==========

/**
 * 初始化
 */
const init = async () => {
  if (!viewer) {
    ElMessage.error('Cesium Viewer 未初始化')
    return
  }

  // 创建水质图层
  waterLayer = new WaterLayer(viewer)

  // 监听站点点击
  waterLayer.onSiteClick((siteInfo) => {
    selectedSiteInfo.value = siteInfo
    popupVisible.value = true

    // 更新 store
    appStore.setSelectedSite(siteInfo.siteId, 'water')

    // 高亮站点
    waterLayer?.unhighlightAll()
    waterLayer?.highlightSite(siteInfo.siteId)
  })

  // 加载时间点
  await loadTimePoints()

  // 自动加载第一个时间点的数据
  if (timePoints.value.length > 0) {
    selectedTime.value = timePoints.value[0]
    await loadWaterData()
  }
}

/**
 * 加载时间点列表
 */
const loadTimePoints = async () => {
  try {
    timePoints.value = await dataManager.getWaterTimePoints()
    console.log(`💧 加载了 ${timePoints.value.length} 个时间点`)
  } catch (error) {
    console.error('❌ 加载时间点失败', error)
    ElMessage.error('加载时间点失败')
  }
}

/**
 * 加载水质数据
 */
const loadWaterData = async () => {
  if (!selectedTime.value) {
    ElMessage.warning('请先选择时间')
    return
  }

  loading.value = true
  try {
    // 加载站点信息
    const sites = await dataManager.getSitesByType('water')

    // 加载该时间点的水质数据
    const waterRecords = await dataManager.getWaterAtTime(selectedTime.value)

    if (waterRecords.length === 0) {
      ElMessage.warning('该时间点无水质数据')
      return
    }

    // 渲染到地图
    waterLayer?.render(waterRecords, sites)

    // 更新统计
    siteCount.value = waterRecords.length
    currentData.value = waterRecords

    // 更新 store 中的时间
    appStore.setCurrentTime(selectedTime.value)

    ElMessage.success(`已加载 ${waterRecords.length} 个站点数据`)
  } catch (error) {
    console.error('❌ 加载水质数据失败:', error)
    ElMessage.error('加载水质数据失败')
  } finally {
    loading.value = false
  }
}

/**
 * 时间变化处理
 */
const handleTimeChange = () => {
  loadWaterData()
}

/**
 * 格式化时间
 */
const formatTime = (timeISO: string): string => {
  return dayjs(timeISO).format('YYYY-MM-DD HH:mm:ss')
}

/**
 * 关闭弹窗
 */
const handlePopupClose = () => {
  popupVisible.value = false
  waterLayer?.unhighlightAll()
}

/**
 * 查看图表
 */
const handleViewChart = (siteId: string) => {
  chartVisible.value = true
  appStore.setSelectedSite(siteId, 'water')
}

/**
 * 关闭图表
 */
const handleChartClose = () => {
  chartVisible.value = false
  appStore.clearSelectedSite()
}

// ========== 生命周期 ==========
onMounted(() => {
  init()
  console.log('💧 水质监测模块已加载')
})

onUnmounted(() => {
  waterLayer?.destroy()
  console.log('🗑️ 水质监测模块已卸载')
})
</script>

<style scoped>
.water-module {
  width: 100%;
  height: 100%;
  position: relative;
}

/* 左侧控制面板 */
.control-panel {
  position: fixed;
  left: 16px;
  top: 80px;
  width: 320px;
  z-index: 100;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
}

.control-label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  color: #606266;
  font-weight: 600;
}

/* 图例 */
.legend-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}

.legend-color {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* 右侧图表面板 */
.chart-panel-wrapper {
  position: fixed;
  right: 16px;
  top: 80px;
  width: 500px;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
  z-index: 200;
}

/* 动画 */
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
</style>

