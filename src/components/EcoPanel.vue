<template>
  <div class="eco-panel">
    <el-card class="panel-card">
      <template #header>
        <div class="panel-header">
          <div class="header-left">
            <span>📷 {{ siteInfo?.siteName || '生态监测站' }}</span>
          </div>
          <el-button type="text" @click="handleClose">✖</el-button>
        </div>
      </template>

      <div v-loading="loading" class="panel-content">
        <!-- 快照图片 -->
        <div class="media-section">
          <h4>实时快照</h4>
          <div v-if="siteInfo?.snapshotUrl" class="snapshot">
            <el-image
              :src="siteInfo.snapshotUrl"
              fit="cover"
              style="width: 100%; border-radius: 8px;"
              :preview-src-list="[siteInfo.snapshotUrl]"
            >
              <template #error>
                <div class="image-placeholder">
                  <el-icon><Picture /></el-icon>
                  <span>图片加载失败</span>
                </div>
              </template>
            </el-image>
          </div>
          <div v-else class="image-placeholder">
            <el-icon><Picture /></el-icon>
            <span>暂无快照</span>
          </div>
        </div>

        <!-- 视频播放 -->
        <div v-if="siteInfo?.videoUrl" class="media-section">
          <h4>监控视频</h4>
          <video
            :src="siteInfo.videoUrl"
            controls
            class="video-player"
            @error="handleVideoError"
          >
            您的浏览器不支持视频播放
          </video>
        </div>

        <!-- 当前数据统计 -->
        <div class="stats-section">
          <h4>当前数据</h4>
          <el-row :gutter="12">
            <el-col :span="8">
              <div class="stat-card birds">
                <div class="stat-icon">🦅</div>
                <div class="stat-value">{{ siteInfo?.birds || 0 }}</div>
                <div class="stat-label">鸟类</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="stat-card fish">
                <div class="stat-icon">🐟</div>
                <div class="stat-value">{{ siteInfo?.fish || 0 }}</div>
                <div class="stat-label">鱼类</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="stat-card total">
                <div class="stat-icon">📊</div>
                <div class="stat-value">{{ siteInfo?.totalCount || 0 }}</div>
                <div class="stat-label">总计</div>
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 时间粒度选择 -->
        <div class="granularity-section">
          <h4>统计周期</h4>
          <el-radio-group v-model="granularity" @change="handleGranularityChange" size="small">
            <el-radio-button label="day">�?/el-radio-button>
            <el-radio-button label="week">�?/el-radio-button>
            <el-radio-button label="month">�?/el-radio-button>
          </el-radio-group>
        </div>

        <!-- 当天数量柱状�?-->
        <div class="chart-section">
          <h4>{{ granularityText }}生物数量</h4>
          <div ref="barChartRef" class="chart"></div>
        </div>

        <!-- 趋势折线�?-->
        <div class="chart-section">
          <h4>数量变化趋势</h4>
          <div ref="lineChartRef" class="chart"></div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { dataManager } from '@/modules/data'
import type { EcoRecord } from '@/modules/data'
import type { EcoSiteInfo, TimeGranularity } from '@/modules/eco'
import dayjs from 'dayjs'

