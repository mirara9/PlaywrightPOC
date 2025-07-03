#!/usr/bin/env node

/**
 * Simple script to start the test-app for development and testing
 * Handles both basic and enhanced server modes
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

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

function showUsage() {
    log('\n📚 Test App Launcher', 'magenta');
    log('=' .repeat(50), 'blue');
    log('Usage: node start-test-app.js [options]', 'cyan');
    log('\nOptions:', 'cyan');
    log('  --enhanced, -e     Start enhanced server (with dashboard)', 'white');
    log('  --basic, -b        Start basic server (original)', 'white');
    log('  --port, -p <port>  Specify port (default: 3000)', 'white');
    log('  --help, -h         Show this help message', 'white');
    log('\nExamples:', 'cyan');
    log('  node start-test-app.js                 # Start enhanced server', 'white');
    log('  node start-test-app.js --enhanced      # Start enhanced server', 'white');
    log('  node start-test-app.js --basic         # Start basic server', 'white');
    log('  node start-test-app.js --port 4000     # Start on port 4000', 'white');
    log('\nURLs:', 'cyan');
    log('  Login Page:  http://localhost:3000/', 'white');
    log('  Dashboard:   http://localhost:3000/dashboard', 'white');
    log('  Health:      http://localhost:3000/health', 'white');
    log('  API:         http://localhost:3000/api/', 'white');
}

function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        enhanced: true, // Default to enhanced
        port: 3000,
        help: false
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        switch (arg) {
            case '--enhanced':
            case '-e':
                options.enhanced = true;
                break;
            case '--basic':
            case '-b':
                options.enhanced = false;
                break;
            case '--port':
            case '-p':
                const port = parseInt(args[i + 1]);
                if (port && port > 0 && port < 65536) {
                    options.port = port;
                    i++; // Skip next argument
                } else {
                    logError('Invalid port number');
                    process.exit(1);
                }
                break;
            case '--help':
            case '-h':
                options.help = true;
                break;
            default:
                logError(`Unknown option: ${arg}`);
                showUsage();
                process.exit(1);
        }
    }

    return options;
}

function checkTestAppDirectory() {
    const testAppDir = path.join(__dirname, 'test-app');
    if (!fs.existsSync(testAppDir)) {
        logError('test-app directory not found!');
        logInfo('Make sure you are running this script from the project root directory');
        process.exit(1);
    }

    const packageJsonPath = path.join(testAppDir, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
        logError('test-app/package.json not found!');
        logInfo('Run "cd test-app && npm install" first');
        process.exit(1);
    }

    const nodeModulesPath = path.join(testAppDir, 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
        logWarning('test-app dependencies not installed');
        logInfo('Installing dependencies...');
        return false;
    }

    return true;
}

function installDependencies() {
    return new Promise((resolve, reject) => {
        logInfo('Installing test-app dependencies...');
        
        const installProcess = spawn('npm', ['install'], {
            cwd: path.join(__dirname, 'test-app'),
            stdio: 'inherit',
            shell: true
        });

        installProcess.on('close', (code) => {
            if (code === 0) {
                logSuccess('Dependencies installed successfully');
                resolve();
            } else {
                logError('Failed to install dependencies');
                reject(new Error(`npm install failed with code ${code}`));
            }
        });

        installProcess.on('error', (error) => {
            logError(`Failed to start npm install: ${error.message}`);
            reject(error);
        });
    });
}

function startServer(options) {
    const { enhanced, port } = options;
    const serverType = enhanced ? 'enhanced' : 'basic';
    const scriptName = enhanced ? 'start:enhanced' : 'start';
    
    logInfo(`Starting ${serverType} test-app server on port ${port}...`);
    
    const env = {
        ...process.env,
        PORT: port.toString()
    };

    const serverProcess = spawn('npm', ['run', scriptName], {
        cwd: path.join(__dirname, 'test-app'),
        stdio: 'inherit',
        shell: true,
        env: env
    });

    // Show server info
    setTimeout(() => {
        log('\n🚀 Test App Server Started!', 'green');
        log('=' .repeat(50), 'blue');
        log(`Server Type: ${enhanced ? 'Enhanced (with dashboard)' : 'Basic'}`, 'cyan');
        log(`Port: ${port}`, 'cyan');
        log('\n📱 Available URLs:', 'yellow');
        log(`  Login Page:  http://localhost:${port}/`, 'white');
        if (enhanced) {
            log(`  Dashboard:   http://localhost:${port}/dashboard`, 'white');
        }
        log(`  Health:      http://localhost:${port}/health`, 'white');
        log(`  API:         http://localhost:${port}/api/`, 'white');
        
        if (enhanced) {
            log('\n👤 Test Credentials:', 'yellow');
            log('  test@example.com / password123', 'white');
            log('  admin@example.com / AdminPass789!', 'white');
            log('  john.doe@example.com / SecurePass123!', 'white');
        }
        
        log('\n⏹️  Press Ctrl+C to stop the server', 'cyan');
        log('=' .repeat(50), 'blue');
    }, 2000);

    // Handle process termination
    process.on('SIGINT', () => {
        log('\n\n🛑 Shutting down server...', 'yellow');
        serverProcess.kill('SIGINT');
        setTimeout(() => {
            log('Server stopped', 'green');
            process.exit(0);
        }, 1000);
    });

    process.on('SIGTERM', () => {
        serverProcess.kill('SIGTERM');
        process.exit(0);
    });

    serverProcess.on('close', (code) => {
        if (code !== 0) {
            logError(`Server process exited with code ${code}`);
        }
        process.exit(code);
    });

    serverProcess.on('error', (error) => {
        logError(`Failed to start server: ${error.message}`);
        process.exit(1);
    });
}

async function main() {
    const options = parseArgs();

    if (options.help) {
        showUsage();
        return;
    }

    log('🎯 Test App Launcher', 'magenta');
    log('=' .repeat(30), 'blue');

    // Check if test-app directory exists
    const hasDependencies = checkTestAppDirectory();

    // Install dependencies if needed
    if (!hasDependencies) {
        try {
            await installDependencies();
        } catch (error) {
            logError('Failed to install dependencies');
            logInfo('Try running: cd test-app && npm install');
            process.exit(1);
        }
    }

    // Start the server
    startServer(options);
}

// Run the script
if (require.main === module) {
    main().catch(error => {
        logError(`Unexpected error: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { main, startServer, checkTestAppDirectory, installDependencies };