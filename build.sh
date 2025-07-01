#!/bin/bash

# Playwright Test Framework Build Script
# This script installs all dependencies and prepares the environment for testing

set -e  # Exit on any error

echo "🚀 Starting Playwright Test Framework Build Process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker to continue."
        exit 1
    fi
    print_success "Docker is installed"
}

# Check if Docker Compose is installed
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose to continue."
        exit 1
    fi
    print_success "Docker Compose is installed"
}

# Install Node.js dependencies locally (optional)
install_local_dependencies() {
    if [ "$1" = "--local" ]; then
        print_status "Installing local Node.js dependencies..."
        
        # Install root dependencies
        if [ -f "package.json" ]; then
            npm install
            print_success "Root dependencies installed"
        fi
        
        # Install test-app dependencies
        if [ -f "test-app/package.json" ]; then
            cd test-app
            npm install
            cd ..
            print_success "Test-app dependencies installed"
        fi
        
        # Install Playwright browsers
        print_status "Installing Playwright browsers..."
        npx playwright install
        
        # Install system dependencies for Playwright
        print_status "Installing Playwright system dependencies..."
        if command -v sudo &> /dev/null; then
            sudo npx playwright install-deps || print_warning "Could not install system dependencies. You may need to run 'sudo npx playwright install-deps' manually."
        else
            print_warning "sudo not available. You may need to install Playwright system dependencies manually."
        fi
        
        print_success "Local dependencies installed"
    fi
}

# Build Docker image
build_docker_image() {
    print_status "Building Docker image..."
    docker build -t playwright-test-framework .
    print_success "Docker image built successfully"
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    mkdir -p test-results playwright-report screenshots
    print_success "Directories created"
}

# Validate Docker setup
validate_docker_setup() {
    print_status "Validating Docker setup..."
    
    # Test if Docker daemon is running
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running. Please start Docker."
        exit 1
    fi
    
    print_success "Docker daemon is running"
}

# Main build process
main() {
    echo "======================================"
    echo "  Playwright Test Framework Builder"
    echo "======================================"
    echo ""
    
    # Parse command line arguments
    LOCAL_INSTALL=false
    SKIP_DOCKER=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --local)
                LOCAL_INSTALL=true
                shift
                ;;
            --skip-docker)
                SKIP_DOCKER=true
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --local       Install dependencies locally (in addition to Docker)"
                echo "  --skip-docker Skip Docker setup"
                echo "  --help        Show this help message"
                echo ""
                echo "Examples:"
                echo "  $0                    # Build Docker image only"
                echo "  $0 --local           # Install locally and build Docker image"
                echo "  $0 --skip-docker     # Install locally only"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
    
    # Install local dependencies if requested
    if [ "$LOCAL_INSTALL" = true ]; then
        install_local_dependencies --local
    fi
    
    # Docker setup
    if [ "$SKIP_DOCKER" = false ]; then
        check_docker
        check_docker_compose
        validate_docker_setup
        create_directories
        build_docker_image
        
        print_status "Docker setup complete. You can now run tests with:"
        echo ""
        echo "  🐳 Docker Commands:"
        echo "     docker-compose up                    # Run tests in headless mode"
        echo "     docker-compose --profile ui-tests up # Run tests with UI (if X11 forwarding is set up)"
        echo "     docker-compose --profile development up # Development mode"
        echo ""
        echo "  🧪 Direct Docker Commands:"
        echo "     docker run --rm playwright-test-framework                    # Run all tests"
        echo "     docker run --rm playwright-test-framework npm test src/tests/api/ # Run API tests only"
        echo ""
    fi
    
    if [ "$LOCAL_INSTALL" = true ]; then
        print_status "Local setup complete. You can now run tests with:"
        echo ""
        echo "  💻 Local Commands:"
        echo "     npm test                             # Run all tests"
        echo "     HEADLESS=false npm test              # Run tests with visible UI"
        echo "     npm test src/tests/api/              # Run API tests only"
        echo ""
    fi
    
    print_success "🎉 Build process completed successfully!"
    echo ""
    echo "📚 Additional Information:"
    echo "   - Test results will be saved in: ./test-results/"
    echo "   - HTML reports will be saved in: ./playwright-report/"
    echo "   - Screenshots will be saved in: ./screenshots/"
    echo "   - Use 'npm run show-report' to view the HTML report"
    echo ""
}

# Run main function
main "$@"