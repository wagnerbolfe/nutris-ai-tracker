import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';

export default function AnalyticsScreen() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={Colors.backgroundGradient}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Text style={styles.title}>Analytics</Text>
          <Text style={styles.subtitle}>Track your progress over time</Text>
          
          <View style={styles.placeholderCard}>
            <Text style={styles.placeholderIcon}>📈</Text>
            <Text style={styles.placeholderTitle}>Charts coming soon</Text>
            <Text style={styles.placeholderText}>
              Your personalized calorie insights will appear here.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  safeArea: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    alignItems: 'center',
  },
  title: {
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
});
