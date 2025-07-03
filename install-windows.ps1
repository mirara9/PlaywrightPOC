# Playwright POC Windows PowerShell Installer
# Handles common Windows npm/Node.js issues

param(
    [switch]$Clean = $false,
    [switch]$SkipPlaywright = $false,
    [switch]$Verbose = $false
)

# Colors for output
$Colors = @{
    Red = 'Red'
    Green = 'Green'
    Yellow = 'Yellow'
    Blue = 'Blue'
    Magenta = 'Magenta'
    Cyan = 'Cyan'
    White = 'White'
}

function Write-ColorOutput {
    param([string]$Message, [string]$Color = 'White')
    Write-Host $Message -ForegroundColor $Colors[$Color]
}

function Write-Step {
    param([string]$Step, [string]$Message)
    Write-ColorOutput "[$Step] $Message" 'Cyan'
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "✅ $Message" 'Green'
}

function Write-Error {
    param([string]$Message)
    Write-ColorOutput "❌ $Message" 'Red'
}

function Write-Warning {
    param([string]$Message)
    Write-ColorOutput "⚠️  $Message" 'Yellow'
}

function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

function Test-Requirements {
    Write-Step 'REQUIREMENTS' 'Checking system requirements...'
    
    # Check Node.js
    if (Test-Command 'node') {
        $nodeVersion = node --version
        Write-ColorOutput "Node.js: $nodeVersion" 'Blue'
        Write-Success 'Node.js found'
    }
    else {
        Write-Error 'Node.js not found. Please install from https://nodejs.org/'
        exit 1
    }
    
    # Check npm
    if (Test-Command 'npm') {
        $npmVersion = npm --version
        Write-ColorOutput "npm: $npmVersion" 'Blue'
        Write-Success 'npm found'
    }
    else {
        Write-Error 'npm not found. Please ensure Node.js is properly installed'
        exit 1
    }
    
    # Check for Visual Studio Build Tools
    if (Test-Command 'msbuild') {
        Write-Success 'Visual Studio Build Tools found'
    }
    else {
        Write-Warning 'Visual Studio Build Tools not found - may cause issues with native modules'
        Write-ColorOutput 'Consider installing Visual Studio Build Tools or Visual Studio Community' 'Yellow'
    }
    
    # Check for Python
    if (Test-Command 'python') {
        $pythonVersion = python --version
        Write-ColorOutput "Python: $pythonVersion" 'Blue'
        Write-Success 'Python found'
    }
    elseif (Test-Command 'python3') {
        $pythonVersion = python3 --version
        Write-ColorOutput "Python3: $pythonVersion" 'Blue'
        Write-Success 'Python3 found'
    }
    else {
        Write-Warning 'Python not found - may cause issues with native modules'
        Write-ColorOutput 'Consider installing Python from python.org' 'Yellow'
    }
    
    # Check Windows version
    $windowsVersion = [System.Environment]::OSVersion.Version
    Write-ColorOutput "Windows Version: $windowsVersion" 'Blue'
    
    # Check PowerShell version
    $psVersion = $PSVersionTable.PSVersion
    Write-ColorOutput "PowerShell Version: $psVersion" 'Blue'
    
    Write-Success 'Requirements check completed'
}

function Invoke-CleanInstall {
    Write-Step 'CLEAN' 'Cleaning previous installation...'
    
    # Clean npm cache
    try {
        npm cache clean --force
        Write-Success 'npm cache cleaned'
    }
    catch {
        Write-Warning 'Could not clean npm cache'
    }
    
    # Remove lock files
    $lockFiles = @('package-lock.json', 'test-app/package-lock.json')
    foreach ($file in $lockFiles) {
        if (Test-Path $file) {
            Remove-Item $file -Force
            Write-ColorOutput "Removed $file" 'Blue'
        }
    }
    
    # Remove node_modules
    $nodeModulesDirs = @('node_modules', 'test-app/node_modules')
    foreach ($dir in $nodeModulesDirs) {
        if (Test-Path $dir) {
            Write-ColorOutput "Removing $dir..." 'Blue'
            try {
                Remove-Item $dir -Recurse -Force
                Write-Success "Removed $dir"
            }
            catch {
                Write-Warning "Could not remove $dir : $($_.Exception.Message)"
            }
        }
    }
    
    Write-Success 'Clean completed'
}

