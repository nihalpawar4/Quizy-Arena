import { create } from 'zustand';
import type { User } from 'firebase/auth';
import type { UserDocument, ArenaProfileDocument } from '@/lib/firebase/types';
import type { SavePayload, RewardResult } from '@/engine/types';
import { applyGameRewardsOptimistic } from '@/lib/firebase/apply-game-rewards';

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
  applyGameRewards: (payload: SavePayload, rewards: RewardResult) => void;
  adjustCoins: (delta: number) => void;
  adjustDiamonds: (delta: number) => void;
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

  applyGameRewards: (payload, rewards) =>
    set((state) => {
      if (!state.userProfile || !state.arenaProfile) return state;
      const updated = applyGameRewardsOptimistic({
        userProfile: state.userProfile,
        arenaProfile: state.arenaProfile,
        payload,
        rewards,
      });
      return {
        userProfile: updated.userProfile,
        arenaProfile: updated.arenaProfile,
      };
    }),

  adjustCoins: (delta) =>
    set((state) => {
      if (!state.userProfile) return state;
      return {
        userProfile: {
          ...state.userProfile,
          coins: Math.max(0, state.userProfile.coins + delta),
        },
      };
    }),

  adjustDiamonds: (delta) =>
    set((state) => {
      if (!state.userProfile) return state;
      return {
        userProfile: {
          ...state.userProfile,
          diamonds: Math.max(0, state.userProfile.diamonds + delta),
        },
      };
    }),

  reset: () => set(initialState),
}));
