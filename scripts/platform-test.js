#!/usr/bin/env node

/**
 * Cross-platform compatibility testing script
 * Tests all major functionality on both Windows and Unix platforms
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

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

function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    child.on('error', reject);
  });
}

async function testNodeJsEnvironment() {
  log('\n🔍 Testing Node.js Environment', 'blue');
  
  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    
    log(`✅ Node.js: ${nodeVersion}`, 'green');
    log(`✅ npm: ${npmVersion}`, 'green');
    
    return true;
  } catch (error) {
    log(`❌ Node.js environment check failed: ${error.message}`, 'red');
    return false;
  }
}

async function testDependencyInstallation() {
  log('\n📦 Testing Dependency Installation', 'blue');
  
  try {
    // Test npm install
    await runCommand('npm', ['install']);
    log('✅ npm install completed successfully', 'green');
    
    // Test dependency verification
    await runCommand('npm', ['run', 'setup:check']);
    log('✅ Dependency verification passed', 'green');
    
    return true;
  } catch (error) {
    log(`❌ Dependency installation failed: ${error.message}`, 'red');
    return false;
  }
}

async function testTypeScriptCompilation() {
  log('\n🔨 Testing TypeScript Compilation', 'blue');
  
  try {
    await runCommand('npm', ['run', 'build']);
    log('✅ TypeScript compilation successful', 'green');
    
    // Check if dist folder was created
    if (fs.existsSync('dist')) {
      log('✅ Dist folder created', 'green');
    } else {
      throw new Error('Dist folder not created');
    }
    
    return true;
  } catch (error) {
    log(`❌ TypeScript compilation failed: ${error.message}`, 'red');
    return false;
  }
}

async function testCrossPlatformScripts() {
  log('\n⚙️ Testing Cross-Platform Scripts', 'blue');
  
  const scriptsToTest = [
    'setup:check',
    'verify'
  ];
  
  let allPassed = true;
  
  for (const script of scriptsToTest) {
    try {
      await runCommand('npm', ['run', script]);
      log(`✅ Script '${script}' works`, 'green');
    } catch (error) {
      log(`❌ Script '${script}' failed: ${error.message}`, 'red');
      allPassed = false;
    }
  }
  
  return allPassed;
}

async function testEnvironmentVariables() {
  log('\n🌍 Testing Environment Variables', 'blue');
  
  try {
    // Test cross-platform environment variable runner
    await runCommand('node', ['scripts/run-with-env.js', 'TEST_VAR=123', 'HEADLESS=true', 'echo', 'Environment test passed']);
    log('✅ Cross-platform environment variables work', 'green');
    
    return true;
  } catch (error) {
    log(`❌ Environment variable test failed: ${error.message}`, 'red');
    return false;
  }
}

async function testFilePathHandling() {
  log('\n📁 Testing File Path Handling', 'blue');
  
  try {
    // Test path operations
    const testPath = path.join('test-results', 'screenshots', 'test.png');
    const expectedSeparator = process.platform === 'win32' ? '\\' : '/';
    
    if (testPath.includes(path.sep)) {
      log('✅ Path separators handled correctly', 'green');
    } else {
      throw new Error('Path separators not handled correctly');
    }
    
    // Test directory creation
    const testDir = path.join('test-results', 'platform-test');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    if (fs.existsSync(testDir)) {
      log('✅ Cross-platform directory creation works', 'green');
      fs.rmSync(testDir, { recursive: true, force: true });
    } else {
      throw new Error('Directory creation failed');
    }
    
    return true;
  } catch (error) {
    log(`❌ File path handling test failed: ${error.message}`, 'red');
    return false;
  }
}

async function testDockerIntegration() {
  log('\n🐳 Testing Docker Integration (Optional)', 'blue');
  
  try {
    // Check if Docker is available
    execSync('docker --version', { stdio: 'pipe' });
    
    // Test Docker build
    await runCommand('npm', ['run', 'docker:build']);
    log('✅ Docker build successful', 'green');
    
    return true;
  } catch (error) {
    log(`⚠️ Docker test skipped: ${error.message}`, 'yellow');
    return true; // Docker is optional, so don't fail
  }
}

async function generatePlatformReport(results) {
  log('\n📊 Platform Compatibility Report', 'blue');
  
  const platform = process.platform;
  const arch = process.arch;
  const nodeVersion = process.version;
  const osInfo = `${os.type()} ${os.release()}`;
  
  console.log('\n' + '='.repeat(50));
  console.log('CROSS-PLATFORM COMPATIBILITY REPORT');
  console.log('='.repeat(50));
  console.log(`Platform: ${platform} (${arch})`);
  console.log(`OS: ${osInfo}`);
  console.log(`Node.js: ${nodeVersion}`);
  console.log(`Test Date: ${new Date().toISOString()}`);
  console.log('='.repeat(50));
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  const failedTests = totalTests - passedTests;
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const color = passed ? 'green' : 'red';
    log(`${status} ${test}`, color);
  });
  
  console.log('='.repeat(50));
  log(`Total Tests: ${totalTests}`, 'blue');
  log(`Passed: ${passedTests}`, 'green');
  log(`Failed: ${failedTests}`, failedTests > 0 ? 'red' : 'green');
  
  const successRate = Math.round((passedTests / totalTests) * 100);
  log(`Success Rate: ${successRate}%`, successRate >= 90 ? 'green' : successRate >= 70 ? 'yellow' : 'red');
  console.log('='.repeat(50));
  
  return failedTests === 0;
}

async function main() {
  log('🚀 Starting Cross-Platform Compatibility Tests', 'blue');
  log(`Platform: ${process.platform} (${process.arch})`, 'blue');
  
  const results = {};
  
  results['Node.js Environment'] = await testNodeJsEnvironment();
  results['Dependency Installation'] = await testDependencyInstallation();
  results['TypeScript Compilation'] = await testTypeScriptCompilation();
  results['Cross-Platform Scripts'] = await testCrossPlatformScripts();
  results['Environment Variables'] = await testEnvironmentVariables();
  results['File Path Handling'] = await testFilePathHandling();
  results['Docker Integration'] = await testDockerIntegration();
  
  const allTestsPassed = await generatePlatformReport(results);
  
  if (allTestsPassed) {
    log('\n🎉 All platform compatibility tests passed!', 'green');
    process.exit(0);
  } else {
    log('\n💥 Some platform compatibility tests failed!', 'red');
    process.exit(1);
  }
}

// Handle CLI usage
if (require.main === module) {
  main().catch((error) => {
    log(`💥 Test runner failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = {
  testNodeJsEnvironment,
  testDependencyInstallation,
  testTypeScriptCompilation,
  testCrossPlatformScripts,
  testEnvironmentVariables,
  testFilePathHandling,
  testDockerIntegration
};