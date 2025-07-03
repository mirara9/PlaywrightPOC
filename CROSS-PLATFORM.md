# Cross-Platform Compatibility Guide

This document outlines the comprehensive cross-platform compatibility features implemented in the Playwright Test Framework, ensuring seamless operation on both Windows and Linux environments.

## 🌍 Supported Platforms

### ✅ Fully Supported
- **Windows 10/11** (Command Prompt, PowerShell)
- **Linux** (Ubuntu, Debian, CentOS, Fedora, Arch)
- **WSL (Windows Subsystem for Linux)**
- **macOS** (Intel and Apple Silicon)
- **Docker** (all platforms)

### 🔧 Package Managers Supported
- **Linux**: APT, YUM, DNF, Pacman
- **macOS**: Homebrew (automatic)
- **Windows**: Chocolatey (optional)

## 🚀 Cross-Platform Features

### 1. **Automatic Environment Detection**
```javascript
// Detects platform automatically
process.platform === 'win32' ? 'windows-script.bat' : './unix-script.sh'
```

### 2. **Cross-Platform Script Runner**
```bash
# Same command works everywhere
npm run test:retry
npm run docker:build
npm run setup
```

### 3. **Path Handling**
```javascript
// All paths use Node.js path.join() for cross-platform compatibility
const filePath = path.join('test-results', 'screenshots', 'test.png');
```

### 4. **Environment Variables**
```bash
# Cross-platform environment variable setting
node scripts/run-with-env.js RETRY_COUNT=3 HEADLESS=false playwright test
```

## 📋 Platform-Specific Files

### Windows Files
- `build.bat` - Windows build script
- `docker-run.bat` - Windows Docker runner
- `scripts/setup-playwright.bat` - Windows setup
- `verify-setup.bat` - Windows verification (auto-generated)

### Unix Files  
- `build.sh` - Unix build script
- `docker-run.sh` - Unix Docker runner
- `scripts/setup-playwright.sh` - Unix setup
- `verify-setup.sh` - Unix verification (auto-generated)

### Cross-Platform Files
- `scripts/cross-platform-runner.js` - Platform detection and script execution
- `scripts/run-with-env.js` - Environment variable handling
- `scripts/check-playwright.js` - Dependency verification
- `scripts/platform-test.js` - Compatibility testing

## 🧪 Cross-Platform npm Scripts

| Script | Windows | Linux | Description |
|--------|---------|--------|-------------|
| `npm run setup` | ✅ | ✅ | Automatic setup |
| `npm run test:retry` | ✅ | ✅ | Retry tests |
| `npm run test:headed` | ✅ | ✅ | Visible browser |
| `npm run docker:build` | ✅ | ✅ | Docker build |
| `npm run verify` | ✅ | ✅ | Verify setup |
| `npm run test:platform` | ✅ | ✅ | Platform tests |

## 🔧 Setup Commands

### Quick Setup (All Platforms)
```bash
# Clone and setup
git clone <repository>
cd playwright-test-framework
npm install
npm run setup
```

### Platform-Specific Setup

#### Windows
```cmd
REM Command Prompt
npm run setup:windows
verify-setup.bat

REM PowerShell  
npm run setup
npm run verify
```

#### Linux/macOS
```bash
# Bash/Zsh
npm run setup:unix
./verify-setup.sh

# Or universal
npm run setup
npm run verify
```

#### Docker (Any Platform)
```bash
npm run docker:build
npm run docker:test
```

## 🧪 Testing Cross-Platform Compatibility

### Comprehensive Platform Test
```bash
npm run test:platform
```

This runs a full suite of cross-platform compatibility tests:
- ✅ Node.js environment verification
- ✅ Dependency installation
- ✅ TypeScript compilation  
- ✅ Cross-platform scripts
- ✅ Environment variables
- ✅ File path handling
- ✅ Docker integration (optional)

### Manual Testing
```bash
# Test environment variables
node scripts/run-with-env.js TEST_VAR=123 echo "Test passed"

# Test script selection
npm run docker:build  # Automatically chooses .bat or .sh

# Test path handling
npm run test:retry     # Works with cross-platform paths
```

## 🔍 Troubleshooting by Platform

### Windows Issues

#### Issue: `'RETRY_COUNT' is not recognized`
**Solution**: Use npm scripts instead of direct environment variables
```cmd
REM Instead of: RETRY_COUNT=3 npm test
REM Use:
npm run test:retry
```

#### Issue: Execution Policy Error (PowerShell)
**Solution**: 
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### Issue: Docker not working
**Solution**: Install Docker Desktop for Windows

### Linux Issues

#### Issue: Missing system dependencies
**Solution**: 
```bash
sudo npx playwright install-deps
# or
npm run setup:force
```

#### Issue: Permission denied
**Solution**:
```bash
chmod +x scripts/*.sh
npm run setup
```

### WSL Issues

#### Issue: X11 forwarding for GUI tests
**Solution**:
```bash
export DISPLAY=:0
# Or use headless mode
npm run test:retry
```

## 📊 Platform Compatibility Matrix

| Feature | Windows | Linux | macOS | WSL | Docker |
|---------|---------|--------|-------|-----|--------|
| **Basic Setup** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Dependency Install** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **TypeScript Build** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Headless Tests** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Headed Tests** | ✅ | ✅ | ✅ | ⚠️ | ⚠️ |
| **Docker Support** | ✅ | ✅ | ✅ | ✅ | N/A |
| **Auto Retry** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **CI/CD** | ✅ | ✅ | ✅ | ✅ | ✅ |

**Legend**: ✅ Full Support, ⚠️ Limited Support (requires X11/display)

## 🎯 Best Practices

### 1. **Always Use npm Scripts**
```bash
# Good ✅
npm run test:retry
npm run docker:build

# Avoid ❌ (platform-specific)
RETRY_COUNT=3 npm test  # Doesn't work on Windows
./build.sh              # Doesn't work on Windows
```

### 2. **Use Cross-Platform Paths**
```javascript
// Good ✅
const filePath = path.join('test-results', 'screenshots', 'test.png');

// Avoid ❌
const filePath = 'test-results/screenshots/test.png'; // Unix-only
const filePath = 'test-results\\screenshots\\test.png'; // Windows-only
```

### 3. **Use the Cross-Platform Runner**
```bash
# For custom environment variables
node scripts/run-with-env.js MY_VAR=value HEADLESS=false playwright test
```

### 4. **Test on Multiple Platforms**
```bash
# Regular testing
npm run test:platform

# Platform-specific testing
npm run test:retry      # Should work everywhere
npm run docker:test     # Should work everywhere
```

## 🚀 CI/CD Considerations

### GitHub Actions
```yaml
strategy:
  matrix:
    os: [ubuntu-latest, windows-latest, macos-latest]
runs-on: ${{ matrix.os }}
steps:
  - uses: actions/checkout@v4
  - run: npm install
  - run: npm run setup
  - run: npm run test:platform
```

### Docker
```yaml
# Works on any platform with Docker
- run: npm run docker:build
- run: npm run docker:test
```

## 📞 Support

For platform-specific issues:

1. **Run platform diagnostics**: `npm run test:platform`
2. **Check setup**: `npm run verify`
3. **Force fresh setup**: `npm run setup:force`
4. **Use Docker fallback**: `npm run docker:build`

The framework is designed to work identically across all supported platforms! 🎉