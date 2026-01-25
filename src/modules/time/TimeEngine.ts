/**
 * 时间引擎 - 控制时间轴播放、暂停、跳转
 */
import dayjs from 'dayjs'
import type { TimeChangeCallback, PlayStatus, TimeEngineOptions } from './types'

/**
 * 时间引擎类
 */
export class TimeEngine {
  // 当前时间（ISO 8601 格式）
  private currentTimeISO: string | null = null

  // 可用的时间点列表（有序）
  private timePoints: string[] = []

  // 当前时间点索引
  private currentIndex: number = 0

  // 播放状态
  private status: PlayStatus = 'stopped'

  // 播放定时器
  private playTimer: number | null = null

  // 播放速度（毫秒/帧）
  private playSpeed: number = 2000

  // 时间变化回调函数列表
  private callbacks: TimeChangeCallback[] = []

  // 配置选项
  private options: TimeEngineOptions

  /**
   * 构造函数
   */
  constructor(options?: TimeEngineOptions) {
    this.options = {
      autoPlay: false,
      loop: false,
      stepMinutes: 60,
      ...options
    }
    console.log('✅ TimeEngine 初始化完成')
  }

  // ========== 时间点管理 ==========

  /**
   * 设置可用的时间点列表
   * @param timePoints 时间点数组（ISO 8601 格式）
   */
  setTimePoints(timePoints: string[]): void {
    // 排序时间点
    this.timePoints = [...timePoints].sort((a, b) => {
      return new Date(a).getTime() - new Date(b).getTime()
    })

    console.log(`🕒 设置时间点: ${this.timePoints.length} 个`)

    // 如果有时间点且当前无时间，设置第一个
    if (this.timePoints.length > 0 && !this.currentTimeISO) {
      this.setTime(this.timePoints[0])
    }
  }

  /**
   * 获取所有时间点
   */
  getTimePoints(): string[] {
    return [...this.timePoints]
  }

  /**
   * 获取时间点数量
   */
  getTimePointCount(): number {
    return this.timePoints.length
  }

  // ========== 时间控制 ==========

  /**
   * 设置当前时间
   * @param timeISO ISO 8601 格式时间字符串
   */
  setTime(timeISO: string): void {
    this.currentTimeISO = timeISO

    // 更新当前索引
    const index = this.timePoints.indexOf(timeISO)
    if (index !== -1) {
      this.currentIndex = index
    }

    // 触发回调
    this.notifyCallbacks()

    console.log(`⏰ 时间设置为: ${dayjs(timeISO).format('YYYY-MM-DD HH:mm:ss')}`)
  }

  /**
   * 根据索引设置时间
   * @param index 时间点索引
   */
  setTimeByIndex(index: number): void {
    if (index < 0 || index >= this.timePoints.length) {
      console.warn('⚠️ 索引超出范围')
      return
    }

    this.setTime(this.timePoints[index])
  }

  /**
   * 获取当前时间
   */
  getCurrentTime(): string | null {
    return this.currentTimeISO
  }

  /**
   * 获取当前索引
   */
  getCurrentIndex(): number {
    return this.currentIndex
  }

  // ========== 播放控制 ==========

  /**
   * 播放时间轴
   * @param startISO 起始时间（可选，默认当前时间或第一个时间点）
   * @param endISO 结束时间（可选，默认最后一个时间点）
   * @param stepMinutes 步进时长（分钟，可选）
   */
  play(startISO?: string, endISO?: string, stepMinutes?: number): void {
    if (this.status === 'playing') {
      console.warn('⚠️ 已在播放中')
      return
    }

    if (this.timePoints.length === 0) {
      console.warn('⚠️ 无可用时间点')
      return
    }

    // 设置起始时间
    if (startISO) {
      this.setTime(startISO)
    } else if (!this.currentTimeISO) {
      this.setTime(this.timePoints[0])
    }

    // 确定结束索引
    let endIndex = this.timePoints.length - 1
    if (endISO) {
      const index = this.timePoints.indexOf(endISO)
      if (index !== -1) {
        endIndex = index
      }
    }

    this.status = 'playing'
    console.log('▶️ 开始播放时间轴')

    // 启动播放定时器
    this.playTimer = window.setInterval(() => {
      // 移动到下一个时间点
      this.currentIndex++

      // 检查是否到达结束点
      if (this.currentIndex > endIndex) {
        if (this.options.loop) {
          // 循环播放
          this.currentIndex = 0
        } else {
          // 停止播放
          this.stop()
          return
        }
      }

      // 设置新时间
      this.setTime(this.timePoints[this.currentIndex])
    }, this.playSpeed)
  }

