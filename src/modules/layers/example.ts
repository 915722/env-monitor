/**
 * LayerManager 使用示例
 */
import type { Viewer } from 'cesium'
import { LayerManager } from './LayerManager'
import { dataManager } from '@/modules/data'
import { useAppStore } from '@/store/appStore'

/**
 * 示例1：创建图层管理器
 */
export function example1CreateLayerManager(viewer: Viewer) {
  console.log('=== 示例1：创建图层管理器 ===')

  // 创建图层管理器实例
  const layerManager = new LayerManager(viewer)

  console.log('✅ 图层管理器创建完成')
  return layerManager
}

/**
 * 示例2：控制图层显隐
 */
export function example2ControlLayers(layerManager: LayerManager) {
  console.log('=== 示例2：控制图层显隐 ===')

  // 隐藏水质图层
  layerManager.showWaterLayer(false)

  // 显示生态图层
  layerManager.showEcoLayer(true)

  // 切换图层
  layerManager.toggleWaterLayer()
  layerManager.toggleEcoLayer()

  // 查询状态
  console.log('水质图层可见:', layerManager.isWaterLayerVisible())
  console.log('生态图层可见:', layerManager.isEcoLayerVisible())
}

/**
 * 示例3：添加站点标注
 */
export function example3AddMarkers(layerManager: LayerManager) {
  console.log('=== 示例3：添加站点标注 ===')

  // 添加水质站点（不同等级显示不同颜色）
  layerManager.createWaterMarker('site_001', '西湖水质站', 120.15, 30.25, 1) // 绿色
  layerManager.createWaterMarker('site_002', '钱塘江监测站', 120.20, 30.30, 3) // 黄色
  layerManager.createWaterMarker('site_003', '运河监测站', 120.12, 30.22, 5) // 红色

  // 添加生态站点
  layerManager.createEcoMarker('camera_001', '湿地摄像头A', 119.95, 30.15)
  layerManager.createEcoMarker('camera_002', '湿地摄像头B', 120.05, 30.20)

  console.log('✅ 站点标注添加完成')
}

/**
 * 示例4：从数据管理器加载站点
 */
export async function example4LoadFromDataManager(layerManager: LayerManager) {
  console.log('=== 示例4：从数据管理器加载站点 ===')

  // 加载站点数据
  const sites = await dataManager.loadSites()

  // 清空现有图层
  layerManager.clearAll()

  // 分类并添加站点
  sites.forEach((site) => {
    if (site.type === 'water') {
      // 水质站点（默认等级2）
      layerManager.createWaterMarker(site.id, site.name, site.lon, site.lat, 2)
    } else {
      // 生态摄像头
      layerManager.createEcoMarker(site.id, site.name, site.lon, site.lat)
    }
  })

  console.log(`✅ 已加载 ${sites.length} 个站点`)
}

/**
 * 示例5：更新站点状态
 */
export async function example5UpdateMarkers(layerManager: LayerManager) {
  console.log('=== 示例5：更新站点状态 ===')

  // 加载某个时间点的水质数据
  const waterData = await dataManager.getWaterAtTime('2026-01-25T08:00:00Z')

  // 更新站点颜色（根据水质等级）
  waterData.forEach((record) => {
    layerManager.updateWaterMarkerGrade(record.siteId, record.grade)
  })

  console.log(`✅ 已更新 ${waterData.length} 个站点状态`)
}

/**
 * 示例6：结合 Pinia Store
 */
export function example6WithStore(layerManager: LayerManager) {
  console.log('=== 示例6：结合 Pinia Store ===')

  const appStore = useAppStore()

  // 监听 store 状态变化
  // 注意：这需要在 Vue 组件中使用 watch
  console.log('水质图层可见:', appStore.waterLayerVisible)
  console.log('生态图层可见:', appStore.ecoLayerVisible)

  // 切换模式
  appStore.enterWaterMode() // 进入水质监测模式
  layerManager.showWaterLayer(appStore.waterLayerVisible)
  layerManager.showEcoLayer(appStore.ecoLayerVisible)

  // 退出模式
  appStore.exitMode()
  layerManager.showWaterLayer(appStore.waterLayerVisible)
  layerManager.showEcoLayer(appStore.ecoLayerVisible)
}

/**
 * 示例7：时间轴播放
 */
export async function example7Timeline(layerManager: LayerManager) {
  console.log('=== 示例7：时间轴播放 ===')

  const appStore = useAppStore()

  // 获取时间点列表
  const timePoints = await dataManager.getWaterTimePoints()

  // 遍历时间点
  for (const time of timePoints) {
    // 更新 store 中的当前时间
    appStore.setCurrentTime(time)

    // 加载该时间点的数据
    const waterData = await dataManager.getWaterAtTime(time)

    // 更新地图上的站点颜色
    waterData.forEach((record) => {
      layerManager.updateWaterMarkerGrade(record.siteId, record.grade)
    })

    console.log(`时间 ${time}: 已更新 ${waterData.length} 个站点`)

    // 等待一段时间（模拟播放）
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
}

/**
 * 示例8：清空和销毁
 */
export function example8CleanUp(layerManager: LayerManager) {
  console.log('=== 示例8：清空和销毁 ===')

  // 清空单个图层
  layerManager.clearWaterLayer()
  layerManager.clearEcoLayer()

  // 清空所有图层
  layerManager.clearAll()

  // 销毁图层管理器（释放资源）
  layerManager.destroy()

  console.log('✅ 清理完成')
}

