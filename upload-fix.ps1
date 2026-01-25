# 修复上传 - 添加所有缺失文件

Write-Host "🔧 修复文件上传..." -ForegroundColor Green

# 1. 检查当前状态
Write-Host "📋 检查当前文件状态..." -ForegroundColor Yellow
git status

Write-Host ""
Write-Host "⏸️  按回车继续..." -ForegroundColor Cyan
Read-Host

# 2. 强制添加所有文件（包括之前可能被忽略的）
Write-Host "📁 添加所有项目文件..." -ForegroundColor Yellow
git add -A
git add -f src/
git add -f public/
git add -f .github/

# 3. 显示将要提交的文件
Write-Host ""
Write-Host "📋 将要提交的文件：" -ForegroundColor Cyan
git status

Write-Host ""
Write-Host "⏸️  确认文件无误后按回车继续..." -ForegroundColor Cyan
Read-Host

# 4. 提交
Write-Host "💾 提交所有文件..." -ForegroundColor Yellow
git commit -m "Add all project files: src, public, .github and other directories"

# 5. 推送
Write-Host "⬆️  推送到 GitHub..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ 上传成功！" -ForegroundColor Green
    Write-Host ""
    Write-Host "📦 已上传的重要目录：" -ForegroundColor Cyan
    Write-Host "  ✓ src/           - 源代码"
    Write-Host "  ✓ public/mock/   - 模拟数据"
    Write-Host "  ✓ .github/       - 自动部署配置"
    Write-Host "  ✓ docs/          - 文档"
    Write-Host ""
    Write-Host "🌐 访问仓库查看：https://github.com/915722/env-monitor"
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ 推送失败" -ForegroundColor Red
}

