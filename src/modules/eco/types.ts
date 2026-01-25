/**
 * 生态监测模块 - 类型定义
 */

/**
 * 生态站点信息（用于显示）
 */
export interface EcoSiteInfo {
  siteId: string
  siteName: string
  lon: number
  lat: number
  birds: number
  fish: number
  totalCount: number
  species?: string
  snapshotUrl?: string
  videoUrl?: string
  timeISO: string
}

/**
 * 生态统计数据（用于图表）
 */
export interface EcoStatData {
  date: string // 日期（YYYY-MM-DD）
  birds: number
  fish: number
  total: number
}

/**
 * 时间粒度
 */
export type TimeGranularity = 'day' | 'week' | 'month'

