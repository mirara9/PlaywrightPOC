#!/usr/bin/env node

/**
 * Sitecore Cleanup and Teardown Script
 * Handles cleanup of Sitecore containers, volumes, networks, and test artifacts
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class SitecoreCleanup {
  constructor(options = {}) {
    this.options = {
      // What to clean
      cleanContainers: true,
      cleanVolumes: true,
      cleanNetworks: true,
      cleanImages: false,
      cleanTestArtifacts: true,
      cleanLogs: false,
      cleanReports: false,
      
      // Safety options
      force: false,
      dryRun: false,
      confirmBeforeClean: true,
      
      // Specific cleanup options
      projectName: 'sitecore-xp0',
      keepBackups: 5,
      
      ...options
    };
    
    this.cleanupResults = {
      containers: { removed: 0, errors: [] },
      volumes: { removed: 0, errors: [] },
      networks: { removed: 0, errors: [] },
      images: { removed: 0, errors: [] },
      files: { removed: 0, errors: [] },
      totalSize: 0
    };
  }

  /**
   * Execute complete cleanup
   */
  async cleanup() {
    console.log('🧹 Starting Sitecore Cleanup Process');
    console.log('='.repeat(80));
    
    if (!this.options.force && this.options.confirmBeforeClean) {
      const confirmed = await this.confirmCleanup();
      if (!confirmed) {
        console.log('❌ Cleanup cancelled by user');
        return false;
      }
    }
    
    try {
      // Stop running containers first
      await this.stopContainers();
      
      // Clean containers
      if (this.options.cleanContainers) {
        await this.cleanContainers();
      }
      
      // Clean volumes
      if (this.options.cleanVolumes) {
        await this.cleanVolumes();
      }
      
      // Clean networks
      if (this.options.cleanNetworks) {
        await this.cleanNetworks();
      }
      
      // Clean images
      if (this.options.cleanImages) {
        await this.cleanImages();
      }
      
      // Clean test artifacts
      if (this.options.cleanTestArtifacts) {
        await this.cleanTestArtifacts();
      }
      
      // Display summary
      this.displayCleanupSummary();
      
      console.log('\n✅ Cleanup completed successfully');
      return true;
      
    } catch (error) {
      console.error(`\n❌ Cleanup failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Confirm cleanup with user
   */
  async confirmCleanup() {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    console.log('⚠️  This will remove Sitecore containers, volumes, and networks.');
    console.log('   Data will be permanently lost unless backed up.');
    console.log('\nCleanup scope:');
    
    if (this.options.cleanContainers) console.log('   ✓ Containers');
    if (this.options.cleanVolumes) console.log('   ✓ Volumes (including databases)');
    if (this.options.cleanNetworks) console.log('   ✓ Networks');
    if (this.options.cleanImages) console.log('   ✓ Images');
    if (this.options.cleanTestArtifacts) console.log('   ✓ Test artifacts');
    
    return new Promise(resolve => {
      readline.question('\n❓ Continue with cleanup? (y/N): ', answer => {
        readline.close();
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
  }

  /**
   * Stop running Sitecore containers
   */
  async stopContainers() {
    console.log('\n🛑 Stopping Sitecore containers...');
    
    try {
      // Try docker-compose down first
      const composeFiles = this.findComposeFiles();
      
      for (const composeFile of composeFiles) {
        try {
          const composePath = path.dirname(composeFile);
          console.log(`   Stopping containers from: ${composePath}`);
          
          if (!this.options.dryRun) {
            execSync('docker-compose down', { 
              cwd: composePath,
              stdio: 'pipe'
            });
          }
          
          console.log('   ✅ Containers stopped via docker-compose');
        } catch (error) {
          console.log(`   ⚠️ Docker-compose down failed: ${error.message}`);
        }
      }
      
      // Fallback: stop containers by project name
      try {
        const containers = this.getSitecoreContainers();
        if (containers.length > 0) {
          console.log(`   Stopping ${containers.length} Sitecore containers...`);
          
          if (!this.options.dryRun) {
            execSync(`docker stop ${containers.join(' ')}`, { stdio: 'pipe' });
          }
          
          console.log('   ✅ Containers stopped');
        }
      } catch (error) {
        console.log(`   ⚠️ Container stop failed: ${error.message}`);
      }
      
    } catch (error) {
      console.log(`⚠️ Some containers may still be running: ${error.message}`);
    }
  }

  /**
   * Clean Sitecore containers
   */
  async cleanContainers() {
    console.log('\n🐳 Cleaning Sitecore containers...');
    
    try {
      const containers = this.getSitecoreContainers(true); // Include stopped
      
      if (containers.length === 0) {
        console.log('   No Sitecore containers found');
        return;
      }
      
      console.log(`   Found ${containers.length} containers to remove`);
      
      for (const container of containers) {
        try {
          console.log(`   Removing container: ${container}`);
          
          if (!this.options.dryRun) {
            execSync(`docker rm -f ${container}`, { stdio: 'pipe' });
          }
          
          this.cleanupResults.containers.removed++;
        } catch (error) {
          console.log(`   ❌ Failed to remove ${container}: ${error.message}`);
          this.cleanupResults.containers.errors.push(`${container}: ${error.message}`);
        }
      }
      
      console.log(`   ✅ Removed ${this.cleanupResults.containers.removed} containers`);
      
    } catch (error) {
      console.log(`❌ Container cleanup failed: ${error.message}`);
    }
  }

  /**
   * Clean Sitecore volumes
   */
  async cleanVolumes() {
    console.log('\n💾 Cleaning Sitecore volumes...');
    
    try {
      const volumes = this.getSitecoreVolumes();
      
      if (volumes.length === 0) {
        console.log('   No Sitecore volumes found');
        return;
      }
      
      console.log(`   Found ${volumes.length} volumes to remove`);
      console.log('   ⚠️  This will permanently delete database and content data!');
      
      for (const volume of volumes) {
        try {
          console.log(`   Removing volume: ${volume}`);
          
          if (!this.options.dryRun) {
            execSync(`docker volume rm ${volume}`, { stdio: 'pipe' });
          }
          
          this.cleanupResults.volumes.removed++;
        } catch (error) {
          console.log(`   ❌ Failed to remove ${volume}: ${error.message}`);
          this.cleanupResults.volumes.errors.push(`${volume}: ${error.message}`);
        }
      }
      
      console.log(`   ✅ Removed ${this.cleanupResults.volumes.removed} volumes`);
      
    } catch (error) {
      console.log(`❌ Volume cleanup failed: ${error.message}`);
    }
  }

  /**
   * Clean Sitecore networks
   */
  async cleanNetworks() {
    console.log('\n🌐 Cleaning Sitecore networks...');
    
    try {
      const networks = this.getSitecoreNetworks();
      
      if (networks.length === 0) {
        console.log('   No Sitecore networks found');
        return;
      }
      
      console.log(`   Found ${networks.length} networks to remove`);
      
      for (const network of networks) {
        try {
          console.log(`   Removing network: ${network}`);
          
          if (!this.options.dryRun) {
            execSync(`docker network rm ${network}`, { stdio: 'pipe' });
          }
          
          this.cleanupResults.networks.removed++;
        } catch (error) {
          console.log(`   ❌ Failed to remove ${network}: ${error.message}`);
          this.cleanupResults.networks.errors.push(`${network}: ${error.message}`);
        }
      }
      
      console.log(`   ✅ Removed ${this.cleanupResults.networks.removed} networks`);
      
    } catch (error) {
      console.log(`❌ Network cleanup failed: ${error.message}`);
    }
  }

  /**
   * Clean Sitecore images
   */
  async cleanImages() {
    console.log('\n🖼️ Cleaning Sitecore images...');
    
    try {
      const images = this.getSitecoreImages();
      
      if (images.length === 0) {
        console.log('   No Sitecore images found');
        return;
      }
      
      console.log(`   Found ${images.length} images to remove`);
      console.log('   ⚠️  This will require re-downloading images on next deployment!');
      
      for (const image of images) {
        try {
          console.log(`   Removing image: ${image}`);
          
          if (!this.options.dryRun) {
            execSync(`docker rmi ${image}`, { stdio: 'pipe' });
          }
          
          this.cleanupResults.images.removed++;
        } catch (error) {
          console.log(`   ❌ Failed to remove ${image}: ${error.message}`);
          this.cleanupResults.images.errors.push(`${image}: ${error.message}`);
        }
      }
      
      console.log(`   ✅ Removed ${this.cleanupResults.images.removed} images`);
      
    } catch (error) {
      console.log(`❌ Image cleanup failed: ${error.message}`);
    }
  }

  /**
   * Clean test artifacts and logs
   */
  async cleanTestArtifacts() {
    console.log('\n📄 Cleaning test artifacts...');
    
    const pathsToClean = [
      'test-results',
      'playwright-report',
      'sitecore-health-report.json',
      'sitecore-e2e-report.json',
      'sitecore-e2e-report.html'
    ];
    
    if (this.options.cleanLogs) {
      pathsToClean.push('logs');
    }
    
    if (this.options.cleanReports) {
      pathsToClean.push('reports');
    }
    
    for (const itemPath of pathsToClean) {
      const fullPath = path.join(process.cwd(), itemPath);
      
      if (fs.existsSync(fullPath)) {
        try {
          console.log(`   Removing: ${itemPath}`);
          
          if (!this.options.dryRun) {
            const stats = fs.statSync(fullPath);
            
            if (stats.isDirectory()) {
              fs.rmSync(fullPath, { recursive: true });
            } else {
              fs.unlinkSync(fullPath);
            }
          }
          
          this.cleanupResults.files.removed++;
        } catch (error) {
          console.log(`   ❌ Failed to remove ${itemPath}: ${error.message}`);
          this.cleanupResults.files.errors.push(`${itemPath}: ${error.message}`);
        }
      }
    }
    
    // Clean old backup files
    await this.cleanOldBackups();
    
    console.log(`   ✅ Removed ${this.cleanupResults.files.removed} files/directories`);
  }

  /**
   * Clean old backup files
   */
  async cleanOldBackups() {
    const sitecoreDir = path.join(process.cwd(), '.sitecore');
    
    if (!fs.existsSync(sitecoreDir)) {
      return;
    }
    
    try {
      const files = fs.readdirSync(sitecoreDir);
      const backupFiles = files
        .filter(f => f.startsWith('license-backup-'))
        .map(f => ({
          name: f,
          path: path.join(sitecoreDir, f),
          mtime: fs.statSync(path.join(sitecoreDir, f)).mtime
        }))
        .sort((a, b) => b.mtime - a.mtime);
      
      if (backupFiles.length > this.options.keepBackups) {
        const toDelete = backupFiles.slice(this.options.keepBackups);
        
        for (const file of toDelete) {
          console.log(`   Removing old backup: ${file.name}`);
          
          if (!this.options.dryRun) {
            fs.unlinkSync(file.path);
          }
          
          this.cleanupResults.files.removed++;
        }
      }
    } catch (error) {
      console.log(`   ⚠️ Backup cleanup failed: ${error.message}`);
    }
  }

  /**
   * Get Sitecore containers
   */
  getSitecoreContainers(includeAll = false) {
    try {
      const flags = includeAll ? '-a' : '';
      const output = execSync(`docker ps ${flags} --format "{{.Names}}"`, { encoding: 'utf8' });
      
      return output
        .split('\n')
        .filter(name => name.includes(this.options.projectName) || name.includes('sitecore'))
        .filter(name => name.trim() !== '');
    } catch (error) {
      return [];
    }
  }

  /**
   * Get Sitecore volumes
   */
  getSitecoreVolumes() {
    try {
      const output = execSync('docker volume ls --format "{{.Name}}"', { encoding: 'utf8' });
      
      return output
        .split('\n')
        .filter(name => name.includes(this.options.projectName) || name.includes('sitecore'))
        .filter(name => name.trim() !== '');
    } catch (error) {
      return [];
    }
  }

  /**
   * Get Sitecore networks
   */
  getSitecoreNetworks() {
    try {
      const output = execSync('docker network ls --format "{{.Name}}"', { encoding: 'utf8' });
      
      return output
        .split('\n')
        .filter(name => name.includes(this.options.projectName) || name.includes('sitecore'))
        .filter(name => name.trim() !== '' && name !== 'bridge' && name !== 'host' && name !== 'none');
    } catch (error) {
      return [];
    }
  }

  /**
   * Get Sitecore images
   */
  getSitecoreImages() {
    try {
      const output = execSync('docker images --format "{{.Repository}}:{{.Tag}}"', { encoding: 'utf8' });
      
      return output
        .split('\n')
        .filter(name => name.includes(this.options.projectName) || name.includes('sitecore') || name.includes('scr.sitecore.com'))
        .filter(name => name.trim() !== '');
    } catch (error) {
      return [];
    }
  }

  /**
   * Find docker-compose files
   */
  findComposeFiles() {
    const possiblePaths = [
      path.join(process.cwd(), 'docker-compose.yml'),
      path.join(process.cwd(), 'sitecore-deployment', 'docker-compose.yml'),
      path.join(process.cwd(), '.sitecore', 'docker-compose.yml')
    ];
    
    return possiblePaths.filter(p => fs.existsSync(p));
  }

  /**
   * Display cleanup summary
   */
  displayCleanupSummary() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 CLEANUP SUMMARY');
    console.log('='.repeat(80));
    
    console.log(`\n🐳 Containers: ${this.cleanupResults.containers.removed} removed`);
    if (this.cleanupResults.containers.errors.length > 0) {
      console.log('   Errors:');
      this.cleanupResults.containers.errors.forEach(error => console.log(`     - ${error}`));
    }
    
    console.log(`\n💾 Volumes: ${this.cleanupResults.volumes.removed} removed`);
    if (this.cleanupResults.volumes.errors.length > 0) {
      console.log('   Errors:');
      this.cleanupResults.volumes.errors.forEach(error => console.log(`     - ${error}`));
    }
    
    console.log(`\n🌐 Networks: ${this.cleanupResults.networks.removed} removed`);
    if (this.cleanupResults.networks.errors.length > 0) {
      console.log('   Errors:');
      this.cleanupResults.networks.errors.forEach(error => console.log(`     - ${error}`));
    }
    
    console.log(`\n🖼️ Images: ${this.cleanupResults.images.removed} removed`);
    if (this.cleanupResults.images.errors.length > 0) {
      console.log('   Errors:');
      this.cleanupResults.images.errors.forEach(error => console.log(`     - ${error}`));
    }
    
    console.log(`\n📄 Files: ${this.cleanupResults.files.removed} removed`);
    if (this.cleanupResults.files.errors.length > 0) {
      console.log('   Errors:');
      this.cleanupResults.files.errors.forEach(error => console.log(`     - ${error}`));
    }
    
    const totalRemoved = this.cleanupResults.containers.removed + 
                        this.cleanupResults.volumes.removed + 
                        this.cleanupResults.networks.removed + 
                        this.cleanupResults.images.removed + 
                        this.cleanupResults.files.removed;
    
    console.log(`\n🎯 Total items cleaned: ${totalRemoved}`);
    console.log('='.repeat(80));
  }

  /**
   * Quick cleanup (containers and volumes only)
   */
  async quickCleanup() {
    console.log('⚡ Quick Sitecore cleanup...');
    
    this.options.cleanContainers = true;
    this.options.cleanVolumes = true;
    this.options.cleanNetworks = false;
    this.options.cleanImages = false;
    this.options.cleanTestArtifacts = false;
    this.options.confirmBeforeClean = false;
    
    return await this.cleanup();
  }

  /**
   * Emergency cleanup (force remove everything)
   */
  async emergencyCleanup() {
    console.log('🚨 Emergency Sitecore cleanup (force mode)...');
    
    this.options.cleanContainers = true;
    this.options.cleanVolumes = true;
    this.options.cleanNetworks = true;
    this.options.cleanImages = true;
    this.options.cleanTestArtifacts = true;
    this.options.force = true;
    this.options.confirmBeforeClean = false;
    
    return await this.cleanup();
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
      const key = arg.replace('--', '').replace(/-/g, '');
      const value = args[i + 1];
      
      if (value && !value.startsWith('--')) {
        options[key] = value === 'true' ? true : value === 'false' ? false : value;
        i++;
      } else {
        options[key] = true;
      }
    }
  }
  
  // Handle special modes
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Sitecore Cleanup and Teardown Script

Usage: node sitecore-cleanup.js [options]

Options:
  --clean-containers       Remove Sitecore containers (default: true)
  --clean-volumes          Remove Sitecore volumes (default: true)
  --clean-networks         Remove Sitecore networks (default: true)
  --clean-images           Remove Sitecore images (default: false)
  --clean-test-artifacts   Remove test artifacts (default: true)
  --clean-logs             Remove log files (default: false)
  --clean-reports          Remove report files (default: false)
  --force                  Skip confirmation prompts
  --dry-run                Show what would be removed without doing it
  --quick                  Quick cleanup (containers and volumes only)
  --emergency              Emergency cleanup (remove everything)
  --project-name <name>    Project name to filter by (default: sitecore-xp0)
  --keep-backups <num>     Number of backup files to keep (default: 5)
  --help, -h               Show this help message

Examples:
  node sitecore-cleanup.js                     # Interactive cleanup
  node sitecore-cleanup.js --force             # Force cleanup without prompts
  node sitecore-cleanup.js --dry-run           # Show what would be cleaned
  node sitecore-cleanup.js --quick             # Quick cleanup
  node sitecore-cleanup.js --emergency         # Emergency cleanup (everything)
`);
    process.exit(0);
  }
  
  const cleanup = new SitecoreCleanup(options);
  
  let cleanupPromise;
  
  if (args.includes('--quick')) {
    cleanupPromise = cleanup.quickCleanup();
  } else if (args.includes('--emergency')) {
    cleanupPromise = cleanup.emergencyCleanup();
  } else {
    cleanupPromise = cleanup.cleanup();
  }
  
  cleanupPromise
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error(`💥 Cleanup failed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = SitecoreCleanup;