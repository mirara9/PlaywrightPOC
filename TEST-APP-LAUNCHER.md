# Test App Launcher

Quick and easy ways to start the Playwright test application for development and testing.

## 🚀 Quick Start

### Option 1: Node.js Script (Recommended)
```bash
# Start enhanced server (with dashboard)
node start-test-app.js

# Start basic server
node start-test-app.js --basic

# Start on custom port
node start-test-app.js --port 4000
```

### Option 2: NPM Scripts
```bash
# Start enhanced server
npm run start:test-app

# Start basic server
npm run start:test-app:basic

# Start enhanced server (explicit)
npm run start:test-app:enhanced
```

### Option 3: Platform-Specific Scripts

#### Windows (Batch File)
```cmd
# Double-click or run from Command Prompt
start-test-app.bat

# With options
start-test-app.bat --enhanced
start-test-app.bat --basic
start-test-app.bat --port 4000
```

#### Windows (PowerShell)
```powershell
# Enhanced server
.\start-test-app.ps1

# Basic server
.\start-test-app.ps1 -Basic

# Custom port
.\start-test-app.ps1 -Port 4000
```

#### Linux/macOS (Shell Script)
```bash
# Make executable (first time only)
chmod +x start-test-app.sh

# Enhanced server
./start-test-app.sh

# Basic server
./start-test-app.sh --basic

# Custom port
./start-test-app.sh --port 4000
```

## 📱 Server Types

### Enhanced Server (Default)
- **Full Dashboard Interface**: Modern responsive dashboard
- **Complete API**: All CRUD operations for projects, tasks, users
- **Authentication**: Token-based authentication system
- **Real-time Features**: Notifications, analytics, search
- **Perfect for**: UI testing, dashboard development, full feature testing

### Basic Server
- **Simple Login Interface**: Basic login functionality
- **Limited API**: User management and authentication only
- **Lightweight**: Minimal features for basic testing
- **Perfect for**: API testing, simple integration tests

## 🌐 Available URLs

When the server is running (default port 3000):

| URL | Description | Enhanced | Basic |
|-----|-------------|----------|-------|
| `http://localhost:3000/` | Login Page | ✅ | ✅ |
| `http://localhost:3000/dashboard` | Dashboard Interface | ✅ | ❌ |
| `http://localhost:3000/health` | Health Check | ✅ | ✅ |
| `http://localhost:3000/api/` | API Endpoints | ✅ | Limited |

## 👤 Test Credentials

Use these credentials to log in:

| Email | Password | Role | Description |
|-------|----------|------|-------------|
| `test@example.com` | `password123` | User | Basic test user |
| `admin@example.com` | `AdminPass789!` | Admin | Administrator user |
| `john.doe@example.com` | `SecurePass123!` | User | Full profile user |
| `jane.smith@example.com` | `SecurePass456!` | Admin | Admin with preferences |

## 🔧 Command Line Options

### Node.js Script Options
```bash
node start-test-app.js [options]

Options:
  --enhanced, -e     Start enhanced server (with dashboard) [default]
  --basic, -b        Start basic server (original)
  --port, -p <port>  Specify port (default: 3000)
  --help, -h         Show help message
```

### Environment Variables
```bash
# Set custom port
export PORT=4000
node start-test-app.js

# Windows
set PORT=4000
node start-test-app.js
```

## 🔍 Features by Server Type

### Enhanced Server Features
- **Dashboard Sections**:
  - Overview with analytics
  - Projects management (CRUD)
  - Tasks management (CRUD)
  - Users management
  - Reports and analytics
  - Settings and preferences
  - Profile management

- **API Endpoints**:
  - Authentication (`/api/login`)
  - Users (`/api/users`)
  - Projects (`/api/projects`)
  - Tasks (`/api/tasks`)
  - Notifications (`/api/notifications`)
  - Reports (`/api/reports`)
  - Analytics (`/api/analytics`)
  - Search (`/api/search`)
  - Settings (`/api/settings`)

### Basic Server Features
- **Simple Interface**:
  - Login form
  - Basic user profile

- **API Endpoints**:
  - Authentication (`/api/login`)
  - Users (`/api/users`)
  - Health check (`/health`)

## 🛠️ Development Usage

### For Dashboard Testing
```bash
# Start enhanced server
node start-test-app.js --enhanced

# Run dashboard tests
npm run test:dashboard
```

### For API Testing
```bash
# Start basic server (lightweight)
node start-test-app.js --basic

# Run API tests
npm run test:api
```

### For Integration Testing
```bash
# Start enhanced server
node start-test-app.js --enhanced

# Run integration tests
npm run test:integration
```

## 🚨 Troubleshooting

### Port Already in Use
```bash
# Check what's using the port
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # Linux/macOS

# Use different port
node start-test-app.js --port 4000
```

### Dependencies Missing
```bash
# Install test-app dependencies
cd test-app
npm install

# Or use the launcher (auto-installs)
node start-test-app.js
```

### Node.js Not Found
- Install Node.js from [nodejs.org](https://nodejs.org/)
- Ensure Node.js is in your PATH
- Restart your terminal/command prompt

## 📊 Server Performance

### Resource Usage
- **Enhanced Server**: ~50-100MB RAM, moderate CPU
- **Basic Server**: ~20-30MB RAM, low CPU

### Startup Time
- **Enhanced Server**: ~2-3 seconds
- **Basic Server**: ~1-2 seconds

### Concurrent Connections
- **Both servers**: Support 100+ concurrent connections
- **Perfect for**: Load testing and parallel test execution

## 🎯 Use Cases

### Development
```bash
# Frontend development with hot reload
node start-test-app.js --enhanced
# Visit http://localhost:3000/dashboard
```

### Testing
```bash
# UI testing
node start-test-app.js --enhanced
npm run test:dashboard

# API testing  
node start-test-app.js --basic
npm run test:api
```

### Demos
```bash
# Full feature demo
node start-test-app.js --enhanced --port 3000
# Share: http://localhost:3000/dashboard
```

---

**Need help?** Run any launcher script with `--help` or `-h` for more information.