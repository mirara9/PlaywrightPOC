#!/usr/bin/env node

/**
 * Sitecore Prerequisites Validation Script
 * Validates system requirements for Sitecore 10.3 container deployment
 */

const os = require('os');
const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

class SitecorePrerequisitesValidator {
  constructor() {
    this.requirements = {
      minRamGB: 32,
      minFreeSpaceGB: 40,
      minCpuCores: 4,
      supportedPlatforms: ['win32'],
      requiredSoftware: {
        docker: 'Docker Desktop',
        powershell: 'PowerShell 5.1+',
        dotnet: '.NET Framework 4.8+'
      }
    };
    
    this.results = {
      passed: [],
      failed: [],
      warnings: []
    };
  }

  /**
   * Run all prerequisite checks
   */
  async validateAll() {
    console.log('🔍 Validating Sitecore 10.3 Prerequisites...\n');

    await this.checkPlatform();
    await this.checkMemory();
    await this.checkDiskSpace();
    await this.checkCpuCores();
    await this.checkDockerDesktop();
    await this.checkPowerShell();
    await this.checkHyperV();
    await this.checkVirtualization();
    await this.checkSitecoreLicense();

    this.displayResults();
    return this.results.failed.length === 0;
  }

  /**
   * Check if running on supported platform
   */
  async checkPlatform() {
    const platform = os.platform();
    const release = os.release();
    
    if (this.requirements.supportedPlatforms.includes(platform)) {
      this.results.passed.push(`✅ Platform: ${platform} ${release}`);
      
      // Check Windows version
      if (platform === 'win32') {
        try {
          const version = execSync('ver', { encoding: 'utf8' });
          if (version.includes('Windows 10') || version.includes('Windows 11')) {
            this.results.passed.push(`✅ Windows Version: Supported`);
          } else {
            this.results.warnings.push(`⚠️  Windows Version: May not be fully supported`);
          }
        } catch (error) {
          this.results.warnings.push(`⚠️  Could not determine Windows version`);
        }
      }
    } else {
      this.results.failed.push(`❌ Platform: ${platform} is not supported (requires Windows 10/11 Pro/Enterprise)`);
    }
  }

  /**
   * Check available memory
   */
  async checkMemory() {
    const totalMemGB = Math.round(os.totalmem() / (1024 * 1024 * 1024));
    
    if (totalMemGB >= this.requirements.minRamGB) {
      this.results.passed.push(`✅ Memory: ${totalMemGB}GB (≥${this.requirements.minRamGB}GB required)`);
    } else {
      this.results.failed.push(`❌ Memory: ${totalMemGB}GB (${this.requirements.minRamGB}GB required)`);
    }
  }

  /**
   * Check available disk space
   */
  async checkDiskSpace() {
    try {
      // For Windows, check C: drive
      const stats = fs.statSync('C:\\');
      const freeSpaceGB = Math.round(stats.free / (1024 * 1024 * 1024));
      
      if (freeSpaceGB >= this.requirements.minFreeSpaceGB) {
        this.results.passed.push(`✅ Disk Space: ${freeSpaceGB}GB free (≥${this.requirements.minFreeSpaceGB}GB required)`);
      } else {
        this.results.failed.push(`❌ Disk Space: ${freeSpaceGB}GB free (${this.requirements.minFreeSpaceGB}GB required)`);
      }
    } catch (error) {
      // Fallback method for cross-platform
      try {
        const output = execSync('df -h / 2>/dev/null || fsutil volume diskfree C: 2>nul', { encoding: 'utf8' });
        this.results.warnings.push(`⚠️  Could not accurately determine disk space. Please ensure ${this.requirements.minFreeSpaceGB}GB free space available.`);
      } catch (e) {
        this.results.warnings.push(`⚠️  Could not check disk space. Please manually verify ${this.requirements.minFreeSpaceGB}GB free space.`);
      }
    }
  }

  /**
   * Check CPU cores
   */
  async checkCpuCores() {
    const cpuCores = os.cpus().length;
    
    if (cpuCores >= this.requirements.minCpuCores) {
      this.results.passed.push(`✅ CPU Cores: ${cpuCores} (≥${this.requirements.minCpuCores} required)`);
    } else {
      this.results.failed.push(`❌ CPU Cores: ${cpuCores} (${this.requirements.minCpuCores} required)`);
    }
  }

  /**
   * Check Docker Desktop installation and status
   */
  async checkDockerDesktop() {
    try {
      // Check if Docker is installed
      const dockerVersion = execSync('docker --version', { encoding: 'utf8' }).trim();
      this.results.passed.push(`✅ Docker Installed: ${dockerVersion}`);

      // Check if Docker daemon is running
      try {
        execSync('docker info', { encoding: 'utf8', stdio: 'ignore' });
        this.results.passed.push(`✅ Docker Service: Running`);

        // Check Windows containers support
        try {
          const info = execSync('docker info --format "{{.OSType}}"', { encoding: 'utf8' }).trim();
          if (info === 'windows') {
            this.results.passed.push(`✅ Docker: Windows containers enabled`);
          } else {
            this.results.warnings.push(`⚠️  Docker: Linux containers detected. Sitecore requires Windows containers.`);
          }
        } catch (e) {
          this.results.warnings.push(`⚠️  Could not determine Docker container type`);
        }
      } catch (error) {
        this.results.failed.push(`❌ Docker Service: Not running or not accessible`);
      }
    } catch (error) {
      this.results.failed.push(`❌ Docker: Not installed or not in PATH`);
    }
  }

