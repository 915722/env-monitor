# GitHub 一键上传脚本

Write-Host "🚀 开始上传项目到 GitHub..." -ForegroundColor Green

# 检查 Git 是否安装
if (!(Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "❌ 未安装 Git，请先安装 Git" -ForegroundColor Red
    exit
}

# 检查是否已初始化 Git
if (!(Test-Path .git)) {
    Write-Host "📦 初始化 Git 仓库..." -ForegroundColor Yellow
    git init
}

# 检查远程仓库
$remote = git remote get-url origin 2>$null
if (!$remote) {
    Write-Host "🔗 添加远程仓库..." -ForegroundColor Yellow
    git remote add origin https://github.com/915722/env-monitor.git
} elseif ($remote -ne "https://github.com/915722/env-monitor.git") {
    Write-Host "🔗 更新远程仓库..." -ForegroundColor Yellow
    git remote set-url origin https://github.com/915722/env-monitor.git
}

# 检查是否在 main 分支
$branch = git branch --show-current
if ($branch -ne "main") {
    Write-Host "🔀 切换到 main 分支..." -ForegroundColor Yellow
    git branch -M main
}

# 添加所有文件
Write-Host "📁 添加文件..." -ForegroundColor Yellow
git add .

# 提交
Write-Host "💾 提交更改..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
git commit -m "Update: $timestamp"

# 推送
Write-Host "⬆️  推送到 GitHub..." -ForegroundColor Yellow
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ 上传成功！" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 下一步操作：" -ForegroundColor Cyan
    Write-Host "1. 访问：https://github.com/915722/env-monitor/settings/pages"
    Write-Host "2. Source 选择：GitHub Actions"
    Write-Host "3. 等待部署完成（2-5分钟）"
    Write-Host "4. 访问网站：https://915722.github.io/env-monitor/"
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ 推送失败，可能需要登录" -ForegroundColor Red
    Write-Host ""
    Write-Host "解决方案：" -ForegroundColor Yellow
    Write-Host "1. 生成 Personal Access Token："
    Write-Host "   https://github.com/settings/tokens"
    Write-Host "2. 推送时输入："
    Write-Host "   Username: 915722"
    Write-Host "   Password: 你的 token（不是 GitHub 密码）"
    Write-Host ""
}

