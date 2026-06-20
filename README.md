<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:0a0a0f,50:1a0a3a,100:2d1060&height=230&section=header&text=Sayanth%20Rock%20AI&fontSize=60&fontColor=ffffff&animation=fadeIn&fontAlignY=42&desc=Gemini-Powered%20AI%20%E2%80%94%20Web%20%2B%20Android&descAlignY=62&descSize=19&fontStyle=bold" width="100%" alt="Sayanth Rock AI banner"/>
</p>

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Gemini API](https://img.shields.io/badge/Gemini%20API-🔐-8e44f7?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Capacitor](https://img.shields.io/badge/Capacitor-Android-119eff?style=for-the-badge&logo=capacitor&logoColor=white)](https://capacitorjs.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

[![GitHub Actions](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088ff?style=for-the-badge&logo=githubactions&logoColor=white)](https://github.com/SayanthRock/Sayanth-Rock-ai/actions)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-181717?style=for-the-badge&logo=github&logoColor=white)](https://sayanthrock.github.io/Sayanth-Rock-ai/)
[![AI Studio](https://img.shields.io/badge/AI%20Studio-View%20App-4285f4?style=for-the-badge&logo=google&logoColor=white)](https://ai.studio/apps/c94863d0-3a20-41c5-ae14-7e83ca2eba13)
[![Author](https://img.shields.io/badge/Author-sayanthrock-7c3aed?style=for-the-badge&logo=github&logoColor=white)](https://github.com/SayanthRock)

</div>

---

## ✦ Overview

**Sayanth Rock AI** is a Gemini-powered AI assistant built with **Next.js 15 + TypeScript**, designed to run both as a **progressive web app** and as a **native Android APK** via Capacitor. Bootstrapped from Google AI Studio and restyled with dark luxury 2026 UI principles — this is AI with personality.

The app connects to the **Gemini API** for intelligent, real-time AI responses, deployable to GitHub Pages in minutes and packaged for Android with a single Capacitor build.

---

## ✦ Features

| Feature | Detail |
|---|---|
| 🤖 **Gemini AI** | Real-time intelligent responses via Google Gemini API |
| 📱 **Android-Ready** | Capacitor integration for native APK packaging |
| ⚡ **Next.js 15** | App Router, server components, blazing-fast performance |
| 🎨 **Tailwind CSS** | Utility-first styling with custom dark luxury design tokens |
| 🔐 **Secure Key Handling** | API key managed via `.env.local` — never exposed client-side |
| 🚀 **CI/CD Pipeline** | GitHub Actions workflow for automated builds and deployments |
| 🌐 **GitHub Pages** | One-push deployment to production |

---

## ✦ Tech Stack

```
Frontend   → Next.js 15 · TypeScript · Tailwind CSS
AI Engine  → Google Gemini API
Mobile     → Capacitor (Android APK)
Tooling    → ESLint · PostCSS · Node.js
CI/CD      → GitHub Actions
Deploy     → GitHub Pages
```

---

## ✦ Getting Started

### Prerequisites

- **Node.js** v18+
- A **Gemini API key** → [Get one here](https://aistudio.google.com/app/apikey)

### 1 — Clone & Install

```bash
git clone https://github.com/SayanthRock/Sayanth-Rock-ai.git
cd Sayanth-Rock-ai
npm install
```

### 2 — Configure Environment

Create `.env.local` in the root:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

> 🔒 `.env.local` is gitignored — your key stays local.

### 3 — Run Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ✦ Android Build (Capacitor)

```bash
# Build the Next.js app
npm run build

# Sync to Capacitor
npx cap sync android

# Open in Android Studio
npx cap open android
```

---

## ✦ Deploy

### GitHub Pages

Push to `main` — the GitHub Actions workflow handles the rest automatically.

### AI Studio

View the live AI Studio version here:
[ai.studio/apps/c94863d0-3a20-41c5-ae14-7e83ca2eba13](https://ai.studio/apps/c94863d0-3a20-41c5-ae14-7e83ca2eba13)

---

## ✦ Project Structure

```
Sayanth-Rock-ai/
├── app/               # Next.js App Router pages & layouts
├── hooks/             # Custom React hooks
├── lib/               # Utility functions & Gemini API helpers
├── public/            # Static assets
├── .github/workflows/ # CI/CD pipeline
├── capacitor.config.ts
└── .env.example       # Environment variable template
```

---

## ✦ Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ | Your Google Gemini API key |

Copy `.env.example` → `.env.local` and fill in your key.

---

<div align="center">

**Built with 🖤 by [sayanthrock](https://github.com/SayanthRock)**

[![GitHub](https://img.shields.io/badge/GitHub-SayanthRock-181717?style=flat-square&logo=github)](https://github.com/SayanthRock)
[![YouTube](https://img.shields.io/badge/YouTube-sayanthrock-ff0000?style=flat-square&logo=youtube)](https://youtube.com/@sayanthrock)
[![Telegram](https://img.shields.io/badge/Telegram-sayanthrock-26a5e4?style=flat-square&logo=telegram)](https://t.me/sayanthrock)

*Part of the **Rock** ecosystem — Rock QR · Rock Wallpapers · OTA Rock · Clock In Rock*

</div>

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:2d1060,50:1a0a3a,100:0a0a0f&height=130&section=footer" width="100%" alt="footer"/>
</p>
