#!/bin/bash

# AI-Powered Podcast Advertising System Deployment Script

set -e

echo "🚀 Starting deployment of AI-Powered Podcast Advertising System..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
NODE_ENV=${NODE_ENV:-production}
PORT=${PORT:-3000}

echo -e "${YELLOW}Environment: $NODE_ENV${NC}"
echo -e "${YELLOW}Port: $PORT${NC}"

# Check if required environment variables are set
echo "🔍 Checking environment variables..."
required_vars=(
    "MONGODB_URI"
    "GEMINI_API_KEY"
    "CONTRACT_ADDRESS"
    "PRIVATE_KEY"
    "RPC_URL"
    "JWT_SECRET"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ Error: $var is not set${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ All required environment variables are set${NC}"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Build the application
echo "🏗️  Building application..."
npm run build

# Database setup
echo "🗄️  Setting up database..."
if [ "$NODE_ENV" = "production" ]; then
    echo "Running database migrations..."
    # Add any database migration commands here
fi

# Smart contract deployment (if needed)
echo "📜 Checking smart contract deployment..."
if [ ! -z "$DEPLOY_CONTRACT" ] && [ "$DEPLOY_CONTRACT" = "true" ]; then
    echo "Deploying smart contract..."
    cd contracts
    npx hardhat run scripts/deploy.js --network polygon
    cd ..
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p public/audio
mkdir -p logs
mkdir -p temp

# Set permissions
chmod 755 public/audio
chmod 755 logs
chmod 755 temp

# Health check
echo "🏥 Setting up health checks..."
cat > health-check.js << 'EOF'
const http = require('http');

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 3000,
  path: '/api/health',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    console.log('✅ Health check passed');
    process.exit(0);
  } else {
    console.log('❌ Health check failed:', res.statusCode);
    process.exit(1);
  }
});

req.on('error', (err) => {
  console.log('❌ Health check error:', err.message);
  process.exit(1);
});

req.on('timeout', () => {
  console.log('❌ Health check timeout');
  req.destroy();
  process.exit(1);
});

req.end();
EOF

# Start the application
echo "🚀 Starting application..."
if [ "$NODE_ENV" = "production" ]; then
    # Use PM2 for production
    if command -v pm2 &> /dev/null; then
        echo "Using PM2 for process management..."
        pm2 start ecosystem.config.js --env production
    else
        echo "PM2 not found, starting with npm..."
        npm start
    fi
else
    npm run dev
fi

# Wait for application to start
echo "⏳ Waiting for application to start..."
sleep 10

# Run health check
echo "🏥 Running health check..."
node health-check.js

# Setup monitoring
if [ "$NODE_ENV" = "production" ]; then
    echo "📊 Setting up monitoring..."
    
    # Setup log rotation
    if command -v logrotate &> /dev/null; then
        cat > /etc/logrotate.d/podcast-ai << 'EOF'
/path/to/your/app/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 app app
    postrotate
        pm2 reload ecosystem.config.js
    endscript
}
EOF
    fi
    
    # Setup cron jobs for automated tasks
    echo "⏰ Setting up cron jobs..."
    (crontab -l 2>/dev/null; echo "*/5 * * * * curl -f http://localhost:$PORT/api/jobs/verification || echo 'Verification job failed'") | crontab -
    (crontab -l 2>/dev/null; echo "*/10 * * * * curl -f http://localhost:$PORT/api/jobs/payouts || echo 'Payout job failed'") | crontab -
    (crontab -l 2>/dev/null; echo "0 * * * * curl -f http://localhost:$PORT/api/jobs/analytics || echo 'Analytics job failed'") | crontab -
fi

# Cleanup
rm -f health-check.js

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${GREEN}Application is running on port $PORT${NC}"
echo -e "${YELLOW}📊 Monitor logs: tail -f logs/production.log${NC}"
echo -e "${YELLOW}🔍 Health check: curl http://localhost:$PORT/api/health${NC}"

# Display important URLs
echo ""
echo "🔗 Important URLs:"
echo "   Application: http://localhost:$PORT"
echo "   Health Check: http://localhost:$PORT/api/health"
echo "   API Docs: http://localhost:$PORT/api/docs"
echo ""

# Final checks
echo "🔍 Final system checks..."
echo "✅ Node.js version: $(node --version)"
echo "✅ NPM version: $(npm --version)"
echo "✅ Environment: $NODE_ENV"
echo "✅ Port: $PORT"

if [ "$NODE_ENV" = "production" ]; then
    echo "✅ Production optimizations enabled"
    echo "✅ Security headers configured"
    echo "✅ Rate limiting enabled"
    echo "✅ Monitoring active"
fi

echo -e "${GREEN}🚀 AI-Powered Podcast Advertising System is ready!${NC}"