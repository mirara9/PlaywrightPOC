#!/bin/bash

# Automatic Playwright Setup Script
# Handles all Playwright dependencies automatically based on the environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Detect OS and environment
detect_environment() {
    print_status "Detecting environment..."
    
    if [ -f /.dockerenv ]; then
        ENVIRONMENT="docker"
        print_status "Running in Docker container"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        ENVIRONMENT="linux"
        if grep -q Microsoft /proc/version 2>/dev/null; then
            ENVIRONMENT="wsl"
            print_status "Running in WSL (Windows Subsystem for Linux)"
        else
            print_status "Running on Linux"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        ENVIRONMENT="macos"
        print_status "Running on macOS"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        ENVIRONMENT="windows"
        print_status "Running on Windows"
    else
        ENVIRONMENT="unknown"
        print_warning "Unknown environment: $OSTYPE"
    fi
}

# Check if running as root or with sudo access
check_permissions() {
    if [ "$EUID" -eq 0 ]; then
        HAS_SUDO=true
        print_status "Running as root"
    elif command -v sudo &> /dev/null && sudo -n true 2>/dev/null; then
        HAS_SUDO=true
        print_status "Sudo access available"
    else
        HAS_SUDO=false
        print_warning "No sudo access available"
    fi
}

# Install system dependencies based on environment
install_system_dependencies() {
    print_status "Installing system dependencies..."
    
    case $ENVIRONMENT in
        "docker")
            # In Docker, dependencies should be in the Dockerfile
            print_status "In Docker container - dependencies should be pre-installed"
            ;;
        "linux"|"wsl")
            install_linux_dependencies
            ;;
        "macos")
            install_macos_dependencies
            ;;
        "windows")
            install_windows_dependencies
            ;;
        *)
            print_warning "Unknown environment - attempting generic installation"
            install_generic_dependencies
            ;;
    esac
}

# Linux-specific installation
install_linux_dependencies() {
    print_status "Installing Linux dependencies..."
    
    # Try to detect package manager
    if command -v apt-get &> /dev/null; then
        install_apt_dependencies
    elif command -v yum &> /dev/null; then
        install_yum_dependencies
    elif command -v dnf &> /dev/null; then
        install_dnf_dependencies
    elif command -v pacman &> /dev/null; then
        install_pacman_dependencies
    else
        print_error "No supported package manager found"
        print_error "Please install these packages manually:"
        echo "  - libnspr4 libnss3 libasound2 libgconf-2-4 libxrandr2 libxcomposite1"
        echo "  - libxdamage1 libxi6 libxtst6 libasound2 libatk1.0-0 libdrm2"
        echo "  - libxss1 libgtk-3-0 libgbm1"
        return 1
    fi
}

# APT-based systems (Ubuntu, Debian)
install_apt_dependencies() {
    print_status "Installing dependencies via APT..."
    
    if [ "$HAS_SUDO" = true ]; then
        # Update package list
        sudo apt-get update
        
        # Install basic dependencies
        sudo apt-get install -y \
            libnspr4 \
            libnss3 \
            libasound2t64 \
            libgconf-2-4 \
            libxrandr2 \
            libxcomposite1 \
            libxdamage1 \
            libxi6 \
            libxtst6 \
            libatk1.0-0 \
            libdrm2 \
            libxss1 \
            libgtk-3-0 \
            libgbm1 \
            xvfb
            
        print_success "APT dependencies installed"
    else
        print_error "Cannot install system dependencies without sudo access"
        print_error "Please run: sudo apt-get install libnspr4 libnss3 libasound2t64 libgconf-2-4 libxrandr2 libxcomposite1 libxdamage1 libxi6 libxtst6 libatk1.0-0 libdrm2 libxss1 libgtk-3-0 libgbm1 xvfb"
        return 1
    fi
}

# YUM-based systems (CentOS, RHEL)
install_yum_dependencies() {
    print_status "Installing dependencies via YUM..."
    
    if [ "$HAS_SUDO" = true ]; then
        sudo yum install -y \
            nspr \
            nss \
            alsa-lib \
            GConf2 \
            libXrandr \
            libXcomposite \
            libXdamage \
            libXi \
            libXtst \
            atk \
            libdrm \
            libXScrnSaver \
            gtk3 \
            mesa-libgbm \
            xorg-x11-server-Xvfb
            
        print_success "YUM dependencies installed"
    else
        print_error "Cannot install system dependencies without sudo access"
        return 1
    fi
}

# DNF-based systems (Fedora)
install_dnf_dependencies() {
    print_status "Installing dependencies via DNF..."
    
    if [ "$HAS_SUDO" = true ]; then
        sudo dnf install -y \
            nspr \
            nss \
            alsa-lib \
            GConf2 \
            libXrandr \
            libXcomposite \
            libXdamage \
            libXi \
            libXtst \
            atk \
            libdrm \
            libXScrnSaver \
            gtk3 \
            mesa-libgbm \
            xorg-x11-server-Xvfb
            
        print_success "DNF dependencies installed"
    else
        print_error "Cannot install system dependencies without sudo access"
        return 1
    fi
}

