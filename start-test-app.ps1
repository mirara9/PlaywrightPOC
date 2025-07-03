# Test App PowerShell Launcher
# Quick launcher for the Playwright test application

param(
    [switch]$Enhanced = $false,
    [switch]$Basic = $false,
    [int]$Port = 3000,
    [switch]$Help = $false
)

# Colors for output
function Write-ColorOutput {
    param([string]$Message, [string]$Color = 'White')
    $Colors = @{
        Red = 'Red'; Green = 'Green'; Yellow = 'Yellow'
        Blue = 'Blue'; Magenta = 'Magenta'; Cyan = 'Cyan'; White = 'White'
    }
    Write-Host $Message -ForegroundColor $Colors[$Color]
}

function Show-Usage {
    Write-ColorOutput "`n📚 Test App PowerShell Launcher" 'Magenta'
    Write-ColorOutput ('=' * 50) 'Blue'
    Write-ColorOutput "Usage: .\start-test-app.ps1 [options]" 'Cyan'
    Write-ColorOutput "`nOptions:" 'Cyan'
    Write-ColorOutput "  -Enhanced          Start enhanced server (with dashboard)" 'White'
    Write-ColorOutput "  -Basic             Start basic server (original)" 'White'
    Write-ColorOutput "  -Port <number>     Specify port (default: 3000)" 'White'
    Write-ColorOutput "  -Help              Show this help message" 'White'
    Write-ColorOutput "`nExamples:" 'Cyan'
    Write-ColorOutput "  .\start-test-app.ps1                    # Start enhanced server" 'White'
    Write-ColorOutput "  .\start-test-app.ps1 -Enhanced          # Start enhanced server" 'White'
    Write-ColorOutput "  .\start-test-app.ps1 -Basic             # Start basic server" 'White'
    Write-ColorOutput "  .\start-test-app.ps1 -Port 4000         # Start on port 4000" 'White'
    Write-ColorOutput "`nURLs:" 'Cyan'
    Write-ColorOutput "  Login Page:  http://localhost:3000/" 'White'
    Write-ColorOutput "  Dashboard:   http://localhost:3000/dashboard" 'White'
    Write-ColorOutput "  Health:      http://localhost:3000/health" 'White'
    Write-ColorOutput "  API:         http://localhost:3000/api/" 'White'
}

function Test-NodeJs {
    try {
        $nodeVersion = node --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Node.js found: $nodeVersion" 'Green'
            return $true
        }
    }
    catch {
        # Node.js not found
    }
    
    Write-ColorOutput "❌ Node.js is not installed or not in PATH" 'Red'
    Write-ColorOutput "Please install Node.js from https://nodejs.org/" 'Yellow'
    return $false
}

function Start-TestApp {
    param([string]$Mode, [int]$Port)
    
    Write-ColorOutput "`n🎯 Test App Launcher" 'Magenta'
    Write-ColorOutput ('=' * 30) 'Blue'
    
    if (-not (Test-NodeJs)) {
        exit 1
    }
    
    Write-ColorOutput "`nStarting $Mode test-app server on port $Port..." 'Blue'
    
    $args = @()
    if ($Mode -eq 'enhanced') {
        $args += '--enhanced'
    } else {
        $args += '--basic'
    }
    $args += '--port', $Port
    
    try {
        & node start-test-app.js @args
    }
    catch {
        Write-ColorOutput "❌ Failed to start server: $($_.Exception.Message)" 'Red'
        exit 1
    }
}

# Main execution
try {
    if ($Help) {
        Show-Usage
        exit 0
    }
    
    # Determine mode
    $mode = 'enhanced'  # Default to enhanced
    if ($Basic) {
        $mode = 'basic'
    } elseif ($Enhanced) {
        $mode = 'enhanced'
    }
    
    # Validate port
    if ($Port -lt 1 -or $Port -gt 65535) {
        Write-ColorOutput "❌ Invalid port number: $Port" 'Red'
        Write-ColorOutput "Port must be between 1 and 65535" 'Yellow'
        exit 1
    }
    
    Start-TestApp -Mode $mode -Port $Port
}
catch {
    Write-ColorOutput "❌ Unexpected error: $($_.Exception.Message)" 'Red'
    exit 1
}