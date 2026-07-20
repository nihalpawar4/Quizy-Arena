# Linking Quizy ↔ Arena: Cross-App Integration Guide

## Architecture Overview

Quizy and Arena are **separate repositories** that share a **single Firebase backend** as the source of truth. Users authenticate once and their data flows seamlessly between both apps.

```
┌──────────────┐      ┌─────────────────┐      ┌──────────────┐
│   Quizy App  │      │    Firebase      │      │  Arena App   │
│  (Main App)  │◄────►│  (Shared SSOT)   │◄────►│ (Games Hub)  │
│              │      │                  │      │              │
│ • Auth       │      │ • Auth           │      │ • Auth       │
│ • Profile    │      │ • Firestore      │      │ • Profile    │
│ • Settings   │      │ • RTDB           │      │ • Engine     │
│              │      │                  │      │              │
└──────────────┘      └─────────────────┘      └──────────────┘
```

---

## Step 1: Same Firebase Project

Both apps MUST use the **same Firebase project**. Copy Arena's Firebase config into Quizy (or vice versa).

### Arena's Firebase Config
Location: `src/lib/firebase/config.ts`

```ts
// Both apps use identical values
const firebaseConfig = {
  apiKey: "...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "...",
  appId: "...",
  databaseURL: "https://your-project.firebaseio.com",
};
```

**Action**: Ensure Quizy's `firebaseConfig` matches Arena's exactly.

---

## Step 2: Shared Authentication

Since both apps use the same Firebase project, **Firebase Auth is automatically shared**. A user who signs in on Quizy is already authenticated on Arena (same `uid`).

However, browser sessions are **per-domain**, so you need one of these approaches:

### Option A: Subdomain Routing (Recommended for Production)

```
quizy.yourdomain.com     → Quizy main app
arena.quizy.yourdomain.com → Arena app
```

Set the auth cookie domain to `.quizy.yourdomain.com` so it's shared across subdomains.

### Option B: Token-Based Handoff (Works with any domain)

When redirecting from Quizy → Arena, pass a short-lived Firebase custom token:

**In Quizy (sender):**
```ts
import { getAuth } from 'firebase/auth';

async function redirectToArena(path = '/') {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) {
    // Not logged in — redirect to Arena sign-in
    window.location.href = `${ARENA_URL}/sign-in?returnTo=${path}`;
    return;
  }

  // Get the user's ID token (short-lived, secure)
  const idToken = await user.getIdToken();
  
  // Redirect with token as URL parameter
  window.location.href = `${ARENA_URL}/auth/handoff?token=${idToken}&returnTo=${encodeURIComponent(path)}`;
}
```

**In Arena (receiver) — create a handoff page:**

```ts
// src/app/auth/handoff/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuth, signInWithCustomToken } from 'firebase/auth';

export default function AuthHandoff() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    async function authenticate() {
      const token = params.get('token');
      const returnTo = params.get('returnTo') || '/';

      if (!token) {
        router.replace('/sign-in');
        return;
      }

      try {
        // Verify the token via your backend, then sign in
        // Option 1: Use Firebase Admin SDK on server to create custom token
        // Option 2: Use signInWithIdToken (requires backend verification)
        const auth = getAuth();
        
        // Call your backend to exchange idToken for customToken
        const res = await fetch('/api/auth/exchange', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: token }),
        });
        const { customToken } = await res.json();
        
        await signInWithCustomToken(auth, customToken);
        router.replace(returnTo);
      } catch {
        router.replace('/sign-in');
      }
    }

    authenticate();
  }, [params, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-sm text-text-secondary">Signing you in...</p>
    </div>
  );
}
```

### Option C: Simple Link (Easiest — User Signs In Separately)

Just link to Arena. Since both apps use the same Firebase Auth, if the user has already signed into Arena before, their session persists. If not, they'll see the Arena sign-in page (same credentials work).

```tsx
// In Quizy — add a button/link
<a href="https://arena.yourdomain.com" target="_blank" rel="noopener">
  🎮 Play Brain Games in Arena
</a>
```

---

## Step 3: Add Navigation Links

### In Quizy → Arena

Add an "Arena" button in Quizy's navigation:

