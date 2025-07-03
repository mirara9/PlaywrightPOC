#!/usr/bin/env node

/**
 * Sitecore Container Health Checker
 * Monitors and validates Sitecore container deployment health and readiness
 */

const { execSync } = require('child_process');
const axios = require('axios').default || require('axios');

class SitecoreHealthChecker {
  constructor(options = {}) {
    this.options = {
      timeout: 1800000, // 30 minutes
      checkInterval: 30000, // 30 seconds
      urls: {
        cm: 'https://xp0cm.localhost',
        id: 'https://xp0id.localhost',
        solr: 'http://localhost:8984',
        sql: 'localhost:14330'
      },
      expectedContainers: [
        'sitecore-xp0_traefik_1',
        'sitecore-xp0_cm_1',
        'sitecore-xp0_id_1',
        'sitecore-xp0_mssql_1',
        'sitecore-xp0_solr_1'
      ],
      ...options
    };
    
    this.healthStatus = {
      overall: 'checking',
      containers: {},
      services: {},
      startTime: new Date(),
      readyTime: null,
      errors: []
    };
  }

  /**
   * Check Docker container status
   */
  checkContainerHealth() {
    console.log('🐳 Checking container health...');
    
    try {
      const output = execSync('docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"', { encoding: 'utf8' });
      const lines = output.split('\n').slice(1); // Skip header
      
      for (const container of this.options.expectedContainers) {
        const line = lines.find(l => l.includes(container));
        
        if (!line) {
          this.healthStatus.containers[container] = { status: 'missing', health: 'unhealthy' };
          continue;
        }
        
        const status = line.split('\t')[1];
        let health = 'unknown';
        
        if (status.includes('healthy')) {
          health = 'healthy';
        } else if (status.includes('unhealthy')) {
          health = 'unhealthy';
        } else if (status.includes('starting')) {
          health = 'starting';
        } else if (status.includes('Up')) {
          health = 'running';
        }
        
        this.healthStatus.containers[container] = {
          status: status,
          health: health,
          ports: line.split('\t')[2] || ''
        };
      }
      
      // Check overall container health
      const containerStates = Object.values(this.healthStatus.containers);
      const healthyContainers = containerStates.filter(c => c.health === 'healthy').length;
      const totalContainers = this.options.expectedContainers.length;
      
      console.log(`📊 Container Health: ${healthyContainers}/${totalContainers} healthy`);
      
      containerStates.forEach((state, index) => {
        const name = this.options.expectedContainers[index];
        const icon = state.health === 'healthy' ? '✅' : state.health === 'starting' ? '⏳' : '❌';
        console.log(`   ${icon} ${name}: ${state.health} (${state.status})`);
      });
      
      return healthyContainers === totalContainers;
      
    } catch (error) {
      console.error(`❌ Container health check failed: ${error.message}`);
      this.healthStatus.errors.push(`Container check: ${error.message}`);
      return false;
    }
  }

  /**
   * Check service endpoints
   */
  async checkServiceHealth() {
    console.log('🌐 Checking service endpoints...');
    
    const serviceChecks = [
      { name: 'Content Management', url: `${this.options.urls.cm}/sitecore/login`, expectedStatus: [200, 302] },
      { name: 'Identity Server', url: `${this.options.urls.id}/.well-known/openid_configuration`, expectedStatus: [200] },
      { name: 'Solr Admin', url: `${this.options.urls.solr}/solr/admin/info/system`, expectedStatus: [200] }
    ];
    
    for (const check of serviceChecks) {
      try {
        console.log(`   🔍 Testing ${check.name}: ${check.url}`);
        
        const response = await axios.get(check.url, {
          timeout: 10000,
          validateStatus: (status) => check.expectedStatus.includes(status),
          maxRedirects: 5,
          httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
        });
        
        this.healthStatus.services[check.name] = {
          status: 'healthy',
          statusCode: response.status,
          responseTime: response.headers['x-response-time'] || 'unknown',
          url: check.url
        };
        
        console.log(`   ✅ ${check.name}: HTTP ${response.status}`);
        
      } catch (error) {
        this.healthStatus.services[check.name] = {
          status: 'unhealthy',
          error: error.message,
          url: check.url
        };
        
        console.log(`   ❌ ${check.name}: ${error.message}`);
      }
    }
    
    // Check SQL Server connectivity
    await this.checkSqlServerHealth();
    
    const healthyServices = Object.values(this.healthStatus.services).filter(s => s.status === 'healthy').length;
    const totalServices = Object.keys(this.healthStatus.services).length;
    
    console.log(`📊 Service Health: ${healthyServices}/${totalServices} healthy`);
    
    return healthyServices === totalServices;
  }

