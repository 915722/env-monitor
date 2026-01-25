/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// Cesium 全局类型支持
declare module 'cesium' {
  export * from 'cesium/Source/Cesium'
}

