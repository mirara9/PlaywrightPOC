#!/usr/bin/env node

/**
 * Cross-platform environment variable runner
 * Works on Windows, macOS, and Linux
 */

const { spawn } = require('child_process');
const path = require('path');

function parseArgs(args) {
  const env = {};
  const commands = [];
  let inCommand = false;
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.includes('=') && !inCommand) {
      // Environment variable
      const [key, value] = arg.split('=', 2);
      env[key] = value;
    } else {
      // Command starts here
      inCommand = true;
      commands.push(arg);
    }
  }
  
  return { env, commands };
}

function runCommand(env, commands) {
  if (commands.length === 0) {
    console.error('No command specified');
    process.exit(1);
  }
  
  // Merge with existing environment
  const fullEnv = { ...process.env, ...env };
  
  // Handle cross-platform npm commands
  let cmd = commands[0];
  let args = commands.slice(1);
  
  // On Windows, we might need to use cmd for npm commands
  if (process.platform === 'win32' && (cmd === 'npm' || cmd === 'npx')) {
    args = ['/c', cmd, ...args];
    cmd = 'cmd';
  }
  
  console.log(`Running: ${commands.join(' ')}`);
  console.log(`Environment:`, Object.keys(env).map(k => `${k}=${env[k]}`).join(' '));
  
  const child = spawn(cmd, args, {
    stdio: 'inherit',
    env: fullEnv,
    shell: process.platform === 'win32'
  });
  
  child.on('exit', (code) => {
    process.exit(code || 0);
  });
  
  child.on('error', (error) => {
    console.error('Failed to start command:', error.message);
    process.exit(1);
  });
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node run-with-env.js [ENV_VAR=value] [ENV_VAR2=value] command [args...]');
    console.log('');
    console.log('Examples:');
    console.log('  node run-with-env.js RETRY_COUNT=3 playwright test');
    console.log('  node run-with-env.js HEADLESS=false npm test');
    process.exit(1);
  }
  
  const { env, commands } = parseArgs(args);
  runCommand(env, commands);
}

module.exports = { parseArgs, runCommand };