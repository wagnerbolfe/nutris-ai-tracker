import { ClerkProvider, useAuth, useUser } from '@clerk/expo';
import * as SecureStore from 'expo-secure-store';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createUserProfile, getUserProfile } from '../lib/firestore';
import { Colors } from '../constants/Colors';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

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
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(false);

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

    const checkOnboardingAndNavigate = async () => {
      const inAuthGroup = segments[0] === '(auth)';
      const isStepForm = (segments[1] as any) === 'step-form';

      if (isSignedIn) {
        if (inAuthGroup && !isStepForm) {
          setIsCheckingOnboarding(true);
          try {
            // Check AsyncStorage first for speed
            const completedLocal = await AsyncStorage.getItem('hasCompletedOnboarding');
            
            if (completedLocal === 'true') {
              router.replace('/(home)');
              setIsCheckingOnboarding(false);
              return;
            }

            // Fallback to Firestore if local storage doesn't have it
            if (user?.id) {
               const profile = await getUserProfile(user.id);
               if (profile?.hasCompletedOnboarding) {
                 await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
                 router.replace('/(home)');
               } else {
                 router.replace('/(auth)/step-form' as any);
               }
            } else {
              // Safety fallback
              router.replace('/(home)');
            }
          } catch (e) {
            console.error('Error checking onboarding status', e);
            router.replace('/(home)');
          } finally {
             setIsCheckingOnboarding(false);
          }
        }
      } else if (!isSignedIn && !inAuthGroup) {
        router.replace('/(auth)/sign-in');
      }
    };

    checkOnboardingAndNavigate();
  }, [isSignedIn, isLoaded, segments, user?.id]);

  if (!isLoaded || isCheckingOnboarding) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
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
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <AuthGuard />
    </ClerkProvider>
  );
}
