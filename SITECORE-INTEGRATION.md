# Sitecore Integration Guide

This document describes the complete Sitecore container deployment and testing solution built on top of the Playwright test framework.

## 🎯 Overview

The Sitecore integration provides:
- **Automated Sitecore 10.3 container deployment**
- **Comprehensive UI testing framework** for Sitecore Content Management
- **End-to-end orchestration** from deployment to testing
- **CI/CD pipeline** with GitHub Actions
- **Advanced authentication handling** and session management

## 📁 Project Structure

```
├── scripts/
│   ├── sitecore-prerequisites.js      # System requirements validation
│   ├── sitecore-license-manager.js    # Secure license file management
│   ├── sitecore-deploy.js             # Container deployment orchestration
│   ├── sitecore-health-checker.js     # Deployment readiness verification
│   ├── sitecore-cleanup.js            # Resource cleanup and teardown
│   └── sitecore-e2e.js               # End-to-end workflow orchestration
├── src/
│   ├── wrappers/ui/
│   │   ├── sitecore-base-page.ts      # Base class for Sitecore pages
│   │   ├── sitecore-login-page.ts     # Login page object
│   │   └── sitecore-content-editor.ts # Content Editor page object
│   ├── utils/
│   │   └── sitecore-auth.ts           # Authentication utilities
│   └── tests/sitecore/
│       ├── sitecore-login.test.ts     # Login functionality tests
│       └── sitecore-content-editor.test.ts # Content management tests
└── .github/workflows/
    └── sitecore-e2e.yml              # CI/CD pipeline
```

## 🚀 Quick Start

### Prerequisites

1. **System Requirements**:
   - Windows 10/11 Pro/Enterprise (for Windows containers)
   - 32GB RAM minimum
   - 40GB free disk space
   - Docker Desktop with Windows containers enabled
   - PowerShell 5.1+

2. **Sitecore License**:
   - Valid Sitecore 10.3 license file (`license.xml`)

### Basic Usage

1. **Validate Prerequisites**:
   ```bash
   npm run sitecore:prerequisites
   ```

2. **Setup License**:
   ```bash
   npm run sitecore:license setup path/to/license.xml
   ```

3. **Deploy Sitecore**:
   ```bash
   npm run sitecore:deploy
   ```

4. **Run Tests**:
   ```bash
   npm run test:sitecore
   ```

5. **Complete E2E Workflow**:
   ```bash
   npm run sitecore:e2e
   ```

## 📋 Available Commands

### Prerequisites and Setup
```bash
npm run sitecore:prerequisites        # Validate system requirements
npm run sitecore:license setup        # Setup license file
npm run sitecore:license verify       # Verify license integrity
npm run sitecore:license info         # Display license information
```

### Deployment
```bash
npm run sitecore:deploy               # Deploy Sitecore containers
npm run sitecore:health               # Check deployment health
npm run sitecore:health -- --wait     # Wait for deployment readiness
```

### Testing
```bash
npm run test:sitecore                 # Run all Sitecore tests
npm run test:sitecore:headless        # Run tests in headless mode
npm run test:sitecore:smoke           # Run smoke tests
npm run test:sitecore:regression      # Run regression tests
npm run test:sitecore:content         # Run content editor tests
npm run test:sitecore:login          # Run login tests only
```

### Cleanup
```bash
npm run sitecore:cleanup              # Interactive cleanup
npm run sitecore:cleanup -- --force  # Force cleanup without prompts
npm run sitecore:cleanup -- --quick  # Quick cleanup (containers + volumes)
npm run sitecore:cleanup -- --emergency # Emergency cleanup (everything)
```

### End-to-End Workflows
```bash
npm run sitecore:e2e                 # Complete deployment + testing
npm run sitecore:e2e:quick           # Tests only (skip deployment)
```

## 🏗️ Deployment Architecture

### Container Stack

The deployment creates the following containers:
- **Traefik**: Reverse proxy and SSL termination
- **SQL Server**: Database server for Sitecore databases
- **Solr**: Search engine for content indexing
- **Identity Server**: Authentication and identity management
- **Content Management**: Main Sitecore CM instance

### Network Configuration

