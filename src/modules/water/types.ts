/**
 * 水质监测模块 - 类型定义
 */

/**
 * 水质站点信息（用于显示）
 */
export interface WaterSiteInfo {
  siteId: string
  siteName: string
  lon: number
  lat: number
  grade: 1 | 2 | 3 | 4 | 5
  ph: number
  do: number
  turbidity?: number
  temperature?: number
  timeISO: string
}

/**
 * 水质历史数据点（用于图表）
 */
export interface WaterChartDataPoint {
  time: string // 格式化后的时间
  ph: number
  do: number
  grade: number
}

