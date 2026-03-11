import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface UserProfile {
  id: string;
  fullName: string | null;
  email: string | null;
  imageUrl?: string | null;
  gender?: string;
  goal?: string;
  workoutDays?: string;
  birthdate?: string; // Stored as ISO string or DD/MM/YYYY
  heightFeet?: string; // Optional: could be number
  weightKg?: string;   // Optional: could be number
  hasCompletedOnboarding?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

/**
 * Upserts a user profile document in the Firestore `users` collection.
 * Called after successful sign-up (email or Google OAuth).
 */
export async function saveUserProfile(
  userId: string,
  data: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await setDoc(
    userRef,
    {
      ...data,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Retrieves an existing user profile from Firestore.
 * Returns null if the document does not exist.
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as UserProfile;
}

/**
 * Creates a new user profile for the first time (includes createdAt).
 */
export async function createUserProfile(
  userId: string,
  data: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await setDoc(
    userRef,
    {
      id: userId,
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