- **CM Interface**: https://xp0cm.localhost
- **Identity Server**: https://xp0id.localhost  
- **SQL Server**: localhost:14330
- **Solr Admin**: http://localhost:8984

### Data Persistence

- Database files: `mssql-data/` volume
- Solr indexes: `solr-data/` volume
- Application logs: `data/cm/` volume

## 🧪 Testing Framework

### Page Objects

#### SitecoreBasePage
Base class for all Sitecore page objects providing:
- Common Sitecore UI element handling
- Session management
- Navigation utilities
- Error handling

#### SitecoreLoginPage
Handles authentication flows:
- Multiple authentication methods
- Retry mechanisms for flaky connections
- Session validation
- Domain-aware login

#### SitecoreContentEditor
Content management operations:
- Content tree navigation
- Item creation/editing/deletion
- Field value manipulation
- Publishing workflows
- Ribbon interactions

### Authentication Management

#### SitecoreAuthManager
Centralized authentication handling:
- Session lifecycle management
- Automatic re-authentication
- Multiple user support
- Session timeout handling

#### Usage Examples

```typescript
// Basic authentication
const authManager = await SitecoreAuthHelpers.setupAdminAuth(
  page, 
  'https://xp0cm.localhost', 
  'adminPassword'
);

// Execute with authentication
await authManager.withAuth(async () => {
  // Your test code here
});

// Cleanup
await authManager.logout();
```

### Test Organization

Tests are organized by functionality:
- **Login Tests**: Authentication flows and error handling
- **Content Editor Tests**: Content management operations
- **Integration Tests**: End-to-end workflows

## 🔧 Configuration

### Environment Variables

```bash
# Sitecore URLs
SITECORE_CM_URL=https://xp0cm.localhost
SITECORE_ID_URL=https://xp0id.localhost

# Authentication
SITECORE_USERNAME=admin
SITECORE_PASSWORD=b
SITECORE_DOMAIN=sitecore

# Test Configuration
HEADLESS=true
TEST_ENV=local
```

### License Management

The license manager provides secure handling:
- Automatic license discovery
- Integrity verification
- Backup management
- Expiration monitoring

```bash
# Setup license
node scripts/sitecore-license-manager.js setup path/to/license.xml

# Verify license
node scripts/sitecore-license-manager.js verify

# Get license info
node scripts/sitecore-license-manager.js info
```

## 🏥 Health Monitoring

### Health Checker Features

- Container status monitoring
- Service endpoint validation
- Database connectivity testing
- Comprehensive health reporting

### Health Check Process

1. **Container Health**: Verify all containers are running and healthy
2. **Service Endpoints**: Test HTTP accessibility of key services
3. **Database Connectivity**: Validate SQL Server connection
4. **Sitecore Initialization**: Ensure Sitecore is fully loaded

### Usage

```bash
# Single health check
npm run sitecore:health

# Wait for readiness (30 min timeout)
npm run sitecore:health -- --wait

# Custom timeout and interval
npm run sitecore:health -- --wait --timeout 1800 --interval 30
```

## 🧹 Cleanup and Resource Management

### Cleanup Scope

The cleanup system can remove:
- **Containers**: Running and stopped Sitecore containers
- **Volumes**: Database and application data
- **Networks**: Custom Docker networks
- **Images**: Sitecore container images
- **Test Artifacts**: Reports, screenshots, logs

### Cleanup Modes

```bash
# Interactive cleanup (with confirmation)
npm run sitecore:cleanup

# Force cleanup (no prompts)
npm run sitecore:cleanup -- --force

# Quick cleanup (containers + volumes only)
npm run sitecore:cleanup -- --quick

# Emergency cleanup (remove everything)
npm run sitecore:cleanup -- --emergency

# Dry run (show what would be removed)
npm run sitecore:cleanup -- --dry-run
```

## 🚀 CI/CD Pipeline

### GitHub Actions Workflow

The CI/CD pipeline (`sitecore-e2e.yml`) provides:
- **Prerequisites validation** on multiple OS
- **Automated Sitecore deployment** on Windows runners
- **Parallel test execution** across test types
- **Artifact collection** for debugging
- **Automatic cleanup** of resources
- **PR comments** with test results

### Workflow Triggers

