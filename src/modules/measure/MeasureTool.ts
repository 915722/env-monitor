/**
 * 测量工具 - 距离测量和面积测量
 */
import {
  Viewer,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Cartesian2,
  Cartesian3,
  Color,
  Entity,
  PolylineGraphics,
  PolygonGraphics,
  PolygonHierarchy,
  defined,
  Cartographic,
  Math as CesiumMath,
  HeightReference,
  VerticalOrigin,
  HorizontalOrigin
} from 'cesium'
import type { MeasureMode, MeasurePoint, MeasureResult } from './types'

/**
 * 测量工具类
 */
export class MeasureTool {
  private viewer: Viewer
  private eventHandler: ScreenSpaceEventHandler | null = null
  private mode: MeasureMode = null
  private points: MeasurePoint[] = []
  private tempEntity: Entity | null = null
  private resultEntity: Entity | null = null
  private labelEntities: Entity[] = []
  private isActive: boolean = false

  constructor(viewer: Viewer) {
    this.viewer = viewer
    console.log('✅ MeasureTool 初始化完成')
  }

  /**
   * 开始测距
   */
  startDistance(): void {
    this.clear()
    this.mode = 'distance'
    this.isActive = true
    this.setupEventHandler()
    this.viewer.canvas.style.cursor = 'crosshair'
    console.log('📏 开始测距')
  }

  /**
   * 开始测面积
   */
  startArea(): void {
    this.clear()
    this.mode = 'area'
    this.isActive = true
    this.setupEventHandler()
    this.viewer.canvas.style.cursor = 'crosshair'
    console.log('📐 开始测面积')
  }

  /**
   * 停止测量
   */
  stop(): void {
    this.isActive = false
    this.mode = null
    this.removeEventHandler()
    this.viewer.canvas.style.cursor = 'default'
    console.log('🛑 停止测量')
  }

  /**
   * 清除所有测量结果
   */
  clear(): void {
    // 清除点
    this.points.forEach((point) => {
      if (point.label) {
        this.viewer.entities.remove(point.label)
      }
    })
    this.points = []

    // 清除临时实体
    if (this.tempEntity) {
      this.viewer.entities.remove(this.tempEntity)
      this.tempEntity = null
    }

    // 清除结果实体
    if (this.resultEntity) {
      this.viewer.entities.remove(this.resultEntity)
      this.resultEntity = null
    }

    // 清除标签
    this.labelEntities.forEach((entity) => {
      this.viewer.entities.remove(entity)
    })
    this.labelEntities = []

    console.log('🗑️ 清除测量结果')
  }

  /**
   * 设置事件处理
   */
  private setupEventHandler(): void {
    if (this.eventHandler) {
      this.eventHandler.destroy()
    }

    this.eventHandler = new ScreenSpaceEventHandler(this.viewer.scene.canvas)

    // 左键点击添加点
    this.eventHandler.setInputAction((movement: any) => {
      const cartesian = this.pickPosition(movement.position)
      if (cartesian) {
        this.addPoint(cartesian)
      }
    }, ScreenSpaceEventType.LEFT_CLICK)

    // 右键点击完成测量
    this.eventHandler.setInputAction(() => {
      if (this.points.length > 0) {
        this.finishMeasure()
      }
    }, ScreenSpaceEventType.RIGHT_CLICK)

    // 鼠标移动预览
    this.eventHandler.setInputAction((movement: any) => {
      if (this.points.length > 0) {
        const cartesian = this.pickPosition(movement.endPosition)
        if (cartesian) {
          this.updateTempEntity(cartesian)
        }
      }
    }, ScreenSpaceEventType.MOUSE_MOVE)
  }

  /**
   * 移除事件处理
   */
  private removeEventHandler(): void {
    if (this.eventHandler) {
      this.eventHandler.destroy()
      this.eventHandler = null
    }
  }

