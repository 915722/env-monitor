@echo off
chcp 65001 >nul
echo.
echo ========================================
echo    上传项目到 GitHub
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

echo 📋 当前文件状态：
echo.
git status
echo.

echo 📁 添加所有文件...
git add .
git add -f src/
git add -f public/
git add -f .github/
echo.

echo 📋 将要提交的文件：
echo.
git status
echo.

echo ⏸️ 按任意键继续提交...
pause >nul

echo 💾 提交文件...
git commit -m "Add all project source code and data files"
echo.

echo ⬆️ 推送到 GitHub...
echo.
git push origin main
echo.

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo ✅ 上传成功！
    echo ========================================
    echo.
    echo 📦 已上传内容：
    echo   ✓ src/           源代码
    echo   ✓ public/mock/   模拟数据
    echo   ✓ .github/       自动部署配置
    echo   ✓ docs/          文档
    echo.
    echo 🌐 查看仓库：
    echo    https://github.com/915722/env-monitor
    echo.
    echo 📋 下一步：
    echo    1. 访问 Settings → Pages
    echo    2. Source 选择 GitHub Actions
    echo    3. 等待部署完成（2-5分钟）
    echo    4. 访问 https://915722.github.io/env-monitor/
    echo.
) else (
    echo.
    echo ========================================
    echo ❌ 推送失败
    echo ========================================
    echo.
    echo 💡 可能原因：
    echo    1. 需要登录认证
    echo    2. 没有推送权限
    echo.
    echo 📖 解决方法：
    echo    访问 https://github.com/settings/tokens
    echo    生成 Personal Access Token
    echo    推送时使用 token 作为密码
    echo.
)

pause

