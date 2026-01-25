# 🌍 环境监测三维可视化平台

基于 **Cesium + Vue3 + TypeScript** 的纯前端环境监测数据三维可视化系统。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Vue](https://img.shields.io/badge/Vue-3.4+-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)
![Cesium](https://img.shields.io/badge/Cesium-1.112+-orange.svg)

---

## 📖 项目简介

本系统是一个**纯前端**的环境监测数据三维可视化平台，通过 Cesium 三维地球引擎展示水质监测和生态监测数据，支持时间轴播放、数据趋势分析、GIS 测量等功能。所有数据通过本地 JSON/GeoJSON 文件模拟，无需后端服务器。

### 核心功能

- ✅ **Cesium 三维地球**：基于 WebGL 的三维地球可视化
- ✅ **水质监测**：站点分级显示、点击查看详情、历史趋势图表
- ✅ **生态监测**：圆柱体表示生物数量、快照视频展示、数量统计分析
- ✅ **时间引擎**：时间轴播放、速度控制、自动循环
- ✅ **GIS 测量工具**：距离测量、面积测量、实时计算
- ✅ **数据可视化**：ECharts 图表展示、多时间粒度聚合

---

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- 支持 WebGL 2.0 的现代浏览器（Chrome/Edge/Firefox）

### 安装

```bash
# 克隆项目
git clone <repository-url>
cd <project-directory>

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 `http://localhost:5173` 即可查看系统。

### 构建

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

---

## 📂 项目结构

```
project/
├── public/
│   └── mock/                        # 模拟数据
│       ├── sites.geojson            # 站点数据
│       ├── water_quality.json       # 水质监测数据
│       └── eco_count.json           # 生态监测数据
│
├── src/
│   ├── modules/                     # 业务模块
│   │   ├── scene/                   # Cesium 场景
│   │   ├── data/                    # 数据管理
│   │   ├── water/                   # 水质监测
│   │   ├── eco/                     # 生态监测
│   │   ├── time/                    # 时间引擎
│   │   ├── layers/                  # 图层管理
│   │   └── measure/                 # GIS 测量
│   │
│   ├── components/                  # UI 组件
│   ├── store/                       # 状态管理（Pinia）
│   ├── App.vue                      # 主应用
│   └── main.ts                      # 入口文件
│
├── docs/                            # 文档
│   └── DEPLOY.md                    # 部署说明
│
├── vite.config.ts                   # Vite 配置
├── tsconfig.json                    # TypeScript 配置
└── package.json                     # 依赖配置
```

---

## 🎯 功能演示

### 1. 水质监测

- **站点渲染**：地图上显示水质监测站点，颜色根据水质等级（1-5 级）变化
- **点击详情**：点击站点弹出详情面板，显示 pH、溶解氧、水质等级
- **趋势分析**：ECharts 折线图展示历史 pH 和溶解氧变化趋势

### 2. 生态监测

- **圆柱体可视化**：用圆柱体表示生态摄像头，高度根据生物数量（鸟类+鱼类）变化
- **颜色映射**：数量少（蓝色）→ 数量多（红色）
- **详情面板**：显示快照图片、监控视频、统计卡片
- **数量统计**：柱状图显示当天数量，折线图显示趋势变化
- **时间粒度**：支持日/周/月粒度切换，自动聚合数据

### 3. 时间引擎

- **时间轴滑块**：拖动滑块切换时间点
- **播放控制**：播放/暂停、上一个/下一个、跳转到首/尾
- **速度控制**：支持快速/正常/慢速三种播放速度
- **自动更新**：时间变化时自动更新所有图层数据

### 4. GIS 测量工具

- **测距**：点击两点自动计算地球表面距离（测地线距离）
- **测面积**：点击多个点形成多边形，计算面积（鞋带公式）
- **实时预览**：鼠标移动时显示临时图形
- **结果显示**：标签显示计算结果（米/千米、平方米/公顷）

---

## 🛠️ 技术栈

| 类别 | 技术 | 版本 |
|-----|------|------|
| 框架 | Vue 3 | ^3.4.0 |
| 语言 | TypeScript | ^5.3.0 |
| 构建工具 | Vite | ^5.0.0 |
| 3D 引擎 | Cesium | ^1.112.0 |
| 图表库 | ECharts | ^5.4.3 |
| UI 组件 | Element Plus | ^2.4.4 |
| 状态管理 | Pinia | ^2.1.7 |
| 日期处理 | dayjs | ^1.11.10 |

---

## 📊 数据说明

### sites.geojson - 站点数据

GeoJSON 格式，包含所有监测站点的位置和基本信息：

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [经度, 纬度, 高度]
      },
      "properties": {
        "id": "站点ID",
        "name": "站点名称",
        "type": "water | camera",
        "status": "online | offline"
      }
    }
  ]
}
```

### water_quality.json - 水质数据

```json
{
  "data": [
    {
      "siteId": "站点ID",
      "timestamp": "时间戳（ISO 8601）",
      "level": 1-5,
      "parameters": {
        "pH": 7.2,
        "dissolvedOxygen": 8.5
      }
    }
  ]
}
```

### eco_count.json - 生态数据

```json
{
  "data": [
    {
      "siteId": "站点ID",
      "timestamp": "时间戳（ISO 8601）",
      "birdCount": 15,
      "fishCount": 8,
      "images": ["图片URL"],
      "videoUrl": "视频URL"
    }
  ]
}
```

详细数据格式说明请查看 [部署文档](docs/DEPLOY.md)。

---

## 🎨 系统特点

### 1. 纯前端架构

- ✅ 无需后端服务器，所有数据本地加载
- ✅ 静态部署，支持任意静态服务器
- ✅ 数据通过 JSON/GeoJSON 文件模拟

### 2. 模块化设计

- ✅ 清晰的模块划分（scene/data/water/eco/time/layers/measure）
- ✅ 单一职责原则，高内聚低耦合
- ✅ TypeScript 类型安全，易于维护和扩展

### 3. 优秀的可视化效果

- ✅ Cesium 三维地球渲染
- ✅ 动态颜色映射（水质等级、生物数量）
- ✅ ECharts 数据图表
- ✅ 流畅的动画和交互

### 4. 完善的交互体验

- ✅ 点击站点查看详情
- ✅ 时间轴播放和控制
- ✅ 实时测量工具
- ✅ 图层切换和管理

---

## 📖 使用指南

### 1. 查看水质监测

1. 左侧边栏点击"水质监测"
2. 地图上会显示水质监测站点（圆形标记，颜色表示水质等级）
3. 点击站点查看详情（pH、溶解氧、等级、历史趋势）

### 2. 查看生态监测

1. 左侧边栏点击"生态监测"
2. 地图上会显示生态摄像头（圆柱体，高度和颜色表示生物数量）
3. 点击圆柱体查看详情（快照、视频、统计数据、趋势分析）
4. 切换时间粒度（日/周/月）查看不同维度的数据

### 3. 使用时间轴

1. 底部时间控制面板显示当前时间
2. 拖动滑块切换时间点
3. 点击"播放"按钮自动播放时间轴
4. 选择播放速度（快速/正常/慢速）
5. 使用跳转按钮（首/上一个/下一个/尾）

### 4. 使用测量工具

1. 左侧边栏点击"GIS 工具"
2. 点击"测距"按钮，在地球表面点击两点测量距离
3. 点击"测面积"按钮，点击多个点形成多边形，右键完成测量
4. 点击"清除测量"清除结果

---

## 🔧 配置说明

### 修改端口

编辑 `vite.config.ts`：

```typescript
export default defineConfig({
  server: {
    port: 3000,        // 修改端口
    host: true         // 允许局域网访问
  }
})
```

### 修改 Cesium 默认视角

编辑 `src/modules/scene/config.ts`：

```typescript
export const sceneConfig = {
  defaultView: {
    longitude: 120.0,  // 经度
    latitude: 30.0,    // 纬度
    height: 1000000    // 高度（米）
  }
}
```

### 更换数据源

修改 `src/modules/data/DataManager.ts` 中的数据加载路径，可以从本地文件改为 API 接口。

---

## 📦 部署

### GitHub Pages（推荐）

快速部署到 GitHub Pages，完全免费：

📖 **[GitHub Pages 快速部署指南](DEPLOY_GITHUB.md)** ⭐

只需 3 步：
1. 修改 `vite.config.ts` 中的仓库名
2. 推送代码到 GitHub
3. 配置 GitHub Pages

详细教程：[docs/GITHUB_PAGES.md](docs/GITHUB_PAGES.md)

---

### 其他部署方式

详细部署说明请查看 [docs/DEPLOY.md](docs/DEPLOY.md)。

```bash
# 1. 构建
npm run build

