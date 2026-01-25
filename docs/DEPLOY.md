# 📦 部署方案

## 环境要求

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **浏览器**: Chrome/Edge >= 90, Firefox >= 88, Safari >= 14
- **WebGL**: 2.0 支持（Cesium 必需）

---

## 安装与启动

### 1. 安装依赖

```bash
npm install
```

如果安装缓慢，使用国内镜像：

```bash
npm config set registry https://registry.npmmirror.com
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:5173`

### 3. 构建生产版本

```bash
npm run build
```

构建后的文件在 `dist/` 目录。

---

## 生产环境部署

### Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 缓存静态资源
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Apache

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /path/to/dist

    <Directory /path/to/dist>
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
</VirtualHost>
```

### GitHub Pages / Vercel / Netlify

1. 构建命令：`npm run build`
2. 输出目录：`dist`
3. 自动部署

---

## 数据格式说明

### sites.geojson - 站点数据

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
      "siteName": "站点名称",
      "timestamp": "2026-01-25T08:00:00Z",
      "level": 1,
      "parameters": {
        "pH": 7.2,
        "dissolvedOxygen": 8.5,
        "turbidity": 3.2,
        "temperature": 15.5
      }
    }
  ]
}
```

**字段说明**：
- `level`: 水质等级（1-5：1优 2良 3中 4差 5劣）
- `pH`: pH 值
- `dissolvedOxygen`: 溶解氧 (mg/L)
- `turbidity`: 浊度 (NTU)，可选
- `temperature`: 温度 (℃)，可选

### eco_count.json - 生态数据

```json
{
  "data": [
    {
      "siteId": "站点ID",
      "siteName": "站点名称",
      "timestamp": "2026-01-25T08:00:00Z",
      "species": "白鹭",
      "birdCount": 15,
      "fishCount": 8,
      "images": [
        "https://example.com/image.jpg"
      ],
      "videoUrl": "https://example.com/video.mp4"
    }
  ]
}
```

**字段说明**：
- `birdCount`: 鸟类数量
- `fishCount`: 鱼类数量
- `species`: 物种名称，可选
- `images`: 快照图片 URL 数组，可选
- `videoUrl`: 视频 URL，可选

---

## 常见问题

### 1. Cesium 静态资源加载失败

**现象**: 控制台报错 `Failed to load Cesium resource`

**解决**: 项目已配置 `vite-plugin-cesium`，无需额外配置。如仍有问题：

```bash
npm install --save-dev vite-plugin-cesium
```

确认 `vite.config.ts` 中已引入：

```typescript
import cesium from 'vite-plugin-cesium'

export default defineConfig({
  plugins: [vue(), cesium()]
})
```

### 2. 页面白屏

**排查步骤**：

1. 打开浏览器控制台查看错误
2. 确认 `public/mock/` 目录下有 3 个数据文件
3. 检查 WebGL 支持：访问 https://get.webgl.org/webgl2/
4. 清除浏览器缓存

### 3. 数据不显示

**检查清单**：

```bash
# 检查数据文件
ls public/mock/
# 应显示: sites.geojson, water_quality.json, eco_count.json

# 验证 JSON 格式
node -e "console.log(JSON.parse(require('fs').readFileSync('public/mock/sites.geojson')))"
```

### 4. 跨域问题

**开发环境**: 在 `vite.config.ts` 配置代理：

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://your-api.com',
        changeOrigin: true
      }
    }
  }
})
```

**生产环境**: 配置服务器 CORS 响应头。

### 5. 子目录部署

如需部署到子目录（如 `/env-monitor/`），修改 `vite.config.ts`：

```typescript
export default defineConfig({
  base: '/env-monitor/'
})
```

### 6. 构建失败

**内存不足**：

```bash
NODE_OPTIONS=--max-old-space-size=4096 npm run build
```

**依赖问题**：

```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 配置项

### 修改端口

`vite.config.ts`:

```typescript
export default defineConfig({
  server: {
    port: 3000,
    host: true  // 允许局域网访问
  }
})
```

### 修改 Cesium 视角

`src/modules/scene/config.ts`:

```typescript
export const sceneConfig = {
  defaultView: {
    longitude: 120.0,
    latitude: 30.0,
    height: 1000000
  }
}
```

### 更换数据源

修改 `src/modules/data/DataManager.ts` 中的 fetch 路径：

```typescript
// 从本地文件
const data = await fetchJSON('/mock/water_quality.json')

// 改为 API
const data = await fetchJSON('/api/water_quality')
```

---

## 性能优化

### 1. 启用 Gzip 压缩

**Nginx**:

```nginx
gzip on;
gzip_types text/css application/javascript application/json;
gzip_min_length 1000;
```

### 2. 使用 CDN

将 Cesium 等大型库改为 CDN 引入：

```html
<!-- index.html -->
<script src="https://cdn.jsdelivr.net/npm/cesium@1.112.0/Build/Cesium/Cesium.js"></script>
```

### 3. 代码分割

Vite 默认已启用代码分割，无需额外配置。

---

## 调试技巧

### 查看 Cesium 版本

```javascript
console.log(Cesium.VERSION)
```

### 查看加载的数据

```javascript
// 在浏览器控制台
fetch('/mock/sites.geojson')
  .then(res => res.json())
  .then(data => console.log('站点数据:', data))
```

### 检查 WebGL 支持

```javascript
const canvas = document.createElement('canvas')
const gl = canvas.getContext('webgl2')
console.log('WebGL 2.0 支持:', !!gl)
```

---

## 系统要求总结

| 项目 | 要求 |
|-----|------|
| Node.js | >= 18.0.0 |
| npm | >= 9.0.0 |
| 浏览器 | Chrome/Edge/Firefox (支持 WebGL 2.0) |
| 内存 | >= 4GB (构建时) |
| 磁盘 | >= 500MB (node_modules) |

---

**部署完成后，访问系统开始使用！** 🚀
