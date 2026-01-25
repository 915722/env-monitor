/**
 * 图层管理模块 - 类型定义
 */

/**
 * 图层类型
 */
export type LayerType = 'water' | 'eco'

/**
 * 图层配置
 */
export interface LayerConfig {
  id: string
  name: string
  type: LayerType
  visible: boolean
  color?: string
}

/**
 * 图层管理器选项
 */
export interface LayerManagerOptions {
  autoShow?: boolean // 是否自动显示图层（默认 true）
}

