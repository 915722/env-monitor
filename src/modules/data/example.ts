/**
 * DataManager 使用示例
 * 此文件仅供参考，不会在生产环境中使用
 */
import { dataManager } from './DataManager'

/**
 * 示例：加载所有数据
 */
export async function exampleLoadAll() {
  console.log('=== 示例：加载所有数据 ===')

  // 加载站点
  const sites = await dataManager.loadSites()
  console.log('站点数据:', sites)

  // 加载水质数据
  const waterRecords = await dataManager.loadWaterQuality()
  console.log('水质数据:', waterRecords)

  // 加载生态数据
  const ecoRecords = await dataManager.loadEcoCount()
  console.log('生态数据:', ecoRecords)
}

/**
 * 示例：按时间筛选
 */
export async function exampleFilterByTime() {
  console.log('=== 示例：按时间筛选 ===')

  // 获取 08:00 的水质数据
  const water8am = await dataManager.getWaterAtTime('2026-01-25T08:00:00Z')
  console.log('08:00 水质数据:', water8am)

  // 获取 09:00 的生态数据
  const eco9am = await dataManager.getEcoAtTime('2026-01-25T09:00:00Z')
  console.log('09:00 生态数据:', eco9am)
}

/**
 * 示例：时间轴应用
 */
export async function exampleTimeline() {
  console.log('=== 示例：时间轴应用 ===')

  // 获取所有时间点
  const timePoints = await dataManager.getWaterTimePoints()
  console.log('时间点列表:', timePoints)

  // 遍历时间点，逐个获取数据（模拟时间轴播放）
  for (const time of timePoints) {
    const waterData = await dataManager.getWaterAtTime(time)
    console.log(`时间 ${time}:`, waterData)
  }
}

/**
 * 示例：站点查询
 */
export async function exampleSiteQuery() {
  console.log('=== 示例：站点查询 ===')

  // 根据ID查询站点
  const site = await dataManager.getSiteById('water_001')
  console.log('站点 water_001:', site)

  // 获取所有水质监测站
  const waterSites = await dataManager.getSitesByType('water')
  console.log('水质监测站:', waterSites)

  // 获取所有摄像头
  const cameras = await dataManager.getSitesByType('camera')
  console.log('摄像头:', cameras)
}

/**
 * 示例：缓存机制
 */
export async function exampleCache() {
  console.log('=== 示例：缓存机制 ===')

  // 第一次加载（从服务器）
  console.time('首次加载')
  await dataManager.loadSites()
  console.timeEnd('首次加载')

  // 第二次加载（从缓存）
  console.time('缓存加载')
  await dataManager.loadSites()
  console.timeEnd('缓存加载')

  // 清除缓存
  dataManager.clearCache()
  console.log('缓存已清除')

  // 再次加载（从服务器）
  console.time('清除后加载')
  await dataManager.loadSites()
  console.timeEnd('清除后加载')
}

/**
 * 示例：预加载
 */
export async function examplePreload() {
  console.log('=== 示例：预加载 ===')

  // 应用启动时预加载所有数据
  await dataManager.preloadAll()
  console.log('预加载完成，后续查询将使用缓存')

  // 后续查询将非常快速
  const sites = await dataManager.loadSites()
  const waterRecords = await dataManager.loadWaterQuality()
  console.log(`站点: ${sites.length} 个，水质记录: ${waterRecords.length} 条`)
}