// ========== Props & Emits ==========
interface Props {
  siteInfo: EcoSiteInfo | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

// ========== 状�?==========
const loading = ref(false)
const granularity = ref<TimeGranularity>('day')
const historyData = ref<EcoRecord[]>([])

// Chart 引用
const barChartRef = ref<HTMLDivElement>()
const lineChartRef = ref<HTMLDivElement>()

let barChart: echarts.ECharts | null = null
let lineChart: echarts.ECharts | null = null

// ========== 计算属�?==========

/**
 * 粒度文本
 */
const granularityText = computed(() => {
  const map = {
    day: '当日',
    week: '本周',
    month: '本月'
  }
  return map[granularity.value]
})

// ========== 方法 ==========

/**
 * 加载历史数据
 */
const loadHistoryData = async () => {
  if (!props.siteInfo) return

  loading.value = true
  try {
    // 加载所有生态数�?
    const allData = await dataManager.loadEcoCount()

    // 筛选当前站点的数据
    historyData.value = allData
      .filter((d) => d.siteId === props.siteInfo!.siteId)
      .sort((a, b) => new Date(a.timeISO).getTime() - new Date(b.timeISO).getTime())

    console.log(`📊 加载�?${historyData.value.length} 条历史数据`)

    // 渲染图表
    renderCharts()
  } catch (error) {
    console.error('�?加载历史数据失败:', error)
  } finally {
    loading.value = false
  }
}

/**
 * 数据聚合（按时间粒度�?
 */
const aggregateData = () => {
  if (historyData.value.length === 0) return []

  const grouped: Record<string, EcoRecord[]> = {}

  historyData.value.forEach((record) => {
    let key: string

    switch (granularity.value) {
      case 'day':
        key = dayjs(record.timeISO).format('YYYY-MM-DD')
        break
      case 'week':
        key = dayjs(record.timeISO).format('YYYY-[W]WW')
        break
      case 'month':
        key = dayjs(record.timeISO).format('YYYY-MM')
        break
    }

    if (!grouped[key]) {
      grouped[key] = []
    }
    grouped[key].push(record)
  })

  // 计算每组的总和
  return Object.entries(grouped).map(([key, records]) => {
    const birds = records.reduce((sum, r) => sum + r.birds, 0)
    const fish = records.reduce((sum, r) => sum + (r.fish || 0), 0)

    return {
      date: key,
      birds: birds,
      fish: fish,
      total: birds + fish
    }
  })
}

/**
 * 渲染图表
 */
const renderCharts = () => {
  const aggregated = aggregateData()

  if (aggregated.length === 0) {
    console.warn('⚠️ 无数据可渲染')
    return
  }

  renderBarChart(aggregated)
  renderLineChart(aggregated)
}

/**
 * 渲染柱状图（当天/当周/当月数量�?
 */
const renderBarChart = (data: any[]) => {
  if (!barChartRef.value) return

  if (!barChart) {
    barChart = echarts.init(barChartRef.value)
  }

  // 取最新的数据�?
  const latest = data[data.length - 1]

  const option: EChartsOption = {
    grid: {
      left: 50,
      right: 20,
      top: 30,
      bottom: 40
    },
    xAxis: {
      type: 'category',
      data: ['鸟类', '鱼类', '总计'],
      axisLabel: {
        fontSize: 12
      }
    },
    yAxis: {
      type: 'value',
      name: '数量',
      nameTextStyle: {
        fontSize: 12
      }
    },
    series: [
      {
        name: '数量',
        type: 'bar',
        data: [
          { value: latest.birds, itemStyle: { color: '#ff9800' } },
          { value: latest.fish, itemStyle: { color: '#2196f3' } },
          { value: latest.total, itemStyle: { color: '#4caf50' } }
        ],
        label: {
          show: true,
          position: 'top',
          fontSize: 14,
          fontWeight: 'bold'
        },
        barWidth: '40%'
      }
    ],
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const data = params[0]
        return `${data.name}: <strong>${data.value}</strong>`
      }
    }
  }

  barChart.setOption(option)
}

/**
 * 渲染折线图（趋势�?
 */
