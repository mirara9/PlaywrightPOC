# Use the official Playwright image with Node.js
FROM mcr.microsoft.com/playwright:v1.48.2-focal

# Set working directory
WORKDIR /app

# Set environment variables
ENV NODE_ENV=test
ENV CI=true
ENV HEADLESS=true

# Copy package files first for better Docker layer caching
COPY package*.json ./
COPY test-app/package*.json ./test-app/

# Install root dependencies
RUN npm ci --only=production --silent

# Install test-app dependencies
WORKDIR /app/test-app
RUN npm ci --only=production --silent

# Go back to root directory
WORKDIR /app

# Copy the rest of the application
COPY . .

# Install Playwright browsers and dependencies
RUN npx playwright install --with-deps

# Create directories for test results
RUN mkdir -p /app/test-results /app/playwright-report

# Set proper permissions
RUN chmod -R 755 /app

# Expose port for the test application
EXPOSE 3000

# Health check to ensure the container is ready
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Default command to run tests
CMD ["npm", "test"]