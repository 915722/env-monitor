/**
 * 图层管理器 - 负责管理 Cesium 中的 DataSource 图层
 */
import {
  Viewer,
  CustomDataSource,
  Color,
  Cartesian3,
  BillboardGraphics,
  Entity
} from 'cesium'
import type { LayerManagerOptions } from './types'

/**
 * 图层管理器类
 */
export class LayerManager {
  // Cesium Viewer 实例
  private viewer: Viewer

  // 数据源（图层）
  private waterDs: CustomDataSource
  private ecoDs: CustomDataSource

  // 图层可见性状态
  private waterVisible: boolean = true
  private ecoVisible: boolean = true

  /**
   * 构造函数
   * @param viewer Cesium Viewer 实例
   * @param options 配置选项
   */
  constructor(viewer: Viewer, options?: LayerManagerOptions) {
    this.viewer = viewer

    // 创建水质监测图层
    this.waterDs = new CustomDataSource('water-layer')
    this.viewer.dataSources.add(this.waterDs)

    // 创建生态监测图层
    this.ecoDs = new CustomDataSource('eco-layer')
    this.viewer.dataSources.add(this.ecoDs)

    // 初始显示状态
    const autoShow = options?.autoShow !== undefined ? options.autoShow : true
    this.waterDs.show = autoShow
    this.ecoDs.show = autoShow

    console.log('✅ LayerManager 初始化完成')
  }

  // ========== 图层显隐控制 ==========

  /**
   * 显示/隐藏水质监测图层
   * @param visible 是否可见
   */
  showWaterLayer(visible: boolean): void {
    this.waterVisible = visible
    this.waterDs.show = visible
    console.log(`🌊 水质图层: ${visible ? '显示' : '隐藏'}`)
  }

  /**
   * 显示/隐藏生态监测图层
   * @param visible 是否可见
   */
  showEcoLayer(visible: boolean): void {
    this.ecoVisible = visible
    this.ecoDs.show = visible
    console.log(`🦅 生态图层: ${visible ? '显示' : '隐藏'}`)
  }

  /**
   * 获取水质图层可见状态
   */
  isWaterLayerVisible(): boolean {
    return this.waterVisible
  }

  /**
   * 获取生态图层可见状态
   */
  isEcoLayerVisible(): boolean {
    return this.ecoVisible
  }

  /**
   * 切换水质图层可见性
   */
  toggleWaterLayer(): void {
    this.showWaterLayer(!this.waterVisible)
  }

  /**
   * 切换生态图层可见性
   */
  toggleEcoLayer(): void {
    this.showEcoLayer(!this.ecoVisible)
  }

  // ========== 实体管理 ==========

  /**
   * 向水质图层添加实体
   * @param entity Cesium Entity
   * @returns 添加的实体
   */
  addWaterEntity(entity: Entity): Entity {
    return this.waterDs.entities.add(entity)
  }

  /**
   * 向生态图层添加实体
   * @param entity Cesium Entity
   * @returns 添加的实体
   */
  addEcoEntity(entity: Entity): Entity {
    return this.ecoDs.entities.add(entity)
  }

  /**
   * 批量添加水质实体
   * @param entities 实体数组
   */
  addWaterEntities(entities: Entity[]): void {
    entities.forEach((entity) => this.waterDs.entities.add(entity))
    console.log(`✅ 添加 ${entities.length} 个水质站点`)
  }

  /**
   * 批量添加生态实体
   * @param entities 实体数组
   */
  addEcoEntities(entities: Entity[]): void {
    entities.forEach((entity) => this.ecoDs.entities.add(entity))
    console.log(`✅ 添加 ${entities.length} 个生态站点`)
  }

  // ========== 快速创建实体 ==========

  /**
   * 创建水质站点实体
   * @param id 站点ID
   * @param name 站点名称
   * @param lon 经度
   * @param lat 纬度
   * @param grade 水质等级 1-5
   * @returns 创建的实体
   */
  createWaterMarker(
    id: string,
    name: string,
    lon: number,
    lat: number,
    grade: 1 | 2 | 3 | 4 | 5
  ): Entity {
    // 根据水质等级设置颜色
    const gradeColors = {
      1: Color.fromCssColorString('#00ff00'), // 优 - 绿色
      2: Color.fromCssColorString('#66ff00'), // 良 - 浅绿
      3: Color.fromCssColorString('#ffff00'), // 中 - 黄色
      4: Color.fromCssColorString('#ff9900'), // 差 - 橙色
      5: Color.fromCssColorString('#ff0000')  // 劣 - 红色
    }

    const entity = new Entity({
      id: `water_${id}`,
      name: name,
      position: Cartesian3.fromDegrees(lon, lat, 0),
      billboard: new BillboardGraphics({
        image: this.createColorCircle(gradeColors[grade]),
        width: 32,
        height: 32,
        heightReference: 0, // NONE
        verticalOrigin: 1, // BOTTOM
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }),
      properties: {
        type: 'water',
        grade: grade,
        siteId: id
      }
    })

    return this.addWaterEntity(entity)
  }

