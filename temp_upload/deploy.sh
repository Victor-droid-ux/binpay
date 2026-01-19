#!/bin/bash

# BinPay Deployment Script
echo "🚀 Starting BinPay deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
    exit 1
}

# Check if we're in the right directory
if [ ! -f "ecosystem.config.js" ]; then
    print_error "Please run this script from the project root directory"
fi

# Create logs directory
mkdir -p logs

# Deploy Backend
echo ""
echo "📦 Building Backend..."
cd backend

if [ ! -f ".env" ]; then
    print_warning ".env file not found in backend. Please create it from .env.production.example"
    exit 1
fi

# Install dependencies
npm install --production=false
if [ $? -ne 0 ]; then
    print_error "Backend npm install failed"
fi

# Build TypeScript
npm run build
if [ $? -ne 0 ]; then
    print_error "Backend build failed"
fi

print_success "Backend built successfully"

# Deploy Frontend
echo ""
echo "🎨 Building Frontend..."
cd ../frontend

if [ ! -f ".env.production" ]; then
    print_warning ".env.production file not found in frontend. Please create it from .env.production.example"
    exit 1
fi

# Install dependencies
npm install --production=false
if [ $? -ne 0 ]; then
    print_error "Frontend npm install failed"
fi

# Build Next.js
npm run build
if [ $? -ne 0 ]; then
    print_error "Frontend build failed"
fi

print_success "Frontend built successfully"

# Return to root
cd ..

# Start/Restart with PM2
echo ""
echo "🔄 Restarting services with PM2..."

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_error "PM2 is not installed. Install it with: npm install -g pm2"
fi

# Start or reload the applications
pm2 delete all 2>/dev/null
pm2 start ecosystem.config.js
if [ $? -ne 0 ]; then
    print_error "PM2 start failed"
fi

# Save PM2 configuration
pm2 save

print_success "Services started successfully"

# Show status
echo ""
echo "📊 Service Status:"
pm2 status

echo ""
print_success "Deployment completed successfully! 🎉"
echo ""
echo "Useful commands:"
echo "  pm2 logs          - View all logs"
echo "  pm2 monit         - Monitor services"
echo "  pm2 restart all   - Restart all services"
echo "  pm2 stop all      - Stop all services"
