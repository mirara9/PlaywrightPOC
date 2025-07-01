# Playwright Test Framework Setup Guide

This guide provides automatic setup instructions for the Playwright test framework with comprehensive dependency management.

## 🚀 Automatic Setup (Recommended)

The framework now handles Playwright dependencies automatically. Simply run:

```bash
npm install
```

This will automatically:
- Install Node.js dependencies
- Install Playwright browsers
- Install system dependencies (with sudo if available)
- Verify the installation

## 📋 Manual Setup Options

### Option 1: One-Command Setup
```bash
npm run setup
```

### Option 2: Force Fresh Setup
```bash
npm run setup:force
```

### Option 3: Script-Based Setup
```bash
./scripts/setup-playwright.sh
```

## 🔍 Verification

Check if everything is working:

```bash
npm run verify
# or
./verify-setup.sh
```

## 🐳 Docker Setup (Alternative)

If you prefer a containerized environment:

```bash
# Build and setup everything in Docker
./build.sh --local

# Or just Docker
./build.sh
```

## 🛠️ Troubleshooting

### Issue: "Host system is missing dependencies"

The framework will automatically try to fix this, but if it fails:

#### Linux/Ubuntu/WSL:
```bash
sudo apt-get update
sudo apt-get install libnspr4 libnss3 libasound2t64 libgconf-2-4 libxrandr2 libxcomposite1 libxdamage1 libxi6 libxtst6 libatk1.0-0 libdrm2 libxss1 libgtk-3-0 libgbm1 xvfb
```

#### Or use Playwright's installer:
```bash
sudo npx playwright install-deps
```

### Issue: Permission Denied

If you get permission errors:

```bash
# Make scripts executable
chmod +x scripts/setup-playwright.sh
chmod +x verify-setup.sh

# Or run with explicit permissions
bash scripts/setup-playwright.sh
```

### Issue: Browser Launch Fails

1. Check dependencies:
   ```bash
   npm run setup:check
   ```

2. Force reinstall:
   ```bash
   npm run setup:force
   ```

3. Use Docker as fallback:
   ```bash
   ./build.sh --local
   ```

## 📁 Environment-Specific Notes

### WSL (Windows Subsystem for Linux)
- Automatic detection and appropriate dependency installation
- May require `sudo` for system dependencies

### Linux
- Supports APT, YUM, DNF, and Pacman package managers
- Automatic detection of package manager

### macOS
- System dependencies handled automatically by Playwright

### Windows
- System dependencies handled automatically by Playwright

### Docker
- All dependencies pre-installed in the official Playwright image

## 🧪 Testing the Setup

After setup, test with:

```bash
# Basic test
npm test

# Retry functionality test
npm run test:retry

# Headed mode (see browser)
npm run test:headed

# Debug mode
npm run test:debug
```

## ⚙️ Configuration

### Environment Variables

- `HEADLESS=false` - Run tests with visible browser
- `RETRY_COUNT=3` - Number of retry attempts
- `SLOW_MO=1000` - Slow down operations (ms)

### Example:
```bash
HEADLESS=false RETRY_COUNT=5 npm test
```

## 🔧 Scripts Reference

| Script | Purpose |
|--------|---------|
| `npm install` | Automatic setup (postinstall hook) |
| `npm run setup` | Manual setup trigger |
| `npm run setup:force` | Force fresh setup |
| `npm run setup:check` | Quick dependency check |
| `npm run verify` | Full verification |
| `npm test` | Run tests (with auto-check) |
| `npm run test:retry` | Test retry functionality |

## 📞 Support

If you encounter issues:

1. Run `npm run setup:check` for diagnostics
2. Check `./verify-setup.sh` output
3. Try `npm run setup:force`
4. Use Docker setup as fallback: `./build.sh --local`
5. Check the GitHub Actions logs for working examples

## 🎯 Quick Start

For new users:

```bash
# Clone and setup
git clone <repository>
cd playwright-test-framework
npm install

# Verify everything works
npm run verify

# Run your first test
npm run test:retry
```

The framework will handle all dependencies automatically! 🎉