  /**
   * 创建生态摄像头实体
   * @param id 站点ID
   * @param name 站点名称
   * @param lon 经度
   * @param lat 纬度
   * @returns 创建的实体
   */
  createEcoMarker(
    id: string,
    name: string,
    lon: number,
    lat: number
  ): Entity {
    const entity = new Entity({
      id: `eco_${id}`,
      name: name,
      position: Cartesian3.fromDegrees(lon, lat, 0),
      billboard: new BillboardGraphics({
        image: this.createColorCircle(Color.fromCssColorString('#4169e1')), // 蓝色
        width: 32,
        height: 32,
        heightReference: 0,
        verticalOrigin: 1,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }),
      properties: {
        type: 'eco',
        siteId: id
      }
    })

    return this.addEcoEntity(entity)
  }

  /**
   * 创建彩色圆形图标（Canvas）
   * @param color Cesium Color
   * @returns Canvas 元素
   */
  private createColorCircle(color: Color): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext('2d')!

    // 外圈（白色描边）
    ctx.beginPath()
    ctx.arc(32, 32, 28, 0, 2 * Math.PI)
    ctx.fillStyle = `rgba(${color.red * 255}, ${color.green * 255}, ${color.blue * 255}, ${color.alpha})`
    ctx.fill()
    ctx.strokeStyle = 'white'
    ctx.lineWidth = 4
    ctx.stroke()

    // 内圈高光
    ctx.beginPath()
    ctx.arc(32, 32, 22, 0, 2 * Math.PI)
    ctx.fillStyle = `rgba(255, 255, 255, 0.3)`
    ctx.fill()

    return canvas
  }

  // ========== 清空操作 ==========

  /**
   * 清空水质图层
   */
  clearWaterLayer(): void {
    this.waterDs.entities.removeAll()
    console.log('🗑️ 水质图层已清空')
  }

  /**
   * 清空生态图层
   */
  clearEcoLayer(): void {
    this.ecoDs.entities.removeAll()
    console.log('🗑️ 生态图层已清空')
  }

  /**
   * 清空所有图层
   */
  clearAll(): void {
    this.clearWaterLayer()
    this.clearEcoLayer()
    console.log('🗑️ 所有图层已清空')
  }

  // ========== 查询操作 ==========

  /**
   * 根据ID获取水质实体
   * @param id 实体ID
   */
  getWaterEntity(id: string): Entity | undefined {
    return this.waterDs.entities.getById(`water_${id}`)
  }

  /**
   * 根据ID获取生态实体
   * @param id 实体ID
   */
  getEcoEntity(id: string): Entity | undefined {
    return this.ecoDs.entities.getById(`eco_${id}`)
  }

  /**
   * 获取水质图层所有实体
   */
  getWaterEntities(): Entity[] {
    return this.waterDs.entities.values
  }

  /**
   * 获取生态图层所有实体
   */
  getEcoEntities(): Entity[] {
    return this.ecoDs.entities.values
  }

  /**
   * 获取水质图层实体数量
   */
  getWaterEntityCount(): number {
    return this.waterDs.entities.values.length
  }

  /**
   * 获取生态图层实体数量
   */
  getEcoEntityCount(): number {
    return this.ecoDs.entities.values.length
  }

  // ========== 更新操作 ==========

  /**
   * 更新水质站点颜色（根据等级）
   * @param id 站点ID
   * @param grade 新的水质等级
   */
  updateWaterMarkerGrade(id: string, grade: 1 | 2 | 3 | 4 | 5): void {
    const entity = this.getWaterEntity(id)
    if (!entity || !entity.billboard) return

    const gradeColors = {
      1: Color.fromCssColorString('#00ff00'),
      2: Color.fromCssColorString('#66ff00'),
      3: Color.fromCssColorString('#ffff00'),
      4: Color.fromCssColorString('#ff9900'),
      5: Color.fromCssColorString('#ff0000')
    }

    entity.billboard.image = this.createColorCircle(gradeColors[grade])
    if (entity.properties) {
      entity.properties.grade = grade
    }
  }

  // ========== 销毁 ==========

  /**
   * 销毁图层管理器
   */
  destroy(): void {
    this.viewer.dataSources.remove(this.waterDs, true)
    this.viewer.dataSources.remove(this.ecoDs, true)
    console.log('🗑️ LayerManager 已销毁')
  }
}

