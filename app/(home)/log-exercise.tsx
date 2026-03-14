import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../components/ThemedText';
import { Colors } from '../../constants/Colors';

interface ExerciseOption {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
  title: string;
  description: string;
  onPress: () => void;
}

function OptionCard({ opt }: { opt: ExerciseOption }) {
  return (
    <TouchableOpacity style={styles.optionCard} onPress={opt.onPress} activeOpacity={0.8}>
      <View style={[styles.optionIconBg, { backgroundColor: opt.bg }]}>
        <Ionicons name={opt.icon} size={30} color={opt.color} />
      </View>
      <View style={styles.optionText}>
        <Text style={styles.optionTitle} weight="700">{opt.title}</Text>
        <Text style={styles.optionDesc} weight="400">{opt.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />
    </TouchableOpacity>
  );
}

export default function LogExerciseScreen() {
  const router = useRouter();

  const options: ExerciseOption[] = [
    {
      icon: 'bicycle-outline',
      color: '#4ADE80',
      bg: 'rgba(74, 222, 128, 0.15)',
      title: 'Run',
      description: 'Running, Walking, Cycling and more',
      onPress: () => {
        router.push({
          pathname: '/(home)/exercise-detail',
          params: { type: 'run', title: 'Run', description: 'Running, Walking, Cycling and more' },
        });
      },
    },
    {
      icon: 'barbell-outline',
      color: '#A78BFA',
      bg: 'rgba(167, 139, 250, 0.15)',
      title: 'Weight Lifting',
      description: 'Gym machines, free weights and more',
      onPress: () => {
        router.push({
          pathname: '/(home)/exercise-detail',
          params: { type: 'weight', title: 'Weight Lifting', description: 'Gym machines, free weights and more' },
        });
      },
    },
    {
      icon: 'flame',
      color: '#F87171',
      bg: 'rgba(250, 82, 21, 0.15)',
      title: 'Manual',
      description: 'Enter calories burned manually',
      onPress: () => {
        router.push('/(home)/manual-calories');
      },
    },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={Colors.backgroundGradient} style={StyleSheet.absoluteFillObject} />

      {/* Background blobs */}
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Big Title */}
        <View style={styles.titleSection}>
          <Text style={styles.bigTitle} weight="800">Log Exercise</Text>
          <Text style={styles.bigSubtitle} weight="400">Choose the type of activity you want to track</Text>
        </View>

        {/* Options */}
        <View style={styles.optionsList}>
          {options.map((opt, i) => (
            <OptionCard key={i} opt={opt} />
          ))}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  blob1: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#4C1D95',
    opacity: 0.15,
    top: -80,
    right: -80,
  },
  blob2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#1E3A5F',
    opacity: 0.2,
    bottom: 200,
    left: -60,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 4,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleSection: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 36,
  },
  titleIconBg: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(41, 143, 80, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(41, 143, 80, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  bigTitle: {
    fontSize: 34,
    color: '#FFF',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  bigSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  optionsList: {
    paddingHorizontal: 20,
    gap: 14,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 22,
    padding: 18,
  },
  optionIconBg: {
    width: 58,
    height: 58,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    flex: 1,
    gap: 4,
  },
  optionTitle: {
    fontSize: 17,
    color: '#FFF',
  },
  optionDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
