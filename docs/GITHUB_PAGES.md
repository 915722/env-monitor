# 🚀 GitHub Pages 部署教程

## 方法一：自动部署（推荐）

使用 GitHub Actions 自动构建和部署。

### 步骤 1：修改 Vite 配置

编辑 `vite.config.ts`，设置 `base` 路径：

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import cesium from 'vite-plugin-cesium'

export default defineConfig({
  // 重要：设置为你的仓库名
  base: '/你的仓库名/',  // 例如：'/env-monitor/'
  
  plugins: [vue(), cesium()],
  
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
```

**注意**：如果你的 GitHub 用户名是 `username`，仓库名是 `env-monitor`，那么：
- 仓库地址：`https://github.com/username/env-monitor`
- 部署后访问：`https://username.github.io/env-monitor/`
- `base` 设置为：`'/env-monitor/'`

---

### 步骤 2：创建 GitHub Actions 配置

创建文件 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  # 推送到 main 分支时触发
  push:
    branches:
      - main
  
  # 手动触发
  workflow_dispatch:

# 设置权限
permissions:
  contents: read
  pages: write
  id-token: write

# 只允许一个部署任务同时运行
concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  # 构建任务
  build:
    runs-on: ubuntu-latest
    steps:
      - name: 检出代码
        uses: actions/checkout@v4

      - name: 设置 Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: 安装依赖
        run: npm ci

      - name: 构建项目
        run: npm run build

      - name: 上传构建结果
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  # 部署任务
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: 部署到 GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

### 步骤 3：推送代码到 GitHub

```bash
# 1. 初始化 Git 仓库（如果还没有）
git init

# 2. 添加所有文件
git add .

# 3. 提交
git commit -m "Initial commit"

# 4. 添加远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/你的用户名/你的仓库名.git

# 5. 推送到 GitHub
git branch -M main
git push -u origin main
```

---

### 步骤 4：配置 GitHub Pages

1. 打开你的 GitHub 仓库页面
2. 点击 **Settings（设置）**
3. 左侧菜单找到 **Pages**
4. 在 **Build and deployment** 部分：
   - **Source**: 选择 **GitHub Actions**
5. 保存

---

### 步骤 5：查看部署状态

1. 回到仓库主页
2. 点击顶部的 **Actions** 标签
3. 查看 "Deploy to GitHub Pages" 工作流
4. 等待构建完成（通常 2-5 分钟）
5. 构建成功后，访问：`https://你的用户名.github.io/你的仓库名/`

---

## 方法二：手动部署

如果不想使用 GitHub Actions，可以手动部署。

### 步骤 1：安装 gh-pages

```bash
npm install --save-dev gh-pages
```

### 步骤 2：修改 package.json

添加部署脚本：

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "deploy": "npm run build && gh-pages -d dist"
  }
}
```

### 步骤 3：修改 vite.config.ts

```typescript
export default defineConfig({
  base: '/你的仓库名/',
  // ... 其他配置
})
```

### 步骤 4：部署

```bash
# 推送代码到 main 分支
git add .
git commit -m "Update"
git push

# 部署到 GitHub Pages
npm run deploy
```

这会自动创建 `gh-pages` 分支并部署。

### 步骤 5：配置 GitHub Pages

1. 打开 GitHub 仓库设置
2. 进入 **Pages** 页面
3. **Source**: 选择 **Deploy from a branch**
4. **Branch**: 选择 **gh-pages** 分支，目录选择 **/ (root)**
5. 保存

几分钟后访问：`https://你的用户名.github.io/你的仓库名/`

---

## 常见问题

### 1. 404 错误

**原因**：`base` 配置不正确

**解决**：
- 确认 `vite.config.ts` 中的 `base` 值为 `/仓库名/`
- 注意：**必须以 / 开头和结尾**

```typescript
// ✅ 正确
base: '/env-monitor/'

// ❌ 错误
base: 'env-monitor'
base: '/env-monitor'
base: 'env-monitor/'
```

---

### 2. 样式或资源加载失败

**原因**：路径问题

**解决**：
1. 确认 `vite.config.ts` 中 `base` 配置正确
2. 重新构建：`npm run build`
3. 检查 `dist/index.html` 中的资源路径是否包含 base 路径