# Pacman-based systems (Arch)
install_pacman_dependencies() {
    print_status "Installing dependencies via Pacman..."
    
    if [ "$HAS_SUDO" = true ]; then
        sudo pacman -S --noconfirm \
            nspr \
            nss \
            alsa-lib \
            libxrandr \
            libxcomposite \
            libxdamage \
            libxi \
            libxtst \
            atk \
            libdrm \
            libxss \
            gtk3 \
            mesa \
            xorg-server-xvfb
            
        print_success "Pacman dependencies installed"
    else
        print_error "Cannot install system dependencies without sudo access"
        return 1
    fi
}

# macOS installation
install_macos_dependencies() {
    print_status "Installing macOS dependencies..."
    # macOS usually doesn't need additional system dependencies for Playwright
    print_success "macOS dependencies handled by Playwright automatically"
}

# Windows installation
install_windows_dependencies() {
    print_status "Installing Windows dependencies..."
    # Windows dependencies are handled by Playwright automatically
    print_success "Windows dependencies handled by Playwright automatically"
}

# Generic installation fallback
install_generic_dependencies() {
    print_status "Attempting generic dependency installation..."
    
    # Try Playwright's built-in installer
    if command -v npx &> /dev/null; then
        if [ "$HAS_SUDO" = true ]; then
            sudo npx playwright install-deps || print_warning "playwright install-deps failed"
        else
            npx playwright install-deps || print_warning "playwright install-deps failed (may need sudo)"
        fi
    fi
}

# Install Node.js dependencies
install_node_dependencies() {
    print_status "Installing Node.js dependencies..."
    
    # Check if npm is available
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install Node.js first."
        return 1
    fi
    
    # Install project dependencies
    npm install
    
    # Install test-app dependencies
    if [ -d "test-app" ] && [ -f "test-app/package.json" ]; then
        cd test-app
        npm install
        cd ..
    fi
    
    print_success "Node.js dependencies installed"
}

# Install Playwright browsers
install_playwright_browsers() {
    print_status "Installing Playwright browsers..."
    
    # Install browsers
    npx playwright install
    
    # Try to install system dependencies via Playwright
    if [ "$HAS_SUDO" = true ]; then
        sudo npx playwright install-deps || print_warning "Playwright system dependencies installation failed"
    else
        npx playwright install-deps || print_warning "Playwright system dependencies installation failed (may need sudo)"
    fi
    
    print_success "Playwright browsers installed"
}

# Verify installation
verify_installation() {
    print_status "Verifying installation..."
    
    # Check if browsers were installed correctly
    if npx playwright --version &> /dev/null; then
        print_success "Playwright is working correctly"
        
        # Try to get browser info
        npx playwright --version
        
        return 0
    else
        print_error "Playwright verification failed"
        return 1
    fi
}

# Create setup verification script
create_verification_script() {
    print_status "Creating verification script..."
    
    cat > verify-setup.sh << 'EOF'
#!/bin/bash

# Quick verification script for Playwright setup

echo "🔍 Verifying Playwright setup..."

# Check Node.js
if command -v node &> /dev/null; then
    echo "✅ Node.js: $(node --version)"
else
    echo "❌ Node.js not found"
fi

# Check npm
if command -v npm &> /dev/null; then
    echo "✅ npm: $(npm --version)"
else
    echo "❌ npm not found"
fi

# Check Playwright
if command -v npx &> /dev/null && npx playwright --version &> /dev/null; then
    echo "✅ Playwright: $(npx playwright --version)"
else
    echo "❌ Playwright not working properly"
fi

# Try a simple browser launch test
echo "🧪 Testing browser launch..."
node -e "
const { chromium } = require('playwright');
(async () => {
  try {
    const browser = await chromium.launch();
    await browser.close();
    console.log('✅ Browser launch test passed');
  } catch (error) {
    console.log('❌ Browser launch test failed:', error.message);
  }
})();
" 2>/dev/null || echo "❌ Browser test failed - run the setup script again"

echo "🏁 Verification complete"
EOF

    chmod +x verify-setup.sh
    print_success "Created verify-setup.sh script"
}

# Main setup function
main() {
    echo "======================================"
    echo "   Automatic Playwright Setup"
    echo "======================================"
    echo ""
    
    detect_environment
    check_permissions
    
    # Install dependencies in order
    install_node_dependencies || {
        print_error "Failed to install Node.js dependencies"
        exit 1
    }
    
    install_system_dependencies || {
        print_warning "System dependencies installation had issues"
        print_warning "You may need to install them manually"
    }
    
    install_playwright_browsers || {
        print_error "Failed to install Playwright browsers"
        exit 1
    }
    
    verify_installation || {
        print_error "Installation verification failed"
        exit 1
    }
    
    create_verification_script
    
    print_success "🎉 Playwright setup completed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Run './verify-setup.sh' to verify everything is working"
    echo "   2. Run 'npm test' to run your tests"
    echo "   3. Run 'npm run test:retry' to test the retry functionality"
    echo ""
    echo "🆘 If you encounter issues:"
    echo "   - Check './verify-setup.sh' output"
    echo "   - Try running 'sudo npx playwright install-deps' manually"
    echo "   - Use Docker setup with './build.sh' for a contained environment"
    echo ""
}

# Run main function
main "$@"