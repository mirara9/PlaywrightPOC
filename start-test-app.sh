#!/bin/bash

# Test App Shell Launcher
# Quick launcher for the Playwright test application

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Default values
MODE="enhanced"
PORT=3000
SHOW_HELP=false

# Functions
log() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

show_usage() {
    log $MAGENTA "\n📚 Test App Shell Launcher"
    log $BLUE "=================================================="
    log $CYAN "Usage: ./start-test-app.sh [options]"
    log $CYAN "\nOptions:"
    log $WHITE "  --enhanced, -e     Start enhanced server (with dashboard) [default]"
    log $WHITE "  --basic, -b        Start basic server (original)"
    log $WHITE "  --port, -p PORT    Specify port (default: 3000)"
    log $WHITE "  --help, -h         Show this help message"
    log $CYAN "\nExamples:"
    log $WHITE "  ./start-test-app.sh                 # Start enhanced server"
    log $WHITE "  ./start-test-app.sh --enhanced      # Start enhanced server"
    log $WHITE "  ./start-test-app.sh --basic         # Start basic server"
    log $WHITE "  ./start-test-app.sh --port 4000     # Start on port 4000"
    log $CYAN "\nURLs:"
    log $WHITE "  Login Page:  http://localhost:3000/"
    log $WHITE "  Dashboard:   http://localhost:3000/dashboard"
    log $WHITE "  Health:      http://localhost:3000/health"
    log $WHITE "  API:         http://localhost:3000/api/"
    echo
}

check_nodejs() {
    if ! command -v node &> /dev/null; then
        log $RED "❌ Node.js is not installed or not in PATH"
        log $YELLOW "Please install Node.js from https://nodejs.org/"
        exit 1
    fi
    
    local node_version=$(node --version)
    log $GREEN "✅ Node.js found: $node_version"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --enhanced|-e)
            MODE="enhanced"
            shift
            ;;
        --basic|-b)
            MODE="basic"
            shift
            ;;
        --port|-p)
            PORT="$2"
            shift 2
            ;;
        --help|-h)
            SHOW_HELP=true
            shift
            ;;
        *)
            log $RED "❌ Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Show help if requested
if [ "$SHOW_HELP" = true ]; then
    show_usage
    exit 0
fi

# Validate port
if ! [[ "$PORT" =~ ^[0-9]+$ ]] || [ "$PORT" -lt 1 ] || [ "$PORT" -gt 65535 ]; then
    log $RED "❌ Invalid port number: $PORT"
    log $YELLOW "Port must be between 1 and 65535"
    exit 1
fi

# Main execution
log $MAGENTA "🎯 Test App Launcher"
log $BLUE "=============================="

check_nodejs

log $BLUE "\nStarting $MODE test-app server on port $PORT..."

# Build arguments
ARGS="--$MODE --port $PORT"

# Start the server
exec node start-test-app.js $ARGS