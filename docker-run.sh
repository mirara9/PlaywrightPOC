#!/bin/bash

# Docker Run Script for Playwright Test Framework
# Provides easy commands to run tests in different modes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show help
show_help() {
    echo "Playwright Test Framework - Docker Runner"
    echo "==========================================="
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  test          Run all tests (default)"
    echo "  test-api      Run API tests only"
    echo "  test-ui       Run UI tests only"
    echo "  test-integration Run integration tests only"
    echo "  build         Build the Docker image"
    echo "  shell         Open bash shell in container"
    echo "  clean         Clean up containers and volumes"
    echo "  logs          Show container logs"
    echo "  report        Show test report"
    echo ""
    echo "Options:"
    echo "  --headless    Run in headless mode (default)"
    echo "  --ui          Run with visible browser UI"
    echo "  --dev         Run in development mode"
    echo "  --grep PATTERN Run tests matching pattern"
    echo ""
    echo "Examples:"
    echo "  $0                           # Run all tests in headless mode"
    echo "  $0 test --ui                 # Run all tests with visible UI"
    echo "  $0 test-api                  # Run API tests only"
    echo "  $0 test --grep \"login\"       # Run tests matching 'login'"
    echo "  $0 shell                     # Open bash shell in container"
    echo ""
}

# Function to build Docker image
build_image() {
    print_info "Building Docker image..."
    docker build -t playwright-test-framework .
    print_success "Docker image built successfully"
}

# Function to run tests
run_tests() {
    local test_type="$1"
    local headless="${2:-true}"
    local grep_pattern="$3"
    
    # Prepare environment variables
    local env_vars="-e HEADLESS=${headless} -e CI=true"
    
    # Prepare test command
    local test_cmd="npm test"
    case "$test_type" in
        "api")
            test_cmd="npm test src/tests/api/"
            ;;
        "ui")
            test_cmd="npm test src/tests/ui/"
            ;;
        "integration")
            test_cmd="npm test src/tests/integration/"
            ;;
        "all"|"")
            test_cmd="npm test"
            ;;
    esac
    
    # Add grep pattern if provided
    if [ -n "$grep_pattern" ]; then
        test_cmd="$test_cmd -- --grep \"$grep_pattern\""
    fi
    
    # Prepare volume mounts
    local volumes="-v $(pwd)/test-results:/app/test-results -v $(pwd)/playwright-report:/app/playwright-report -v $(pwd)/screenshots:/app/screenshots"
    
    # Add X11 forwarding for UI mode
    if [ "$headless" = "false" ]; then
        volumes="$volumes -v /tmp/.X11-unix:/tmp/.X11-unix:rw"
        env_vars="$env_vars -e DISPLAY=${DISPLAY}"
    fi
    
    print_info "Running tests: $test_cmd"
    print_info "Headless mode: $headless"
    
    # Create directories if they don't exist
    mkdir -p test-results playwright-report screenshots
    
    # Run the container
    docker run --rm \
        $env_vars \
        $volumes \
        -p 3000:3000 \
        -p 9323:9323 \
        playwright-test-framework \
        bash -c "$test_cmd"
}

# Function to open shell
open_shell() {
    print_info "Opening bash shell in container..."
    
    mkdir -p test-results playwright-report screenshots
    
    docker run -it --rm \
        -e HEADLESS=false \
        -e CI=false \
        -v $(pwd):/app \
        -v /app/node_modules \
        -v /app/test-app/node_modules \
        -v $(pwd)/test-results:/app/test-results \
        -v $(pwd)/playwright-report:/app/playwright-report \
        -v $(pwd)/screenshots:/app/screenshots \
        -p 3000:3000 \
        -p 9323:9323 \
        playwright-test-framework \
        /bin/bash
}

# Function to show logs
show_logs() {
    print_info "Showing container logs..."
    docker-compose logs -f playwright-tests
}

# Function to clean up
cleanup() {
    print_info "Cleaning up containers and volumes..."
    docker-compose down -v --remove-orphans
    docker system prune -f
    print_success "Cleanup completed"
}

# Function to show report
show_report() {
    print_info "Starting report server..."
    if [ -d "playwright-report" ]; then
        docker run --rm \
            -v $(pwd)/playwright-report:/app/playwright-report \
            -p 9323:9323 \
            playwright-test-framework \
            npx playwright show-report --host=0.0.0.0
    else
        print_error "No test reports found. Run tests first."
    fi
}

# Main function
main() {
    local command="${1:-test}"
    shift || true
    
    # Parse options
    local headless="true"
    local grep_pattern=""
    local dev_mode="false"
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --headless)
                headless="true"
                shift
                ;;
            --ui)
                headless="false"
                shift
                ;;
            --dev)
                dev_mode="true"
                shift
                ;;
            --grep)
                grep_pattern="$2"
                shift 2
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Check if Docker is available
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Execute command
    case "$command" in
        "test")
            run_tests "all" "$headless" "$grep_pattern"
            ;;
        "test-api")
            run_tests "api" "$headless" "$grep_pattern"
            ;;
        "test-ui")
            run_tests "ui" "$headless" "$grep_pattern"
            ;;
        "test-integration")
            run_tests "integration" "$headless" "$grep_pattern"
            ;;
        "build")
            build_image
            ;;
        "shell")
            open_shell
            ;;
        "logs")
            show_logs
            ;;
        "clean")
            cleanup
            ;;
        "report")
            show_report
            ;;
        "help"|"--help")
            show_help
            ;;
        *)
            print_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"