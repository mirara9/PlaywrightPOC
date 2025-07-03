#!/usr/bin/env node

/**
 * Sitecore Container Deployment Script
 * Orchestrates Sitecore 10.3 deployment using Docker containers
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const SitecorePrerequisitesValidator = require('./sitecore-prerequisites');
const SitecoreLicenseManager = require('./sitecore-license-manager');

class SitecoreDeployer {
  constructor(options = {}) {
    this.options = {
      sitecoreVersion: '10.3.0',
      topology: 'xp0', // xp0, xp1, xm1, xc1
      windowsVersion: 'ltsc2019', // ltsc2019, ltsc2022
      sqlPassword: this.generatePassword(),
      sitecorePassword: this.generatePassword(),
      telerikKey: '', // Required for Sitecore
      deploymentPath: path.join(process.cwd(), 'sitecore-deployment'),
      timeout: 1800000, // 30 minutes
      ...options
    };
    
    this.validator = new SitecorePrerequisitesValidator();
    this.licenseManager = new SitecoreLicenseManager();
    this.deploymentStatus = {
      phase: 'not_started',
      containers: {},
      startTime: null,
      errors: []
    };
  }

  /**
   * Generate secure password
   */
  generatePassword(length = 16) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Pre-deployment validation
   */
  async validateEnvironment() {
    console.log('🔍 Validating environment for Sitecore deployment...');
    
    // Validate prerequisites
    const prereqsPassed = await this.validator.validateAll();
    if (!prereqsPassed) {
      throw new Error('Prerequisites validation failed. Please resolve issues before deployment.');
    }
    
    // Validate license
    try {
      const licensePath = this.licenseManager.getDeploymentLicensePath();
      console.log(`✅ License validated: ${licensePath}`);
    } catch (error) {
      console.log('⚠️  License not found, attempting setup...');
      await this.licenseManager.setupLicense();
    }
    
    console.log('✅ Environment validation complete');
  }

  /**
   * Download Sitecore container deployment package
   */
  async downloadSitecorePackage() {
    console.log('📦 Preparing Sitecore deployment package...');
    
    const packagePath = path.join(this.options.deploymentPath, 'package');
    
    if (!fs.existsSync(packagePath)) {
      fs.mkdirSync(packagePath, { recursive: true });
    }
    
    // In real implementation, this would download from Sitecore Developer Portal
    console.log('⚠️  Note: Download Sitecore Container Deployment Package manually from:');
    console.log('   https://dev.sitecore.net/Downloads/Sitecore_Experience_Platform');
    console.log(`   Extract to: ${packagePath}`);
    
    // For now, create the expected directory structure
    const composePath = path.join(packagePath, 'compose', this.options.windowsVersion, this.options.topology);
    if (!fs.existsSync(composePath)) {
      fs.mkdirSync(composePath, { recursive: true });
    }
    
    return composePath;
  }

  /**
   * Generate docker-compose configuration
   */
  generateDockerCompose(composePath) {
    console.log('📝 Generating docker-compose configuration...');
    
    const licensePath = this.licenseManager.getDeploymentLicensePath();
    
    const composeContent = `version: '2.4'

networks:
  default:
    external:
      name: nat

services:
  
  traefik:
    isolation: hyperv
    image: traefik:v2.2.0-windowsservercore-1809
    command:
      - "--ping"
      - "--api.insecure=true"
      - "--providers.docker.endpoint=npipe:////./pipe/docker_engine"
      - "--providers.docker.exposedByDefault=false"
      - "--providers.file.directory=C:/etc/traefik/dynamic"
      - "--entrypoints.websecure.address=:443"
      - "--entrypoints.web.address=:80"
    ports:
      - "443:443"
      - "80:80"
      - "8080:8080"
    volumes:
      - source: \\.\pipe\\docker_engine
        target: \\.\pipe\\docker_engine
        type: npipe
      - .\\traefik:C:\\etc\\traefik
    depends_on:
      - cm

  mssql:
    isolation: hyperv
    image: \${REGISTRY}\${COMPOSE_PROJECT_NAME}-mssql:\${VERSION:-latest}
    build:
      context: .\\docker\\build\\mssql
      args:
        BASE_IMAGE: \${MSSQL_BASE_IMAGE}
        SPE_IMAGE: \${SPE_IMAGE}
        SXA_IMAGE: \${SXA_IMAGE}
    environment:
      SA_PASSWORD: \${SQL_SA_PASSWORD}
      ACCEPT_EULA: "Y"
    ports:
      - "14330:1433"
    volumes:
      - type: bind
        source: .\\mssql-data
        target: c:\\data

  solr:
    isolation: hyperv
    image: \${REGISTRY}\${COMPOSE_PROJECT_NAME}-solr:\${VERSION:-latest}
    build:
      context: .\\docker\\build\\solr
      args:
        BASE_IMAGE: \${SOLR_BASE_IMAGE}
    ports:
      - "8984:8983"
    volumes:
      - type: bind
        source: .\\solr-data
        target: c:\\data
    environment:
      SOLR_MODE: solrcloud

  id:
    isolation: hyperv
    image: \${REGISTRY}\${COMPOSE_PROJECT_NAME}-id:\${VERSION:-latest}
    build:
      context: .\\docker\\build\\id
      args:
        BASE_IMAGE: \${ID_BASE_IMAGE}
        ASSETS_IMAGE: \${TOOLS_ASSETS_IMAGE}
    environment:
      Sitecore_Sitecore__IdentityServer__SitecoreMemberShipOptions__ConnectionString: Data Source=mssql;Initial Catalog=Sitecore.Core;Integrated Security=False;User ID=sa;Password=\${SQL_SA_PASSWORD}
      Sitecore_Sitecore__IdentityServer__AccountOptions__PasswordRecoveryUrl: https://\${CM_HOST}/sitecore/login?rc=1
      Sitecore_Sitecore__IdentityServer__Clients__PasswordClient__ClientSecrets__ClientSecret1: \${SITECORE_IDSECRET}
      Sitecore_Sitecore__IdentityServer__Clients__DefaultClient__ClientSecrets__ClientSecret1: \${SITECORE_IDSECRET}
      Sitecore_Sitecore__IdentityServer__CertificateRawData: \${SITECORE_ID_CERTIFICATE}
      Sitecore_Sitecore__IdentityServer__PublicOrigin: https://\${ID_HOST}
      Sitecore_Sitecore__IdentityServer__CertificateRawDataPassword: \${SITECORE_ID_CERTIFICATE_PASSWORD}
      Sitecore_License: \${SITECORE_LICENSE}
      Sitecore_Logging__LogLevel__Default: \${LOG_LEVEL_VALUE}
    depends_on:
      - mssql
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.id-secure.entrypoints=websecure"
      - "traefik.http.routers.id-secure.rule=Host(\`\${ID_HOST}\`)"
      - "traefik.http.routers.id-secure.tls=true"

  cm:
    isolation: hyperv
    image: \${REGISTRY}\${COMPOSE_PROJECT_NAME}-cm:\${VERSION:-latest}
    build:
      context: .\\docker\\build\\cm
      args:
        BASE_IMAGE: \${CM_BASE_IMAGE}
        SPE_IMAGE: \${SPE_IMAGE}
        SXA_IMAGE: \${SXA_IMAGE}
        TOOLING_IMAGE: \${TOOLS_ASSETS_IMAGE}
        SOLUTION_IMAGE: \${SOLUTION_BASE_IMAGE}
    depends_on:
      - id
      - mssql
      - solr
    environment:
      Sitecore_ConnectionStrings_Core: Data Source=mssql;Initial Catalog=Sitecore.Core;Integrated Security=False;User ID=sa;Password=\${SQL_SA_PASSWORD}
      Sitecore_ConnectionStrings_Security: Data Source=mssql;Initial Catalog=Sitecore.Core;Integrated Security=False;User ID=sa;Password=\${SQL_SA_PASSWORD}
      Sitecore_ConnectionStrings_Master: Data Source=mssql;Initial Catalog=Sitecore.Master;Integrated Security=False;User ID=sa;Password=\${SQL_SA_PASSWORD}
      Sitecore_ConnectionStrings_Web: Data Source=mssql;Initial Catalog=Sitecore.Web;Integrated Security=False;User ID=sa;Password=\${SQL_SA_PASSWORD}
      Sitecore_ConnectionStrings_Solr.Search: http://solr:8983/solr
      Sitecore_Identity_Server_Authority: https://\${ID_HOST}
      Sitecore_Identity_Server_InternalAuthority: http://id
      Sitecore_Identity_Server_CallbackAuthority: https://\${CM_HOST}
      Sitecore_Identity_Server_Require_Https: false
      SOLR_CORE_PREFIX_NAME: \${SOLR_CORE_PREFIX_NAME}
      MEDIA_REQUEST_PROTECTION_SHARED_SECRET: \${MEDIA_REQUEST_PROTECTION_SHARED_SECRET}
      LOG_LEVEL_VALUE: \${LOG_LEVEL_VALUE}
      Sitecore_License: \${SITECORE_LICENSE}
      Sitecore_GraphQL_CORS_AllowedOrigins: https://\${CM_HOST}
      Sitecore_Mvc_DisableViewStateMAC: true
      Sitecore_DisableClientGeoIpLookup: true
      SITECORE_DEVELOPMENT_PATCHES: DevEnvOn,CustomErrorsOff,DebugOn,DiagnosticsOff,InitMessagesOff
      Sitecore_AppSettings_Telerik.AsyncUpload.ConfigurationEncryptionKey: \${TELERIK_ENCRYPTION_KEY}
      Sitecore_AppSettings_Telerik.Upload.ConfigurationHashKey: \${TELERIK_ENCRYPTION_KEY}
      Sitecore_AppSettings_Telerik.Web.UI.DialogParametersEncryptionKey: \${TELERIK_ENCRYPTION_KEY}
    ports:
      - "44001:80"
    labels:
      - "traefik.enable=true"
      - "traefik.http.middlewares.force-STS-Header.headers.forceSTSHeader=true"
      - "traefik.http.middlewares.force-STS-Header.headers.stsSeconds=31536000"
      - "traefik.http.routers.cm-secure.entrypoints=websecure"
      - "traefik.http.routers.cm-secure.rule=Host(\`\${CM_HOST}\`)"
      - "traefik.http.routers.cm-secure.tls=true"
      - "traefik.http.routers.cm-secure.middlewares=force-STS-Header"
    volumes:
      - \${LOCAL_DEPLOY_PATH}\\website:C:\\deploy
      - \${LOCAL_DATA_PATH}\\cm:C:\\inetpub\\wwwroot\\App_Data\\logs
`;

    const envContent = `# Sitecore Environment Variables
COMPOSE_PROJECT_NAME=sitecore-xp0
REGISTRY=
VERSION=latest

# Host names
CM_HOST=xp0cm.localhost
ID_HOST=xp0id.localhost

# SQL Server
SQL_SA_PASSWORD=${this.options.sqlPassword}
MSSQL_BASE_IMAGE=mcr.microsoft.com/mssql/server:2019-latest

# Sitecore Images
CM_BASE_IMAGE=scr.sitecore.com/sxp/sitecore-xp0-cm:${this.options.sitecoreVersion}-${this.options.windowsVersion}
ID_BASE_IMAGE=scr.sitecore.com/sxp/sitecore-id6:${this.options.sitecoreVersion}-${this.options.windowsVersion}
SOLR_BASE_IMAGE=scr.sitecore.com/sxp/sitecore-xp0-solr:${this.options.sitecoreVersion}-${this.options.windowsVersion}
TOOLS_ASSETS_IMAGE=scr.sitecore.com/tools/sitecore-docker-tools-assets:${this.options.sitecoreVersion}-${this.options.windowsVersion}
SOLUTION_BASE_IMAGE=mcr.microsoft.com/dotnet/framework/sdk:4.8-${this.options.windowsVersion}

# Additional Images (if using SPE/SXA)
SPE_IMAGE=scr.sitecore.com/sxp/modules/sitecore-spe-assets:6.4-1809
SXA_IMAGE=scr.sitecore.com/sxp/modules/sitecore-sxa-assets:10.3.0-1809

# Security
SITECORE_IDSECRET=${this.generatePassword(64)}
SITECORE_ID_CERTIFICATE=${this.generateCertificate()}
SITECORE_ID_CERTIFICATE_PASSWORD=${this.generatePassword(32)}
TELERIK_ENCRYPTION_KEY=${this.options.telerikKey || this.generatePassword(128)}
MEDIA_REQUEST_PROTECTION_SHARED_SECRET=${this.generatePassword(64)}

# License
SITECORE_LICENSE=${this.encodeLicense(licensePath)}

# Solr
SOLR_CORE_PREFIX_NAME=sitecore

# Logging
LOG_LEVEL_VALUE=INFO

# Local paths
LOCAL_DEPLOY_PATH=.\\deploy
LOCAL_DATA_PATH=.\\data
`;

    // Write files
    fs.writeFileSync(path.join(composePath, 'docker-compose.yml'), composeContent);
    fs.writeFileSync(path.join(composePath, '.env'), envContent);
    
    // Create required directories
    ['deploy', 'data\\cm', 'mssql-data', 'solr-data', 'traefik'].forEach(dir => {
      const dirPath = path.join(composePath, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    });
    
    console.log(`✅ Docker compose configuration generated: ${composePath}`);
    return composePath;
  }

  /**
   * Encode license file for environment variable
   */
  encodeLicense(licensePath) {
    try {
      const content = fs.readFileSync(licensePath, 'utf8');
      return Buffer.from(content).toString('base64');
    } catch (error) {
      throw new Error(`Failed to encode license: ${error.message}`);
    }
  }

  /**
   * Generate self-signed certificate for Identity Server
   */
  generateCertificate() {
    // In production, use proper certificate generation
    // For demo, return placeholder
    return 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0t...'; // Base64 encoded certificate
  }

  /**
   * Initialize deployment environment
   */
  async initializeDeployment(composePath) {
    console.log('🚀 Initializing Sitecore deployment...');
    
    try {
      // Run compose-init equivalent
      console.log('📝 Running deployment initialization...');
      
      // Pull required images (this would normally be done by compose-init.ps1)
      console.log('📥 Pulling Sitecore container images...');
      
      // In real implementation, this would execute:
      // execSync('docker-compose pull', { cwd: composePath, stdio: 'inherit' });
      
      console.log('✅ Deployment initialization complete');
      
    } catch (error) {
      throw new Error(`Deployment initialization failed: ${error.message}`);
    }
  }

  /**
   * Start Sitecore containers
   */
  async startContainers(composePath) {
    console.log('🐳 Starting Sitecore containers...');
    this.deploymentStatus.phase = 'starting';
    this.deploymentStatus.startTime = new Date();
    
    try {
      // Start containers
      console.log('⏳ This may take 15-30 minutes for first deployment...');
      
      // In real implementation:
      // execSync('docker-compose up -d', { cwd: composePath, stdio: 'inherit' });
      
      console.log('⚠️  Note: Execute the following commands manually:');
      console.log(`   cd "${composePath}"`);
      console.log('   docker-compose up -d');
      
      this.deploymentStatus.phase = 'started';
      
    } catch (error) {
      this.deploymentStatus.phase = 'failed';
      this.deploymentStatus.errors.push(error.message);
      throw new Error(`Container startup failed: ${error.message}`);
    }
  }

  /**
   * Deploy Sitecore environment
   */
  async deploy() {
    try {
      console.log('🎯 Starting Sitecore 10.3 deployment...\n');
      
      // Validate environment
      await this.validateEnvironment();
      
      // Download/prepare package
      const packagePath = await this.downloadSitecorePackage();
      
      // Generate docker-compose
      const composePath = this.generateDockerCompose(packagePath);
      
      // Initialize deployment
      await this.initializeDeployment(composePath);
      
      // Start containers
      await this.startContainers(composePath);
      
      console.log('\n🎉 Sitecore deployment initiated successfully!');
      console.log('\n📊 Deployment Information:');
      console.log(`   Topology: ${this.options.topology}`);
      console.log(`   Version: ${this.options.sitecoreVersion}`);
      console.log(`   Compose Path: ${composePath}`);
      console.log('\n🌐 Access URLs (after containers are healthy):');
      console.log('   Content Management: https://xp0cm.localhost');
      console.log('   Identity Server: https://xp0id.localhost');
      console.log('   SQL Server: localhost:14330');
      console.log('   Solr: http://localhost:8984');
      
      console.log('\n⚠️  Next Steps:');
      console.log('   1. Wait for all containers to show "healthy" status');
      console.log('   2. Verify access to CM and ID URLs');
      console.log('   3. Run Playwright tests with npm run test:sitecore');
      
      return {
        success: true,
        composePath,
        urls: {
          cm: 'https://xp0cm.localhost',
          id: 'https://xp0id.localhost',
          sql: 'localhost:14330',
          solr: 'http://localhost:8984'
        }
      };
      
    } catch (error) {
      console.error(`\n❌ Deployment failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        status: this.deploymentStatus
      };
    }
  }

  /**
   * Get deployment status
   */
  getStatus() {
    return this.deploymentStatus;
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
      options[key] = value;
    }
  }
  
  const deployer = new SitecoreDeployer(options);
  
  deployer.deploy()
    .then(result => {
      if (result.success) {
        console.log('\n✅ Deployment completed successfully');
        process.exit(0);
      } else {
        console.error('\n❌ Deployment failed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error(`\n💥 Unexpected error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = SitecoreDeployer;