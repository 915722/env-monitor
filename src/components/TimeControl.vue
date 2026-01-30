<template>
  <div class="time-control" :class="{ 'is-collapsed': isCollapsed }">
    <div v-if="isCollapsed" class="expand-btn" @click="toggleCollapse">
      <el-icon size="24"><Timer /></el-icon>
    </div>
    
    <el-card v-else class="time-card">
      <template #header>
        <div class="card-header">
          <div class="header-title">
            <span>⏰ 时间轴控制</span>
          </div>
          <el-button link @click="toggleCollapse">
            <el-icon size="18"><Minus /></el-icon>
          </el-button>
        </div>
      </template>

      <div class="control-layout">
        <!-- 当前时间显示 -->
        <div class="current-time">
          <label>当前时间</label>
          <div class="time-display">
            {{ formattedTime }}
          </div>
        </div>

        <!-- 时间轴滑块 -->
        <div class="time-slider">
          <el-slider
            v-model="currentIndex"
            :min="0"
            :max="maxIndex"
            :marks="marks"
            :show-tooltip="true"
            :format-tooltip="formatTooltip"
            :disabled="!hasTimePoints"
            @change="handleSliderChange"
          />
        </div>

        <!-- 播放控制按钮 -->
        <div class="control-buttons">
          <el-button-group style="width: 100%;">
            <el-button style="flex: 1;" @click="handleFirst" :disabled="!hasTimePoints">
              <el-icon><DArrowLeft /></el-icon>
            </el-button>
            <el-button style="flex: 1;" @click="handlePrevious" :disabled="!hasTimePoints">
              <el-icon><ArrowLeft /></el-icon>
            </el-button>
            <el-button
              style="flex: 2;"
              type="primary"
              @click="handlePlayPause"
              :disabled="!hasTimePoints"
            >
              <el-icon v-if="isPlaying"><VideoPause /></el-icon>
              <el-icon v-else><VideoPlay /></el-icon>
              <span style="margin-left: 8px;">{{ isPlaying ? '暂停' : '播放' }}</span>
            </el-button>
            <el-button style="flex: 1;" @click="handleNext" :disabled="!hasTimePoints">
              <el-icon><ArrowRight /></el-icon>
            </el-button>
            <el-button style="flex: 1;" @click="handleLast" :disabled="!hasTimePoints">
              <el-icon><DArrowRight /></el-icon>
            </el-button>
          </el-button-group>
        </div>

        <!-- 播放速度和状态信息 -->
        <div class="speed-and-status">
          <div class="speed-control">
            <label>播放速度</label>
            <el-radio-group v-model="playSpeed" @change="handleSpeedChange" size="small">
              <el-radio-button :label="500">快速</el-radio-button>
              <el-radio-button :label="1000">正常</el-radio-button>
              <el-radio-button :label="2000">慢速</el-radio-button>
            </el-radio-group>
          </div>

          <!-- 简化的状态信息 -->
          <div class="status-info">
            <div class="status-item">
              <span class="status-label">进度：</span>
              <span class="status-value">{{ progressText }}</span>
            </div>
            <div class="status-item">
              <span class="status-label">范围：</span>
              <span class="status-value">{{ timeRangeText }}</span>
            </div>
            <div class="status-item">
              <span class="status-label">状态：</span>
              <el-tag :type="statusType" size="small">{{ statusText }}</el-tag>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import {
  Timer,
  VideoPlay,
  VideoPause,
  ArrowLeft,
  ArrowRight,
  DArrowLeft,
  DArrowRight,
  Minus
} from '@element-plus/icons-vue'
import type { TimeEngine } from '@/modules/time'
import dayjs from 'dayjs'

// ========== Props ==========
interface Props {
  timeEngine: TimeEngine | null
}

const props = defineProps<Props>()

// ========== 状态 ==========
const currentIndex = ref(0)
const playSpeed = ref(2000)
const isPlaying = ref(false)
const timePoints = ref<string[]>([])
const isCollapsed = ref(false) // 折叠状态

// ========== 计算属性 ==========

/**
 * 是否有时间点
 */
const hasTimePoints = computed(() => timePoints.value.length > 0)

/**
 * 最大索引
 */
const maxIndex = computed(() => Math.max(0, timePoints.value.length - 1))

/**
 * 时间点数量
 */
const timePointCount = computed(() => timePoints.value.length)

/**
 * 格式化当前时间
 */
const formattedTime = computed(() => {
  if (!hasTimePoints.value || currentIndex.value >= timePoints.value.length) {
    return '--'
  }
  const time = timePoints.value[currentIndex.value]
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
})

/**
 * 进度文本
 */
const progressText = computed(() => {
  if (!hasTimePoints.value) return '--'
  return `${currentIndex.value + 1} / ${timePoints.value.length}`
})

/**
 * 时间范围文本
 */
const timeRangeText = computed(() => {
  if (!hasTimePoints.value) return '--'
  const start = dayjs(timePoints.value[0]).format('HH:mm')
  const end = dayjs(timePoints.value[timePoints.value.length - 1]).format('HH:mm')
  return `${start} ~ ${end}`
})

/**
 * 状态文本
 */
const statusText = computed(() => {
  if (!props.timeEngine) return '未初始化'
  const status = props.timeEngine.getStatus()
  const statusMap = {
    playing: '播放中',
    paused: '已暂停',
    stopped: '已停止'
  }
  return statusMap[status] || '未知'
})

/**
 * 状态类型（用于 Tag 颜色）
 */
const statusType = computed(() => {
  if (!props.timeEngine) return 'info'
  const status = props.timeEngine.getStatus()
  const typeMap = {
    playing: 'success',
    paused: 'warning',
    stopped: 'info'
  }
  return typeMap[status] || 'info'
})

