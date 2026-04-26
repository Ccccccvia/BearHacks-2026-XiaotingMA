#!/bin/bash
set -e

cd /opt/petspeak

echo "🔨 Building PetSpeak..."
npm run build

echo ""
echo "🚀 Starting PetSpeak with PM2..."
pm2 delete petspeak 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root

echo ""
echo "=============================="
echo "✅ PetSpeak is running!"
echo "   Visit: http://$(curl -s ifconfig.me)"
echo ""
