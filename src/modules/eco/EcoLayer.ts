/**
 * 生态监测图层 - 负责渲染摄像头站点和生物数量可视化
 */
import {
  Viewer,
  Entity,
  Cartesian3,
  Color,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  defined,
  PolylineGraphics,
  HeightReference
} from 'cesium'
import type { EcoRecord } from '@/modules/data'
import type { EcoSiteInfo } from './types'

/**
 * 生态图层类
 */
export class EcoLayer {
  private viewer: Viewer
  private entities: Map<string, Entity> = new Map()
  private eventHandler: ScreenSpaceEventHandler | null = null
  private onSiteClickCallback: ((siteInfo: EcoSiteInfo) => void) | null = null

  /**
   * 构造函数
   */
  constructor(viewer: Viewer) {
    this.viewer = viewer
    this.setupClickHandler()
    console.log('✅ EcoLayer 初始化完成')
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

        // 检查是否是生态站点
        if (entity.properties && entity.properties.type === 'eco') {
          const siteInfo: EcoSiteInfo = {
            siteId: entity.properties.siteId,
            siteName: entity.name || '',
            lon: entity.properties.lon,
            lat: entity.properties.lat,
            birds: entity.properties.birds,
            fish: entity.properties.fish,
            totalCount: entity.properties.totalCount,
            species: entity.properties.species,
            snapshotUrl: entity.properties.snapshotUrl,
            videoUrl: entity.properties.videoUrl,
            timeISO: entity.properties.timeISO
          }

          // 触发回调
          if (this.onSiteClickCallback) {
            this.onSiteClickCallback(siteInfo)
          }

          console.log('🎯 点击生态站点:', siteInfo)
        }
      }
    }, ScreenSpaceEventType.LEFT_CLICK)
  }

  /**
   * 设置站点点击回调
   */
  onSiteClick(callback: (siteInfo: EcoSiteInfo) => void): void {
    this.onSiteClickCallback = callback
  }

  /**
   * 渲染生态数据到地图
   */
  render(
    ecoRecords: EcoRecord[],
    sites: Array<{ id: string; name: string; lon: number; lat: number }>
  ): void {
    // 清除旧的实体
    this.clear()

    // 创建站点实体
    ecoRecords.forEach((record) => {
      const site = sites.find((s) => s.id === record.siteId)
      if (!site) return

      const entity = this.createEcoEntity(site, record)
      this.entities.set(record.siteId, entity)
      this.viewer.entities.add(entity)
    })

    console.log(`✅ 渲染了 ${ecoRecords.length} 个生态站点`)
  }

  /**
   * 创建生态站点实体
   */
  private createEcoEntity(
    site: { id: string; name: string; lon: number; lat: number },
    record: EcoRecord
  ): Entity {
    const totalCount = record.birds + (record.fish || 0)

    // 根据总数计算柱高（最小 50m，最大 500m）
    const height = Math.min(50 + totalCount * 10, 500)

    // 根据总数计算颜色（数量越多越偏红色）
    const color = this.getColorByCount(totalCount)

    const entity = new Entity({
      id: `eco_${site.id}_${Date.now()}`,
      name: site.name,
      position: Cartesian3.fromDegrees(site.lon, site.lat, height / 2),

      // 使用圆柱体表示（底座 + 柱体）
      cylinder: {
        length: height,
        topRadius: 15,
        bottomRadius: 15,
        material: color,
        outline: true,
        outlineColor: Color.WHITE,
        outlineWidth: 2,
        heightReference: HeightReference.RELATIVE_TO_GROUND
      },

      // 存储站点数据
      properties: {
        type: 'eco',
        siteId: site.id,
        lon: site.lon,
        lat: site.lat,
        birds: record.birds,
        fish: record.fish || 0,
        totalCount: totalCount,
        species: record.species,
        snapshotUrl: record.snapshotUrl,
        videoUrl: record.videoUrl,
        timeISO: record.timeISO
      }
    })

    return entity
  }

  /**
   * 根据数量获取颜色
   * 数量少：蓝色 → 数量多：红色
   */
  private getColorByCount(count: number): Color {
    // 归一化到 0-1 范围
    const normalized = Math.min(count / 50, 1)

    // 从蓝色渐变到红色
    const r = normalized * 255
    const g = (1 - normalized) * 128
    const b = (1 - normalized) * 255

    return Color.fromBytes(r, g, b, 200) // 半透明
  }

  /**
   * 更新图层（时间轴变化时调用）
   */
  async update(
    timeISO: string,
    ecoRecords: EcoRecord[],
    sites: Array<{ id: string; name: string; lon: number; lat: number }>
  ): Promise<void> {
    console.log(`🔄 更新生态图层: ${timeISO}`)

    if (ecoRecords.length > 0) {
      this.render(ecoRecords, sites)
    } else {
      console.log('⚠️ 该时间点无生态数据')
      this.clear()
    }
  }

  /**
   * 高亮显示指定站点
   */
  highlightSite(siteId: string): void {
    const entity = this.entities.get(siteId)
    if (!entity || !entity.cylinder) return

    // 增大圆柱体
    if (entity.cylinder.topRadius && entity.cylinder.bottomRadius) {
      const originalTop = entity.cylinder.topRadius.getValue(new Date())
      const originalBottom = entity.cylinder.bottomRadius.getValue(new Date())
      entity.cylinder.topRadius = originalTop * 1.5
      entity.cylinder.bottomRadius = originalBottom * 1.5
    }
  }

  /**
   * 取消高亮
   */
  unhighlightSite(siteId: string): void {
    const entity = this.entities.get(siteId)
    if (!entity || !entity.cylinder) return

    // 恢复原始大小
    entity.cylinder.topRadius = 15
    entity.cylinder.bottomRadius = 15
  }

  /**
   * 取消所有高亮
   */
  unhighlightAll(): void {
    this.entities.forEach((entity) => {
      if (entity.cylinder) {
        entity.cylinder.topRadius = 15
        entity.cylinder.bottomRadius = 15
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
        range: 3000
      }
    })
  }

  /**
   * 清空图层
   */
  clear(): void {
    this.entities.forEach((entity) => {
      this.viewer.entities.remove(entity)
    })
    this.entities.clear()
    console.log('🗑️ 生态图层已清空')
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
    console.log('🗑️ EcoLayer 已销毁')
  }
}

