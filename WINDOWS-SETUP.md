# Windows Setup Guide

This guide provides Windows-specific instructions for setting up the Playwright test framework.

## 🚀 Quick Start (Windows)

### Option 1: Automatic Setup (Recommended)

```cmd
git clone <repository>
cd playwright-test-framework
npm install
```

This automatically handles all dependencies including Playwright browsers.

### Option 2: Manual Setup

```cmd
npm run setup:windows
```

### Option 3: Using PowerShell

```powershell
# Clone and setup
git clone <repository>
cd playwright-test-framework
npm install

# Verify setup
npm run verify
```

## 🧪 Running Tests on Windows

### Basic Commands

```cmd
REM Run all tests
npm test

REM Run tests with visible browser
npm run test:headed

REM Run retry tests
npm run test:retry

REM Run debug mode
npm run test:debug
```

### With Environment Variables

```cmd
REM Using the cross-platform runner
npm run test:retry
npm run test:max-retry
npm run test:no-retry

REM Manual environment variables (PowerShell)
$env:RETRY_COUNT=3; npm test

REM Manual environment variables (Command Prompt)
set RETRY_COUNT=3 && npm test
```

## 🔧 Troubleshooting Windows Issues

### Issue: Environment Variables Not Working

**Solution**: Use the built-in npm scripts that handle cross-platform environment variables:

```cmd
REM Instead of: RETRY_COUNT=3 npm test (doesn't work on Windows)
REM Use:
npm run test:retry

REM Or use the cross-platform runner directly:
node scripts/run-with-env.js RETRY_COUNT=3 playwright test
```

### Issue: Script Execution Policy (PowerShell)

If you get execution policy errors in PowerShell:

```powershell
# Check current policy
Get-ExecutionPolicy

# Set policy for current user (if needed)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Alternative: Run specific command
powershell -ExecutionPolicy Bypass -File "scripts\setup-playwright.ps1"
```

### Issue: Missing Dependencies

The framework automatically handles Windows dependencies, but if you encounter issues:

```cmd
REM Force fresh setup
npm run setup:force

REM Or manual Playwright installation
npx playwright install
npx playwright install-deps
```

### Issue: Path Issues

Use the Windows-specific scripts:

```cmd
REM Windows batch script
scripts\setup-playwright.bat

REM Verification
verify-setup.bat

REM Cross-platform (works everywhere)
npm run setup
npm run verify
```

## 📋 Available npm Scripts (Windows Compatible)

| Script | Purpose | Windows Compatible |
|--------|---------|-------------------|
| `npm install` | Automatic setup | ✅ |
| `npm run setup` | Manual setup trigger | ✅ |
| `npm run setup:windows` | Windows-specific setup | ✅ |
| `npm run verify` | Verify installation | ✅ |
| `npm test` | Run all tests | ✅ |
| `npm run test:retry` | Run retry tests | ✅ |
| `npm run test:headed` | Run with visible browser | ✅ |
| `npm run test:debug` | Debug mode | ✅ |

## 🎯 Best Practices for Windows

### 1. Use npm Scripts
Always use npm scripts instead of direct commands:
```cmd
REM Good ✅
npm run test:retry

REM Avoid ❌ (doesn't work on Windows CMD)
RETRY_COUNT=3 npm test
```

### 2. Use Node.js Cross-Platform Runner
For custom environment variables:
```cmd
node scripts/run-with-env.js RETRY_COUNT=5 HEADLESS=false playwright test
```

### 3. PowerShell vs Command Prompt
Both work, but PowerShell has better environment variable handling:

**Command Prompt:**
```cmd
set RETRY_COUNT=3 && npm test
```

**PowerShell:**
```powershell
$env:RETRY_COUNT=3; npm test
```

**Cross-Platform (Recommended):**
```cmd
npm run test:retry
```

## 🐳 Docker Alternative

If you prefer a consistent environment:

```cmd
REM Install Docker Desktop for Windows first
docker build -t playwright-test-framework .
docker run --rm playwright-test-framework npm test
```

## 🔍 Verification Commands

```cmd
REM Check if everything is working
npm run verify

REM Check specific components
node --version
npm --version
npx playwright --version

REM Test browser launch
node -e "const { chromium } = require('playwright'); (async () => { const browser = await chromium.launch(); await browser.close(); console.log('✅ Browser test passed'); })()"
```

## 📞 Windows-Specific Support

If you encounter Windows-specific issues:

1. **Use npm scripts** - they handle cross-platform compatibility
2. **Check Node.js version** - ensure you have Node.js 16+ installed
3. **Use PowerShell** - generally better than Command Prompt for development
4. **Docker fallback** - use Docker Desktop if local setup fails
5. **WSL option** - consider using Windows Subsystem for Linux

## 🎉 Quick Test

Verify everything works:

```cmd
cd playwright-test-framework
npm install
npm run verify
npm run test:retry
```

If this succeeds, your Windows setup is complete! 🎉