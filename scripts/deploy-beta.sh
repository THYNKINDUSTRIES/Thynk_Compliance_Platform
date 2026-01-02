#!/bin/bash

# =============================================================================
# Thynk Compliance Platform - Private Beta Deployment Script
# =============================================================================
# This script deploys the application to Vercel with beta security settings
# =============================================================================

set -e

echo "🚀 Starting Private Beta Deployment..."
echo "============================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}Error: Vercel CLI is not installed${NC}"
    echo "Install with: npm i -g vercel"
    exit 1
fi

# Check if logged in to Vercel
echo "📋 Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}Not logged in to Vercel. Please authenticate:${NC}"
    vercel login
fi

# Environment check
echo ""
echo "🔒 Beta Security Configuration:"
echo "  - VITE_BETA_MODE=true"
echo "  - VITE_ALLOWED_EMAIL_DOMAIN=@thynk.guru"
echo "  - noindex meta tags: ENABLED"
echo "  - robots.txt: BLOCKING ALL"
echo ""

# Confirm deployment
read -p "Deploy to production? (y/N): " confirm
if [[ $confirm != [yY] ]]; then
    echo "Deployment cancelled."
    exit 0
fi

# Build the application
echo ""
echo "📦 Building application..."
npm run build

# Check build success
if [ ! -d "dist" ]; then
    echo -e "${RED}Build failed - dist directory not found${NC}"
    exit 1
fi

# Verify security files
echo ""
echo "🔍 Verifying security configuration..."

# Check index.html for noindex
if grep -q "noindex" dist/index.html; then
    echo -e "  ${GREEN}✓${NC} noindex meta tag present"
else
    echo -e "  ${RED}✗${NC} noindex meta tag MISSING"
    exit 1
fi

# Check robots.txt
if grep -q "Disallow: /" public/robots.txt; then
    echo -e "  ${GREEN}✓${NC} robots.txt blocking crawlers"
else
    echo -e "  ${RED}✗${NC} robots.txt not configured"
    exit 1
fi

# Check vercel.json
if [ -f "vercel.json" ]; then
    echo -e "  ${GREEN}✓${NC} vercel.json present"
else
    echo -e "  ${RED}✗${NC} vercel.json MISSING"
    exit 1
fi

# Deploy to Vercel
echo ""
echo "🚀 Deploying to Vercel..."
vercel --prod \
    --env VITE_BETA_MODE=true \
    --env VITE_ALLOWED_EMAIL_DOMAIN=@thynk.guru

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "============================================"
echo "📋 Post-Deployment Checklist:"
echo "============================================"
echo ""
echo "1. Cloudflare Zero Trust:"
echo "   - Verify Access Application is active"
echo "   - Check @thynk.guru email policy"
echo "   - Verify IP whitelist (192.168.1.0/24)"
echo ""
echo "2. SSL/TLS:"
echo "   - Confirm Full (strict) mode in Cloudflare"
echo "   - Test HTTPS redirect"
echo ""
echo "3. Test Access:"
echo "   - Try login with @thynk.guru email"
echo "   - Verify unauthorized access is blocked"
echo ""
echo "4. Verify Headers:"
echo "   curl -I https://thynkflow.io"
echo ""
echo "============================================"
