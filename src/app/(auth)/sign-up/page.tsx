'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trophy, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { signUpWithEmail, signInWithGoogle, updateUserProfile } from '@/lib/firebase/auth';
import { setDocument, serverTimestamp } from '@/lib/firebase/firestore';
import { createArenaProfile } from '@/lib/firebase/arena-profile';
import type { UserDocument } from '@/lib/firebase/types';

export default function SignUpPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleEmailSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);

    try {
      const user = await signUpWithEmail(email, password);
      await updateUserProfile(user, { displayName: name });
      await createUserDocuments(user.uid, name, email);
      router.replace('/onboarding');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to sign up';
      if (message.includes('email-already-in-use')) {
        setError('An account with this email already exists.');
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignUp() {
    setError('');
    setIsGoogleLoading(true);

    try {
      const user = await signInWithGoogle();
      // Check if user doc already exists (returning Quizy user)
      const { getDocument } = await import('@/lib/firebase/firestore');
      const existingProfile = await getDocument<UserDocument>('users', user.uid);

      if (existingProfile) {
        // Existing Quizy user — just ensure Arena profile exists
        const { documentExists } = await import('@/lib/firebase/firestore');
        const hasArena = await documentExists('arena_profiles', user.uid);
        if (!hasArena) {
          await createArenaProfile(user.uid);
        }
        router.replace('/onboarding');
      } else {
        // Brand new user
        await createUserDocuments(
          user.uid,
          user.displayName || 'Player',
          user.email || '',
        );
        router.replace('/onboarding');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to sign up';
      if (!message.includes('popup-closed')) {
        setError(message);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  }

  return (
    <>
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center mb-4">
          <Trophy className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-xl font-bold text-text-primary">
          Create your account
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Start training your brain today
        </p>
      </div>

      {/* Google Sign Up */}
      <Button
        variant="secondary"
        fullWidth
        onClick={handleGoogleSignUp}
        isLoading={isGoogleLoading}
        className="mb-4"
      >
        <GoogleIcon />
        Continue with Google
      </Button>

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-text-tertiary">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Email Form */}
      <form onSubmit={handleEmailSignUp} className="space-y-4">
        <Input
          label="Full Name"
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
        />

        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-8 text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>

        {error && (
          <p className="text-sm text-danger">{error}</p>
        )}

        <Button type="submit" fullWidth isLoading={isLoading}>
          Create Account
        </Button>
      </form>

      {/* Sign In Link */}
      <p className="text-center text-sm text-text-secondary mt-6">
        Already have an account?{' '}
        <Link
          href="/sign-in"
          className="text-primary hover:text-primary-hover font-medium transition-colors"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}

/**
 * Create both shared user doc and Arena profile for a new user.
 */
async function createUserDocuments(uid: string, name: string, email: string) {
  const now = serverTimestamp();

  const userDoc: Record<string, unknown> = {
    uid,
    email,
    displayName: name,
    username: '',
    avatarUrl: null,
    globalXp: 0,
    globalLevel: 1,
    coins: 0,
    diamonds: 0,
    isPremium: false,
    premiumPlan: 'free',
    premiumExpiresAt: null,
    activeFrame: null,
    activeTitle: null,
    activeBadges: [],
    earnedBadges: [],
    earnedFrames: [],
    earnedTitles: [],
    settings: {
      language: 'en',
      theme: 'dark',
      soundEnabled: true,
      notificationsEnabled: true,
      colorBlindMode: false,
      privacy: {
        profilePublic: true,
        showOnlineStatus: true,
        showActivity: true,
      },
    },
    onboardedApps: [],
    blockedUsers: [],
    createdAt: now,
    updatedAt: now,
    lastActiveAt: now,
    // Quizy-compatibility fields
    name,
    role: 'student',
    xp: 0,
  };

  await setDocument('users', uid, userDoc);
  await createArenaProfile(uid);
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