```tsx
// In Quizy's sidebar or nav component
const ARENA_URL = process.env.NEXT_PUBLIC_ARENA_URL || 'https://arena.yourdomain.com';

<a
  href={ARENA_URL}
  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface transition-colors"
>
  <span>🎮</span>
  <span>Arena</span>
  <span className="text-xs text-text-tertiary ml-auto">Brain Games</span>
</a>
```

### In Arena → Quizy

Arena already has a potential spot in the top bar. Add a "Back to Quizy" link:

```tsx
// In Arena's top-bar.tsx or app-shell.tsx
const QUIZY_URL = process.env.NEXT_PUBLIC_QUIZY_URL || 'https://quizy.yourdomain.com';

<a
  href={QUIZY_URL}
  className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
>
  ← Back to Quizy
</a>
```

---

## Step 4: Environment Variables

Add these to both apps:

### Arena's `.env.local`
```env
# Existing Firebase config...
NEXT_PUBLIC_QUIZY_URL=https://quizy.yourdomain.com
```

### Quizy's `.env.local`
```env
# Existing Firebase config (same project!)
NEXT_PUBLIC_ARENA_URL=https://arena.yourdomain.com
```

---

## Step 5: Shared Data (Already Working)

The following data is **already shared** through Firebase because both apps read/write the same Firestore documents:

| Data | Firestore Path | Written By | Read By |
|------|---------------|-----------|---------|
| Auth Profile | `users/{uid}` | Both | Both |
| Display Name | `users/{uid}.displayName` | Both | Both |
| Username | `users/{uid}.username` | Both | Both |
| Avatar | `users/{uid}.avatarUrl` | Both | Both |
| Coins | `users/{uid}.coins` | Both | Both |
| Diamonds | `users/{uid}.diamonds` | Both | Both |
| Global XP | `users/{uid}.globalXp` | Both | Both |
| Global Level | `users/{uid}.globalLevel` | Both | Both |
| Premium | `users/{uid}.isPremium` | Quizy | Both |
| Preferences | `users/{uid}.preferences` | Both | Both |
| Arena Profile | `arena_profiles/{uid}` | Arena | Both |
| Arena XP | `arena_profiles/{uid}.arenaXp` | Arena | Both |
| Brain Score | `arena_profiles/{uid}.brainScore` | Arena | Both |
| Skills | `arena_profiles/{uid}.skill*` | Arena | Both |
| Game Sessions | `arena_sessions/{id}` | Arena | Both |

### Real-Time Sync

Both apps use `onSnapshot` listeners on `users/{uid}`. When Arena saves a game session and increments `coins` or `globalXp`, Quizy's listener fires automatically and the UI updates in real-time.

**No additional sync code is needed.**

---

## Step 6: Deployment

### Option A: Vercel (Recommended)
Deploy each app as a separate Vercel project:

```bash
# Arena
cd quizy-games-arena
vercel --prod

# Quizy  
cd quizy-main
vercel --prod
```

Configure custom domains in Vercel dashboard:
- `quizy.yourdomain.com` → Quizy project
- `arena.yourdomain.com` → Arena project

### Option B: Firebase Hosting
Use Firebase multi-site hosting:

```json
// firebase.json
{
  "hosting": [
    {
      "target": "quizy",
      "public": "quizy-main/.next",
      "rewrites": [{ "source": "**", "destination": "/index.html" }]
    },
    {
      "target": "arena",
      "public": "quizy-games-arena/.next",
      "rewrites": [{ "source": "**", "destination": "/index.html" }]
    }
  ]
}
```

---

## Quick Start Checklist

- [ ] Both apps use the **same Firebase project** (identical `firebaseConfig`)
- [ ] Add `NEXT_PUBLIC_ARENA_URL` to Quizy's env
- [ ] Add `NEXT_PUBLIC_QUIZY_URL` to Arena's env
- [ ] Add "Arena" link in Quizy's navigation
- [ ] Add "Back to Quizy" link in Arena's top bar
- [ ] Deploy both apps (Vercel recommended)
- [ ] Configure custom domains (subdomain setup preferred)
- [ ] Test: Sign in on Quizy → Navigate to Arena → Verify same user data appears
- [ ] Test: Play a game in Arena → Check Quizy reflects updated coins/XP in real-time