const renderLineChart = (data: any[]) => {
  if (!lineChartRef.value) return

  if (!lineChart) {
    lineChart = echarts.init(lineChartRef.value)
  }

  const dates = data.map((d) => formatDate(d.date))
  const birdsData = data.map((d) => d.birds)
  const fishData = data.map((d) => d.fish)

  const option: EChartsOption = {
    grid: {
      left: 50,
      right: 20,
      top: 50,
      bottom: 40
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: {
        fontSize: 11,
        rotate: 15
      }
    },
    yAxis: {
      type: 'value',
      name: '数量',
      nameTextStyle: {
        fontSize: 12
      }
    },
    legend: {
      data: ['鸟类', '鱼类'],
      top: 10
    },
    series: [
      {
        name: '鸟类',
        type: 'line',
        data: birdsData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          width: 3,
          color: '#ff9800'
        },
        itemStyle: {
          color: '#ff9800'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(255, 152, 0, 0.3)' },
            { offset: 1, color: 'rgba(255, 152, 0, 0.05)' }
          ])
        }
      },
      {
        name: '鱼类',
        type: 'line',
        data: fishData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          width: 3,
          color: '#2196f3'
        },
        itemStyle: {
          color: '#2196f3'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(33, 150, 243, 0.3)' },
            { offset: 1, color: 'rgba(33, 150, 243, 0.05)' }
          ])
        }
      }
    ],
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        let result = `<strong>${params[0].axisValue}</strong><br/>`
        params.forEach((item: any) => {
          result += `${item.marker} ${item.seriesName}: <strong>${item.value}</strong><br/>`
        })
        return result
      }
    }
  }

  lineChart.setOption(option)
}

/**
 * 格式化日期显�?
 */
const formatDate = (dateStr: string): string => {
  if (granularity.value === 'week') {
    // 周格�? 2026-W03 -> �?�?
    const match = dateStr.match(/\d+-W(\d+)/)
    return match ? `�?{match[1]}周` : dateStr
  }
  if (granularity.value === 'month') {
    // 月格�? 2026-01 -> 1�?
    return dayjs(dateStr).format('M�?)
  }
  // 日格�? 2026-01-25 -> 01-25
  return dayjs(dateStr).format('MM-DD')
}

/**
 * 粒度变化处理
 */
const handleGranularityChange = () => {
  renderCharts()
}

/**
 * 视频加载失败处理
 */
const handleVideoError = () => {
  console.warn('⚠️ 视频加载失败')
}

/**
 * 关闭面板
 */
const handleClose = () => {
  emit('close')
}

/**
 * 窗口大小变化处理
 */
const handleResize = () => {
  barChart?.resize()
  lineChart?.resize()
}

// ========== 生命周期 ==========
onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  barChart?.dispose()
  lineChart?.dispose()
})

// ========== 监听 ==========
watch(
  () => props.siteInfo,
  (newVal) => {
    if (newVal) {
      loadHistoryData()
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.eco-panel {
  width: 100%;
  height: 100%;
}

.panel-card {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  max-height: calc(100vh - 100px);
  overflow-y: auto;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
}

.panel-content {
  min-height: 400px;
}

/* 媒体部分 */
.media-section {
  margin-bottom: 24px;
}

.media-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #606266;
  font-weight: 600;
}

.snapshot {
  border-radius: 8px;
  overflow: hidden;
}

.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  background: #f5f7fa;
  border-radius: 8px;
  color: #909399;
}

.image-placeholder .el-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.video-player {
  width: 100%;
  border-radius: 8px;
  background: #000;
}

/* 统计卡片 */
.stats-section {
  margin-bottom: 24px;
}

.stats-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #606266;
  font-weight: 600;
}

.stat-card {
  text-align: center;
  padding: 16px 12px;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stat-card.birds {
  background: linear-gradient(135deg, #ff9800 0%, #ff5722 100%);
}

.stat-card.fish {
  background: linear-gradient(135deg, #2196f3 0%, #03a9f4 100%);
}

.stat-card.total {
  background: linear-gradient(135deg, #4caf50 0%, #8bc34a 100%);
}

.stat-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  opacity: 0.9;
}

/* 粒度选择 */
.granularity-section {
  margin-bottom: 24px;
}

.granularity-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #606266;
  font-weight: 600;
}

/* 图表部分 */
.chart-section {
  margin-bottom: 24px;
}

.chart-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #606266;
  font-weight: 600;
}

.chart {
  width: 100%;
  height: 250px;
}
</style>

