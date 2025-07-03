@echo off
setlocal enabledelayedexpansion

echo ================================
echo    Test App Quick Launcher
echo ================================
echo.

REM Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js found: 
node --version
echo.

REM Check for command line arguments
set "MODE=enhanced"
set "PORT=3000"

:parse_args
if "%~1"=="" goto :start_server
if /i "%~1"=="--basic" set "MODE=basic"
if /i "%~1"=="-b" set "MODE=basic"
if /i "%~1"=="--enhanced" set "MODE=enhanced"
if /i "%~1"=="-e" set "MODE=enhanced"
if /i "%~1"=="--port" (
    set "PORT=%~2"
    shift
)
if /i "%~1"=="-p" (
    set "PORT=%~2"
    shift
)
if /i "%~1"=="--help" goto :show_help
if /i "%~1"=="-h" goto :show_help
shift
goto :parse_args

:start_server
echo Starting %MODE% test-app server on port %PORT%...
echo.

if /i "%MODE%"=="enhanced" (
    echo Starting Enhanced Server with Dashboard...
    node start-test-app.js --enhanced --port %PORT%
) else (
    echo Starting Basic Server...
    node start-test-app.js --basic --port %PORT%
)

goto :end

:show_help
echo.
echo Usage: start-test-app.bat [options]
echo.
echo Options:
echo   --enhanced, -e     Start enhanced server (with dashboard) [default]
echo   --basic, -b        Start basic server (original)
echo   --port, -p PORT    Specify port (default: 3000)
echo   --help, -h         Show this help message
echo.
echo Examples:
echo   start-test-app.bat                 # Start enhanced server
echo   start-test-app.bat --enhanced      # Start enhanced server
echo   start-test-app.bat --basic         # Start basic server
echo   start-test-app.bat --port 4000     # Start on port 4000
echo.
echo URLs (when running):
echo   Login Page:  http://localhost:3000/
echo   Dashboard:   http://localhost:3000/dashboard (enhanced only)
echo   Health:      http://localhost:3000/health
echo   API:         http://localhost:3000/api/
echo.

:end
if not "%1"=="--help" if not "%1"=="-h" pause