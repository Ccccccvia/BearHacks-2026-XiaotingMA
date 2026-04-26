#!/bin/bash
set -e

cd /opt/petspeak

echo "📥 Pulling latest changes..."
git pull origin main

echo ""
echo "📦 Installing dependencies..."
npm ci --production=false

echo ""
echo "🔨 Rebuilding..."
npm run build

echo ""
echo "🔄 Restarting..."
pm2 restart petspeak

echo ""
echo "=============================="
echo "✅ Update complete!"
echo "   Visit: http://$(curl -s ifconfig.me)"
echo ""
