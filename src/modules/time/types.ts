/**
 * 时间模块 - 类型定义
 */

/**
 * 时间变化回调函数类型
 */
export type TimeChangeCallback = (timeISO: string) => void

/**
 * 播放状态
 */
export type PlayStatus = 'playing' | 'paused' | 'stopped'

/**
 * 时间引擎配置
 */
export interface TimeEngineOptions {
  autoPlay?: boolean // 是否自动播放
  loop?: boolean // 是否循环播放
  stepMinutes?: number // 默认步进时长（分钟）
}

