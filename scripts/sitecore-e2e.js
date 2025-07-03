#!/usr/bin/env node

/**
 * Sitecore End-to-End Orchestration Script
 * Manages complete Sitecore deployment and testing workflow
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const SitecorePrerequisitesValidator = require('./sitecore-prerequisites');
const SitecoreLicenseManager = require('./sitecore-license-manager');
const SitecoreDeployer = require('./sitecore-deploy');
const SitecoreHealthChecker = require('./sitecore-health-checker');

class SitecoreE2EOrchestrator {
  constructor(options = {}) {
    this.options = {
      // Deployment options
      skipPrerequisites: false,
      skipDeployment: false,
      skipHealthCheck: false,
      skipTests: false,
      
      // Test options
      testSuite: 'all', // all, smoke, regression, content
      testEnv: 'local',
      headless: true,
      parallel: false,
      
      // Cleanup options
      cleanupOnSuccess: false,
      cleanupOnFailure: true,
      keepLogs: true,
      
      // Timeout options
      deploymentTimeout: 1800000, // 30 minutes
      healthCheckTimeout: 600000,  // 10 minutes
      testTimeout: 1200000,        // 20 minutes
      
      ...options
    };
    
    this.state = {
      phase: 'not_started',
      startTime: null,
      endTime: null,
      errors: [],
      results: {},
      deploymentInfo: null,
      testResults: null
    };
    
    this.components = {
      validator: new SitecorePrerequisitesValidator(),
      licenseManager: new SitecoreLicenseManager(),
      deployer: new SitecoreDeployer(),
      healthChecker: new SitecoreHealthChecker()
    };
  }

  /**
   * Execute complete end-to-end workflow
   */
  async execute() {
    console.log('🚀 Starting Sitecore End-to-End Workflow');
    console.log('='.repeat(80));
    
    this.state.startTime = new Date();
    
    try {
      // Phase 1: Prerequisites validation
      if (!this.options.skipPrerequisites) {
        await this.validatePrerequisites();
      }
      
      // Phase 2: Deployment
      if (!this.options.skipDeployment) {
        await this.deploySitecore();
      }
      
      // Phase 3: Health check
      if (!this.options.skipHealthCheck) {
        await this.waitForHealth();
      }
      
      // Phase 4: Test execution
      if (!this.options.skipTests) {
        await this.runTests();
      }
      
      // Phase 5: Results and cleanup
      await this.finalize();
      
      this.state.phase = 'completed';
      this.state.endTime = new Date();
      
      console.log('\n🎉 End-to-End workflow completed successfully!');
      this.displaySummary();
      
      return {
        success: true,
        results: this.state.results,
        duration: this.getDuration()
      };
      
    } catch (error) {
      this.state.phase = 'failed';
      this.state.endTime = new Date();
      this.state.errors.push(error.message);
      
      console.error(`\n❌ End-to-End workflow failed: ${error.message}`);
      
      if (this.options.cleanupOnFailure) {
        await this.cleanup();
      }
      
      this.displaySummary();
      
      return {
        success: false,
        error: error.message,
        results: this.state.results,
        duration: this.getDuration()
      };
    }
  }

  /**
   * Phase 1: Validate prerequisites
   */
  async validatePrerequisites() {
    console.log('\n📋 Phase 1: Validating Prerequisites');
    console.log('-'.repeat(50));
    
    this.state.phase = 'prerequisites';
    
    const prereqsPassed = await this.components.validator.validateAll();
    this.state.results.prerequisites = {
      passed: prereqsPassed,
      details: this.components.validator.results
    };
    
    if (!prereqsPassed) {
      throw new Error('Prerequisites validation failed');
    }
    
    console.log('✅ Prerequisites validation completed');
  }

  /**
   * Phase 2: Deploy Sitecore
   */
  async deploySitecore() {
    console.log('\n🐳 Phase 2: Deploying Sitecore');
    console.log('-'.repeat(50));
    
    this.state.phase = 'deployment';
    
    // Setup license
    try {
      await this.components.licenseManager.setupLicense();
    } catch (error) {
      throw new Error(`License setup failed: ${error.message}`);
    }
    
    // Deploy containers
    const deploymentResult = await this.components.deployer.deploy();
    this.state.deploymentInfo = deploymentResult;
    this.state.results.deployment = deploymentResult;
    
    if (!deploymentResult.success) {
      throw new Error(`Deployment failed: ${deploymentResult.error}`);
    }
    
    console.log('✅ Sitecore deployment completed');
  }

  /**
   * Phase 3: Wait for health check
   */
  async waitForHealth() {
    console.log('\n🏥 Phase 3: Health Check');
    console.log('-'.repeat(50));
    
    this.state.phase = 'health_check';
    
    // Configure health checker with deployment URLs
    if (this.state.deploymentInfo && this.state.deploymentInfo.urls) {
      this.components.healthChecker.options.urls = this.state.deploymentInfo.urls;
    }
    
    // Wait for deployment to be ready
    const ready = await this.components.healthChecker.waitForDeployment();
    const healthReport = this.components.healthChecker.generateReport();
    
    this.state.results.healthCheck = {
      ready,
      report: healthReport
    };
    
    if (!ready) {
      throw new Error('Sitecore deployment health check failed');
    }
    
    console.log('✅ Health check passed');
  }

  /**
   * Phase 4: Run tests
   */
  async runTests() {
    console.log('\n🧪 Phase 4: Running Tests');
    console.log('-'.repeat(50));
    
    this.state.phase = 'testing';
    
    // Set environment variables for tests
    const testEnv = {
      ...process.env,
      SITECORE_CM_URL: this.state.deploymentInfo?.urls?.cm || 'https://xp0cm.localhost',
      SITECORE_ID_URL: this.state.deploymentInfo?.urls?.id || 'https://xp0id.localhost',
      HEADLESS: this.options.headless.toString(),
      TEST_ENV: this.options.testEnv
    };
    
    try {
      const testResults = await this.executeTestSuite(testEnv);
      this.state.testResults = testResults;
      this.state.results.tests = testResults;
      
      if (!testResults.success) {
        throw new Error(`Tests failed: ${testResults.failures} failures`);
      }
      
      console.log('✅ Tests completed successfully');
      
    } catch (error) {
      throw new Error(`Test execution failed: ${error.message}`);
    }
  }

  /**
   * Execute test suite based on configuration
   */
  async executeTestSuite(env) {
    const testCommands = {
      all: 'npm run test:sitecore',
      smoke: 'npm run test:sitecore:smoke',
      regression: 'npm run test:sitecore:regression',
      content: 'npm run test:sitecore:content'
    };
    
    const command = testCommands[this.options.testSuite] || testCommands.all;
    
    console.log(`📝 Executing: ${command}`);
    
    try {
      const output = execSync(command, {
        env,
        encoding: 'utf8',
        timeout: this.options.testTimeout,
        cwd: process.cwd()
      });
      
      // Parse test results (this would depend on your test reporter)
      const results = this.parseTestResults(output);
      
      return {
        success: results.failures === 0,
        total: results.total,
        passed: results.passed,
        failures: results.failures,
        skipped: results.skipped,
        duration: results.duration,
        output: output
      };
      
    } catch (error) {
      // Test command failed
      return {
        success: false,
        error: error.message,
        output: error.stdout || error.stderr || ''
      };
    }
  }

  /**
   * Parse test results from output
   */
  parseTestResults(output) {
    // This would parse your specific test output format
    // For now, return mock results
    const lines = output.split('\n');
    
    // Look for Playwright test summary
    const summaryLine = lines.find(line => line.includes('passed') && line.includes('failed'));
    
    if (summaryLine) {
      // Parse actual results
      const passedMatch = summaryLine.match(/(\d+) passed/);
      const failedMatch = summaryLine.match(/(\d+) failed/);
      const skippedMatch = summaryLine.match(/(\d+) skipped/);
      
      const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
      const failures = failedMatch ? parseInt(failedMatch[1]) : 0;
      const skipped = skippedMatch ? parseInt(skippedMatch[1]) : 0;
      
      return {
        total: passed + failures + skipped,
        passed,
        failures,
        skipped,
        duration: 0 // Could parse duration too
      };
    }
    
    // Default values if parsing fails
    return {
      total: 0,
      passed: 0,
      failures: 0,
      skipped: 0,
      duration: 0
    };
  }

  /**
   * Phase 5: Finalize and cleanup
   */
  async finalize() {
    console.log('\n📊 Phase 5: Finalization');
    console.log('-'.repeat(50));
    
    this.state.phase = 'finalizing';
    
    // Generate comprehensive report
    await this.generateReport();
    
    // Cleanup if requested
    if (this.options.cleanupOnSuccess) {
      await this.cleanup();
    }
    
    console.log('✅ Finalization completed');
  }

  /**
   * Generate comprehensive test report
   */
  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      duration: this.getDuration(),
      options: this.options,
      state: this.state,
      results: this.state.results,
      environment: {
        platform: process.platform,
        nodeVersion: process.version,
        cwd: process.cwd()
      }
    };
    
    const reportPath = path.join(process.cwd(), 'sitecore-e2e-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📄 Report generated: ${reportPath}`);
    
    // Also generate HTML report if possible
    await this.generateHtmlReport(report);
  }

  /**
   * Generate HTML report
   */
  async generateHtmlReport(report) {
    const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
    <title>Sitecore E2E Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #0078d4; color: white; padding: 20px; border-radius: 5px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .success { background: #d4edda; border-color: #c3e6cb; }
        .failure { background: #f8d7da; border-color: #f5c6cb; }
        .warning { background: #fff3cd; border-color: #ffeaa7; }
        .results { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
        .metric { text-align: center; padding: 10px; background: #f8f9fa; border-radius: 3px; }
        .metric h3 { margin: 0; color: #495057; }
        .metric .value { font-size: 2em; font-weight: bold; color: #0078d4; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 3px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎯 Sitecore E2E Test Report</h1>
        <p>Generated: ${report.timestamp}</p>
        <p>Duration: ${Math.round(report.duration / 1000)}s</p>
    </div>
    
    <div class="section ${report.state.phase === 'completed' ? 'success' : 'failure'}">
        <h2>Overall Status: ${report.state.phase.toUpperCase()}</h2>
        <p>Workflow ${report.state.phase === 'completed' ? 'completed successfully' : 'failed'}</p>
    </div>
    
    <div class="section">
        <h2>📊 Test Results</h2>
        <div class="results">
            <div class="metric">
                <h3>Total Tests</h3>
                <div class="value">${report.results.tests?.total || 0}</div>
            </div>
            <div class="metric">
                <h3>Passed</h3>
                <div class="value" style="color: #28a745;">${report.results.tests?.passed || 0}</div>
            </div>
            <div class="metric">
                <h3>Failed</h3>
                <div class="value" style="color: #dc3545;">${report.results.tests?.failures || 0}</div>
            </div>
            <div class="metric">
                <h3>Skipped</h3>
                <div class="value" style="color: #ffc107;">${report.results.tests?.skipped || 0}</div>
            </div>
        </div>
    </div>
    
    <div class="section">
        <h2>🚀 Deployment Status</h2>
        <p>Status: ${report.results.deployment?.success ? '✅ Success' : '❌ Failed'}</p>
        ${report.results.deployment?.urls ? `
        <h3>Access URLs:</h3>
        <ul>
            ${Object.entries(report.results.deployment.urls).map(([name, url]) => 
                `<li><strong>${name.toUpperCase()}:</strong> <a href="${url}" target="_blank">${url}</a></li>`
            ).join('')}
        </ul>
        ` : ''}
    </div>
    
    ${report.state.errors.length > 0 ? `
    <div class="section failure">
        <h2>❌ Errors</h2>
        <ul>
            ${report.state.errors.map(error => `<li>${error}</li>`).join('')}
        </ul>
    </div>
    ` : ''}
    
    <div class="section">
        <h2>🔧 Configuration</h2>
        <pre>${JSON.stringify(report.options, null, 2)}</pre>
    </div>
</body>
</html>`;
    
    const htmlPath = path.join(process.cwd(), 'sitecore-e2e-report.html');
    fs.writeFileSync(htmlPath, htmlTemplate);
    
    console.log(`📄 HTML report generated: ${htmlPath}`);
  }

  /**
   * Cleanup deployment and test artifacts
   */
  async cleanup() {
    console.log('🧹 Cleaning up resources...');
    
    try {
      // Stop containers
      execSync('docker-compose down', { 
        cwd: this.state.deploymentInfo?.composePath,
        stdio: 'ignore' 
      });
      
      // Clean up test artifacts if not keeping logs
      if (!this.options.keepLogs) {
        // Remove test-results directory
        const testResultsPath = path.join(process.cwd(), 'test-results');
        if (fs.existsSync(testResultsPath)) {
          fs.rmSync(testResultsPath, { recursive: true });
        }
      }
      
      console.log('✅ Cleanup completed');
      
    } catch (error) {
      console.log(`⚠️ Cleanup failed: ${error.message}`);
    }
  }

  /**
   * Display execution summary
   */
  displaySummary() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 SITECORE E2E EXECUTION SUMMARY');
    console.log('='.repeat(80));
    
    console.log(`\n🎯 Overall Status: ${this.state.phase.toUpperCase()}`);
    console.log(`⏱️  Total Duration: ${Math.round(this.getDuration() / 1000)}s`);
    
    if (this.state.results.tests) {
      const tests = this.state.results.tests;
      console.log(`\n🧪 Test Results: ${tests.passed}/${tests.total} passed`);
      if (tests.failures > 0) {
        console.log(`   ❌ Failures: ${tests.failures}`);
      }
      if (tests.skipped > 0) {
        console.log(`   ⏭️  Skipped: ${tests.skipped}`);
      }
    }
    
    if (this.state.deploymentInfo?.urls) {
      console.log('\n🌐 Access URLs:');
      Object.entries(this.state.deploymentInfo.urls).forEach(([name, url]) => {
        console.log(`   ${name.toUpperCase()}: ${url}`);
      });
    }
    
    if (this.state.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.state.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    console.log('\n' + '='.repeat(80));
  }

  /**
   * Get execution duration
   */
  getDuration() {
    if (this.state.startTime) {
      const endTime = this.state.endTime || new Date();
      return endTime.getTime() - this.state.startTime.getTime();
    }
    return 0;
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--')) {
      const key = arg.replace('--', '');
      const value = args[i + 1];
      
      if (value && !value.startsWith('--')) {
        // Handle boolean conversion
        if (value === 'true' || value === 'false') {
          options[key] = value === 'true';
        } else {
          options[key] = value;
        }
        i++; // Skip next argument
      } else {
        // Flag without value
        options[key] = true;
      }
    }
  }
  
  // Display help
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Sitecore End-to-End Orchestration Script

Usage: node sitecore-e2e.js [options]

Options:
  --skip-prerequisites     Skip prerequisites validation
  --skip-deployment        Skip Sitecore deployment
  --skip-health-check      Skip health check
  --skip-tests             Skip test execution
  --test-suite <suite>     Test suite to run (all|smoke|regression|content)
  --headless <boolean>     Run tests in headless mode
  --cleanup-on-success     Clean up after successful run
  --cleanup-on-failure     Clean up after failed run
  --keep-logs              Keep test logs and artifacts
  --help, -h               Show this help message

Examples:
  node sitecore-e2e.js                           # Full workflow
  node sitecore-e2e.js --skip-deployment         # Tests only (assumes Sitecore is running)
  node sitecore-e2e.js --test-suite smoke        # Run only smoke tests
  node sitecore-e2e.js --headless false          # Run tests with browser UI
`);
    process.exit(0);
  }
  
  // Execute workflow
  const orchestrator = new SitecoreE2EOrchestrator(options);
  
  orchestrator.execute()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error(`💥 Unexpected error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = SitecoreE2EOrchestrator;