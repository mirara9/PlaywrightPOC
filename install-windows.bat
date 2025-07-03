@echo off
setlocal enabledelayedexpansion

echo ================================
echo  Playwright POC Windows Installer
echo ================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is available
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not available
    echo Please ensure Node.js is properly installed
    pause
    exit /b 1
)

echo Node.js and npm are available
echo.

REM Check for Administrator privileges (optional but recommended)
net session >nul 2>&1
if %errorlevel% equ 0 (
    echo Running with Administrator privileges - Good!
) else (
    echo WARNING: Not running as Administrator
    echo Some installations might fail without admin privileges
    echo.
)

REM Clean installation option
set /p clean="Clean install? (removes node_modules and package-lock.json) [y/N]: "
if /i "!clean!"=="y" (
    echo Cleaning previous installation...
    if exist node_modules rmdir /s /q node_modules
    if exist test-app\node_modules rmdir /s /q test-app\node_modules
    if exist package-lock.json del package-lock.json
    if exist test-app\package-lock.json del test-app\package-lock.json
    echo Clean completed
    echo.
)

REM Set npm configuration for Windows
echo Configuring npm for Windows...
npm config set msvs_version 2022 --global
npm config set python python --global
npm config set cache %TEMP%\npm-cache --global
npm config set prefer-offline false --global
npm config set audit false --global
npm config set fund false --global

echo Running Windows-specific installation...
node scripts/windows-install.js

if %errorlevel% neq 0 (
    echo.
    echo ================================
    echo  Installation Failed
    echo ================================
    echo.
    echo Possible solutions:
    echo 1. Run as Administrator
    echo 2. Install Visual Studio Build Tools
    echo 3. Install Python from python.org
    echo 4. Clear npm cache: npm cache clean --force
    echo 5. Try manual installation:
    echo    - npm install --no-optional
    echo    - cd test-app && npm install --no-optional
    echo    - npx playwright install
    echo.
    pause
    exit /b 1
)

echo.
echo ================================
echo  Installation Successful!
echo ================================
echo.
echo You can now run:
echo   npm test                    - Run all tests
echo   npm run test:dashboard      - Test new dashboard
echo   cd test-app && npm start    - Start test application
echo.
pause