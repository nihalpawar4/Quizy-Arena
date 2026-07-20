# Quizy Arena 🎮🧠

**Brain Training Games Platform** — A premium game launcher for cognitive training, built with Next.js 16, Firebase, and Framer Motion.

Part of the **Quizy ecosystem**. Shares authentication, profiles, currency, and progression with the main [Quizy app](https://quizzytest.vercel.app).

## Features

- 🧠 **3 Brain Games** — Memory Match, Speed Math, Pattern Recall
- 📈 **Infinite Level System** — Algorithmic difficulty scaling per game
- 🏆 **XP, Coins, Diamonds** — Full reward & economy system
- 🔥 **Daily Challenges** — Rotating daily missions & streak tracking
- 📊 **Brain Score** — Multi-skill radar (memory, logic, focus, reaction)
- 🌍 **World Map** — Unlock new game worlds as you level up
- ⚔️ **Battle Arena** — Multiplayer (Coming Soon)
- 🔄 **Real-Time Sync** — Shared Firebase backend with Quizy
- 🎨 **Premium UI** — Dark mode, glassmorphism, micro-animations

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + CSS Custom Properties
- **Animation**: Framer Motion
- **Backend**: Firebase (Auth, Firestore, RTDB)
- **State**: Zustand
- **Deployment**: Vercel

## Getting Started

```bash
# Install dependencies
npm install

# Create .env.local (see .env.example)
cp .env.example .env.local

# Run development server
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your Firebase config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Quizy Arena
NEXT_PUBLIC_QUIZY_URL=https://quizzytest.vercel.app
```

## Project Structure

```
src/
├── app/           # Next.js App Router pages
├── components/    # Reusable UI components
├── engine/        # Game engine (lifecycle, scoring, rewards, save)
├── games/         # Individual game implementations
├── hooks/         # Custom React hooks
├── lib/           # Utilities, Firebase, constants
├── providers/     # Auth, theme, toast providers
└── stores/        # Zustand state stores
```

## Cross-App Integration

See [CROSS_APP_INTEGRATION.md](./CROSS_APP_INTEGRATION.md) for details on linking Arena with the main Quizy app.

## License

Private — All rights reserved.