/**
 * Slider 标记
 */
const marks = computed(() => {
  if (!hasTimePoints.value) return {}
  
  const result: Record<number, string> = {}
  
  // 只标记首尾
  result[0] = dayjs(timePoints.value[0]).format('HH:mm')
  if (timePoints.value.length > 1) {
    result[maxIndex.value] = dayjs(timePoints.value[maxIndex.value]).format('HH:mm')
  }
  
  return result
})

// ========== 方法 ==========

/**
 * 切换折叠
 */
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

/**
 * 初始化时间点
 */
const initTimePoints = () => {
  if (!props.timeEngine) return

  timePoints.value = props.timeEngine.getTimePoints()
  currentIndex.value = props.timeEngine.getCurrentIndex()
  
  console.log(`⏰ TimeControl 初始化 ${timePoints.value.length} 个时间点`)
}

/**
 * Slider 变化处理
 */
const handleSliderChange = (value: number) => {
  if (!props.timeEngine) return
  props.timeEngine.setTimeByIndex(value)
}

/**
 * 播放/暂停
 */
const handlePlayPause = () => {
  if (!props.timeEngine) return

  if (isPlaying.value) {
    props.timeEngine.pause()
  } else {
    props.timeEngine.play()
  }
}

/**
 * 上一个
 */
const handlePrevious = () => {
  if (!props.timeEngine) return
  props.timeEngine.previous()
}

/**
 * 下一个
 */
const handleNext = () => {
  if (!props.timeEngine) return
  props.timeEngine.next()
}

/**
 * 第一个
 */
const handleFirst = () => {
  if (!props.timeEngine) return
  props.timeEngine.first()
}

/**
 * 最后一个
 */
const handleLast = () => {
  if (!props.timeEngine) return
  props.timeEngine.last()
}

/**
 * 播放速度变化
 */
const handleSpeedChange = (speed: number) => {
  if (!props.timeEngine) return
  props.timeEngine.setPlaySpeed(speed)
}

/**
 * 格式化 Tooltip
 */
const formatTooltip = (value: number) => {
  if (!hasTimePoints.value || value >= timePoints.value.length) {
    return ''
  }
  const time = timePoints.value[value]
  return dayjs(time).format('HH:mm:ss')
}

/**
 * 时间变化回调
 */
const onTimeChange = (timeISO: string) => {
  if (!props.timeEngine) return
  
  // 更新当前索引
  currentIndex.value = props.timeEngine.getCurrentIndex()
  
  // 更新播放状态
  isPlaying.value = props.timeEngine.isPlaying()
}

// ========== 生命周期 ==========
onMounted(() => {
  if (props.timeEngine) {
    initTimePoints()
    
    // 注册时间变化回调
    props.timeEngine.onTimeChange(onTimeChange)
    
    // 设置初始播放速度
    props.timeEngine.setPlaySpeed(playSpeed.value)
  }
})

onUnmounted(() => {
  if (props.timeEngine) {
    props.timeEngine.offTimeChange(onTimeChange)
  }
})

// ========== 监听 ==========
watch(() => props.timeEngine, (newEngine) => {
  if (newEngine) {
    initTimePoints()
    newEngine.onTimeChange(onTimeChange)
    newEngine.setPlaySpeed(playSpeed.value)
  }
})
</script>

<style scoped>
.time-control {
  width: 100%;
  transition: all 0.3s ease;
}

.time-control.is-collapsed {
  width: auto;
}

.time-card {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
}

.expand-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s;
  color: #409eff;
}

.expand-btn:hover {
  transform: scale(1.1);
  background: #f0f9ff;
}

/* 当前时间显示 */
.current-time {
  text-align: center;
}

.current-time label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  color: #909399;
  font-weight: 600;
}

.time-display {
  font-size: 24px;
  font-weight: 700;
  color: #409eff;
  font-family: 'Courier New', monospace;
  letter-spacing: 1px;
}

/* 时间轴滑块 */
.time-slider {
  padding: 0 12px;
  margin-bottom: 48px; /* 增加底部间距，避免刻度标记重叠 */
}

/* 播放速度和状态信息 */
.speed-and-status {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.speed-control label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  color: #606266;
  font-weight: 600;
}

/* 状态信息 */
.status-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
  font-size: 13px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-label {
  color: #909399;
  font-weight: 500;
  min-width: 50px;
}

.status-value {
  color: #303133;
  font-weight: 600;
}

/* 按钮组 */
.control-buttons {
  margin: 8px 0;
}

:deep(.el-button-group .el-button) {
  margin: 0 !important;
}

/* Slider 标记样式优化 */
:deep(.el-slider__marks-text) {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
}

/* Tooltip 样式优化 */
:deep(.el-slider__button-wrapper) {
  z-index: 10;
}

:deep(.el-popper.is-dark) {
  background: rgba(48, 49, 51, 0.9);
  backdrop-filter: blur(8px);
}


/* Slider Customization */
:deep(.el-slider__runway) {
  height: 12px;
  background-color: #e4e7ed;
  border-radius: 6px;
}

:deep(.el-slider__bar) {
  height: 12px;
  background-color: #409eff;
  border-radius: 6px;
}

:deep(.el-slider__button) {
  width: 24px;
  height: 24px;
  border: 3px solid #409eff;
  background-color: #fff;
  border-radius: 6px; /* Square with rounded corners aka "Big Box" */
  transition: transform 0.2s;
}

:deep(.el-slider__button:hover) {
  transform: scale(1.15);
}

:deep(.el-slider__marks-text) {
  margin-top: 15px; /* Increase gap to prevent overlap with larger handle */
  font-size: 13px;
  font-weight: 500;
  color: #606266;
}

</style>

