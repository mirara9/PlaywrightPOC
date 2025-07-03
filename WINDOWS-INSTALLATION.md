# Windows Setup Guide for Playwright POC

This guide provides Windows-specific installation instructions and troubleshooting for the Playwright POC framework.

## Quick Start (Recommended)

### Option 1: Automated Installation Script
```bash
# Run the automated Windows installer
npm run install:windows
```

### Option 2: Batch File (if Node.js issues)
```cmd
# Double-click or run from Command Prompt
install-windows.bat
```

### Option 3: PowerShell Script
```powershell
# Run from PowerShell
.\install-windows.ps1
```

## Manual Installation

If automated installation fails, follow these manual steps:

### 1. Prerequisites

#### Required Software:
- **Node.js 16+**: Download from [nodejs.org](https://nodejs.org/)
- **Git**: Download from [git-scm.com](https://git-scm.com/)

#### Recommended Software:
- **Visual Studio Build Tools**: For native module compilation
  - Download from [Visual Studio Downloads](https://visualstudio.microsoft.com/downloads/)
  - Or install via: `npm install -g windows-build-tools`
- **Python 3.x**: For node-gyp compatibility
  - Download from [python.org](https://python.org/)

### 2. Clone and Setup

```bash
# Clone repository
git clone https://github.com/mirara9/PlaywrightPOC.git
cd PlaywrightPOC

# Clean install (recommended for Windows)
npm run install:windows:clean

# Or manual installation
npm install --no-optional
cd test-app && npm install --no-optional
cd ..
npx playwright install
```

### 3. Verify Installation

```bash
# Run verification
npm run verify
npm run test:health
cd test-app && npm run test:health
```

## Common Windows Issues and Solutions

### Issue 1: npm install fails with EACCES errors

**Solution:**
```bash
# Option A: Run as Administrator
# Right-click Command Prompt/PowerShell → "Run as Administrator"

# Option B: Configure npm to use different directory
npm config set prefix %APPDATA%\npm
npm config set cache %APPDATA%\npm-cache
```

### Issue 2: node-gyp compilation errors

**Symptoms:**
- Errors mentioning "MSBuild", "Visual Studio", or "Python"
- Native module compilation failures

**Solutions:**
```bash
# Install build tools
npm install -g windows-build-tools

# Or install Visual Studio Build Tools manually
# Download from: https://visualstudio.microsoft.com/thank-you-downloading-visual-studio/?sku=BuildTools

# Configure npm to use specific Python version
npm config set python python
```

### Issue 3: Path length limitations

**Symptoms:**
- "path too long" errors
- File system errors in node_modules

**Solutions:**
```bash
# Enable long paths (requires Admin privileges)
# In PowerShell as Administrator:
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force

# Alternative: Use shorter project path
# Move project to C:\dev\playwright-poc
```

### Issue 4: PowerShell execution policy

**Symptoms:**
- "execution of scripts is disabled on this system"

**Solution:**
```powershell
# In PowerShell as Administrator:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Issue 5: Playwright browser installation fails

**Solutions:**
```bash
# Manual browser installation
npx playwright install chromium
npx playwright install firefox
npx playwright install webkit

# Or install specific browser only
npx playwright install chromium --force

# Check Playwright installation
npx playwright --version
```

### Issue 6: Test execution fails

**Common Solutions:**
```bash
# Clear caches
npm cache clean --force
npm run clean

# Rebuild project
npm run build

# Check specific test
npm run test:dashboard:debug
```

## Windows-Specific npm Scripts

The following npm scripts are optimized for Windows:

```bash
# Installation
npm run install:windows           # Full Windows installation
npm run install:windows:clean     # Clean install (removes node_modules)
npm run install:windows:quick     # Skip Playwright browser download

# Testing
npm run test:windows              # Windows-optimized test execution
npm run test:dashboard            # Test the new dashboard
npm run test:dashboard:headed     # Test with visible browser

# Development
npm run dev                       # Start development mode
cd test-app && npm run start:enhanced   # Start enhanced test app

# Cleaning
npm run clean:windows             # Windows-specific clean
npm run clean                     # Cross-platform clean
```

## Environment Variables

Set these environment variables for better Windows compatibility:

```bash
# In Command Prompt:
set npm_config_msvs_version=2022
set npm_config_python=python
set npm_config_cache=%TEMP%\npm-cache

# In PowerShell:
$env:npm_config_msvs_version="2022"
$env:npm_config_python="python"
$env:npm_config_cache="$env:TEMP\npm-cache"
```

## Project Structure for Windows

```
PlaywrightPOC/
├── install-windows.bat          # Windows batch installer
├── install-windows.ps1          # PowerShell installer
├── scripts/
│   ├── windows-install.js       # Windows installation helper
│   └── cross-platform-runner.js # Cross-platform script runner
├── src/
│   └── tests/
│       └── ui/
│           └── dashboard-comprehensive.ui.test.ts  # 50 UI tests
├── test-app/                    # Enhanced test application
│   ├── src/
│   │   ├── server.js           # Original server
│   │   └── enhanced-server.js  # Enhanced server with dashboard
│   └── public/
│       ├── index.html          # Login page
│       ├── dashboard.html      # Dashboard interface
│       └── dashboard.js        # Dashboard functionality
└── package.json
```

## Performance Tips for Windows

1. **Use Windows Defender exclusions:**
   - Add project folder to Windows Defender exclusions
   - Add `node_modules` folders to exclusions

2. **Use faster storage:**
   - Install on SSD if available
   - Avoid network drives

3. **Close unnecessary applications:**
   - Playwright tests can be resource-intensive
   - Close browsers and heavy applications during test runs

4. **Use PowerShell instead of CMD:**
   - PowerShell has better Unicode support
   - Better error handling and output formatting

## Troubleshooting Commands

```bash
# Check system information
node --version
npm --version
npx playwright --version

# Check npm configuration
npm config list
npm config get registry
npm config get cache

# Check installed packages
npm list --depth=0
cd test-app && npm list --depth=0

# Reset npm configuration
npm config delete prefix
npm config delete cache
npm cache clean --force

# Reinstall from scratch
npm run install:windows:clean
```

## Getting Help

If you continue to experience issues:

1. **Check the logs:** Look for detailed error messages in the console output
2. **Try clean installation:** Use `npm run install:windows:clean`
3. **Check system requirements:** Ensure all prerequisites are installed
4. **Run diagnostics:** Use the built-in diagnostic scripts
5. **Create an issue:** Include your system information and error messages

## Enhanced Test Application

The project includes an enhanced test application with:

- **Full Dashboard Interface**: Modern responsive design
- **50 Comprehensive UI Tests**: Complete coverage of all features
- **Cross-platform Support**: Works on Windows, Linux, and macOS
- **API Integration**: RESTful backend with authentication
- **Real-time Features**: Live updates and notifications

### Starting the Enhanced Test App

```bash
# Start the enhanced server
cd test-app
npm run start:enhanced

# Access the application
# Login: http://localhost:3000
# Dashboard: http://localhost:3000/dashboard
```

### Running the Dashboard Tests

```bash
# Run all 50 dashboard tests
npm run test:dashboard

# Run with visible browser (for debugging)
npm run test:dashboard:headed

# Run in debug mode
npm run test:dashboard:debug
```

## Success Indicators

When installation is successful, you should see:

- ✅ All npm packages installed without errors
- ✅ Playwright browsers downloaded successfully
- ✅ Build completes without errors
- ✅ Test execution works (`npm test`)
- ✅ Enhanced test app starts (`cd test-app && npm run start:enhanced`)
- ✅ Dashboard tests pass (`npm run test:dashboard`)

---

*For general setup instructions, see [SETUP.md](./SETUP.md)*
*For cross-platform information, see [CROSS-PLATFORM.md](./CROSS-PLATFORM.md)*