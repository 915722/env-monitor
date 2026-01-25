<template>
  <div class="data-manager-test">
    <el-card>
      <template #header>
        <span>数据管理器测试面板</span>
      </template>

      <el-space direction="vertical" :size="16" style="width: 100%;">
        <!-- 加载按钮组 -->
        <el-button-group>
          <el-button type="primary" @click="loadAllData" :loading="loading">
            加载所有数据
          </el-button>
          <el-button @click="clearCache">清除缓存</el-button>
          <el-button @click="preloadData">预加载</el-button>
        </el-button-group>

        <!-- 数据统计 -->
        <el-descriptions :column="3" border>
          <el-descriptions-item label="站点数量">
            {{ sitesCount }}
          </el-descriptions-item>
          <el-descriptions-item label="水质记录">
            {{ waterCount }}
          </el-descriptions-item>
          <el-descriptions-item label="生态记录">
            {{ ecoCount }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 时间轴测试 -->
        <el-divider content-position="left">时间轴测试</el-divider>
        <div>
          <el-select v-model="selectedTime" placeholder="选择时间点" style="width: 100%;">
            <el-option
              v-for="time in timePoints"
              :key="time"
              :label="formatTime(time)"
              :value="time"
            />
          </el-select>
          <el-button
            type="success"
            style="margin-top: 8px; width: 100%;"
            @click="loadTimeData"
            :disabled="!selectedTime"
          >
            加载该时间点数据
          </el-button>
        </div>

        <!-- 数据展示 -->
        <el-collapse v-if="currentTimeData.water.length > 0 || currentTimeData.eco.length > 0">
          <el-collapse-item title="水质数据" name="water">
            <div v-for="record in currentTimeData.water" :key="record.siteId" class="data-item">
              <strong>{{ record.siteName }}</strong>
              <div>等级: {{ record.grade }} | pH: {{ record.ph }} | DO: {{ record.do }}</div>
            </div>
          </el-collapse-item>
          <el-collapse-item title="生态数据" name="eco">
            <div v-for="record in currentTimeData.eco" :key="record.siteId" class="data-item">
              <strong>{{ record.siteName }}</strong>
              <div>鸟类: {{ record.birds }} | 鱼类: {{ record.fish || 0 }}</div>
            </div>
          </el-collapse-item>
        </el-collapse>

        <!-- 控制台输出 -->
        <el-alert
          v-if="message"
          :title="message"
          :type="messageType"
          :closable="false"
          show-icon
        />
      </el-space>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { dataManager } from './DataManager'
import type { WaterRecord, EcoRecord } from './types'
import dayjs from 'dayjs'

// ========== 状态 ==========
const loading = ref(false)
const sitesCount = ref(0)
const waterCount = ref(0)
const ecoCount = ref(0)

const timePoints = ref<string[]>([])
const selectedTime = ref<string>('')

const currentTimeData = ref<{
  water: WaterRecord[]
  eco: EcoRecord[]
}>({
  water: [],
  eco: []
})

const message = ref('')
const messageType = ref<'success' | 'info' | 'warning' | 'error'>('info')

// ========== 方法 ==========

/**
 * 加载所有数据
 */
const loadAllData = async () => {
  loading.value = true
  try {
    const [sites, waterRecords, ecoRecords] = await Promise.all([
      dataManager.loadSites(),
      dataManager.loadWaterQuality(),
      dataManager.loadEcoCount()
    ])

    sitesCount.value = sites.length
    waterCount.value = waterRecords.length
    ecoCount.value = ecoRecords.length

    // 加载时间点
    timePoints.value = await dataManager.getWaterTimePoints()

    showMessage('数据加载成功', 'success')
    console.log('✅ 数据加载完成', { sites, waterRecords, ecoRecords })
  } catch (error) {
    showMessage('数据加载失败', 'error')
    console.error('❌ 数据加载失败:', error)
  } finally {
    loading.value = false
  }
}

/**
 * 清除缓存
 */
const clearCache = () => {
  dataManager.clearCache()
  sitesCount.value = 0
  waterCount.value = 0
  ecoCount.value = 0
  timePoints.value = []
  currentTimeData.value = { water: [], eco: [] }
  showMessage('缓存已清除', 'info')
}

/**
 * 预加载数据
 */
const preloadData = async () => {
  loading.value = true
  try {
    await dataManager.preloadAll()
    await loadAllData() // 更新统计
    showMessage('预加载完成', 'success')
  } catch (error) {
    showMessage('预加载失败', 'error')
  } finally {
    loading.value = false
  }
}

/**
 * 加载指定时间的数据
 */
const loadTimeData = async () => {
  if (!selectedTime.value) return

  try {
    const [waterData, ecoData] = await Promise.all([
      dataManager.getWaterAtTime(selectedTime.value),
      dataManager.getEcoAtTime(selectedTime.value)
    ])

    currentTimeData.value = {
      water: waterData,
      eco: ecoData
    }

    showMessage(`已加载 ${formatTime(selectedTime.value)} 的数据`, 'success')
    console.log('📊 时间点数据:', { waterData, ecoData })
  } catch (error) {
    showMessage('时间点数据加载失败', 'error')
    console.error('❌ 时间点数据加载失败:', error)
  }
}

/**
 * 格式化时间显示
 */
const formatTime = (timeISO: string): string => {
  return dayjs(timeISO).format('YYYY-MM-DD HH:mm:ss')
}

/**
 * 显示消息
 */
const showMessage = (msg: string, type: typeof messageType.value) => {
  message.value = msg
  messageType.value = type
  ElMessage[type](msg)

  // 3秒后清除消息
  setTimeout(() => {
    message.value = ''
  }, 3000)
}
</script>

<style scoped>
.data-manager-test {
  padding: 16px;
}

.data-item {
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.data-item:last-child {
  border-bottom: none;
}

.data-item strong {
  display: block;
  margin-bottom: 4px;
  color: #409eff;
}

.data-item div {
  font-size: 13px;
  color: #666;
}
</style>

