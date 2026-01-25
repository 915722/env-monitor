/**
 * 场景模块类型定义
 */

/**
 * 底图类型
 */
export type BaseMapType = 'default' | 'tianditu' | 'arcgis'

/**
 * 底图配置接口
 */
export interface BaseMapConfig {
  type: BaseMapType
  label: string
  description: string
  requiresToken?: boolean
}

/**
 * 相机视角配置
 */
export interface CameraView {
  longitude: number
  latitude: number
  height: number
  heading?: number
  pitch?: number
  roll?: number
}