  /**
   * 拾取地球表面位置
   */
  private pickPosition(windowPosition: any): Cartesian3 | undefined {
    const ray = this.viewer.camera.getPickRay(windowPosition)
    if (!ray) return undefined

    const cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene)
    return cartesian || undefined
  }

  /**
   * 添加点
   */
  private addPoint(cartesian: Cartesian3): void {
    // 创建点标签
    const label = this.viewer.entities.add({
      position: cartesian,
      point: {
        pixelSize: 8,
        color: Color.YELLOW,
        outlineColor: Color.WHITE,
        outlineWidth: 2,
        heightReference: HeightReference.CLAMP_TO_GROUND
      },
      label: {
        text: `点 ${this.points.length + 1}`,
        font: '12px sans-serif',
        fillColor: Color.WHITE,
        outlineColor: Color.BLACK,
        outlineWidth: 2,
        style: 0, // FILL_AND_OUTLINE
        verticalOrigin: VerticalOrigin.BOTTOM,
        pixelOffset: new Cartesian2(0, -10),
        heightReference: HeightReference.CLAMP_TO_GROUND
      }
    })

    this.points.push({ position: cartesian, label })

    // 如果是测距且有2个点，自动完成
    if (this.mode === 'distance' && this.points.length === 2) {
      this.finishMeasure()
    }
  }

  /**
   * 更新临时实体（鼠标移动时的预览）
   */
  private updateTempEntity(cartesian: Cartesian3): void {
    if (this.tempEntity) {
      this.viewer.entities.remove(this.tempEntity)
    }

    const positions = [...this.points.map((p) => p.position), cartesian]

    if (this.mode === 'distance') {
      // 绘制临时线段
      this.tempEntity = this.viewer.entities.add({
        polyline: {
          positions: positions,
          width: 3,
          material: Color.YELLOW.withAlpha(0.7),
          clampToGround: true
        }
      })
    } else if (this.mode === 'area') {
      // 绘制临时多边形
      if (positions.length >= 3) {
        this.tempEntity = this.viewer.entities.add({
          polygon: {
            hierarchy: new PolygonHierarchy(positions),
            material: Color.YELLOW.withAlpha(0.3),
            outline: true,
            outlineColor: Color.YELLOW,
            outlineWidth: 2,
            heightReference: HeightReference.CLAMP_TO_GROUND
          }
        })
      } else {
        // 少于3个点时绘制线段
        this.tempEntity = this.viewer.entities.add({
          polyline: {
            positions: positions,
            width: 3,
            material: Color.YELLOW.withAlpha(0.7),
            clampToGround: true
          }
        })
      }
    }
  }

  /**
   * 完成测量
   */
  private finishMeasure(): void {
    if (this.tempEntity) {
      this.viewer.entities.remove(this.tempEntity)
      this.tempEntity = null
    }

    const positions = this.points.map((p) => p.position)

    if (this.mode === 'distance') {
      // 计算距离
      const distance = this.calculateDistance(positions)
      this.drawDistanceResult(positions, distance)
    } else if (this.mode === 'area') {
      // 计算面积
      if (positions.length < 3) {
        console.warn('⚠️ 面积测量至少需要3个点')
        return
      }
      const area = this.calculateArea(positions)
      this.drawAreaResult(positions, area)
    }

    this.stop()
  }

  /**
   * 计算距离（米）
   */
  private calculateDistance(positions: Cartesian3[]): number {
    let totalDistance = 0

    for (let i = 0; i < positions.length - 1; i++) {
      const start = Cartographic.fromCartesian(positions[i])
      const end = Cartographic.fromCartesian(positions[i + 1])

      const geodesic = new Cesium.EllipsoidGeodesic(start, end)
      totalDistance += geodesic.surfaceDistance
    }

    return totalDistance
  }

  /**
   * 计算面积（平方米）
   */
  private calculateArea(positions: Cartesian3[]): number {
    // 使用简单的三角形分割法计算面积
    const cartographics = positions.map((pos) => Cartographic.fromCartesian(pos))

    // 转换为平面坐标（使用第一个点作为原点）
    const origin = cartographics[0]
    const points = cartographics.map((carto) => {
      const x = (carto.longitude - origin.longitude) * 6378137 * Math.cos(origin.latitude)
      const y = (carto.latitude - origin.latitude) * 6378137
      return { x, y }
    })

    // 使用鞋带公式计算多边形面积
    let area = 0
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length
      area += points[i].x * points[j].y
      area -= points[j].x * points[i].y
    }
    area = Math.abs(area) / 2

    return area
  }

  /**
   * 绘制距离结果
   */
  private drawDistanceResult(positions: Cartesian3[], distance: number): void {
    // 绘制线段
    this.resultEntity = this.viewer.entities.add({
      polyline: {
        positions: positions,
        width: 4,
        material: Color.RED,
        clampToGround: true
      }
    })

    // 在中点显示距离标签
    const midpoint = Cartesian3.midpoint(positions[0], positions[1], new Cartesian3())
    const distanceText = this.formatDistance(distance)

    const labelEntity = this.viewer.entities.add({
      position: midpoint,
      label: {
        text: `距离: ${distanceText}`,
        font: '16px sans-serif',
        fillColor: Color.WHITE,
        backgroundColor: Color.RED.withAlpha(0.8),
        showBackground: true,
        style: 0, // FILL_AND_OUTLINE
        outlineColor: Color.BLACK,
        outlineWidth: 2,
        verticalOrigin: VerticalOrigin.BOTTOM,
        pixelOffset: new Cartesian2(0, -20),
        heightReference: HeightReference.CLAMP_TO_GROUND
      }
    })

    this.labelEntities.push(labelEntity)

    console.log(`📏 测距结果: ${distanceText}`)
  }

  /**
   * 绘制面积结果
   */
  private drawAreaResult(positions: Cartesian3[], area: number): void {
    // 绘制多边形
    this.resultEntity = this.viewer.entities.add({
      polygon: {
        hierarchy: new PolygonHierarchy(positions),
        material: Color.RED.withAlpha(0.4),
        outline: true,
        outlineColor: Color.RED,
        outlineWidth: 3,
        heightReference: HeightReference.CLAMP_TO_GROUND
      }
    })

    // 计算多边形中心点
    const center = this.getPolygonCenter(positions)
    const areaText = this.formatArea(area)

    const labelEntity = this.viewer.entities.add({
      position: center,
      label: {
        text: `面积: ${areaText}`,
        font: '16px sans-serif',
        fillColor: Color.WHITE,
        backgroundColor: Color.RED.withAlpha(0.8),
        showBackground: true,
        style: 0, // FILL_AND_OUTLINE
        outlineColor: Color.BLACK,
        outlineWidth: 2,
        verticalOrigin: VerticalOrigin.CENTER,
        heightReference: HeightReference.CLAMP_TO_GROUND
      }
    })

    this.labelEntities.push(labelEntity)

    console.log(`📐 测面积结果: ${areaText}`)
  }

  /**
   * 获取多边形中心点
   */
  private getPolygonCenter(positions: Cartesian3[]): Cartesian3 {
    let x = 0,
      y = 0,
      z = 0

    positions.forEach((pos) => {
      x += pos.x
      y += pos.y
      z += pos.z
    })

    return new Cartesian3(x / positions.length, y / positions.length, z / positions.length)
  }

  /**
   * 格式化距离显示
   */
  private formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${meters.toFixed(2)} 米`
    } else {
      return `${(meters / 1000).toFixed(2)} 千米`
    }
  }

  /**
   * 格式化面积显示
   */
  private formatArea(squareMeters: number): string {
    if (squareMeters < 10000) {
      return `${squareMeters.toFixed(2)} 平方米`
    } else {
      return `${(squareMeters / 10000).toFixed(2)} 公顷`
    }
  }

  /**
   * 销毁工具
   */
  destroy(): void {
    this.stop()
    this.clear()
    console.log('🗑️ MeasureTool 已销毁')
  }
}

