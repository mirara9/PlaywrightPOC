@echo off
setlocal enabledelayedexpansion

echo =======================================
echo   Windows Diagnostic for Test App
echo =======================================
echo.

echo === System Information ===
echo OS: %OS%
echo Processor: %PROCESSOR_ARCHITECTURE%
echo User: %USERNAME%
echo Computer: %COMPUTERNAME%
echo.

echo === Node.js Information ===
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Node.js: FOUND
    for /f "tokens=*" %%a in ('node --version') do echo Version: %%a
) else (
    echo Node.js: NOT FOUND
    echo Please install Node.js from https://nodejs.org/
)
echo.

echo === npm Information ===
where npm.cmd >nul 2>&1
if %errorlevel% equ 0 (
    echo npm.cmd: FOUND
    for /f "tokens=*" %%a in ('npm.cmd --version') do echo Version: %%a
    echo Location: 
    where npm.cmd
) else (
    where npm >nul 2>&1
    if %errorlevel% equ 0 (
        echo npm: FOUND
        for /f "tokens=*" %%a in ('npm --version') do echo Version: %%a
        echo Location: 
        where npm
    ) else (
        echo npm: NOT FOUND
        echo Please ensure Node.js is properly installed
    )
)
echo.

echo === PATH Information ===
echo PATH contains:
echo %PATH%
echo.

echo === Test App Files ===
if exist "start-test-app.js" (
    echo start-test-app.js: FOUND
) else (
    echo start-test-app.js: NOT FOUND
)

if exist "start-test-app.bat" (
    echo start-test-app.bat: FOUND
) else (
    echo start-test-app.bat: NOT FOUND
)

if exist "start-test-app.ps1" (
    echo start-test-app.ps1: FOUND
) else (
    echo start-test-app.ps1: NOT FOUND
)

if exist "test-app\package.json" (
    echo test-app\package.json: FOUND
) else (
    echo test-app\package.json: NOT FOUND
    echo Please ensure you are in the correct directory
)

if exist "test-app\node_modules" (
    echo test-app\node_modules: FOUND
) else (
    echo test-app\node_modules: NOT FOUND
    echo Run: cd test-app && npm install
)
echo.

echo === Testing Node.js Execution ===
node start-test-app.js --help >nul 2>&1
if %errorlevel% equ 0 (
    echo Test App Script: WORKING
    echo You can run: node start-test-app.js
) else (
    echo Test App Script: ERROR
    echo There may be an issue with the script
)
echo.

echo === Recommendations ===
echo 1. Ensure Node.js is installed from https://nodejs.org/
echo 2. Run "cd test-app && npm install" to install dependencies
echo 3. Try running: node start-test-app.js --help
echo 4. If issues persist, try running as Administrator
echo.

echo === Quick Test Commands ===
echo Try these commands:
echo   node start-test-app.js --help
echo   node start-test-app.js --basic
echo   start-test-app.bat
echo   npm run start:test-app
echo.

pause