- **Push** to main/develop branches
- **Pull Requests** to main branch
- **Manual dispatch** with configuration options

### Required Secrets

```bash
SITECORE_LICENSE_B64  # Base64-encoded license file content
```

### Manual Workflow Execution

1. Go to **Actions** tab in GitHub
2. Select **Sitecore E2E Testing** workflow
3. Click **Run workflow**
4. Configure options:
   - Test suite (smoke/regression/content/all)
   - Headless mode (true/false)
   - Skip deployment (use existing Sitecore)
   - Cleanup after tests

## 📊 Reporting and Monitoring

### Generated Reports

- **Health Report**: `sitecore-health-report.json`
- **E2E Report**: `sitecore-e2e-report.html` / `.json`
- **Test Results**: Standard Playwright reports
- **Screenshots**: Captured on test failures

### Report Features

- **Deployment Status**: Container and service health
- **Test Metrics**: Pass/fail rates and durations
- **Environment Info**: System and configuration details
- **Error Tracking**: Detailed failure information
- **Artifact Links**: Direct access to logs and screenshots

## 🔍 Troubleshooting

### Common Issues

#### Prerequisites Failures
```bash
# Check system requirements
npm run sitecore:prerequisites

# Common issues:
# - Insufficient RAM (need 32GB+)
# - Docker not running Windows containers
# - Hyper-V not enabled
# - PowerShell version too old
```

#### License Issues
```bash
# Verify license file
npm run sitecore:license verify

# Common issues:
# - License expired
# - Invalid XML format
# - File permissions
# - Missing required elements
```

#### Deployment Failures
```bash
# Check deployment logs
docker-compose logs

# Check container health
npm run sitecore:health

# Common issues:
# - Insufficient disk space
# - Port conflicts
# - Firewall blocking containers
# - Image pull failures
```

#### Test Failures
```bash
# Run with debug output
npm run test:sitecore:login -- --headed

# Common issues:
# - Sitecore not fully initialized
# - Authentication failures
# - Network connectivity
# - Element locator changes
```

### Debug Mode

```bash
# Run tests with browser UI
HEADLESS=false npm run test:sitecore

# Debug specific test
npm run test:sitecore:login -- --debug

# Increase timeouts
TEST_TIMEOUT=60000 npm run test:sitecore
```

### Log Locations

- **Container Logs**: `docker-compose logs [service]`
- **Sitecore Logs**: `data/cm/` directory
- **Test Artifacts**: `test-results/` directory
- **Health Reports**: Root directory (`.json` files)

## 🔐 Security Considerations

### License Security
- License files stored in `.sitecore/` with restricted permissions
- Automatic `.gitignore` creation to prevent commits
- Backup management with configurable retention
- Integrity verification with checksums

### Authentication Security  
- No hardcoded credentials in code
- Environment variable configuration
- Session timeout handling
- Secure credential storage patterns

### Container Security
- Non-root container execution where possible
- Network isolation
- Volume mount restrictions
- Regular base image updates

## 📈 Performance Optimization

### Container Performance
- Resource allocation tuning
- Volume optimization for data persistence
- Network configuration for minimal latency
- Health check optimization

### Test Performance
- Parallel test execution
- Page object reuse
- Smart wait strategies
- Screenshot optimization

### CI/CD Performance
- Artifact caching
- Parallel job execution
- Resource cleanup optimization
- Build artifact reuse

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch
3. Implement changes with tests
4. Ensure all checks pass
5. Submit pull request

### Testing Changes
```bash
# Test prerequisites
npm run sitecore:prerequisites

# Test license management
npm run sitecore:license setup test-license.xml

# Test deployment (requires license)
npm run sitecore:deploy

# Test cleanup
npm run sitecore:cleanup -- --dry-run
```

### Code Standards
- TypeScript for all new code
- Comprehensive error handling
- Logging for debugging
- Documentation for public APIs

## 📚 Additional Resources

- [Sitecore Container Documentation](https://containers.doc.sitecore.com/)
- [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)
- [Playwright Documentation](https://playwright.dev/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section above
2. Review GitHub Issues for similar problems
3. Create a new issue with detailed reproduction steps
4. Include relevant logs and configuration