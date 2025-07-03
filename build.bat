@echo off
REM Playwright Test Framework Build Script (Windows)
REM This script installs all dependencies and prepares the environment for testing

setlocal EnableDelayedExpansion

echo 🚀 Starting Playwright Test Framework Build Process...

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed. Please install Docker Desktop for Windows.
    echo Download from: https://docs.docker.com/desktop/windows/install/
    exit /b 1
)

echo [SUCCESS] Docker is installed

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker daemon is not running. Please start Docker Desktop.
    exit /b 1
)

echo [SUCCESS] Docker daemon is running

REM Parse command line arguments
set LOCAL_INSTALL=false
set SKIP_DOCKER=false

:parse_args
if "%1"=="--local" (
    set LOCAL_INSTALL=true
    shift
    goto parse_args
)
if "%1"=="--skip-docker" (
    set SKIP_DOCKER=true
    shift
    goto parse_args
)
if "%1"=="--help" (
    echo Usage: %0 [OPTIONS]
    echo.
    echo Options:
    echo   --local       Install dependencies locally ^(in addition to Docker^)
    echo   --skip-docker Skip Docker setup
    echo   --help        Show this help message
    echo.
    echo Examples:
    echo   %0                    # Build Docker image only
    echo   %0 --local           # Install locally and build Docker image
    echo   %0 --skip-docker     # Install locally only
    exit /b 0
)
if "%1" neq "" (
    echo [ERROR] Unknown option: %1
    echo Use --help for usage information
    exit /b 1
)

REM Install local dependencies if requested
if "%LOCAL_INSTALL%"=="true" (
    echo [INFO] Installing local Node.js dependencies...
    
    REM Install root dependencies
    if exist "package.json" (
        call npm install
        if errorlevel 1 (
            echo [ERROR] Failed to install root dependencies
            exit /b 1
        )
        echo [SUCCESS] Root dependencies installed
    )
    
    REM Install test-app dependencies
    if exist "test-app\package.json" (
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
    
    REM Install Playwright browsers
    echo [INFO] Installing Playwright browsers...
    call npx playwright install
    if errorlevel 1 (
        echo [ERROR] Failed to install Playwright browsers
        exit /b 1
    )
    
    REM Install system dependencies for Playwright
    echo [INFO] Installing Playwright system dependencies...
    call npx playwright install-deps
    if errorlevel 1 (
        echo [WARNING] Could not install system dependencies. This is normal on Windows.
    )
    
    echo [SUCCESS] Local dependencies installed
)

REM Docker setup
if "%SKIP_DOCKER%"=="false" (
    echo [INFO] Creating necessary directories...
    if not exist "test-results" mkdir test-results
    if not exist "playwright-report" mkdir playwright-report
    if not exist "screenshots" mkdir screenshots
    echo [SUCCESS] Directories created
    
    echo [INFO] Building Docker image...
    docker build -t playwright-test-framework .
    if errorlevel 1 (
        echo [ERROR] Failed to build Docker image
        exit /b 1
    )
    echo [SUCCESS] Docker image built successfully
    
    echo [INFO] Docker setup complete. You can now run tests with:
    echo.
    echo   🐳 Docker Commands:
    echo      docker-compose up                    # Run tests in headless mode
    echo      docker-compose --profile ui-tests up # Run tests with UI
    echo      docker-compose --profile development up # Development mode
    echo.
    echo   🧪 Direct Docker Commands:
    echo      docker run --rm playwright-test-framework                    # Run all tests
    echo      docker run --rm playwright-test-framework npm test src/tests/api/ # Run API tests only
    echo.
)

if "%LOCAL_INSTALL%"=="true" (
    echo [INFO] Local setup complete. You can now run tests with:
    echo.
    echo   💻 Local Commands:
    echo      npm test                             # Run all tests
    echo      npm run test:headed                  # Run tests with visible UI
    echo      npm test src/tests/api/              # Run API tests only
    echo.
)

echo [SUCCESS] 🎉 Build process completed successfully!
echo.
echo 📚 Additional Information:
echo    - Test results will be saved in: .\test-results\
echo    - HTML reports will be saved in: .\playwright-report\
echo    - Screenshots will be saved in: .\screenshots\
echo    - Use 'npm run test:report' to view the HTML report
echo.

endlocal