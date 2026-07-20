import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getDatabase, type Database } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

/**
 * Firebase is initialized lazily to prevent crashes during
 * Next.js build/SSR when env vars are not set.
 */

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _storage: FirebaseStorage | null = null;
let _rtdb: Database | null = null;

function getApp(): FirebaseApp {
  if (_app) return _app;

  if (!firebaseConfig.apiKey) {
    throw new Error(
      'Firebase API key is missing. Create a .env.local file with your Firebase config. ' +
      'See .env.local.example for the required variables.',
    );
  }

  _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  return _app;
}

/**
 * Get the Firebase Auth instance. Lazily initialized.
 */
export function getFirebaseAuth(): Auth {
  if (_auth) return _auth;
  _auth = getAuth(getApp());
  return _auth;
}

/**
 * Get the Firestore instance. Lazily initialized.
 * Note: Offline persistence is enabled separately in the auth provider
 * (client-only) to avoid SSR issues.
 */
export function getFirebaseDb(): Firestore {
  if (_db) return _db;
  _db = getFirestore(getApp());
  return _db;
}

/**
 * Get the Firebase Storage instance. Lazily initialized.
 */
export function getFirebaseStorage(): FirebaseStorage {
  if (_storage) return _storage;
  _storage = getStorage(getApp());
  return _storage;
}

/**
 * Get the Firebase Realtime Database instance. Lazily initialized.
 * Used exclusively for the presence system (online status, lastSeen).
 */
export function getFirebaseRtdb(): Database {
  if (_rtdb) return _rtdb;
  _rtdb = getDatabase(getApp());
  return _rtdb;
}
