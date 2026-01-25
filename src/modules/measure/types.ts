/**
 * 测量工具模块 - 类型定义
 */

/**
 * 测量模式
 */
export type MeasureMode = 'distance' | 'area' | null

/**
 * 测量点
 */
export interface MeasurePoint {
  position: Cesium.Cartesian3
  label?: Cesium.Entity
}

/**
 * 测量结果
 */
export interface MeasureResult {
  mode: MeasureMode
  value: number // 距离(m) 或 面积(㎡)
  points: Cesium.Cartesian3[]
  entity?: Cesium.Entity
  labels?: Cesium.Entity[]
}

