#!/usr/bin/env node

/**
 * Windows-specific installation helper for Playwright POC
 * Addresses common Windows npm/Node.js issues
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m'
};

function log(message, color = 'white') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
    log(`[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

async function checkWindowsRequirements() {
    logStep('WINDOWS CHECK', 'Checking Windows-specific requirements...');
    
    // Check Windows version
    const windowsVersion = os.release();
    log(`Windows Version: ${windowsVersion}`, 'blue');
    
    // Check if running in PowerShell or CMD
    const shell = process.env.ComSpec || 'Unknown';
    log(`Shell: ${shell}`, 'blue');
    
    // Check for Visual Studio Build Tools (needed for native modules)
    try {
        execSync('where msbuild', { stdio: 'ignore' });
        logSuccess('Visual Studio Build Tools found');
    } catch (error) {
        logWarning('Visual Studio Build Tools not found - may cause issues with native modules');
        log('Consider installing Visual Studio Build Tools or Visual Studio Community', 'yellow');
    }
    
    // Check for Python (needed for node-gyp)
    try {
        execSync('python --version', { stdio: 'ignore' });
        logSuccess('Python found');
    } catch (error) {
        try {
            execSync('python3 --version', { stdio: 'ignore' });
            logSuccess('Python3 found');
        } catch (error2) {
            logWarning('Python not found - may cause issues with native modules');
            log('Consider installing Python from python.org', 'yellow');
        }
    }
    
    logSuccess('Windows requirements check completed');
}

async function cleanCache() {
    logStep('CACHE CLEAN', 'Cleaning npm cache...');
    
    try {
        execSync('npm cache clean --force', { stdio: 'inherit' });
        logSuccess('npm cache cleaned');
    } catch (error) {
        logError('Failed to clean npm cache');
    }
    
    // Clean package-lock files
    const lockFiles = ['package-lock.json', 'test-app/package-lock.json'];
    lockFiles.forEach(file => {
        if (fs.existsSync(file)) {
            fs.unlinkSync(file);
            log(`Removed ${file}`, 'blue');
        }
    });
    
    // Clean node_modules
    const nodeModulesDirs = ['node_modules', 'test-app/node_modules'];
    nodeModulesDirs.forEach(dir => {
        if (fs.existsSync(dir)) {
            log(`Removing ${dir}...`, 'blue');
            try {
                fs.rmSync(dir, { recursive: true, force: true });
                logSuccess(`Removed ${dir}`);
            } catch (error) {
                logWarning(`Could not remove ${dir}: ${error.message}`);
            }
        }
    });
}

async function installWithRetry(command, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            log(`Attempt ${i + 1}/${retries}: ${command}`, 'blue');
            execSync(command, { 
                stdio: 'inherit',
                timeout: 300000, // 5 minutes timeout
                env: {
                    ...process.env,
                    npm_config_cache: path.join(os.tmpdir(), 'npm-cache'),
                    npm_config_prefer_offline: 'false',
                    npm_config_audit: 'false',
                    npm_config_fund: 'false'
                }
            });
            return true;
        } catch (error) {
            logError(`Attempt ${i + 1} failed: ${error.message}`);
            if (i < retries - 1) {
                log('Retrying in 2 seconds...', 'yellow');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }
    return false;
}

async function installDependencies() {
    logStep('DEPENDENCIES', 'Installing dependencies...');
    
    // Install main dependencies
    log('Installing main project dependencies...', 'blue');
    const mainInstallSuccess = await installWithRetry('npm install --no-optional --prefer-offline --no-audit --no-fund');
    
    if (!mainInstallSuccess) {
        logError('Failed to install main dependencies');
        return false;
    }
    
    logSuccess('Main dependencies installed');
    
    // Install test-app dependencies
    if (fs.existsSync('test-app')) {
        log('Installing test-app dependencies...', 'blue');
        process.chdir('test-app');
        const testAppSuccess = await installWithRetry('npm install --no-optional --prefer-offline --no-audit --no-fund');
        process.chdir('..');
        
        if (!testAppSuccess) {
            logError('Failed to install test-app dependencies');
            return false;
        }
        
        logSuccess('Test-app dependencies installed');
    }
    
    return true;
}

async function setupPlaywright() {
    logStep('PLAYWRIGHT', 'Setting up Playwright...');
    
    try {
        // Install Playwright browsers
        log('Installing Playwright browsers...', 'blue');
        execSync('npx playwright install', { 
            stdio: 'inherit',
            timeout: 600000 // 10 minutes timeout
        });
        logSuccess('Playwright browsers installed');
        
        // Install system dependencies for browsers
        log('Installing system dependencies...', 'blue');
        execSync('npx playwright install-deps', { 
            stdio: 'inherit',
            timeout: 600000 // 10 minutes timeout
        });
        logSuccess('System dependencies installed');
        
        return true;
    } catch (error) {
        logError(`Playwright setup failed: ${error.message}`);
        return false;
    }
}

async function verifyInstallation() {
    logStep('VERIFICATION', 'Verifying installation...');
    
    // Check if main dependencies are installed
    if (!fs.existsSync('node_modules')) {
        logError('Main node_modules not found');
        return false;
    }
    
    // Check if test-app dependencies are installed
    if (fs.existsSync('test-app') && !fs.existsSync('test-app/node_modules')) {
        logError('Test-app node_modules not found');
        return false;
    }
    
    // Check if Playwright is installed
    try {
        execSync('npx playwright --version', { stdio: 'ignore' });
        logSuccess('Playwright is available');
    } catch (error) {
        logError('Playwright not available');
        return false;
    }
    
    // Try to run build
    try {
        execSync('npm run build', { stdio: 'ignore' });
        logSuccess('Build successful');
    } catch (error) {
        logWarning('Build failed - may need manual fixing');
    }
    
    logSuccess('Installation verification completed');
    return true;
}

async function main() {
    const startTime = Date.now();
    
    log('🚀 Windows Installation Helper for Playwright POC', 'magenta');
    log('=' .repeat(50), 'blue');
    
    try {
        await checkWindowsRequirements();
        
        if (process.argv.includes('--clean')) {
            await cleanCache();
        }
        
        const installSuccess = await installDependencies();
        if (!installSuccess) {
            logError('Installation failed');
            process.exit(1);
        }
        
        if (!process.argv.includes('--skip-playwright')) {
            const playwrightSuccess = await setupPlaywright();
            if (!playwrightSuccess) {
                logError('Playwright setup failed');
                process.exit(1);
            }
        }
        
        const verifySuccess = await verifyInstallation();
        if (!verifySuccess) {
            logError('Verification failed');
            process.exit(1);
        }
        
        const duration = Math.round((Date.now() - startTime) / 1000);
        log('=' .repeat(50), 'blue');
        logSuccess(`Installation completed successfully in ${duration} seconds!`);
        
        log('\n📝 Next steps:', 'cyan');
        log('  • npm test                    - Run all tests', 'white');
        log('  • npm run test:dashboard      - Test new dashboard', 'white');
        log('  • npm run dev                 - Start development mode', 'white');
        log('  • cd test-app && npm run start:enhanced - Start enhanced test app', 'white');
        
    } catch (error) {
        logError(`Installation failed: ${error.message}`);
        process.exit(1);
    }
}

// Handle command line arguments
if (require.main === module) {
    main().catch(error => {
        logError(`Unexpected error: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { main, checkWindowsRequirements, cleanCache, installDependencies, setupPlaywright, verifyInstallation };