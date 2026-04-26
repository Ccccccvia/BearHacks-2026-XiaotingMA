# 🐾 PetSpeak — Give Your Pet a Voice

> What if your pet could talk? Snap a photo, hear their voice, and learn how to care for them.

**PetSpeak** is an AI-powered pet translator that identifies your pet's breed, generates a unique personality, and gives them a voice — all powered by cutting-edge AI. Built for **BearHacks 2026**.

## ✨ Features

- **📸 Breed Detection** — Upload or capture a photo of your pet; AI identifies the breed instantly
- **🎭 Personality Generation** — Each pet gets a unique, breed-accurate personality with traits and charm
- **🗣️ Voice Introduction** — Your pet introduces itself with a realistic AI-generated voice
- **💬 Chat** — Have an interactive, voiced conversation with your pet
- **❤️ Care Dashboard** — Breed-specific care tips with a gamified daily checklist and happiness meter

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **Next.js 16** | Full-stack React framework (App Router) |
| **TypeScript** | Type-safe development |
| **Tailwind CSS v4** | Utility-first styling |
| **shadcn/ui** | Modern UI component library |
| **Zustand** | Client-side state management |

## 🤖 API Integrations

| API | Usage |
|---|---|
| **Google Cloud Vision API** | Pet breed identification from photos |
| **Google Gemini (Gemma 4)** | Personality generation & chat intelligence |
| **ElevenLabs** | Text-to-speech voice synthesis |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Ccccccvia/BearHacks-2026-XiaotingMA.git
   cd BearHacks-2026-XiaotingMA
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Fill in your API keys:
   - **Google Cloud Vision**: [Get API Key](https://console.cloud.google.com/)
   - **Google Gemini**: [Get API Key](https://aistudio.google.com/)
   - **ElevenLabs**: [Get API Key](https://elevenlabs.io/)

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## 📱 How It Works

1. **Snap** — Take or upload a photo of your pet
2. **Listen** — Your pet introduces itself with an AI-generated voice and personality
3. **Chat** — Have a real conversation with your pet
4. **Learn** — Get personalized care tips for your pet's breed

## 🏆 Prize Tracks

PetSpeak targets the following BearHacks 2026 prize tracks:

| Track | Integration |
|---|---|
| Use of Google Cloud Vision API | Pet breed identification from photos |
| Use of ElevenLabs | AI-generated unique pet voices |
| Use of Gemma 4 | Pet personality generation and chat |
| Use of Vultr | Cloud deployment |
| UI/UX Design | Warm, animated pet-themed interface |
| Most Fun Project | Give your pet a voice and personality! |

## 🚀 Deployment (Vultr)

### Quick Deploy
1. Create a Vultr Cloud Compute instance (Ubuntu 24.04, any plan)
2. SSH into your server: `ssh root@YOUR_IP`
3. Run the setup script:
   ```bash
   curl -sSL https://raw.githubusercontent.com/Ccccccvia/BearHacks-2026-XiaotingMA/main/deploy/setup.sh | bash
   ```
4. Edit environment variables: `nano /opt/petspeak/.env.local`
5. Start the app: `bash /opt/petspeak/deploy/start.sh`
6. Visit `http://YOUR_IP` in your browser!

### Updating
After pushing new changes to GitHub:
```bash
bash /opt/petspeak/deploy/update.sh
```

## 🎬 Demo

[Live Demo](YOUR_DEPLOYMENT_URL) | [Demo Video](YOUR_VIDEO_URL)

## 👤 Developer

Built solo by Xiaoting MA for BearHacks 2026

## 📄 License

All Rights Reserved. This project was built for BearHacks 2026.