# 2. 部署 dist/ 目录到静态服务器
# 支持: Nginx, Apache, Vercel, Netlify 等
```

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## ❓ 常见问题

### 1. 页面白屏或加载缓慢

- Cesium 资源较大，首次加载需要 20-30 秒
- 检查控制台是否有错误信息
- 确认浏览器支持 WebGL 2.0

### 2. 数据不显示

- 确认 `public/mock/` 下的 3 个数据文件存在
- 检查 JSON 文件格式是否正确
- 查看控制台是否有数据加载错误

### 3. Cesium 静态资源加载失败

项目已配置 `vite-plugin-cesium`，正常情况下无需额外配置。如果仍有问题，请查看 [部署文档](docs/DEPLOY.md) 的解决方案。

---

## 📝 开发说明

### 代码规范

- 使用 ESLint + Prettier 格式化代码
- TypeScript 严格模式
- 遵循 Vue3 Composition API 规范

### 目录规范

- `modules/` - 业务逻辑模块，每个模块独立
- `components/` - 可复用的 UI 组件
- `store/` - 全局状态管理
- `public/mock/` - 模拟数据文件

### Git 提交规范

```bash
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 重构
perf: 性能优化
test: 测试相关
chore: 构建/工具相关
```

---

## 📄 License

MIT License

---

## 🙏 致谢

- [Cesium](https://cesium.com/) - 三维地球引擎
- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [ECharts](https://echarts.apache.org/) - 数据可视化图表库
- [Element Plus](https://element-plus.org/) - Vue 3 组件库

---

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 Issue
- 发送邮件
- 查看部署文档：[docs/DEPLOY.md](docs/DEPLOY.md)

---

**环境监测三维可视化平台 - 让数据可视化更直观！** 🚀