function Install-Dependencies {
    Write-Step 'DEPENDENCIES' 'Installing dependencies...'
    
    # Configure npm for Windows
    Write-ColorOutput 'Configuring npm for Windows...' 'Blue'
    npm config set audit false
    npm config set fund false
    npm config set prefer-offline false
    
    # Install main dependencies
    Write-ColorOutput 'Installing main project dependencies...' 'Blue'
    try {
        npm install --no-optional
        Write-Success 'Main dependencies installed'
    }
    catch {
        Write-Error 'Failed to install main dependencies'
        throw
    }
    
    # Install test-app dependencies
    if (Test-Path 'test-app') {
        Write-ColorOutput 'Installing test-app dependencies...' 'Blue'
        Push-Location 'test-app'
        try {
            npm install --no-optional
            Write-Success 'Test-app dependencies installed'
        }
        catch {
            Write-Error 'Failed to install test-app dependencies'
            throw
        }
        finally {
            Pop-Location
        }
    }
}

function Install-Playwright {
    Write-Step 'PLAYWRIGHT' 'Setting up Playwright...'
    
    try {
        # Install Playwright browsers
        Write-ColorOutput 'Installing Playwright browsers...' 'Blue'
        npx playwright install
        Write-Success 'Playwright browsers installed'
        
        # Install system dependencies
        Write-ColorOutput 'Installing system dependencies...' 'Blue'
        npx playwright install-deps
        Write-Success 'System dependencies installed'
    }
    catch {
        Write-Error "Playwright setup failed: $($_.Exception.Message)"
        throw
    }
}

function Test-Installation {
    Write-Step 'VERIFICATION' 'Verifying installation...'
    
    # Check main node_modules
    if (-not (Test-Path 'node_modules')) {
        Write-Error 'Main node_modules not found'
        return $false
    }
    
    # Check test-app node_modules
    if ((Test-Path 'test-app') -and (-not (Test-Path 'test-app/node_modules'))) {
        Write-Error 'Test-app node_modules not found'
        return $false
    }
    
    # Check Playwright
    try {
        npx playwright --version | Out-Null
        Write-Success 'Playwright is available'
    }
    catch {
        Write-Error 'Playwright not available'
        return $false
    }
    
    # Try build
    try {
        npm run build | Out-Null
        Write-Success 'Build successful'
    }
    catch {
        Write-Warning 'Build failed - may need manual fixing'
    }
    
    Write-Success 'Installation verification completed'
    return $true
}

# Main execution
try {
    $startTime = Get-Date
    
    Write-ColorOutput '🚀 Playwright POC Windows PowerShell Installer' 'Magenta'
    Write-ColorOutput ('=' * 50) 'Blue'
    
    Test-Requirements
    
    if ($Clean) {
        Invoke-CleanInstall
    }
    
    Install-Dependencies
    
    if (-not $SkipPlaywright) {
        Install-Playwright
    }
    
    $verifySuccess = Test-Installation
    if (-not $verifySuccess) {
        Write-Error 'Verification failed'
        exit 1
    }
    
    $duration = [math]::Round(((Get-Date) - $startTime).TotalSeconds)
    Write-ColorOutput ('=' * 50) 'Blue'
    Write-Success "Installation completed successfully in $duration seconds!"
    
    Write-ColorOutput "`n📝 Next steps:" 'Cyan'
    Write-ColorOutput '  • npm test                    - Run all tests' 'White'
    Write-ColorOutput '  • npm run test:dashboard      - Test new dashboard' 'White'
    Write-ColorOutput '  • npm run dev                 - Start development mode' 'White'
    Write-ColorOutput '  • cd test-app && npm run start:enhanced - Start enhanced test app' 'White'
}
catch {
    Write-Error "Installation failed: $($_.Exception.Message)"
    Write-ColorOutput "`nPossible solutions:" 'Yellow'
    Write-ColorOutput '1. Run PowerShell as Administrator' 'White'
    Write-ColorOutput '2. Install Visual Studio Build Tools' 'White'
    Write-ColorOutput '3. Install Python from python.org' 'White'
    Write-ColorOutput '4. Clear npm cache: npm cache clean --force' 'White'
    Write-ColorOutput '5. Try manual installation' 'White'
    exit 1
}