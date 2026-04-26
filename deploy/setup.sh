#!/bin/bash
set -e

echo "🐾 PetSpeak Deployment Script"
echo "=============================="

# 1. Update system
echo ""
echo "📦 Updating system packages..."
apt-get update && apt-get upgrade -y

# 2. Install Node.js 22 LTS
echo ""
echo "⬇️  Installing Node.js 22 LTS..."
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

echo "   Node.js version: $(node -v)"
echo "   npm version: $(npm -v)"

# 3. Install PM2 globally
echo ""
echo "⬇️  Installing PM2 process manager..."
npm install -g pm2

# 4. Clone the repository (user will replace URL)
echo ""
echo "📥 Cloning PetSpeak repository..."
cd /opt
git clone https://github.com/Ccccccvia/BearHacks-2026-XiaotingMA.git petspeak
cd petspeak

# 5. Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm ci --production=false

# 6. Create .env.local (user fills in keys)
cat > .env.local << 'EOF'
# Google Cloud Vision API Key (https://console.cloud.google.com/)
GOOGLE_VISION_API_KEY=your_key_here

# Google Gemini API Key (https://aistudio.google.com/)
GOOGLE_GEMINI_API_KEY=your_key_here

# ElevenLabs API Key (https://elevenlabs.io/)
ELEVENLABS_API_KEY=your_key_here
EOF

echo ""
echo "=============================="
echo "✅ Setup complete!"
echo ""
echo "⚠️  IMPORTANT: Edit .env.local with your actual API keys!"
echo "   nano /opt/petspeak/.env.local"
echo ""
echo "Then run: bash /opt/petspeak/deploy/start.sh"
