import { useAuth } from '@clerk/expo';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { Colors } from '../constants/Colors';

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return isSignedIn ? (
    <Redirect href="/(home)" />
  ) : (
    <Redirect href="/(auth)/sign-in" />
  );
}
