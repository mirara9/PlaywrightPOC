#!/usr/bin/env node

/**
 * Quick Playwright Installation Checker
 * Verifies if Playwright is properly installed and browsers are available
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkPlaywrightInstallation() {
  try {
    // Check if Playwright is installed
    const playwrightVersion = execSync('npx playwright --version', { 
      encoding: 'utf8', 
      stdio: 'pipe' 
    }).trim();
    
    log(`✅ Playwright installed: ${playwrightVersion}`, 'green');
    return true;
  } catch (error) {
    log('❌ Playwright not found or not working', 'red');
    return false;
  }
}

function checkBrowserInstallation() {
  try {
    // Try to check browsers
    execSync('npx playwright install --dry-run', { 
      encoding: 'utf8', 
      stdio: 'pipe' 
    });
    
    log('✅ Playwright browsers appear to be installed', 'green');
    return true;
  } catch (error) {
    log('❌ Playwright browsers not properly installed', 'red');
    return false;
  }
}

async function checkBrowserLaunch() {
  return new Promise((resolve) => {
    try {
      // Quick browser launch test
      const testScript = `
        const { chromium } = require('playwright');
        (async () => {
          try {
            const browser = await chromium.launch({ headless: true });
            await browser.close();
            process.exit(0);
          } catch (error) {
            process.exit(1);
          }
        })();
      `;
      
      const child = spawn('node', ['-e', testScript], {
        stdio: 'pipe',
        timeout: 10000
      });
      
      child.on('exit', (code) => {
        if (code === 0) {
          log('✅ Browser launch test passed', 'green');
          resolve(true);
        } else {
          log('❌ Browser launch test failed', 'red');
          resolve(false);
        }
      });
      
      child.on('error', () => {
        log('❌ Browser launch test failed', 'red');
        resolve(false);
      });
      
      // Timeout after 10 seconds
      setTimeout(() => {
        child.kill();
        log('❌ Browser launch test timed out', 'red');
        resolve(false);
      }, 10000);
      
    } catch (error) {
      log('❌ Browser launch test failed', 'red');
      resolve(false);
    }
  });
}

function checkSystemDependencies() {
  const os = require('os');
  const platform = os.platform();
  
  if (platform === 'linux') {
    // Check for common missing dependencies on Linux
    const commonDeps = ['libnspr4', 'libnss3', 'libasound2'];
    let missingDeps = [];
    
    for (const dep of commonDeps) {
      try {
        execSync(`dpkg -l | grep -q ${dep}`, { stdio: 'pipe' });
      } catch (error) {
        missingDeps.push(dep);
      }
    }
    
    if (missingDeps.length > 0) {
      log(`⚠️  Missing system dependencies: ${missingDeps.join(', ')}`, 'yellow');
      return false;
    } else {
      log('✅ System dependencies appear to be installed', 'green');
      return true;
    }
  } else {
    // Windows and macOS typically don't need manual dependency installation
    log(`✅ Platform ${platform} - dependencies handled automatically`, 'green');
    return true;
  }
}

function suggestFixes() {
  log('\n🔧 Suggested fixes:', 'blue');
  log('1. Run: npm run setup:force', 'blue');
  log('2. Or manually: ./scripts/setup-playwright.sh', 'blue');
  log('3. Or install dependencies: sudo npx playwright install-deps', 'blue');
  log('4. For Docker users: ./build.sh --local', 'blue');
  log('');
}

async function main() {
  log('🔍 Checking Playwright installation...', 'blue');
  
  let allGood = true;
  
  // Check Playwright installation
  if (!checkPlaywrightInstallation()) {
    allGood = false;
  }
  
  // Check browser installation
  if (!checkBrowserInstallation()) {
    allGood = false;
  }
  
  // Check system dependencies
  if (!checkSystemDependencies()) {
    allGood = false;
  }
  
  // Check browser launch
  if (!(await checkBrowserLaunch())) {
    allGood = false;
  }
  
  if (allGood) {
    log('\n🎉 All checks passed! Playwright is ready to use.', 'green');
    process.exit(0);
  } else {
    log('\n❌ Some checks failed. Playwright may not work properly.', 'red');
    suggestFixes();
    process.exit(1);
  }
}

// Handle CLI usage
if (require.main === module) {
  main().catch((error) => {
    log(`❌ Check failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = {
  checkPlaywrightInstallation,
  checkBrowserInstallation,
  checkSystemDependencies,
  checkBrowserLaunch
};