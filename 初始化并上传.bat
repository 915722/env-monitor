@echo off
chcp 65001 >nul
echo.
echo ========================================
echo    初始化 Git 并上传到 GitHub
echo ========================================
echo.

REM 检查是否安装 Git
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 未安装 Git！
    echo.
    echo 请先安装 Git: https://git-scm.com/download/win
    echo.
    pause
    exit /b
)

REM 检查是否已经是 Git 仓库
if not exist .git (
    echo 📦 初始化 Git 仓库...
    git init
    echo ✅ Git 仓库初始化完成
    echo.
) else (
    echo ✅ Git 仓库已存在
    echo.
)

REM 配置 Git 用户信息（如果没有配置）
git config user.name >nul 2>nul
if %errorlevel% neq 0 (
    echo 🔧 配置 Git 用户信息...
    git config user.name "915722"
    git config user.email "915722@users.noreply.github.com"
    echo ✅ Git 配置完成
    echo.
)

REM 检查远程仓库
git remote get-url origin >nul 2>nul
if %errorlevel% neq 0 (
    echo 🔗 添加远程仓库...
    git remote add origin https://github.com/915722/env-monitor.git
    echo ✅ 远程仓库已添加
    echo.
) else (
    echo ✅ 远程仓库已存在
    echo.
)

REM 确保在 main 分支
git branch -M main

echo 📁 添加所有文件...
git add .
echo.

echo 📋 将要提交的文件列表：
echo.
git status --short
echo.

echo ⏸️ 按任意键继续提交...
pause >nul

echo.
echo 💾 提交文件...
git commit -m "Initial commit: Add complete project"
echo.

echo ⬆️ 推送到 GitHub...
echo.
echo ⚠️ 可能需要输入 GitHub 凭据：
echo    用户名: 915722
echo    密码: 使用 Personal Access Token
echo.
git push -u origin main
echo.

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo ✅ 上传成功！
    echo ========================================
    echo.
    echo 🎉 项目已成功上传到 GitHub！
    echo.
    echo 🌐 仓库地址：
    echo    https://github.com/915722/env-monitor
    echo.
    echo 📋 下一步操作：
    echo.
    echo 1. 配置 GitHub Pages
    echo    访问: https://github.com/915722/env-monitor/settings/pages
    echo    Source 选择: GitHub Actions
    echo.
    echo 2. 等待自动部署（2-5分钟）
    echo    查看进度: https://github.com/915722/env-monitor/actions
    echo.
    echo 3. 访问你的网站
    echo    网址: https://915722.github.io/env-monitor/
    echo.
) else (
    echo.
    echo ========================================
    echo ❌ 推送失败
    echo ========================================
    echo.
    echo 💡 需要 Personal Access Token
    echo.
    echo 📖 获取步骤：
    echo    1. 访问 https://github.com/settings/tokens/new
    echo    2. Note 填写: env-monitor
    echo    3. 勾选: repo（所有权限）
    echo    4. 点击 Generate token
    echo    5. 复制 token（只显示一次！）
    echo.
    echo 🔐 使用方法：
    echo    重新运行此脚本
    echo    用户名: 915722
    echo    密码: 粘贴你的 token
    echo.
)

pause

