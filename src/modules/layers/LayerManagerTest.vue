<template>
  <div class="layer-manager-test">
    <el-card>
      <template #header>
        <span>图层管理器测试面板</span>
      </template>

      <el-space direction="vertical" :size="16" style="width: 100%;">
        <!-- 图层控制 -->
        <el-descriptions title="图层控制" :column="2" border>
          <el-descriptions-item label="水质图层">
            <el-switch
              v-model="appStore.waterLayerVisible"
              @change="handleWaterLayerChange"
              active-text="显示"
              inactive-text="隐藏"
            />
          </el-descriptions-item>
          <el-descriptions-item label="生态图层">
            <el-switch
              v-model="appStore.ecoLayerVisible"
              @change="handleEcoLayerChange"
              active-text="显示"
              inactive-text="隐藏"
            />
          </el-descriptions-item>
        </el-descriptions>

        <!-- 操作按钮 -->
        <el-button-group style="width: 100%;">
          <el-button style="flex: 1;" @click="loadTestData" :loading="loading">
            加载测试数据
          </el-button>
          <el-button style="flex: 1;" @click="clearLayers">
            清空图层
          </el-button>
        </el-button-group>

        <!-- 模式控制 -->
        <el-divider content-position="left">应用模式</el-divider>
        <el-radio-group v-model="appStore.currentMode" @change="handleModeChange" style="width: 100%;">
          <el-radio-button label="water" style="flex: 1;">水质监测</el-radio-button>
          <el-radio-button label="eco" style="flex: 1;">生态监测</el-radio-button>
          <el-radio-button :label="null" style="flex: 1;">默认</el-radio-button>
        </el-radio-group>

        <!-- 统计信息 -->
        <el-descriptions title="图层统计" :column="2" border>
          <el-descriptions-item label="水质站点">
            {{ waterCount }}
          </el-descriptions-item>
          <el-descriptions-item label="生态站点">
            {{ ecoCount }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 时间控制 -->
        <el-divider content-position="left">时间控制</el-divider>
        <div>
          <el-input
            v-model="appStore.currentTimeISO"
            placeholder="ISO 8601 时间格式"
            clearable
          />
          <div style="margin-top: 8px; font-size: 12px; color: #999;">
            当前: {{ appStore.formattedTime }}
          </div>
        </div>

        <!-- 消息提示 -->
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
import { ref, onMounted, inject } from 'vue'
import { ElMessage } from 'element-plus'
import type { Viewer } from 'cesium'
import { LayerManager } from './LayerManager'
import { useAppStore } from '@/store/appStore'
import { dataManager } from '@/modules/data'

// ========== 状态 ==========
const appStore = useAppStore()
const viewer = inject<Viewer>('cesiumViewer')

const loading = ref(false)
const waterCount = ref(0)
const ecoCount = ref(0)

const message = ref('')
const messageType = ref<'success' | 'info' | 'warning' | 'error'>('info')

let layerManager: LayerManager | null = null

// ========== 初始化 ==========
onMounted(() => {
  if (!viewer) {
    showMessage('未找到 Cesium Viewer 实例', 'error')
    return
  }

  // 创建图层管理器
  layerManager = new LayerManager(viewer)
  showMessage('图层管理器初始化完成', 'success')
})

// ========== 方法 ==========

/**
 * 加载测试数据
 */
const loadTestData = async () => {
  if (!layerManager) return

  loading.value = true
  try {
    // 清空现有图层
    layerManager.clearAll()

    // 加载站点数据
    const sites = await dataManager.loadSites()

    // 分类站点
    const waterSites = sites.filter((s) => s.type === 'water')
    const ecoSites = sites.filter((s) => s.type === 'camera')

    // 添加水质站点
    waterSites.forEach((site) => {
      layerManager!.createWaterMarker(
        site.id,
        site.name,
        site.lon,
        site.lat,
        2 // 默认等级2（良）
      )
    })

    // 添加生态站点
    ecoSites.forEach((site) => {
      layerManager!.createEcoMarker(site.id, site.name, site.lon, site.lat)
    })

    // 更新统计
    waterCount.value = layerManager.getWaterEntityCount()
    ecoCount.value = layerManager.getEcoEntityCount()

    showMessage(`已加载 ${waterSites.length} 个水质站点和 ${ecoSites.length} 个生态站点`, 'success')
  } catch (error) {
    showMessage('加载数据失败', 'error')
    console.error(error)
  } finally {
    loading.value = false
  }
}

/**
 * 清空图层
 */
const clearLayers = () => {
  if (!layerManager) return

  layerManager.clearAll()
  waterCount.value = 0
  ecoCount.value = 0
  showMessage('图层已清空', 'info')
}

/**
 * 水质图层变化处理
 */
const handleWaterLayerChange = (visible: boolean) => {
  if (!layerManager) return
  layerManager.showWaterLayer(visible)
}

/**
 * 生态图层变化处理
 */
const handleEcoLayerChange = (visible: boolean) => {
  if (!layerManager) return
  layerManager.showEcoLayer(visible)
}

/**
 * 模式切换处理
 */
const handleModeChange = (mode: 'water' | 'eco' | null) => {
  console.log('模式切换:', mode)
  
  if (mode === 'water') {
    appStore.enterWaterMode()
    if (layerManager) {
      layerManager.showWaterLayer(true)
      layerManager.showEcoLayer(false)
    }
  } else if (mode === 'eco') {
    appStore.enterEcoMode()
    if (layerManager) {
      layerManager.showWaterLayer(false)
      layerManager.showEcoLayer(true)
    }
  } else {
    appStore.exitMode()
    if (layerManager) {
      layerManager.showWaterLayer(true)
      layerManager.showEcoLayer(true)
    }
  }
}

/**
 * 显示消息
 */
const showMessage = (msg: string, type: typeof messageType.value) => {
  message.value = msg
  messageType.value = type
  ElMessage[type](msg)

  setTimeout(() => {
    message.value = ''
  }, 3000)
}
</script>

<style scoped>
.layer-manager-test {
  padding: 16px;
}

:deep(.el-radio-button) {
  flex: 1;
}

:deep(.el-radio-button__inner) {
  width: 100%;
}
</style>

