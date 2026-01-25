<template>
  <aside class="sidebar">
    <!-- Logo 区域 -->
    <div class="sidebar-header">
      <span style="font-size: 28px;">🌍</span>
      <h2>功能模块</h2>
    </div>

    <!-- 功能菜单 -->
    <el-menu
      :default-active="activeModule"
      class="sidebar-menu"
      @select="handleMenuSelect"
    >
      <el-menu-item index="water">
        <span>💧 水质监测</span>
      </el-menu-item>

      <el-menu-item index="ecology">
        <span>📷 生态监测</span>
      </el-menu-item>

      <el-menu-item index="layer">
        <span>📊 图层管理</span>
      </el-menu-item>

      <el-menu-item index="measure">
        <span>📏 GIS 工具</span>
      </el-menu-item>
    </el-menu>

    <!-- 测量工具面板 -->
    <div v-if="activeModule === 'measure'" class="measure-panel">
      <el-divider content-position="left">
        <span style="font-size: 14px; color: #606266;">测量工具</span>
      </el-divider>
      
      <div class="measure-buttons">
        <el-button
          type="primary"
          :icon="activeButton === 'distance' ? 'Check' : 'Ruler'"
          @click="handleMeasure('distance')"
          :plain="activeButton !== 'distance'"
          style="width: 100%; margin-bottom: 12px;"
        >
          {{ activeButton === 'distance' ? '测距中...' : '测距' }}
        </el-button>
        
        <el-button
          type="success"
          :icon="activeButton === 'area' ? 'Check' : 'Grid'"
          @click="handleMeasure('area')"
          :plain="activeButton !== 'area'"
          style="width: 100%; margin-bottom: 12px;"
        >
          {{ activeButton === 'area' ? '测面积中...' : '测面积' }}
        </el-button>

        <el-button
          type="danger"
          icon="Delete"
          @click="handleClear"
          :disabled="!hasMeasurement"
          style="width: 100%;"
        >
          清除测量
        </el-button>
      </div>

      <el-alert
        v-if="activeButton"
        :title="measureHint"
        type="info"
        :closable="false"
        style="margin-top: 16px;"
      />
    </div>

    <!-- 底部信息 -->
    <div class="sidebar-footer">
      <el-divider />
      <div class="info-item">
        <span class="label">在线站点：</span>
        <span class="value">{{ stats.online }}/{{ stats.total }}</span>
      </div>
      <div class="info-item">
        <span class="label">数据更新：</span>
        <span class="value">{{ updateTime }}</span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGlobalStore } from '@/store'
import dayjs from 'dayjs'

// ========== Props ==========
interface Props {
  collapsed?: boolean
  stats?: {
    online: number
    total: number
  }
}

const props = withDefaults(defineProps<Props>(), {
  collapsed: false,
  stats: () => ({ online: 0, total: 0 })
})

// ========== Emit ==========
const emit = defineEmits<{
  moduleChange: [module: string]
  measureStart: [mode: 'distance' | 'area']
  measureClear: []
}>()

// ========== 状态 ==========
const globalStore = useGlobalStore()

const activeModule = computed(() => globalStore.activeModule || '')

// 数据更新时间
const updateTime = ref(dayjs().format('MM-DD HH:mm'))

// 测量工具状态
const activeButton = ref<'distance' | 'area' | null>(null)
const hasMeasurement = ref(false)

/**
 * 菜单选择处理
 */
const handleMenuSelect = (index: string) => {
  globalStore.setActiveModule(index as any)
  emit('moduleChange', index)
  
  // 切换模块时重置测量状态
  if (index !== 'measure') {
    activeButton.value = null
    hasMeasurement.value = false
  }
}

/**
 * 测量工具处理
 */
const handleMeasure = (mode: 'distance' | 'area') => {
  if (activeButton.value === mode) {
    // 取消当前测量
    activeButton.value = null
    emit('measureClear')
  } else {
    // 开始新的测量
    activeButton.value = mode
    emit('measureStart', mode)
  }
}

/**
 * 清除测量
 */
const handleClear = () => {
  activeButton.value = null
  hasMeasurement.value = false
  emit('measureClear')
}

/**
 * 设置测量完成状态
 */
const setMeasurementDone = () => {
  hasMeasurement.value = true
  activeButton.value = null
}

/**
 * 测量提示文本
 */
const measureHint = computed(() => {
  if (activeButton.value === 'distance') {
    return '左键点击地球表面添加2个点，系统自动计算距离'
  } else if (activeButton.value === 'area') {
    return '左键点击地球表面添加多个点，右键完成并计算面积'
  }
  return ''
})

// 暴露方法给父组件
defineExpose({
  setMeasurementDone
})

// 定时更新时间
setInterval(() => {
  updateTime.value = dayjs().format('MM-DD HH:mm')
}, 60000) // 每分钟更新
</script>

<style scoped>
.sidebar {
  width: 100%;
  height: 100%;
  background: #fff;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
}

/* 头部 */
.sidebar-header {
  padding: 24px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

/* 菜单 */
.sidebar-menu {
  flex: 1;
  border-right: none;
  padding: 16px 0;
}

:deep(.el-menu-item) {
  height: 56px;
  line-height: 56px;
  margin: 4px 12px;
  border-radius: 8px;
  transition: all 0.3s;
}

:deep(.el-menu-item:hover) {
  background: rgba(64, 158, 255, 0.1);
}

:deep(.el-menu-item.is-active) {
  background: rgba(64, 158, 255, 0.15);
  color: #409EFF;
  font-weight: 600;
}

:deep(.el-menu-item .el-icon) {
  font-size: 20px;
  margin-right: 8px;
}

/* 底部信息 */
.sidebar-footer {
  padding: 16px 20px 20px;
  background: #f5f7fa;
}

.sidebar-footer :deep(.el-divider) {
  margin: 0 0 16px 0;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 13px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-item .label {
  color: #909399;
}

.info-item .value {
  color: #303133;
  font-weight: 600;
}

/* 测量工具面板 */
.measure-panel {
  padding: 16px 20px;
  background: #f9fafb;
  border-top: 1px solid #e4e7ed;
}

.measure-buttons {
  margin-top: 12px;
}
</style>