  /**
   * Check SQL Server connectivity
   */
  async checkSqlServerHealth() {
    try {
      console.log('   🔍 Testing SQL Server connectivity...');
      
      // Use sqlcmd if available, otherwise skip
      try {
        const output = execSync('sqlcmd -S localhost,14330 -U sa -P YourPassword -Q "SELECT @@VERSION" -h -1', { 
          encoding: 'utf8',
          timeout: 10000 
        });
        
        if (output.includes('Microsoft SQL Server')) {
          this.healthStatus.services['SQL Server'] = {
            status: 'healthy',
            version: output.trim(),
            url: this.options.urls.sql
          };
          console.log('   ✅ SQL Server: Connected');
        } else {
          throw new Error('Unexpected SQL Server response');
        }
        
      } catch (sqlError) {
        // Try Docker exec as fallback
        try {
          const containerName = 'sitecore-xp0_mssql_1';
          execSync(`docker exec ${containerName} sqlcmd -S localhost -U sa -P YourPassword -Q "SELECT 1"`, {
            encoding: 'utf8',
            timeout: 10000
          });
          
          this.healthStatus.services['SQL Server'] = {
            status: 'healthy',
            method: 'docker-exec',
            url: this.options.urls.sql
          };
          console.log('   ✅ SQL Server: Connected (via container)');
          
        } catch (dockerError) {
          this.healthStatus.services['SQL Server'] = {
            status: 'unhealthy',
            error: 'Cannot connect to SQL Server',
            url: this.options.urls.sql
          };
          console.log('   ❌ SQL Server: Connection failed');
        }
      }
      
    } catch (error) {
      this.healthStatus.services['SQL Server'] = {
        status: 'unknown',
        error: error.message,
        url: this.options.urls.sql
      };
      console.log('   ⚠️  SQL Server: Status unknown');
    }
  }

