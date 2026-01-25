<template>
  <transition name="popup-fade">
    <div v-if="visible && siteInfo" class="water-popup" :style="popupStyle">
      <div class="popup-header">
        <div class="header-left">
          <div class="grade-badge" :class="`grade-${siteInfo.grade}`">
            {{ gradeText }}
          </div>
          <h3>{{ siteInfo.siteName }}</h3>
        </div>
        <el-button
          type="text"
          class="close-btn"
          @click="handleClose"
        >✖</el-button>
      </div>

      <div class="popup-content">
        <el-descriptions :column="2" size="small" border>
          <el-descriptions-item label="pH�?>
            <span class="value-text">{{ siteInfo.ph.toFixed(2) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="溶解�?>
            <span class="value-text">{{ siteInfo.do.toFixed(2) }} mg/L</span>
          </el-descriptions-item>
          <el-descriptions-item label="浊度" v-if="siteInfo.turbidity">
            <span class="value-text">{{ siteInfo.turbidity.toFixed(2) }} NTU</span>
          </el-descriptions-item>
          <el-descriptions-item label="温度" v-if="siteInfo.temperature">
            <span class="value-text">{{ siteInfo.temperature.toFixed(1) }} �?/span>
          </el-descriptions-item>
        </el-descriptions>

        <div class="popup-time">
          <el-icon><Clock /></el-icon>
          <span>{{ formattedTime }}</span>
        </div>

        <div class="popup-actions">
          <el-button type="primary" size="small" @click="handleViewChart">
            <el-icon><TrendCharts /></el-icon>
            查看历史数据
          </el-button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

import type { WaterSiteInfo } from '@/modules/water/types'
import dayjs from 'dayjs'

// ========== Props & Emits ==========
interface Props {
  visible: boolean
  siteInfo: WaterSiteInfo | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  viewChart: [siteId: string]
}>()

// ========== 状�?==========
const popupStyle = ref({
  left: '50%',
  top: '20%',
  transform: 'translateX(-50%)'
})

// ========== 计算属�?==========

/**
 * 水质等级文本
 */
const gradeText = computed(() => {
  if (!props.siteInfo) return ''
  const gradeMap = {
    1: 'Ⅰ类 �?,
    2: 'Ⅱ类 �?,
    3: 'Ⅲ类 �?,
    4: 'Ⅳ类 �?,
    5: 'Ⅴ类 �?
  }
  return gradeMap[props.siteInfo.grade] || '未知'
})

/**
 * 格式化时�?
 */
const formattedTime = computed(() => {
  if (!props.siteInfo) return '--'
  return dayjs(props.siteInfo.timeISO).format('YYYY-MM-DD HH:mm:ss')
})

// ========== 方法 ==========

/**
 * 关闭弹窗
 */
const handleClose = () => {
  emit('close')
}

/**
 * 查看图表
 */
const handleViewChart = () => {
  if (props.siteInfo) {
    emit('viewChart', props.siteInfo.siteId)
  }
}

// ========== 监听 ==========
watch(() => props.visible, (newVal) => {
  if (newVal) {
    console.log('📍 弹窗显示:', props.siteInfo)
  }
})
</script>

<style scoped>
.water-popup {
  position: fixed;
  z-index: 2000;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  min-width: 380px;
  max-width: 500px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.header-left h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.grade-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.grade-badge.grade-1 {
  background: #0066ff;
  color: white;
}

.grade-badge.grade-2 {
  background: #00cc66;
  color: white;
}

.grade-badge.grade-3 {
  background: #ffcc00;
  color: #333;
}

.grade-badge.grade-4 {
  background: #ff6600;
  color: white;
}

.grade-badge.grade-5 {
  background: #ff0000;
  color: white;
}

.close-btn {
  color: white !important;
  font-size: 18px;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2) !important;
}

.popup-content {
  padding: 20px;
}

.value-text {
  font-weight: 600;
  color: #409eff;
  font-size: 14px;
}

.popup-time {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 10px 12px;
  background: #f5f7fa;
  border-radius: 8px;
  font-size: 13px;
  color: #606266;
}

.popup-actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

/* 动画效果 */
.popup-fade-enter-active,
.popup-fade-leave-active {
  transition: all 0.3s ease;
}

.popup-fade-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

.popup-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}
</style>

