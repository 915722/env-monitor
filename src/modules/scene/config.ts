/**
 * Cesium 场景配置
 */
import type { BaseMapConfig, CameraView } from './types'

/**
 * 底图配置列表
 */
export const BASE_MAP_CONFIGS: Record<string, BaseMapConfig> = {
  default: {
    type: 'default',
    label: 'Cesium 默认影像',
    description: 'Cesium Ion 提供的全球影像',
    requiresToken: false
  },
  tianditu: {
    type: 'tianditu',
    label: '天地图影像',
    description: '国家地理信息公共服务平台',
    requiresToken: true // 需要天地图 Token
  },
  arcgis: {
    type: 'arcgis',
    label: 'ArcGIS 影像',
    description: 'ArcGIS Online 世界影像',
    requiresToken: false
  }
}

/**
 * 默认底图类型
 */
export const DEFAULT_BASE_MAP = 'default'

/**
 * Cesium Ion 访问令牌（可选）
 * 获取地址：https://ion.cesium.com/tokens
 */
export const CESIUM_ION_TOKEN = ''

/**
 * 天地图访问令牌（可选）
 * 获取地址：https://console.tianditu.gov.cn/api/key
 */
export const TIANDITU_TOKEN = ''

/**
 * 中国区域默认相机视角
 */
export const CHINA_VIEW: CameraView = {
  longitude: 118.79, // 经度：南京（中心）
  latitude: 32.07,   // 纬度：南京（中心）
  height: 40000,     // 高度：40km
  heading: 0,
  pitch: -90,       // 俯视角度
  roll: 0
}

/**
 * Viewer 初始化配置
 */
export const VIEWER_OPTIONS = {
  animation: false,              // 不显示动画控件
  timeline: false,               // 不显示时间轴
  baseLayerPicker: false,        // 不显示图层选择器
  geocoder: false,               // 不显示地名搜索
  homeButton: true,              // 显示Home按钮
  sceneModePicker: true,         // 显示场景模式切换（3D/2D/哥伦布视图）
  navigationHelpButton: false,   // 不显示帮助按钮
  fullscreenButton: false,       // 不显示全屏按钮
  vrButton: false,               // 不显示VR按钮
  infoBox: false,                // 不显示信息框
  selectionIndicator: false,     // 不显示选择指示器
  shouldAnimate: true            // 启用场景动画
}