  /**
   * Check Sitecore application initialization
   */
  async checkSitecoreInitialization() {
    console.log('🎯 Checking Sitecore initialization...');
    
    try {
      // Check if Sitecore admin login is accessible
      const response = await axios.get(`${this.options.urls.cm}/sitecore/admin/`, {
        timeout: 15000,
        maxRedirects: 5,
        httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
      });
      
      if (response.data.includes('Sitecore') || response.status === 200) {
        console.log('   ✅ Sitecore admin interface accessible');
        return true;
      } else {
        console.log('   ❌ Sitecore admin interface not ready');
        return false;
      }
      
    } catch (error) {
      console.log(`   ❌ Sitecore initialization check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Wait for deployment to be ready
   */
  async waitForDeployment() {
    console.log('⏳ Waiting for Sitecore deployment to be ready...');
    console.log(`   Timeout: ${Math.round(this.options.timeout / 60000)} minutes`);
    console.log(`   Check interval: ${this.options.checkInterval / 1000} seconds\n`);
    
    const startTime = Date.now();
    let attempt = 1;
    
    while (Date.now() - startTime < this.options.timeout) {
      console.log(`🔄 Health check attempt ${attempt} (${new Date().toLocaleTimeString()}):`);
      
      // Check container health
      const containersHealthy = this.checkContainerHealth();
      
      if (containersHealthy) {
        // Check service health
        const servicesHealthy = await this.checkServiceHealth();
        
        if (servicesHealthy) {
          // Check Sitecore initialization
          const sitecoreReady = await this.checkSitecoreInitialization();
          
          if (sitecoreReady) {
            this.healthStatus.overall = 'ready';
            this.healthStatus.readyTime = new Date();
            
            const totalTime = Math.round((Date.now() - startTime) / 1000);
            console.log(`\n🎉 Sitecore deployment is ready! (${totalTime}s)`);
            return true;
          }
        }
      }
      
      console.log(`⏳ Not ready yet, waiting ${this.options.checkInterval / 1000}s before next check...\n`);
      
      await new Promise(resolve => setTimeout(resolve, this.options.checkInterval));
      attempt++;
    }
    
    this.healthStatus.overall = 'timeout';
    console.log('\n❌ Deployment readiness check timed out');
    return false;
  }

  /**
   * Generate health report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      status: this.healthStatus.overall,
      duration: this.healthStatus.readyTime ? 
        Math.round((this.healthStatus.readyTime - this.healthStatus.startTime) / 1000) : null,
      containers: this.healthStatus.containers,
      services: this.healthStatus.services,
      errors: this.healthStatus.errors,
      urls: this.options.urls
    };
    
    return report;
  }

  /**
   * Display health summary
   */
  displaySummary() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 SITECORE DEPLOYMENT HEALTH SUMMARY');
    console.log('='.repeat(80));
    
    console.log(`\n🎯 Overall Status: ${this.healthStatus.overall.toUpperCase()}`);
    
    if (this.healthStatus.readyTime) {
      const duration = Math.round((this.healthStatus.readyTime - this.healthStatus.startTime) / 1000);
      console.log(`⏱️  Ready in: ${duration} seconds`);
    }
    
    console.log('\n🐳 Container Status:');
    Object.entries(this.healthStatus.containers).forEach(([name, status]) => {
      const icon = status.health === 'healthy' ? '✅' : '❌';
      console.log(`   ${icon} ${name}: ${status.health}`);
    });
    
    console.log('\n🌐 Service Status:');
    Object.entries(this.healthStatus.services).forEach(([name, status]) => {
      const icon = status.status === 'healthy' ? '✅' : '❌';
      console.log(`   ${icon} ${name}: ${status.status}`);
    });
    
    if (this.healthStatus.overall === 'ready') {
      console.log('\n🎉 Ready for testing! Access URLs:');
      Object.entries(this.options.urls).forEach(([service, url]) => {
        console.log(`   ${service.toUpperCase()}: ${url}`);
      });
    }
    
    if (this.healthStatus.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      this.healthStatus.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    console.log('\n' + '='.repeat(80));
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    if (value && !value.startsWith('--')) {
      if (key === 'timeout') options.timeout = parseInt(value) * 1000;
      else if (key === 'interval') options.checkInterval = parseInt(value) * 1000;
      else options[key] = value;
    }
  }
  
  const checker = new SitecoreHealthChecker(options);
  
  if (args.includes('--wait')) {
    // Wait for deployment to be ready
    checker.waitForDeployment()
      .then(ready => {
        checker.displaySummary();
        
        // Save report
        const report = checker.generateReport();
        require('fs').writeFileSync('sitecore-health-report.json', JSON.stringify(report, null, 2));
        
        process.exit(ready ? 0 : 1);
      })
      .catch(error => {
        console.error(`❌ Health check failed: ${error.message}`);
        process.exit(1);
      });
  } else {
    // Single health check
    Promise.all([
      checker.checkContainerHealth(),
      checker.checkServiceHealth()
    ]).then(([containers, services]) => {
      checker.displaySummary();
      process.exit((containers && services) ? 0 : 1);
    }).catch(error => {
      console.error(`❌ Health check failed: ${error.message}`);
      process.exit(1);
    });
  }
}

module.exports = SitecoreHealthChecker;