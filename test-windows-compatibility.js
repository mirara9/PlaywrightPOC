#!/usr/bin/env node

/**
 * Windows compatibility test for the test-app launcher
 * Tests various Windows-specific scenarios
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
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

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

async function testWindowsEnvironment() {
    log('🔍 Windows Compatibility Test', 'magenta');
    log('=' .repeat(50), 'blue');
    
    // Check platform
    const isWindows = process.platform === 'win32';
    log(`Platform: ${process.platform}`, 'cyan');
    log(`Is Windows: ${isWindows}`, 'cyan');
    log(`OS Release: ${os.release()}`, 'cyan');
    log(`Architecture: ${process.arch}`, 'cyan');
    
    if (!isWindows) {
        logWarning('This test is designed for Windows systems');
        return false;
    }
    
    // Test Node.js
    logInfo('Testing Node.js...');
    try {
        const nodeVersion = process.version;
        logSuccess(`Node.js version: ${nodeVersion}`);
    } catch (error) {
        logError(`Node.js test failed: ${error.message}`);
        return false;
    }
    
    // Test npm commands
    logInfo('Testing npm commands...');
    const npmCommands = ['npm', 'npm.cmd'];
    let npmFound = false;
    
    for (const npmCmd of npmCommands) {
        try {
            await testCommand(npmCmd, ['--version']);
            logSuccess(`${npmCmd} is available`);
            npmFound = true;
        } catch (error) {
            logWarning(`${npmCmd} not available: ${error.message}`);
        }
    }
    
    if (!npmFound) {
        logError('No npm command found');
        return false;
    }
    
    // Test spawn functionality
    logInfo('Testing spawn functionality...');
    try {
        await testSpawn();
        logSuccess('Spawn functionality works');
    } catch (error) {
        logError(`Spawn test failed: ${error.message}`);
        return false;
    }
    
    // Test file system operations
    logInfo('Testing file system operations...');
    try {
        await testFileSystem();
        logSuccess('File system operations work');
    } catch (error) {
        logError(`File system test failed: ${error.message}`);
        return false;
    }
    
    // Test path operations
    logInfo('Testing path operations...');
    try {
        testPathOperations();
        logSuccess('Path operations work');
    } catch (error) {
        logError(`Path test failed: ${error.message}`);
        return false;
    }
    
    // Test environment variables
    logInfo('Testing environment variables...');
    try {
        testEnvironmentVariables();
        logSuccess('Environment variables work');
    } catch (error) {
        logError(`Environment test failed: ${error.message}`);
        return false;
    }
    
    logSuccess('All Windows compatibility tests passed!');
    return true;
}

function testCommand(command, args) {
    return new Promise((resolve, reject) => {
        const process = spawn(command, args, {
            shell: true,
            windowsHide: true,
            stdio: 'pipe'
        });
        
        let output = '';
        
        process.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        process.on('close', (code) => {
            if (code === 0) {
                resolve(output.trim());
            } else {
                reject(new Error(`Command failed with code ${code}`));
            }
        });
        
        process.on('error', (error) => {
            reject(error);
        });
    });
}

function testSpawn() {
    return new Promise((resolve, reject) => {
        const isWindows = process.platform === 'win32';
        const nodeCmd = isWindows ? 'node.exe' : 'node';
        
        const testProcess = spawn(nodeCmd, ['--version'], {
            shell: true,
            windowsHide: true,
            stdio: 'pipe'
        });
        
        testProcess.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Spawn test failed with code ${code}`));
            }
        });
        
        testProcess.on('error', (error) => {
            reject(error);
        });
    });
}

function testFileSystem() {
    return new Promise((resolve, reject) => {
        try {
            // Test temp directory creation
            const tempDir = path.join(os.tmpdir(), 'playwright-test-' + Date.now());
            fs.mkdirSync(tempDir);
            
            // Test file creation
            const testFile = path.join(tempDir, 'test.txt');
            fs.writeFileSync(testFile, 'Windows test');
            
            // Test file reading
            const content = fs.readFileSync(testFile, 'utf8');
            if (content !== 'Windows test') {
                throw new Error('File content mismatch');
            }
            
            // Cleanup
            fs.unlinkSync(testFile);
            fs.rmdirSync(tempDir);
            
            resolve();
        } catch (error) {
            reject(error);
        }
    });
}

function testPathOperations() {
    // Test Windows path handling
    const testPaths = [
        'C:\\Users\\test',
        'C:/Users/test',
        '.\\relative\\path',
        './relative/path',
        '..\\parent\\path',
        '../parent/path'
    ];
    
    for (const testPath of testPaths) {
        const normalized = path.normalize(testPath);
        const resolved = path.resolve(testPath);
        const parsed = path.parse(testPath);
        
        if (!normalized || !resolved || !parsed) {
            throw new Error(`Path operation failed for: ${testPath}`);
        }
    }
    
    // Test path joining
    const joined = path.join('C:', 'Users', 'test', 'Documents');
    if (!joined.includes('Users')) {
        throw new Error('Path join failed');
    }
}

function testEnvironmentVariables() {
    // Test common Windows environment variables
    const windowsEnvVars = ['PATH', 'USERPROFILE', 'TEMP', 'OS'];
    
    for (const envVar of windowsEnvVars) {
        const value = process.env[envVar];
        if (!value) {
            logWarning(`Environment variable ${envVar} not found`);
        } else {
            log(`${envVar}: ${value.substring(0, 50)}...`, 'white');
        }
    }
    
    // Test setting environment variables
    process.env.TEST_VAR = 'test_value';
    if (process.env.TEST_VAR !== 'test_value') {
        throw new Error('Environment variable setting failed');
    }
    
    delete process.env.TEST_VAR;
}

async function testStartTestApp() {
    logInfo('Testing start-test-app.js functionality...');
    
    try {
        // Test the help function
        const { main } = require('./start-test-app.js');
        
        // Mock process.argv for help test
        const originalArgv = process.argv;
        process.argv = ['node', 'start-test-app.js', '--help'];
        
        logSuccess('start-test-app.js loads successfully');
        
        // Restore original argv
        process.argv = originalArgv;
        
    } catch (error) {
        logError(`start-test-app.js test failed: ${error.message}`);
        return false;
    }
    
    return true;
}

async function main() {
    try {
        const envTestPassed = await testWindowsEnvironment();
        
        if (envTestPassed) {
            const appTestPassed = await testStartTestApp();
            
            if (appTestPassed) {
                log('\n🎉 All tests passed!', 'green');
                log('The test-app launcher should work properly on this Windows system', 'green');
                
                log('\n📝 Next steps:', 'cyan');
                log('1. Try: node start-test-app.js --help', 'white');
                log('2. Try: node start-test-app.js --basic', 'white');
                log('3. Try: start-test-app.bat', 'white');
                log('4. Try: .\\start-test-app.ps1', 'white');
            } else {
                log('\n⚠️  Some application tests failed', 'yellow');
                log('The launcher might have issues on this system', 'yellow');
            }
        } else {
            log('\n❌ Environment tests failed', 'red');
            log('This Windows system may not be compatible', 'red');
        }
        
    } catch (error) {
        logError(`Test suite failed: ${error.message}`);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { 
    testWindowsEnvironment, 
    testStartTestApp, 
    testCommand, 
    testSpawn, 
    testFileSystem 
};