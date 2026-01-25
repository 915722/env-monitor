<template>
  <div class="layer-manager">
    <el-card class="manager-card">
      <template #header>
        <div class="header">
          <span>📚 图层管理</span>
          <el-button type="text" @click="handleClose">✖</el-button>
        </div>
      </template>
      
      <div class="layer-list">
        <div class="layer-item">
          <div class="layer-info">
            <span class="icon">💧</span>
            <span class="name">水质监测站点</span>
          </div>
          <el-switch v-model="waterVisible" @change="handleWaterChange" />
        </div>
        
        <div class="layer-item">
          <div class="layer-info">
            <span class="icon">📷</span>
            <span class="name">生态监测站点</span>
          </div>
          <el-switch v-model="ecoVisible" @change="handleEcoChange" />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  close: [],
  'update:water': [visible: boolean],
  'update:eco': [visible: boolean]
}>()

const waterVisible = ref(true)
const ecoVisible = ref(true)

const handleWaterChange = (val: boolean | string | number) => {
  emit('update:water', val as boolean)
}

const handleEcoChange = (val: boolean | string | number) => {
  emit('update:eco', val as boolean)
}

const handleClose = () => {
  emit('close')
}
</script>

<style scoped>
.layer-manager {
  width: 300px;
}

.manager-card {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.layer-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.layer-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.layer-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon {
  font-size: 18px;
}

.name {
  font-size: 14px;
  color: #606266;
}
</style>
