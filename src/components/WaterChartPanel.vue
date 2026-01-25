<template>
  <div class="water-chart-panel">
    <el-card>
      <template #header>
        <div class="chart-header">
          <div class="header-left">
            <el-icon><TrendCharts /></el-icon>
            <span>{{ siteName }} - 历史数据</span>
          </div>
          <el-button
            type="text"
            :icon="Close"
            @click="handleClose"
          />
        </div>
      </template>

      <div v-loading="loading" class="chart-content">
        <!-- pH 折线图 -->
        <div class="chart-item">
          <h4>pH 值趋势</h4>
          <div ref="phChartRef" class="chart"></div>
        </div>

        <!-- 溶解氧折线图 -->
        <div class="chart-item">
          <h4>溶解氧趋势</h4>
          <div ref="doChartRef" class="chart"></div>
        </div>

        <!-- 数据统计 -->
        <div class="chart-stats">
          <el-descriptions :column="2" size="small" border>
            <el-descriptions-item label="数据点数">
              {{ dataPoints.length }}
            </el-descriptions-item>
            <el-descriptions-item label="时间范围">
              {{ timeRange }}
            </el-descriptions-item>
            <el-descriptions-item label="pH 范围">
              {{ phRange }}
            </el-descriptions-item>
            <el-descriptions-item label="DO 范围">
              {{ doRange }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { Close, TrendCharts } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { dataManager } from '@/modules/data'
import type { WaterRecord } from '@/modules/data'
import dayjs from 'dayjs'

// ========== Props & Emits ==========
interface Props {
  siteId: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

// ========== 状态 ==========
const loading = ref(false)
const siteName = ref('')
const dataPoints = ref<WaterRecord[]>([])

// Chart 引用
const phChartRef = ref<HTMLDivElement>()
const doChartRef = ref<HTMLDivElement>()

let phChart: echarts.ECharts | null = null
let doChart: echarts.ECharts | null = null

// ========== 计算属性 ==========

/**
 * 时间范围
 */
const timeRange = computed(() => {
  if (dataPoints.value.length === 0) return '--'
  const times = dataPoints.value.map((d) => new Date(d.timeISO).getTime())
  const start = dayjs(Math.min(...times)).format('HH:mm')
  const end = dayjs(Math.max(...times)).format('HH:mm')
  return `${start} ~ ${end}`
})

/**
 * pH 范围
 */
const phRange = computed(() => {
  if (dataPoints.value.length === 0) return '--'
  const phs = dataPoints.value.map((d) => d.ph)
  const min = Math.min(...phs).toFixed(2)
  const max = Math.max(...phs).toFixed(2)
  return `${min} ~ ${max}`
})

/**
 * DO 范围
 */
const doRange = computed(() => {
  if (dataPoints.value.length === 0) return '--'
  const dos = dataPoints.value.map((d) => d.do)
  const min = Math.min(...dos).toFixed(2)
  const max = Math.max(...dos).toFixed(2)
  return `${min} ~ ${max} mg/L`
})

// ========== 方法 ==========

/**
 * 加载站点历史数据
 */
const loadData = async () => {
  if (!props.siteId) return

  loading.value = true
  try {
    // 加载所有水质数据
    const allData = await dataManager.loadWaterQuality()

    // 筛选当前站点的数据
    dataPoints.value = allData
      .filter((d) => d.siteId === props.siteId)
      .sort((a, b) => new Date(a.timeISO).getTime() - new Date(b.timeISO).getTime())

    // 获取站点名称
    if (dataPoints.value.length > 0) {
      siteName.value = dataPoints.value[0].siteName || props.siteId
    }

    // 渲染图表
    renderCharts()

    console.log(`📊 加载了 ${dataPoints.value.length} 条历史数据`)
  } catch (error) {
    console.error('❌ 加载历史数据失败:', error)
  } finally {
    loading.value = false
  }
}

/**
 * 渲染图表
 */
const renderCharts = () => {
  if (dataPoints.value.length === 0) return

  // 准备数据
  const times = dataPoints.value.map((d) => dayjs(d.timeISO).format('HH:mm'))
  const phValues = dataPoints.value.map((d) => d.ph)
  const doValues = dataPoints.value.map((d) => d.do)
  const grades = dataPoints.value.map((d) => d.grade)

  // 渲染 pH 图表
  renderPhChart(times, phValues, grades)

  // 渲染 DO 图表
  renderDoChart(times, doValues, grades)
}

/**
 * 渲染 pH 图表
 */
const renderPhChart = (times: string[], values: number[], grades: number[]) => {
  if (!phChartRef.value) return

  if (!phChart) {
    phChart = echarts.init(phChartRef.value)
  }

  const option: EChartsOption = {
    grid: {
      left: 50,
      right: 20,
      top: 30,
      bottom: 40
    },
    xAxis: {
      type: 'category',
      data: times,
      axisLabel: {
        fontSize: 11
      }
    },
    yAxis: {
      type: 'value',
      name: 'pH',
      nameTextStyle: {
        fontSize: 12
      },
      min: 6,
      max: 8,
      splitLine: {
        lineStyle: {
          type: 'dashed',
          color: '#e0e0e0'
        }
      }
    },
    series: [
      {
        name: 'pH值',
        type: 'line',
        data: values,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          width: 3,
          color: '#409eff'
        },
        itemStyle: {
          color: (params: any) => {
            const grade = grades[params.dataIndex]
            return getGradeColor(grade)
          }
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
          ])
        }
      }
    ],
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const data = params[0]
        const grade = grades[data.dataIndex]
        return `
          <div style="font-size: 12px;">
            <strong>${data.name}</strong><br/>
            pH: <strong style="color: #409eff;">${data.value}</strong><br/>
            等级: <strong style="color: ${getGradeColor(grade)};">${getGradeText(grade)}</strong>
          </div>
        `
      }
    }
  }

  phChart.setOption(option)
}

