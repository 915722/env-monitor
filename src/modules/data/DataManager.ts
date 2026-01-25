/**
 * 数据管理器 - 负责加载、解析、缓存和查询监测数据
 */
import { fetchJSON, fetchGeoJSON } from '@/utils/request'
import type {
  Site,
  WaterRecord,
  EcoRecord,
  RawSiteGeoJSON,
  RawWaterQualityData,
  RawEcoCountData
} from './types'

/**
 * 数据管理器类（单例模式）
 */
export class DataManager {
  private static instance: DataManager | null = null

  // 缓存数据
  private sitesCache: Site[] | null = null
  private waterRecordsCache: WaterRecord[] | null = null
  private ecoRecordsCache: EcoRecord[] | null = null

  // 私有构造函数（单例模式）
  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): DataManager {
    if (!DataManager.instance) {
      DataManager.instance = new DataManager()
    }
    return DataManager.instance
  }

  // ========== 站点数据加载 ==========

  /**
   * 加载站点数据
   * @returns 站点列表
   */
  async loadSites(): Promise<Site[]> {
    // 如果已有缓存，直接返回
    if (this.sitesCache) {
      console.log('✅ 使用缓存的站点数据')
      return this.sitesCache
    }

    try {
      console.log('📥 正在加载站点数据...')
      const rawData = await fetchGeoJSON<RawSiteGeoJSON>('/mock/sites.geojson')

      // 解析并转换为统一结构
      this.sitesCache = rawData.features.map((feature) => {
        const coords = feature.geometry.coordinates
        const props = feature.properties

        // 统一 type 字段：ecology -> camera
        let siteType: 'water' | 'camera' = props.type === 'water' ? 'water' : 'camera'

        return {
          id: props.id,
          name: props.name,
          type: siteType,
          lon: coords[0],
          lat: coords[1],
          alt: coords[2],
          riverId: props.riverId,
          status: props.status || 'online'
        }
      })

      console.log(`✅ 站点数据加载完成，共 ${this.sitesCache.length} 个站点`)
      return this.sitesCache
    } catch (error) {
      console.error('❌ 站点数据加载失败:', error)
      throw error
    }
  }

  // ========== 水质数据加载 ==========

  /**
   * 加载水质监测数据
   * @returns 水质记录列表
   */
  async loadWaterQuality(): Promise<WaterRecord[]> {
    // 如果已有缓存，直接返回
    if (this.waterRecordsCache) {
      console.log('✅ 使用缓存的水质数据')
      return this.waterRecordsCache
    }

    try {
      console.log('📥 正在加载水质数据...')
      const rawData = await fetchJSON<RawWaterQualityData>('/mock/water_quality.json')

      // 解析并转换为统一结构
      this.waterRecordsCache = rawData.data.map((item) => ({
        siteId: item.siteId,
        siteName: item.siteName,
        timeISO: item.timestamp,
        ph: item.parameters.pH,
        do: item.parameters.dissolvedOxygen,
        turbidity: item.parameters.turbidity,
        temperature: item.parameters.temperature,
        grade: item.level
      }))

      console.log(`✅ 水质数据加载完成，共 ${this.waterRecordsCache.length} 条记录`)
      return this.waterRecordsCache
    } catch (error) {
      console.error('❌ 水质数据加载失败:', error)
      throw error
    }
  }

  // ========== 生态数据加载 ==========

  /**
   * 加载生态监测数据
   * @returns 生态记录列表
   */
  async loadEcoCount(): Promise<EcoRecord[]> {
    // 如果已有缓存，直接返回
    if (this.ecoRecordsCache) {
      console.log('✅ 使用缓存的生态数据')
      return this.ecoRecordsCache
    }

    try {
      console.log('📥 正在加载生态数据...')
      const rawData = await fetchJSON<RawEcoCountData>('/mock/eco_count.json')

      // 解析并转换为统一结构
      this.ecoRecordsCache = rawData.data.map((item) => ({
        siteId: item.siteId,
        siteName: item.siteName,
        timeISO: item.timestamp || item.date || new Date().toISOString(),
        birds: item.birdCount || item.count || 0,
        fish: item.fishCount,
        species: item.species,
        snapshotUrl: item.images?.[0],
        videoUrl: item.videoUrl
      }))

      console.log(`✅ 生态数据加载完成，共 ${this.ecoRecordsCache.length} 条记录`)
      return this.ecoRecordsCache
    } catch (error) {
      console.error('❌ 生态数据加载失败:', error)
      throw error
    }
  }

  // ========== 按时间筛选 ==========

  /**
   * 获取指定时间的水质数据
   * @param timeISO ISO 8601 时间字符串
   * @returns 该时间点的水质记录列表
   */
  async getWaterAtTime(timeISO: string): Promise<WaterRecord[]> {
    const records = await this.loadWaterQuality()
    return records.filter((record) => record.timeISO === timeISO)
  }

  /**
   * 获取指定时间的生态数据
   * @param timeISO ISO 8601 时间字符串
   * @returns 该时间点的生态记录列表
   */
  async getEcoAtTime(timeISO: string): Promise<EcoRecord[]> {
    const records = await this.loadEcoCount()
    return records.filter((record) => record.timeISO === timeISO)
  }

  /**
   * 获取指定时间范围的水质数据
   * @param startTime 开始时间（ISO 8601）
   * @param endTime 结束时间（ISO 8601）
   * @returns 时间范围内的水质记录列表
   */
  async getWaterInRange(startTime: string, endTime: string): Promise<WaterRecord[]> {
    const records = await this.loadWaterQuality()
    const start = new Date(startTime).getTime()
    const end = new Date(endTime).getTime()

    return records.filter((record) => {
      const time = new Date(record.timeISO).getTime()
      return time >= start && time <= end
    })
  }

  /**
   * 获取指定时间范围的生态数据
   * @param startTime 开始时间（ISO 8601）
   * @param endTime 结束时间（ISO 8601）
   * @returns 时间范围内的生态记录列表
   */
  async getEcoInRange(startTime: string, endTime: string): Promise<EcoRecord[]> {
    const records = await this.loadEcoCount()
    const start = new Date(startTime).getTime()
    const end = new Date(endTime).getTime()

    return records.filter((record) => {
      const time = new Date(record.timeISO).getTime()
      return time >= start && time <= end
    })
  }

  // ========== 工具方法 ==========

  /**
   * 获取所有唯一的时间点（用于时间轴）
   * @returns 排序后的时间点数组
   */
  async getWaterTimePoints(): Promise<string[]> {
    const records = await this.loadWaterQuality()
    const timeSet = new Set(records.map((r) => r.timeISO))
    return Array.from(timeSet).sort()
  }

  /**
   * 获取所有唯一的生态数据时间点
   * @returns 排序后的时间点数组
   */
  async getEcoTimePoints(): Promise<string[]> {
    const records = await this.loadEcoCount()
    const timeSet = new Set(records.map((r) => r.timeISO))
    return Array.from(timeSet).sort()
  }

  /**
   * 根据站点ID获取站点信息
   * @param siteId 站点ID
   * @returns 站点信息或 undefined
   */
  async getSiteById(siteId: string): Promise<Site | undefined> {
    const sites = await this.loadSites()
    return sites.find((site) => site.id === siteId)
  }

  /**
   * 根据类型获取站点列表
   * @param type 站点类型
   * @returns 站点列表
   */
  async getSitesByType(type: 'water' | 'camera'): Promise<Site[]> {
    const sites = await this.loadSites()
    return sites.filter((site) => site.type === type)
  }

  /**
   * 清除所有缓存（用于重新加载数据）
   */
  clearCache(): void {
    this.sitesCache = null
    this.waterRecordsCache = null
    this.ecoRecordsCache = null
    console.log('🗑️ 缓存已清除')
  }

  /**
   * 预加载所有数据（用于应用启动时）
   */
  async preloadAll(): Promise<void> {
    console.log('🚀 开始预加载所有数据...')
    await Promise.all([
      this.loadSites(),
      this.loadWaterQuality(),
      this.loadEcoCount()
    ])
    console.log('✅ 所有数据预加载完成')
  }
}

/**
 * 导出单例实例（便于使用）
 */
export const dataManager = DataManager.getInstance()

