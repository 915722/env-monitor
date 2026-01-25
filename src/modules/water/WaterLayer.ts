/**
 * 水质图层渲染器
 * 负责将水质数据渲染到 Cesium 场景中
 */
import {
  Viewer,
  Entity,
  Cartesian3,
  Color,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  ScreenSpaceEventType,
  defined,
  HeightReference
} from 'cesium'
import type { WaterRecord } from '@/modules/data'
import type { WaterSiteInfo } from './types'

/**
 * 水质等级颜色映射
 * 1优 -> 蓝色（最好）
 * 2良 -> 绿色
 * 3中 -> 黄色
 * 4差 -> 橙色
 * 5劣 -> 红色（最差）
 */
const GRADE_COLORS: Record<number, Color> = {
  1: Color.fromCssColorString('#0066ff'), // 优 - 蓝色
  2: Color.fromCssColorString('#00cc66'), // 良 - 绿色
  3: Color.fromCssColorString('#ffcc00'), // 中 - 黄色
  4: Color.fromCssColorString('#ff6600'), // 差 - 橙色
  5: Color.fromCssColorString('#ff0000')  // 劣 - 红色
}

/**
 * 水质图层渲染器类
 */
export class WaterLayer {
  private viewer: Viewer
  private entities: Map<string, Entity> = new Map()
  private eventHandler: ScreenSpaceEventHandler | null = null
  private onSiteClickCallback: ((siteInfo: WaterSiteInfo) => void) | null = null

  /**
   * 构造函数
   * @param viewer Cesium Viewer 实例
   */
  constructor(viewer: Viewer) {
    this.viewer = viewer
    this.setupClickHandler()
  }

  /**
   * 设置点击事件处理
   */
  private setupClickHandler(): void {
    this.eventHandler = new ScreenSpaceEventHandler(this.viewer.scene.canvas)

    // 左键点击事件
    this.eventHandler.setInputAction((movement: any) => {
      const pickedObject = this.viewer.scene.pick(movement.position)

      if (defined(pickedObject) && defined(pickedObject.id)) {
        const entity = pickedObject.id as Entity

        // 检查是否是水质站点
        if (entity.properties && entity.properties.type === 'water') {
          const siteInfo: WaterSiteInfo = {
            siteId: entity.properties.siteId,
            siteName: entity.name || '',
            lon: entity.properties.lon,
            lat: entity.properties.lat,
            grade: entity.properties.grade,
            ph: entity.properties.ph,
            do: entity.properties.do,
            turbidity: entity.properties.turbidity,
            temperature: entity.properties.temperature,
            timeISO: entity.properties.timeISO
          }

          // 触发回调
          if (this.onSiteClickCallback) {
            this.onSiteClickCallback(siteInfo)
          }

          console.log('🎯 点击水质站点:', siteInfo)
        }
      }
    }, ScreenSpaceEventType.LEFT_CLICK)
  }

  /**
   * 设置站点点击回调
   * @param callback 回调函数
   */
  onSiteClick(callback: (siteInfo: WaterSiteInfo) => void): void {
    this.onSiteClickCallback = callback
  }

  /**
   * 渲染水质数据到地图
   * @param waterRecords 水质记录数组
   * @param sites 站点位置信息
   */
  render(
    waterRecords: WaterRecord[],
    sites: Array<{ id: string; name: string; lon: number; lat: number }>
  ): void {
    // 清除旧的实体
    this.clear()

    // 创建站点实体
    waterRecords.forEach((record) => {
      const site = sites.find((s) => s.id === record.siteId)
      if (!site) return

      const entity = this.createWaterEntity(site, record)
      this.entities.set(record.siteId, entity)
      this.viewer.entities.add(entity)
    })

    console.log(`✅ 渲染了 ${waterRecords.length} 个水质站点`)
  }

