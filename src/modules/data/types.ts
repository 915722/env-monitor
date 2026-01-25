/**
 * 数据管理模块 - 统一数据结构类型
 */

/**
 * 监测站点（统一结构）
 */
export interface Site {
  id: string
  name: string
  type: 'water' | 'camera' // water: 水质监测站 | camera: 生态摄像头
  lon: number // 经度
  lat: number // 纬度
  alt?: number // 高度（可选）
  riverId?: string // 所属河流ID（可选）
  status?: 'online' | 'offline' // 在线状态
}

/**
 * 水质监测记录（统一结构）
 */
export interface WaterRecord {
  siteId: string // 站点ID
  siteName?: string // 站点名称（可选）
  timeISO: string // 时间（ISO 8601格式）
  ph: number // pH值
  do: number // 溶解氧 (mg/L)
  turbidity?: number // 浊度 NTU（可选）
  temperature?: number // 温度 ℃（可选）
  grade: 1 | 2 | 3 | 4 | 5 // 水质等级：1优 2良 3中 4差 5劣
}

/**
 * 生态监测记录（统一结构）
 */
export interface EcoRecord {
  siteId: string // 站点ID
  siteName?: string // 站点名称（可选）
  timeISO: string // 时间（ISO 8601格式）
  birds: number // 鸟类数量
  fish?: number // 鱼类数量（可选）
  species?: string // 物种名称（可选）
  snapshotUrl?: string // 快照图片URL（可选）
  videoUrl?: string // 视频URL（可选）
}

/**
 * 原始 GeoJSON 站点数据结构
 */
export interface RawSiteGeoJSON {
  type: 'FeatureCollection'
  features: Array<{
    type: 'Feature'
    geometry: {
      type: 'Point'
      coordinates: [number, number, number?] // [经度, 纬度, 高度]
    }
    properties: {
      id: string
      name: string
      type: 'water' | 'ecology' | 'camera'
      longitude?: number
      latitude?: number
      altitude?: number
      riverId?: string
      status?: 'online' | 'offline'
    }
  }>
}

/**
 * 原始水质数据结构
 */
export interface RawWaterQualityData {
  data: Array<{
    siteId: string
    siteName?: string
    timestamp: string
    level: 1 | 2 | 3 | 4 | 5
    parameters: {
      pH: number
      dissolvedOxygen: number
      turbidity?: number
      temperature?: number
    }
  }>
  meta?: any
}

/**
 * 原始生态数据结构
 */
export interface RawEcoCountData {
  data: Array<{
    siteId: string
    siteName?: string
    date?: string
    timestamp?: string
    species?: string
    count: number
    birdCount?: number
    fishCount?: number
    images?: string[]
    videoUrl?: string
  }>
  meta?: any
}

