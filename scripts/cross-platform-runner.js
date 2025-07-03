#!/usr/bin/env node

/**
 * Cross-platform script runner utility
 * Automatically selects the appropriate script based on the platform
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

function runCrossPlatformScript(scriptName, args = [], options = {}) {
  // Define script mappings
  const scriptMappings = {
    'build': {
      win32: 'build.bat',
      default: './build.sh'
    },
    'docker-run': {
      win32: 'docker-run.bat',
      default: './docker-run.sh'
    },
    'setup-playwright': {
      win32: 'scripts\\setup-playwright.bat',
      default: './scripts/setup-playwright.sh'
    },
    'verify-setup': {
      win32: 'verify-setup.bat',
      default: './verify-setup.sh'
    }
  };

  // Get the appropriate script for the platform
  const mapping = scriptMappings[scriptName];
  if (!mapping) {
    console.error(`Unknown script: ${scriptName}`);
    process.exit(1);
  }

  const script = mapping[process.platform] || mapping.default;
  
  // Check if script exists
  if (!fs.existsSync(script)) {
    console.error(`Script not found: ${script}`);
    console.error(`Available scripts: ${Object.keys(scriptMappings).join(', ')}`);
    process.exit(1);
  }

  console.log(`Running ${process.platform} script: ${script} ${args.join(' ')}`);

  // Spawn the appropriate script
  const child = spawn(script, args, {
    stdio: 'inherit',
    shell: true,
    ...options
  });

  child.on('exit', (code) => {
    process.exit(code || 0);
  });

  child.on('error', (error) => {
    console.error(`Failed to start script: ${error.message}`);
    process.exit(1);
  });
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node cross-platform-runner.js <script-name> [args...]');
    console.log('');
    console.log('Available scripts:');
    console.log('  build                 - Build script');
    console.log('  docker-run            - Docker runner script');
    console.log('  setup-playwright      - Playwright setup script');
    console.log('  verify-setup          - Setup verification script');
    console.log('');
    console.log('Examples:');
    console.log('  node cross-platform-runner.js build --local');
    console.log('  node cross-platform-runner.js docker-run test');
    process.exit(1);
  }

  const scriptName = args[0];
  const scriptArgs = args.slice(1);
  
  runCrossPlatformScript(scriptName, scriptArgs);
}

module.exports = { runCrossPlatformScript };