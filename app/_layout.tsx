import { ClerkProvider, useAuth, useUser } from '@clerk/expo';
import * as SecureStore from 'expo-secure-store';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createUserProfile, getUserProfile } from '../lib/firestore';

const tokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {}
  },
  async clearToken(key: string) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {}
  },
};

function AuthGuard() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const segments = useSegments();

  // Save user profile to Firestore on first sign-in (if not already saved)
  useEffect(() => {
    if (!isSignedIn || !user?.id) return;
    (async () => {
      try {
        const existing = await getUserProfile(user.id);
        if (!existing) {
          await createUserProfile(user.id, {
            fullName: user.fullName ?? null,
            email: user.primaryEmailAddress?.emailAddress ?? null,
            imageUrl: user.imageUrl ?? null,
          });
        }
      } catch (err) {
        console.warn('[Firestore] Failed to save user profile:', err);
      }
    })();
  }, [isSignedIn, user?.id]);

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inHomeGroup = segments[0] === '(home)';

    if (isSignedIn && inAuthGroup) {
      router.replace('/(home)');
    } else if (!isSignedIn && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    }
  }, [isSignedIn, isLoaded, segments]);

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F0F1A' }}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(home)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <AuthGuard />
    </ClerkProvider>
  );
}
