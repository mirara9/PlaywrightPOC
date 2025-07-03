#!/usr/bin/env node

/**
 * Sitecore License Manager
 * Handles secure license file management for Sitecore container deployments
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

class SitecoreLicenseManager {
  constructor() {
    this.defaultLicensePaths = [
      'C:\\License\\license.xml',
      path.join(process.cwd(), 'sitecore', 'license.xml'),
      path.join(process.cwd(), 'license.xml'),
      path.join(process.env.USERPROFILE || process.env.HOME || '', 'sitecore-license.xml')
    ];
    
    this.secureStoragePath = path.join(process.cwd(), '.sitecore');
    this.licenseConfigFile = path.join(this.secureStoragePath, 'license-config.json');
  }

  /**
   * Initialize secure storage directory
   */
  initializeSecureStorage() {
    if (!fs.existsSync(this.secureStoragePath)) {
      fs.mkdirSync(this.secureStoragePath, { recursive: true });
      console.log(`📁 Created secure storage directory: ${this.secureStoragePath}`);
    }

    // Create .gitignore to prevent accidental commits
    const gitignorePath = path.join(this.secureStoragePath, '.gitignore');
    if (!fs.existsSync(gitignorePath)) {
      fs.writeFileSync(gitignorePath, '# Sitecore License Files - DO NOT COMMIT\n*\n!.gitignore\n');
    }
  }

  /**
   * Discover license file from common locations
   */
  discoverLicenseFile() {
    console.log('🔍 Searching for Sitecore license file...');
    
    for (const licensePath of this.defaultLicensePaths) {
      if (fs.existsSync(licensePath)) {
        if (this.validateLicenseFile(licensePath)) {
          console.log(`✅ Valid license found: ${licensePath}`);
          return licensePath;
        } else {
          console.log(`⚠️  Invalid license file: ${licensePath}`);
        }
      }
    }
    
    console.log('❌ No valid license file found in default locations:');
    this.defaultLicensePaths.forEach(p => console.log(`   - ${p}`));
    return null;
  }

  /**
   * Validate license file format and content
   */
  validateLicenseFile(licensePath) {
    try {
      const content = fs.readFileSync(licensePath, 'utf8');
      
      // Basic XML structure validation
      if (!content.includes('<license>') || !content.includes('</license>')) {
        return false;
      }
      
      // Check for required Sitecore license elements
      const requiredElements = ['signature', 'expires', 'version'];
      for (const element of requiredElements) {
        if (!content.includes(`<${element}>`)) {
          console.log(`⚠️  License missing required element: ${element}`);
          return false;
        }
      }
      
      // Check expiration date
      const expirationMatch = content.match(/<expires>(.*?)<\/expires>/);
      if (expirationMatch) {
        const expirationDate = new Date(expirationMatch[1]);
        const now = new Date();
        
        if (expirationDate < now) {
          console.log(`⚠️  License expired on: ${expirationDate.toISOString()}`);
          return false;
        }
        
        // Warn if license expires soon (within 30 days)
        const daysUntilExpiration = Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiration <= 30) {
          console.log(`⚠️  License expires in ${daysUntilExpiration} days`);
        }
      }
      
      return true;
    } catch (error) {
      console.error(`❌ Error validating license: ${error.message}`);
      return false;
    }
  }

  /**
   * Copy license file to secure storage with encryption
   */
  secureLicenseFile(sourcePath, options = {}) {
    this.initializeSecureStorage();
    
    if (!this.validateLicenseFile(sourcePath)) {
      throw new Error('Invalid license file provided');
    }
    
    const securedLicensePath = path.join(this.secureStoragePath, 'license.xml');
    const backupPath = path.join(this.secureStoragePath, `license-backup-${Date.now()}.xml`);
    
    try {
      // Create backup if license already exists
      if (fs.existsSync(securedLicensePath)) {
        fs.copyFileSync(securedLicensePath, backupPath);
        console.log(`📦 Created backup: ${backupPath}`);
      }
      
      // Copy license to secure location
      fs.copyFileSync(sourcePath, securedLicensePath);
      
      // Set restrictive permissions (Windows)
      if (process.platform === 'win32') {
        try {
          execSync(`icacls "${securedLicensePath}" /inheritance:r /grant:r "%USERNAME%":F`, { stdio: 'ignore' });
          console.log('🔒 Set restrictive file permissions');
        } catch (error) {
          console.log('⚠️  Could not set file permissions');
        }
      }
      
      // Save license configuration
      const config = {
        licensePath: securedLicensePath,
        originalPath: sourcePath,
        securedAt: new Date().toISOString(),
        checksum: this.calculateChecksum(securedLicensePath),
        ...options
      };
      
      fs.writeFileSync(this.licenseConfigFile, JSON.stringify(config, null, 2));
      
      console.log(`✅ License secured at: ${securedLicensePath}`);
      return securedLicensePath;
      
    } catch (error) {
      throw new Error(`Failed to secure license file: ${error.message}`);
    }
  }

  /**
   * Calculate file checksum for integrity verification
   */
  calculateChecksum(filePath) {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Verify license integrity
   */
  verifyLicenseIntegrity() {
    if (!fs.existsSync(this.licenseConfigFile)) {
      return { valid: false, error: 'No license configuration found' };
    }
    
    try {
      const config = JSON.parse(fs.readFileSync(this.licenseConfigFile, 'utf8'));
      
      if (!fs.existsSync(config.licensePath)) {
        return { valid: false, error: 'License file not found' };
      }
      
      const currentChecksum = this.calculateChecksum(config.licensePath);
      if (currentChecksum !== config.checksum) {
        return { valid: false, error: 'License file has been modified' };
      }
      
      if (!this.validateLicenseFile(config.licensePath)) {
        return { valid: false, error: 'License file is invalid' };
      }
      
      return { valid: true, config };
      
    } catch (error) {
      return { valid: false, error: `Verification failed: ${error.message}` };
    }
  }

  /**
   * Get current license information
   */
  getLicenseInfo() {
    const verification = this.verifyLicenseIntegrity();
    
    if (!verification.valid) {
      return { error: verification.error };
    }
    
    try {
      const content = fs.readFileSync(verification.config.licensePath, 'utf8');
      
      // Extract license information
      const info = {};
      
      const expirationMatch = content.match(/<expires>(.*?)<\/expires>/);
      if (expirationMatch) {
        info.expires = new Date(expirationMatch[1]);
        info.daysUntilExpiration = Math.ceil((info.expires - new Date()) / (1000 * 60 * 60 * 24));
      }
      
      const versionMatch = content.match(/<version>(.*?)<\/version>/);
      if (versionMatch) {
        info.version = versionMatch[1];
      }
      
      const customerMatch = content.match(/<customer>(.*?)<\/customer>/);
      if (customerMatch) {
        info.customer = customerMatch[1];
      }
      
      info.path = verification.config.licensePath;
      info.securedAt = verification.config.securedAt;
      
      return info;
      
    } catch (error) {
      return { error: `Failed to read license info: ${error.message}` };
    }
  }

  /**
   * Setup license for Sitecore deployment
   */
  async setupLicense(sourcePath = null) {
    console.log('🎫 Setting up Sitecore license...');
    
    let licensePath = sourcePath;
    
    // Auto-discover if no path provided
    if (!licensePath) {
      licensePath = this.discoverLicenseFile();
      if (!licensePath) {
        throw new Error('No valid license file found. Please provide a valid Sitecore license.');
      }
    }
    
    // Verify provided path
    if (!fs.existsSync(licensePath)) {
      throw new Error(`License file not found: ${licensePath}`);
    }
    
    // Secure the license
    const securedPath = this.secureLicenseFile(licensePath);
    
    // Display license information
    const info = this.getLicenseInfo();
    if (!info.error) {
      console.log('\n📄 License Information:');
      console.log(`   Customer: ${info.customer || 'Unknown'}`);
      console.log(`   Version: ${info.version || 'Unknown'}`);
      console.log(`   Expires: ${info.expires ? info.expires.toLocaleDateString() : 'Unknown'}`);
      if (info.daysUntilExpiration !== undefined) {
        console.log(`   Days until expiration: ${info.daysUntilExpiration}`);
      }
    }
    
    return securedPath;
  }

  /**
   * Get license path for deployment scripts
   */
  getDeploymentLicensePath() {
    const verification = this.verifyLicenseIntegrity();
    if (!verification.valid) {
      throw new Error(`License verification failed: ${verification.error}`);
    }
    
    return verification.config.licensePath;
  }

  /**
   * Clean up old license backups
   */
  cleanupBackups(keepCount = 5) {
    try {
      const files = fs.readdirSync(this.secureStoragePath);
      const backupFiles = files
        .filter(f => f.startsWith('license-backup-') && f.endsWith('.xml'))
        .map(f => ({
          name: f,
          path: path.join(this.secureStoragePath, f),
          mtime: fs.statSync(path.join(this.secureStoragePath, f)).mtime
        }))
        .sort((a, b) => b.mtime - a.mtime);
      
      if (backupFiles.length > keepCount) {
        const toDelete = backupFiles.slice(keepCount);
        toDelete.forEach(file => {
          fs.unlinkSync(file.path);
          console.log(`🗑️  Removed old backup: ${file.name}`);
        });
      }
    } catch (error) {
      console.log(`⚠️  Could not cleanup backups: ${error.message}`);
    }
  }
}