  /**
   * 创建水质站点实体
   */
  private createWaterEntity(
    site: { id: string; name: string; lon: number; lat: number },
    record: WaterRecord
  ): Entity {
    const color = GRADE_COLORS[record.grade] || GRADE_COLORS[3]

    const entity = new Entity({
      id: `water_${site.id}_${Date.now()}`,
      name: site.name,
      position: Cartesian3.fromDegrees(site.lon, site.lat, 0),

      // 使用 Billboard 显示圆形图标
      billboard: {
        image: this.createCircleIcon(color),
        width: 40,
        height: 40,
        heightReference: HeightReference.CLAMP_TO_GROUND,
        verticalOrigin: 1, // BOTTOM
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      },

      // 存储站点数据
      properties: {
        type: 'water',
        siteId: site.id,
        lon: site.lon,
        lat: site.lat,
        grade: record.grade,
        ph: record.ph,
        do: record.do,
        turbidity: record.turbidity,
        temperature: record.temperature,
        timeISO: record.timeISO
      }
    })

    return entity
  }

  /**
   * 创建圆形图标（Canvas）
   */
  private createCircleIcon(color: Color): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = 80
    canvas.height = 80
    const ctx = canvas.getContext('2d')!

    const centerX = 40
    const centerY = 40
    const radius = 32

    // 外圈阴影
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
    ctx.shadowBlur = 8
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 2

    // 主圆
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
    ctx.fillStyle = `rgba(${color.red * 255}, ${color.green * 255}, ${color.blue * 255}, 1)`
    ctx.fill()

    // 白色描边
    ctx.strokeStyle = 'white'
    ctx.lineWidth = 4
    ctx.stroke()

    // 去除阴影
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0

    // 内圈高光
    ctx.beginPath()
    ctx.arc(centerX - 8, centerY - 8, 12, 0, 2 * Math.PI)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
    ctx.fill()

    // 中心小圆点
    ctx.beginPath()
    ctx.arc(centerX, centerY, 6, 0, 2 * Math.PI)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.fill()

    return canvas
  }

  /**
   * 更新单个站点的等级（重新渲染颜色）
   */
  updateSiteGrade(siteId: string, grade: 1 | 2 | 3 | 4 | 5): void {
    const entity = this.entities.get(siteId)
    if (!entity || !entity.billboard) return

    const color = GRADE_COLORS[grade] || GRADE_COLORS[3]
    entity.billboard.image = this.createCircleIcon(color)

    if (entity.properties) {
      entity.properties.grade = grade
    }
  }

  /**
   * 高亮显示指定站点
   */
  highlightSite(siteId: string): void {
    const entity = this.entities.get(siteId)
    if (!entity || !entity.billboard) return

    // 放大显示
    entity.billboard.scale = 1.3
  }

  /**
   * 取消高亮
   */
  unhighlightSite(siteId: string): void {
    const entity = this.entities.get(siteId)
    if (!entity || !entity.billboard) return

    // 恢复正常大小
    entity.billboard.scale = 1.0
  }

  /**
   * 取消所有高亮
   */
  unhighlightAll(): void {
    this.entities.forEach((entity) => {
      if (entity.billboard) {
        entity.billboard.scale = 1.0
      }
    })
  }

  /**
   * 飞行到指定站点
   */
  flyToSite(siteId: string, duration: number = 1.5): void {
    const entity = this.entities.get(siteId)
    if (!entity) return

    this.viewer.flyTo(entity, {
      duration: duration,
      offset: {
        heading: 0,
        pitch: -0.5,
        range: 5000
      }
    })
  }

  /**
   * 清除所有水质站点
   */
  clear(): void {
    this.entities.forEach((entity) => {
      this.viewer.entities.remove(entity)
    })
    this.entities.clear()
    console.log('🗑️ 水质图层已清空')
  }

  /**
   * 更新图层（时间轴变化时调用）
   * @param timeISO 新的时间点
   * @param waterRecords 该时间点的水质数据
   * @param sites 站点信息
   */
  async update(
    timeISO: string,
    waterRecords: WaterRecord[],
    sites: Array<{ id: string; name: string; lon: number; lat: number }>
  ): Promise<void> {
    console.log(`🔄 更新水质图层: ${timeISO}`)

    // 重新渲染
    this.render(waterRecords, sites)
  }

  /**
   * 设置图层可见性
   */
  setVisible(visible: boolean): void {
    this.entities.forEach((entity) => {
      entity.show = visible
    })
  }

  /**
   * 销毁图层
   */
  destroy(): void {
    this.clear()
    if (this.eventHandler) {
      this.eventHandler.destroy()
      this.eventHandler = null
    }
    console.log('🗑️ WaterLayer 已销毁')
  }
}

