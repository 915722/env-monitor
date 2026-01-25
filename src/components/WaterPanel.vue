<template>
  <div class="water-panel">
    <el-card class="panel-card">
      <template #header>
        <div class="panel-header">
          <div class="header-left">
            <span>💧 {{ siteInfo?.siteName || '水质监测站' }}</span>
            <el-tag :type="gradeColor" size="small" effect="dark" style="margin-left: 8px">
              {{ gradeText }}
            </el-tag>
          </div>
          <el-button type="text" @click="handleClose">✖</el-button>
        </div>
      </template>

      <div v-loading="loading" class="panel-content">
        <!-- 实时监测数据 -->
        <div class="data-section">
          <h4>实时指标</h4>
          <el-row :gutter="12">
            <el-col :span="12">
              <div class="data-item">
                <span class="label">PH值</span>
                <span class="value">{{ siteInfo?.ph || '--' }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="data-item">
                <span class="label">溶解氧</span>
                <span class="value">{{ siteInfo?.do || '--' }} mg/L</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="data-item">
                <span class="label">浊度</span>
                <span class="value">{{ siteInfo?.turbidity || '--' }} NTU</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="data-item">
                <span class="label">水温</span>
                <span class="value">{{ siteInfo?.temperature || '--' }} ℃</span>
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 评价 -->
        <div class="evaluation-section">
          <h4>水质评价</h4>
          <el-alert
            :title="evaluationText"
            :type="gradeType"
            :closable="false"
            show-icon
          />
        </div>

        <!-- 历史趋势图 -->
        <div class="chart-section">
          <h4>溶解氧 & 浊度 趋势</h4>
          <div ref="chartRef" class="chart"></div>
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
import type { WaterRecord } from '@/modules/data'
import type { WaterSiteInfo } from '@/modules/water/types'
import dayjs from 'dayjs'

// ========== Props & Emits ==========
interface Props {
  siteInfo: WaterSiteInfo | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

// ========== 状态 ==========
const loading = ref(false)
const chartRef = ref<HTMLDivElement>()
let chart: echarts.ECharts | null = null

// ========== 计算属性 ==========

const gradeText = computed(() => {
  const map: Record<number, string> = {
    1: 'Ⅰ类',
    2: 'Ⅱ类',
    3: 'Ⅲ类',
    4: 'Ⅳ类',
    5: 'Ⅴ类'
  }
  return map[props.siteInfo?.grade || 3] || '未知'
})

const gradeColor = computed(() => {
  const map: Record<number, string> = {
    1: '',
    2: 'success',
    3: 'warning',
    4: 'warning', // Orange-ish in Element Plus usually warning
    5: 'danger'
  }
  return map[props.siteInfo?.grade || 3] || 'info'
})

const gradeType = computed(() => {
  const map: Record<number, any> = {
    1: 'success',
    2: 'success',
    3: 'warning',
    4: 'warning',
    5: 'error'
  }
  return map[props.siteInfo?.grade || 3] || 'info'
})

const evaluationText = computed(() => {
  const g = props.siteInfo?.grade
  if (g === 1 || g === 2) return '水质优良，适合水源地及珍稀水生生物栖息。'
  if (g === 3) return '水质尚可，适用于一般工业用水及人体非直接接触的娱乐用水区。'
  if (g === 4) return '水质轻度污染，仅适用于一般工业用水及人体非直接接触的娱乐用水区。'
  if (g === 5) return '水质重度污染，限制使用。'
  return '暂无评价数据'
})

// ========== 方法 ==========

const loadHistoryAndRender = async () => {
  if (!props.siteInfo) return
  
  loading.value = true
  try {
    // 模拟加载历史数据，实际应该从 dataManager 获取
    // 这里简单地生成一些模拟趋势数据基于当前值
    // 或者我们扩充 dataManager 来支持 getHistory(siteId)
    // 为了演示，我们从 dataManager 获取所有时间点的数据
    const timePoints = await dataManager.getWaterTimePoints()
    
    // 异步获取每个时间点的数据
    const history: { time: string; do: number; turbidity: number }[] = []
    
    for (const t of timePoints) {
      const records = await dataManager.getWaterAtTime(t)
      const record = records.find(r => r.siteId === props.siteInfo?.siteId)
      if (record) {
        history.push({
          time: dayjs(t).format('HH:mm'),
          do: record.do,
          turbidity: record.turbidity
        })
      }
    }
    
    renderChart(history)

  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const renderChart = (data: any[]) => {
  if (!chartRef.value) return
  if (!chart) {
    chart = echarts.init(chartRef.value)
  }

  const option: EChartsOption = {
    grid: {
      left: 40,
      right: 40,
      top: 40,
      bottom: 30
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['溶解氧', '浊度']
    },
    xAxis: {
      type: 'category',
      data: data.map(d => d.time)
    },
    yAxis: [
      {
        type: 'value',
        name: 'mg/L',
        position: 'left'
      },
      {
        type: 'value',
        name: 'NTU',
        position: 'right' // 双Y轴
      }
    ],
    series: [
      {
        name: '溶解氧',
        type: 'line',
        data: data.map(d => d.do),
        smooth: true,
        yAxisIndex: 0,
        itemStyle: { color: '#409eff' }
      },
      {
        name: '浊度',
        type: 'line',
        data: data.map(d => d.turbidity),
        smooth: true,
        yAxisIndex: 1,
        itemStyle: { color: '#e6a23c' }
      }
    ]
  }

  chart.setOption(option)
}

const handleClose = () => {
  emit('close')
}

const handleResize = () => {
  chart?.resize()
}

// ========== Lifecycle ==========
onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chart?.dispose()
})

watch(() => props.siteInfo, (val) => {
  if (val) {
    loadHistoryAndRender()
  }
}, { immediate: true })

</script>

<style scoped>
.water-panel {
  width: 100%;
}

.panel-card {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
}

.data-section {
  margin-bottom: 24px;
}

.data-section h4, .evaluation-section h4, .chart-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #606266;
  font-weight: 600;
}

.data-item {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 8px;
  text-align: center;
  margin-bottom: 12px;
}

.data-item .label {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.data-item .value {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.evaluation-section {
  margin-bottom: 24px;
}

.chart {
  width: 100%;
  height: 250px;
}
</style>
