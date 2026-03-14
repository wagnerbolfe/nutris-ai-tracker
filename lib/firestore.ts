import { doc, getDoc, setDoc, serverTimestamp, increment, collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
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
  dailyCalories?: string; // Appended for goals overlay
  dailyWater?: string;    // Appended for water goals (liters)
  protein?: string;
  fats?: string;
  carbs?: string;
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
  data: Partial<Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>>
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

export interface DailyLog {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalFat: number;
  totalCarbs: number;
  totalWater: number;
  caloriesBurned?: number;
  lastUpdated?: unknown;
}

/**
 * Retrieves a daily log. If none exist, returns a 0 base outline.
 */
export async function getDailyLog(userId: string, dateStr: string): Promise<DailyLog> {
  const logRef = doc(db, 'users', userId, 'daily_logs', dateStr);
  const snap = await getDoc(logRef);
  
  if (!snap.exists()) {
    return {
      date: dateStr,
      totalCalories: 0,
      totalProtein: 0,
      totalFat: 0,
      totalCarbs: 0,
      totalWater: 0,
    };
  }
  return snap.data() as DailyLog;
}

/**
 * Logs an activity into the daily log by incrementing the values dynamically.
 * Also stores an individual ActivityEntry in a sub-collection for Recent Activity display.
 */
export async function logActivity(
  userId: string,
  dateStr: string,
  calories: number,
  protein: number,
  fat: number,
  carbs: number,
  water: number = 0,
  options?: { description?: string; type?: string }
): Promise<void> {
  const logRef = doc(db, 'users', userId, 'daily_logs', dateStr);

  const isManual = options?.type === 'manual';

  await setDoc(logRef, {
    date: dateStr,
    ...(isManual
      ? { caloriesBurned: increment(calories) }
      : { totalCalories: increment(calories) }),
    totalProtein: increment(protein),
    totalFat: increment(fat),
    totalCarbs: increment(carbs),
    totalWater: increment(water),
    lastUpdated: serverTimestamp(),
  }, { merge: true });

  // Store individual entry for Recent Activity display
  const entriesRef = collection(db, 'users', userId, 'daily_logs', dateStr, 'entries');
  await addDoc(entriesRef, {
    calories,
    protein,
    fat,
    carbs,
    water,
    ...(options?.type        ? { type: options.type }               : {}),
    ...(options?.description ? { description: options.description } : {}),
    loggedAt: serverTimestamp(),
  });
}

export interface ActivityEntry {
  id: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  water: number;
  type?: string;
  description?: string;
  loggedAt?: any;
}

/**
 * Retrieves all individual activity entries for a specific date.
 */
export async function getActivityEntries(
  userId: string,
  dateStr: string
): Promise<ActivityEntry[]> {
  const entriesRef = collection(db, 'users', userId, 'daily_logs', dateStr, 'entries');
  const q = query(entriesRef, orderBy('loggedAt', 'desc'));
  const snap = await getDocs(q);
  if (snap.empty) return [];
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ActivityEntry));
}