---

### 3. GitHub Actions 构建失败

**常见原因**：

#### 内存不足
在 `.github/workflows/deploy.yml` 中增加内存限制：

```yaml
- name: 构建项目
  run: NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

#### 依赖安装失败
使用 `npm ci` 而不是 `npm install`（配置文件中已使用）

#### Node 版本问题
确保使用 Node 18+：

```yaml
- name: 设置 Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '18'  # 或 '20'
```

---

### 4. Cesium 资源加载失败

**原因**：Cesium 静态资源路径问题

**解决**：
项目已配置 `vite-plugin-cesium`，应该没问题。如果仍有问题，检查：

1. 确认 `package.json` 中有 `vite-plugin-cesium`
2. 确认 `vite.config.ts` 中已引入

---

### 5. 推送被拒绝

**错误信息**：`! [rejected] main -> main (fetch first)`

**解决**：

```bash
# 先拉取远程更改
git pull origin main --rebase

# 再推送
git push origin main
```

---

### 6. 权限问题

**错误信息**：`Error: Resource not accessible by integration`

**解决**：
1. 进入仓库 **Settings** > **Actions** > **General**
2. 找到 **Workflow permissions**
3. 选择 **Read and write permissions**
4. 勾选 **Allow GitHub Actions to create and approve pull requests**
5. 保存

---

## 完整示例

假设：
- GitHub 用户名：`zhangsan`
- 仓库名：`env-monitor`

### 1. vite.config.ts

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import cesium from 'vite-plugin-cesium'

export default defineConfig({
  base: '/env-monitor/',
  plugins: [vue(), cesium()],
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
```

### 2. 创建 .github/workflows/deploy.yml

（使用上面提供的完整配置）

### 3. 推送代码

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/zhangsan/env-monitor.git
git branch -M main
git push -u origin main
```

### 4. 配置 GitHub Pages

Settings > Pages > Source: **GitHub Actions**

### 5. 访问网站

等待构建完成后，访问：`https://zhangsan.github.io/env-monitor/`

---

## 自定义域名（可选）

如果你有自己的域名：

### 1. 添加 CNAME 文件

在 `public/` 目录创建 `CNAME` 文件：

```
your-domain.com
```

### 2. 配置 DNS

在域名服务商添加 DNS 记录：

```
类型: CNAME
主机记录: www (或 @)
记录值: 你的用户名.github.io
```

### 3. GitHub 设置

Settings > Pages > Custom domain: 填入你的域名

### 4. 启用 HTTPS

勾选 **Enforce HTTPS**

---

## 更新网站

修改代码后：

### 自动部署（GitHub Actions）

```bash
git add .
git commit -m "Update features"
git push
```

推送后自动触发构建和部署。

### 手动部署（gh-pages）

```bash
npm run deploy
```

---

## 优化建议

### 1. 添加构建缓存

在 `.github/workflows/deploy.yml` 中已配置 npm 缓存：

```yaml
- name: 设置 Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '18'
    cache: 'npm'  # 启用缓存
```

### 2. 压缩构建产物

安装压缩插件：

```bash
npm install --save-dev vite-plugin-compression
```

修改 `vite.config.ts`：

```typescript
import compression from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    vue(),
    cesium(),
    compression({
      algorithm: 'gzip',
      ext: '.gz'
    })
  ]
})
```

---

## 检查清单

部署前检查：

- [ ] `vite.config.ts` 中 `base` 已正确配置
- [ ] `.github/workflows/deploy.yml` 文件已创建
- [ ] 代码已推送到 GitHub
- [ ] GitHub Pages 设置为 **GitHub Actions**
- [ ] Actions 工作流已成功运行
- [ ] 可以访问部署后的网站

---

## 监控和调试

### 查看构建日志

1. 进入仓库的 **Actions** 标签
2. 点击最近的工作流运行
3. 查看详细日志

### 本地预览构建结果

```bash
npm run build
npm run preview
```

访问 `http://localhost:4173/你的仓库名/`

---

**部署成功后，你的环境监测平台就可以在线访问了！** 🎉

**示例网站**: `https://你的用户名.github.io/你的仓库名/`