/**
 * 渲染 DO 图表
 */
const renderDoChart = (times: string[], values: number[], grades: number[]) => {
  if (!doChartRef.value) return

  if (!doChart) {
    doChart = echarts.init(doChartRef.value)
  }

  const option: EChartsOption = {
    grid: {
      left: 50,
      right: 20,
      top: 30,
      bottom: 40
    },
    xAxis: {
      type: 'category',
      data: times,
      axisLabel: {
        fontSize: 11
      }
    },
    yAxis: {
      type: 'value',
      name: 'DO (mg/L)',
      nameTextStyle: {
        fontSize: 12
      },
      min: 5,
      max: 10,
      splitLine: {
        lineStyle: {
          type: 'dashed',
          color: '#e0e0e0'
        }
      }
    },
    series: [
      {
        name: '溶解氧',
        type: 'line',
        data: values,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          width: 3,
          color: '#67c23a'
        },
        itemStyle: {
          color: (params: any) => {
            const grade = grades[params.dataIndex]
            return getGradeColor(grade)
          }
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
            { offset: 1, color: 'rgba(103, 194, 58, 0.05)' }
          ])
        }
      }
    ],
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const data = params[0]
        const grade = grades[data.dataIndex]
        return `
          <div style="font-size: 12px;">
            <strong>${data.name}</strong><br/>
            DO: <strong style="color: #67c23a;">${data.value} mg/L</strong><br/>
            等级: <strong style="color: ${getGradeColor(grade)};">${getGradeText(grade)}</strong>
          </div>
        `
      }
    }
  }

  doChart.setOption(option)
}

/**
 * 获取等级颜色
 */
const getGradeColor = (grade: number): string => {
  const colorMap: Record<number, string> = {
    1: '#0066ff',
    2: '#00cc66',
    3: '#ffcc00',
    4: '#ff6600',
    5: '#ff0000'
  }
  return colorMap[grade] || '#999'
}

/**
 * 获取等级文本
 */
const getGradeText = (grade: number): string => {
  const textMap: Record<number, string> = {
    1: 'Ⅰ类 优',
    2: 'Ⅱ类 良',
    3: 'Ⅲ类 中',
    4: 'Ⅳ类 差',
    5: 'Ⅴ类 劣'
  }
  return textMap[grade] || '未知'
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
  phChart?.resize()
  doChart?.resize()
}

// ========== 生命周期 ==========
onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  phChart?.dispose()
  doChart?.dispose()
})

// ========== 监听 ==========
watch(() => props.siteId, (newVal) => {
  if (newVal) {
    loadData()
  }
}, { immediate: true })
</script>

<style scoped>
.water-chart-panel {
  width: 100%;
  height: 100%;
}

.chart-header {
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

.chart-content {
  min-height: 600px;
}

.chart-item {
  margin-bottom: 32px;
}

.chart-item h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #606266;
  font-weight: 600;
}

.chart {
  width: 100%;
  height: 250px;
}

.chart-stats {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e4e7ed;
}
</style>

