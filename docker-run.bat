@echo off
REM Docker Run Script for Playwright Test Framework (Windows)
REM Provides easy commands to run tests in different modes

setlocal EnableDelayedExpansion

REM Function to show help
if "%1"=="help" goto show_help
if "%1"=="" goto show_help

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker daemon is not running. Please start Docker Desktop.
    exit /b 1
)

REM Handle different commands
if "%1"=="test" goto run_tests
if "%1"=="test-api" goto run_api_tests
if "%1"=="test-ui" goto run_ui_tests
if "%1"=="test-integration" goto run_integration_tests
if "%1"=="shell" goto run_shell
if "%1"=="clean" goto clean_containers
if "%1"=="report" goto show_report
if "%1"=="build" goto build_image

echo [ERROR] Unknown command: %1
echo Use 'docker-run.bat help' for usage information
exit /b 1

:show_help
echo Playwright Test Framework - Docker Runner (Windows)
echo ===================================================
echo.
echo Usage: %0 [COMMAND] [OPTIONS]
echo.
echo Commands:
echo   test              Run all tests in Docker
echo   test-api          Run API tests only
echo   test-ui           Run UI tests only  
echo   test-integration  Run integration tests only
echo   shell             Open shell in Docker container
echo   clean             Clean up Docker containers and images
echo   report            Show test report
echo   build             Build Docker image
echo   help              Show this help
echo.
echo Examples:
echo   %0 test                    # Run all tests
echo   %0 test-api               # Run API tests only
echo   %0 test-ui --headed       # Run UI tests with visible browser
echo   %0 shell                  # Interactive shell
echo.
exit /b 0

:build_image
echo [INFO] Building Docker image...
docker build -t playwright-test-framework .
if errorlevel 1 (
    echo [ERROR] Failed to build Docker image
    exit /b 1
)
echo [SUCCESS] Docker image built successfully
goto end

:run_tests
echo [INFO] Running all tests in Docker...
docker run --rm ^
    -v "%cd%\test-results:/app/test-results" ^
    -v "%cd%\playwright-report:/app/playwright-report" ^
    -v "%cd%\screenshots:/app/screenshots" ^
    -e HEADLESS=true ^
    -e CI=true ^
    playwright-test-framework npm test %2 %3 %4 %5
goto end

:run_api_tests
echo [INFO] Running API tests in Docker...
docker run --rm ^
    -v "%cd%\test-results:/app/test-results" ^
    -v "%cd%\playwright-report:/app/playwright-report" ^
    -e HEADLESS=true ^
    -e CI=true ^
    playwright-test-framework npm test src/tests/api/ %2 %3 %4 %5
goto end

:run_ui_tests
echo [INFO] Running UI tests in Docker...
set UI_OPTIONS=
if "%2"=="--ui" set UI_OPTIONS=-e HEADLESS=false
if "%2"=="--headed" set UI_OPTIONS=-e HEADLESS=false

docker run --rm ^
    -v "%cd%\test-results:/app/test-results" ^
    -v "%cd%\playwright-report:/app/playwright-report" ^
    -v "%cd%\screenshots:/app/screenshots" ^
    -e CI=true ^
    %UI_OPTIONS% ^
    playwright-test-framework npm test src/tests/ui/ %3 %4 %5
goto end

:run_integration_tests
echo [INFO] Running integration tests in Docker...
docker run --rm ^
    -v "%cd%\test-results:/app/test-results" ^
    -v "%cd%\playwright-report:/app/playwright-report" ^
    -v "%cd%\screenshots:/app/screenshots" ^
    -e HEADLESS=true ^
    -e CI=true ^
    playwright-test-framework npm test src/tests/integration/ %2 %3 %4 %5
goto end

:run_shell
echo [INFO] Opening shell in Docker container...
docker run --rm -it ^
    -v "%cd%:/app/workspace" ^
    -v "%cd%\test-results:/app/test-results" ^
    -v "%cd%\playwright-report:/app/playwright-report" ^
    playwright-test-framework /bin/bash
goto end

:clean_containers
echo [INFO] Cleaning up Docker containers and images...
echo [INFO] Stopping containers...
for /f %%i in ('docker ps -q --filter "ancestor=playwright-test-framework"') do docker stop %%i

echo [INFO] Removing containers...
for /f %%i in ('docker ps -aq --filter "ancestor=playwright-test-framework"') do docker rm %%i

echo [INFO] Removing image...
docker rmi playwright-test-framework 2>nul || echo [WARNING] No image to remove

echo [SUCCESS] Cleanup completed
goto end

:show_report
echo [INFO] Starting test report server...
if exist "playwright-report\index.html" (
    echo [INFO] Opening test report at http://localhost:9323
    docker run --rm -p 9323:9323 ^
        -v "%cd%\playwright-report:/usr/share/nginx/html" ^
        nginx:alpine
) else (
    echo [ERROR] No test report found. Run tests first.
    exit /b 1
)
goto end

:end
endlocal