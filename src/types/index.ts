/**
 * 全局类型定义
 */

// ========== 监测点位类型 ==========
export interface MonitorSite {
  id: string
  name: string
  type: 'water' | 'ecology' // 水质监测 | 生态监测
  longitude: number
  latitude: number
  altitude?: number
  status?: 'online' | 'offline'
}

// ========== 水质监测数据 ==========
export interface WaterQualityData {
  siteId: string
  siteName: string
  timestamp: string // ISO 8601 格式
  level: 1 | 2 | 3 | 4 // 水质等级：1优 2良 3中 4差
  parameters: {
    pH: number
    dissolvedOxygen: number // 溶解氧 mg/L
    turbidity: number // 浊度 NTU
    temperature: number // 温度 ℃
  }
}

// ========== 生态监测数据 ==========
export interface EcoCountData {
  siteId: string
  siteName: string
  cameraId: string
  date: string // YYYY-MM-DD
  species: string // 生物物种
  count: number // 数量
  images: string[] // 图片URL列表
  videoUrl?: string // 视频URL
}

// ========== GeoJSON 类型 ==========
export interface SiteGeoJSON {
  type: 'FeatureCollection'
  features: Array<{
    type: 'Feature'
    geometry: {
      type: 'Point'
      coordinates: [number, number, number?] // [经度, 纬度, 高度]
    }
    properties: MonitorSite
  }>
}

