@echo off
REM Windows Playwright Setup Script
REM Handles all Playwright dependencies automatically for Windows

setlocal EnableDelayedExpansion

echo ======================================
echo    Automatic Playwright Setup
echo ======================================
echo.

echo [INFO] Detecting Windows environment...
echo [INFO] Running on Windows

REM Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Please install Node.js first.
    echo Download from: https://nodejs.org/
    exit /b 1
)

echo [SUCCESS] Node.js is available

REM Check if npm is available
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not available. Please ensure Node.js is properly installed.
    exit /b 1
)

echo [SUCCESS] npm is available

echo [INFO] Installing Node.js dependencies...
call npm install
if errorlevel 1 (
    echo [ERROR] Failed to install Node.js dependencies
    exit /b 1
)

echo [SUCCESS] Node.js dependencies installed

REM Install test-app dependencies if directory exists
if exist "test-app\package.json" (
    echo [INFO] Installing test-app dependencies...
    cd test-app
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install test-app dependencies
        cd ..
        exit /b 1
    )
    cd ..
    echo [SUCCESS] Test-app dependencies installed
)

echo [INFO] Installing Playwright browsers...
call npx playwright install
if errorlevel 1 (
    echo [ERROR] Failed to install Playwright browsers
    exit /b 1
)

echo [SUCCESS] Playwright browsers installed

echo [INFO] Installing Playwright system dependencies...
call npx playwright install-deps
if errorlevel 1 (
    echo [WARNING] System dependencies installation had issues
    echo [WARNING] This is normal on Windows - dependencies are handled automatically
)

echo [SUCCESS] System dependencies handled

echo [INFO] Verifying installation...
call npx playwright --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Playwright verification failed
    exit /b 1
)

echo [SUCCESS] Playwright is working correctly

REM Create verification script
echo @echo off > verify-setup.bat
echo echo 🔍 Verifying Playwright setup... >> verify-setup.bat
echo. >> verify-setup.bat
echo REM Check Node.js >> verify-setup.bat
echo node --version ^>nul 2^>^&1 >> verify-setup.bat
echo if errorlevel 1 ^( >> verify-setup.bat
echo     echo ❌ Node.js not found >> verify-setup.bat
echo ^) else ^( >> verify-setup.bat
echo     echo ✅ Node.js: >> verify-setup.bat
echo     node --version >> verify-setup.bat
echo ^) >> verify-setup.bat
echo. >> verify-setup.bat
echo REM Check npm >> verify-setup.bat
echo npm --version ^>nul 2^>^&1 >> verify-setup.bat
echo if errorlevel 1 ^( >> verify-setup.bat
echo     echo ❌ npm not found >> verify-setup.bat
echo ^) else ^( >> verify-setup.bat
echo     echo ✅ npm: >> verify-setup.bat
echo     npm --version >> verify-setup.bat
echo ^) >> verify-setup.bat
echo. >> verify-setup.bat
echo REM Check Playwright >> verify-setup.bat
echo npx playwright --version ^>nul 2^>^&1 >> verify-setup.bat
echo if errorlevel 1 ^( >> verify-setup.bat
echo     echo ❌ Playwright not working properly >> verify-setup.bat
echo ^) else ^( >> verify-setup.bat
echo     echo ✅ Playwright: >> verify-setup.bat
echo     npx playwright --version >> verify-setup.bat
echo ^) >> verify-setup.bat
echo. >> verify-setup.bat
echo echo 🏁 Verification complete >> verify-setup.bat

echo [SUCCESS] Created verify-setup.bat script

echo.
echo 🎉 Playwright setup completed successfully!
echo.
echo 📋 Next steps:
echo    1. Run 'verify-setup.bat' to verify everything is working
echo    2. Run 'npm test' to run your tests
echo    3. Run 'npm run test:retry' to test the retry functionality
echo.
echo 🆘 If you encounter issues:
echo    - Check 'verify-setup.bat' output
echo    - Use Docker setup with './build.sh' for a contained environment
echo.

endlocal