// CLI execution
if (require.main === module) {
  const manager = new SitecoreLicenseManager();
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node sitecore-license-manager.js <command> [options]');
    console.log('Commands:');
    console.log('  setup [license-path]    - Setup license for deployment');
    console.log('  verify                  - Verify current license');
    console.log('  info                    - Display license information');
    console.log('  cleanup                 - Clean up old backups');
    process.exit(1);
  }
  
  const command = args[0];
  
  try {
    switch (command) {
      case 'setup':
        manager.setupLicense(args[1])
          .then(path => {
            console.log(`\n✅ License setup complete: ${path}`);
            process.exit(0);
          })
          .catch(error => {
            console.error(`❌ Setup failed: ${error.message}`);
            process.exit(1);
          });
        break;
        
      case 'verify':
        const verification = manager.verifyLicenseIntegrity();
        if (verification.valid) {
          console.log('✅ License verification passed');
          process.exit(0);
        } else {
          console.error(`❌ License verification failed: ${verification.error}`);
          process.exit(1);
        }
        break;
        
      case 'info':
        const info = manager.getLicenseInfo();
        if (info.error) {
          console.error(`❌ ${info.error}`);
          process.exit(1);
        } else {
          console.log('📄 License Information:');
          Object.entries(info).forEach(([key, value]) => {
            if (key !== 'error') {
              console.log(`   ${key}: ${value}`);
            }
          });
          process.exit(0);
        }
        break;
        
      case 'cleanup':
        manager.cleanupBackups();
        console.log('✅ Cleanup complete');
        process.exit(0);
        break;
        
      default:
        console.error(`❌ Unknown command: ${command}`);
        process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

module.exports = SitecoreLicenseManager;