import { useAuth, useUser } from '@clerk/expo';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/sign-in');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#0F0F1A', '#1A0E2E', '#0F1729']}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Text style={styles.greeting}>
            Hey, {user?.firstName ?? 'there'} 👋
          </Text>
          <Text style={styles.subtitle}>Welcome to Nutris AI Tracker</Text>

          <View style={styles.placeholderCard}>
            <Text style={styles.placeholderIcon}>🥗</Text>
            <Text style={styles.placeholderTitle}>Dashboard coming soon</Text>
            <Text style={styles.placeholderText}>
              Your AI-powered calorie tracking experience is being built.
            </Text>
          </View>

          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A' },
  safeArea: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    alignItems: 'center',
  },
  blob1: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#4C1D95',
    opacity: 0.2,
    top: -60,
    right: -80,
  },
  blob2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#1E3A5F',
    opacity: 0.25,
    bottom: 120,
    left: -50,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#9CA3AF',
    marginBottom: 40,
    textAlign: 'center',
  },
  placeholderCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 32,
    alignItems: 'center',
    marginBottom: 40,
  },
  placeholderIcon: { fontSize: 48, marginBottom: 16 },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  placeholderText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  signOutBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(139, 92, 246, 0.5)',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  signOutText: {
    color: '#A78BFA',
    fontSize: 15,
    fontWeight: '700',
  },
});