  /**
   * Check PowerShell version
   */
  async checkPowerShell() {
    try {
      const psVersion = execSync('powershell -Command "$PSVersionTable.PSVersion.Major"', { encoding: 'utf8' }).trim();
      if (parseInt(psVersion) >= 5) {
        this.results.passed.push(`✅ PowerShell: Version ${psVersion}.x`);
      } else {
        this.results.failed.push(`❌ PowerShell: Version ${psVersion}.x (5.1+ required)`);
      }
    } catch (error) {
      this.results.failed.push(`❌ PowerShell: Not available or not in PATH`);
    }
  }

  /**
   * Check Hyper-V status (Windows only)
   */
  async checkHyperV() {
    if (os.platform() !== 'win32') {
      this.results.warnings.push(`⚠️  Hyper-V check skipped (Windows only)`);
      return;
    }

    try {
      const output = execSync('powershell -Command "Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V-All | Select-Object State"', { encoding: 'utf8' });
      if (output.includes('Enabled')) {
        this.results.passed.push(`✅ Hyper-V: Enabled`);
      } else {
        this.results.failed.push(`❌ Hyper-V: Not enabled (required for Docker Desktop)`);
      }
    } catch (error) {
      this.results.warnings.push(`⚠️  Could not check Hyper-V status. Ensure it's enabled for Docker Desktop.`);
    }
  }

  /**
   * Check hardware virtualization support
   */
  async checkVirtualization() {
    try {
      const output = execSync('powershell -Command "(Get-CimInstance -ClassName Win32_Processor).VirtualizationFirmwareEnabled"', { encoding: 'utf8' });
      if (output.includes('True')) {
        this.results.passed.push(`✅ Hardware Virtualization: Enabled in BIOS/UEFI`);
      } else {
        this.results.failed.push(`❌ Hardware Virtualization: Not enabled in BIOS/UEFI`);
      }
    } catch (error) {
      this.results.warnings.push(`⚠️  Could not check virtualization support. Ensure it's enabled in BIOS/UEFI.`);
    }
  }

  /**
   * Check for Sitecore license file
   */
  async checkSitecoreLicense() {
    const licensePaths = [
      'C:\\License\\license.xml',
      path.join(process.cwd(), 'license.xml'),
      path.join(process.cwd(), 'sitecore', 'license.xml')
    ];

    let licenseFound = false;
    for (const licensePath of licensePaths) {
      if (fs.existsSync(licensePath)) {
        try {
          const content = fs.readFileSync(licensePath, 'utf8');
          if (content.includes('<license>') && content.includes('</license>')) {
            this.results.passed.push(`✅ Sitecore License: Found at ${licensePath}`);
            licenseFound = true;
            break;
          }
        } catch (error) {
          // Continue checking other paths
        }
      }
    }

    if (!licenseFound) {
      this.results.failed.push(`❌ Sitecore License: Not found in expected locations (${licensePaths.join(', ')})`);
    }
  }

  /**
   * Display validation results
   */
  displayResults() {
    console.log('\n' + '='.repeat(80));
    console.log('📋 SITECORE PREREQUISITES VALIDATION RESULTS');
    console.log('='.repeat(80));

    if (this.results.passed.length > 0) {
      console.log('\n✅ PASSED CHECKS:');
      this.results.passed.forEach(check => console.log(`  ${check}`));
    }

    if (this.results.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.results.warnings.forEach(warning => console.log(`  ${warning}`));
    }

    if (this.results.failed.length > 0) {
      console.log('\n❌ FAILED CHECKS:');
      this.results.failed.forEach(failure => console.log(`  ${failure}`));
    }

    console.log('\n' + '='.repeat(80));
    
    if (this.results.failed.length === 0) {
      console.log('🎉 ALL PREREQUISITES MET! Ready for Sitecore deployment.');
    } else {
      console.log(`❌ ${this.results.failed.length} prerequisite(s) failed. Please address before deployment.`);
      console.log('\n📖 For help resolving issues, see:');
      console.log('   - Sitecore Container Documentation: https://containers.doc.sitecore.com/');
      console.log('   - Docker Desktop Requirements: https://docs.docker.com/desktop/install/windows-install/');
    }
    
    console.log('='.repeat(80));
  }

  /**
   * Get system information summary
   */
  getSystemInfo() {
    return {
      platform: `${os.platform()} ${os.release()}`,
      arch: os.arch(),
      memory: `${Math.round(os.totalmem() / (1024 * 1024 * 1024))}GB`,
      cpus: os.cpus().length,
      hostname: os.hostname(),
      uptime: `${Math.round(os.uptime() / 3600)}h`
    };
  }
}

// CLI execution
if (require.main === module) {
  const validator = new SitecorePrerequisitesValidator();
  
  // Display system info
  console.log('💻 System Information:');
  const sysInfo = validator.getSystemInfo();
  Object.entries(sysInfo).forEach(([key, value]) => {
    console.log(`   ${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`);
  });
  console.log();

  validator.validateAll()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Validation failed with error:', error.message);
      process.exit(1);
    });
}

module.exports = SitecorePrerequisitesValidator;