import { useAuth } from '@clerk/expo';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F0F1A' }}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return isSignedIn ? (
    <Redirect href="/(home)" />
  ) : (
    <Redirect href="/(auth)/sign-in" />
  );
}
