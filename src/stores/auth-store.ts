import { create } from 'zustand';
import type { User } from 'firebase/auth';
import type { UserDocument, ArenaProfileDocument } from '@/lib/firebase/types';

interface AuthState {
  // Firebase Auth user
  firebaseUser: User | null;

  // Firestore user profile (shared)
  userProfile: UserDocument | null;

  // Arena-specific profile
  arenaProfile: ArenaProfileDocument | null;

  // Loading states
  isAuthLoading: boolean;
  isProfileLoading: boolean;

  // Derived
  isAuthenticated: boolean;
  isArenaOnboarded: boolean;

  // Actions
  setFirebaseUser: (user: User | null) => void;
  setUserProfile: (profile: UserDocument | null) => void;
  setArenaProfile: (profile: ArenaProfileDocument | null) => void;
  setAuthLoading: (loading: boolean) => void;
  setProfileLoading: (loading: boolean) => void;
  reset: () => void;
}

const initialState = {
  firebaseUser: null,
  userProfile: null,
  arenaProfile: null,
  isAuthLoading: true,
  isProfileLoading: false,
  isAuthenticated: false,
  isArenaOnboarded: false,
};

export const useAuthStore = create<AuthState>((set) => ({
  ...initialState,

  setFirebaseUser: (user) =>
    set({
      firebaseUser: user,
      isAuthenticated: user !== null,
    }),

  setUserProfile: (profile) =>
    set({ userProfile: profile }),

  setArenaProfile: (profile) =>
    set({
      arenaProfile: profile,
      isArenaOnboarded: profile?.isOnboarded ?? false,
    }),

  setAuthLoading: (loading) =>
    set({ isAuthLoading: loading }),

  setProfileLoading: (loading) =>
    set({ isProfileLoading: loading }),

  reset: () => set(initialState),
}));
