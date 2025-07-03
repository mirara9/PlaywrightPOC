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