  /**
   * 暂停播放
   */
  pause(): void {
    if (this.status !== 'playing') return

    this.status = 'paused'

    if (this.playTimer !== null) {
      clearInterval(this.playTimer)
      this.playTimer = null
    }

    console.log('⏸️ 暂停播放')
  }

  /**
   * 停止播放
   */
  stop(): void {
    this.status = 'stopped'

    if (this.playTimer !== null) {
      clearInterval(this.playTimer)
      this.playTimer = null
    }

    console.log('⏹️ 停止播放')
  }

  /**
   * 恢复播放
   */
  resume(): void {
    if (this.status === 'paused') {
      this.status = 'playing'
      this.play()
    }
  }

  /**
   * 获取播放状态
   */
  getStatus(): PlayStatus {
    return this.status
  }

  /**
   * 是否正在播放
   */
  isPlaying(): boolean {
    return this.status === 'playing'
  }

  // ========== 时间跳转 ==========

  /**
   * 跳转到下一个时间点
   */
  next(): void {
    if (this.currentIndex < this.timePoints.length - 1) {
      this.setTimeByIndex(this.currentIndex + 1)
    } else if (this.options.loop) {
      this.setTimeByIndex(0)
    }
  }

  /**
   * 跳转到上一个时间点
   */
  previous(): void {
    if (this.currentIndex > 0) {
      this.setTimeByIndex(this.currentIndex - 1)
    } else if (this.options.loop) {
      this.setTimeByIndex(this.timePoints.length - 1)
    }
  }

  /**
   * 跳转到第一个时间点
   */
  first(): void {
    if (this.timePoints.length > 0) {
      this.setTimeByIndex(0)
    }
  }

  /**
   * 跳转到最后一个时间点
   */
  last(): void {
    if (this.timePoints.length > 0) {
      this.setTimeByIndex(this.timePoints.length - 1)
    }
  }

  // ========== 播放速度控制 ==========

  /**
   * 设置播放速度
   * @param speed 毫秒/帧
   */
  setPlaySpeed(speed: number): void {
    this.playSpeed = Math.max(100, speed) // 最小 100ms

    // 如果正在播放，重新启动定时器
    if (this.status === 'playing') {
      const wasPlaying = true
      this.pause()
      if (wasPlaying) {
        this.play()
      }
    }

    console.log(`⏱️ 播放速度设置为: ${this.playSpeed}ms/帧`)
  }

  /**
   * 获取播放速度
   */
  getPlaySpeed(): number {
    return this.playSpeed
  }

  // ========== 回调管理 ==========

  /**
   * 注册时间变化回调
   * @param callback 回调函数
   */
  onTimeChange(callback: TimeChangeCallback): void {
    this.callbacks.push(callback)
  }

  /**
   * 移除时间变化回调
   * @param callback 回调函数
   */
  offTimeChange(callback: TimeChangeCallback): void {
    const index = this.callbacks.indexOf(callback)
    if (index !== -1) {
      this.callbacks.splice(index, 1)
    }
  }

  /**
   * 通知所有回调
   */
  private notifyCallbacks(): void {
    if (!this.currentTimeISO) return

    this.callbacks.forEach((callback) => {
      try {
        callback(this.currentTimeISO!)
      } catch (error) {
        console.error('❌ 时间变化回调执行失败:', error)
      }
    })
  }

  // ========== 销毁 ==========

  /**
   * 销毁时间引擎
   */
  destroy(): void {
    this.stop()
    this.callbacks = []
    this.timePoints = []
    this.currentTimeISO = null
    console.log('🗑️ TimeEngine 已销毁')
  }
}

