import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../components/ThemedText';
import { Colors } from '../../constants/Colors';

// ─── Intensity ──────────────────────────────────────────────────────────────
type Intensity = 'Low' | 'Medium' | 'High';

const INTENSITIES: { label: Intensity; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { label: 'Low', icon: 'battery-half-outline', color: '#4ADE80' },
  { label: 'Medium', icon: 'battery-charging-outline', color: '#FACC15' },
  { label: 'High', icon: 'flame-outline', color: '#F87171' },
];

function IntensitySlider({
  value,
  onChange,
}: {
  value: Intensity;
  onChange: (v: Intensity) => void;
}) {
  const currentIdx = INTENSITIES.findIndex((i) => i.label === value);
  const current = INTENSITIES[currentIdx];
  const trackWidthRef = useRef(0);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const handleTouch = (x: number) => {
    const w = trackWidthRef.current;
    if (w === 0) return;
    const pct = Math.max(0, Math.min(x, w)) / w;
    if (pct < 1 / 3) onChangeRef.current('Low');
    else if (pct < 2 / 3) onChangeRef.current('Medium');
    else onChangeRef.current('High');
  };

  return (
    <View style={styles.sliderCard}>
      {/* Track — touch & drag to select intensity */}
      <View
        style={styles.track}
        onLayout={(e) => { trackWidthRef.current = e.nativeEvent.layout.width; }}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(e) => handleTouch(e.nativeEvent.locationX)}
        onResponderMove={(e) => handleTouch(e.nativeEvent.locationX)}
      >
        {INTENSITIES.map((item, idx) => {
          const isActive = idx <= currentIdx;
          return (
            <View
              key={item.label}
              style={[
                styles.trackSegment,
                isActive && { backgroundColor: current.color },
                idx === 0 && { borderTopLeftRadius: 8, borderBottomLeftRadius: 8 },
                idx === INTENSITIES.length - 1 && {
                  borderTopRightRadius: 8,
                  borderBottomRightRadius: 8,
                },
              ]}
            />
          );
        })}
        {/* Thumb */}
        <View
          style={[
            styles.thumb,
            {
              left: `${(currentIdx / (INTENSITIES.length - 1)) * 85 + 3}%`,
              backgroundColor: current.color,
              shadowColor: current.color,
            },
          ]}
        />
      </View>

      {/* Labels */}
      <View style={styles.sliderLabels}>
        {INTENSITIES.map((item) => (
          <TouchableOpacity
            key={item.label}
            onPress={() => onChange(item.label)}
            style={styles.labelBtn}
          >
            <Text
              style={[styles.labelText, item.label === value && { color: current.color }]}
              weight={item.label === value ? '700' : '400'}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Active indicator */}
      <View style={[styles.intensityBadge, { borderColor: current.color, backgroundColor: `${current.color}18` }]}>
        <Ionicons name={current.icon} size={16} color={current.color} />
        <Text style={[styles.intensityBadgeText, { color: current.color }]} weight="700">
          {value} Intensity
        </Text>
      </View>
    </View>
  );
}

// ─── Duration Chips ──────────────────────────────────────────────────────────
const DURATION_CHIPS = [15, 30, 60, 90];

export default function ExerciseDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type: string; title: string; description: string }>();
  const title = params.title ?? 'Exercise';
  const description = params.description ?? '';

  const [intensity, setIntensity] = useState<Intensity>('Medium');
  const [selectedDuration, setSelectedDuration] = useState<number | null>(30);
  const [manualDuration, setManualDuration] = useState('');

  const handleChipPress = (val: number) => {
    setSelectedDuration(val);
    setManualDuration('');
  };

  const handleManualChange = (text: string) => {
    setManualDuration(text);
    setSelectedDuration(null);
  };

  const getDuration = () => {
    if (manualDuration) return parseInt(manualDuration) || 0;
    return selectedDuration ?? 0;
  };

  const handleContinue = () => {
    const duration = getDuration();
    if (duration <= 0) return;
    router.push({
      pathname: '/(home)/workout-result',
      params: { type: params.type, title, intensity, duration: duration.toString() },
    });
  };

  const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
    run: 'bicycle-outline',
    weight: 'barbell-outline',
  };
  const colorMap: Record<string, string> = {
    run: '#4ADE80',
    weight: '#A78BFA',
  };
  const typeKey = params.type ?? 'run';
  const accentColor = colorMap[typeKey] ?? Colors.primary;
  const accentIcon = iconMap[typeKey] ?? 'fitness-outline';

  return (
    <View style={styles.container}>
      <LinearGradient colors={Colors.backgroundGradient} style={StyleSheet.absoluteFillObject} />
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          <View style={styles.titleRow}>
            <View style={[styles.titleIconBg, { backgroundColor: `${accentColor}20`, borderColor: `${accentColor}50` }]}>
              <Ionicons name={accentIcon} size={26} color={accentColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bigTitle} weight="800">{title}</Text>
              <Text style={styles.bigDesc} weight="400">{description}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle} weight="700">Workout Intensity</Text>
            <Text style={styles.sectionSubtitle} weight="400">How hard are you going to push?</Text>
            <IntensitySlider value={intensity} onChange={setIntensity} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle} weight="700">Duration</Text>
            <Text style={styles.sectionSubtitle} weight="400">How long is your session?</Text>

            <View style={styles.chipsRow}>
              {DURATION_CHIPS.map((min) => {
                const active = selectedDuration === min && !manualDuration;
                return (
                  <TouchableOpacity
                    key={min}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => handleChipPress(min)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]} weight={active ? '700' : '500'}>
                      {min} min
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.manualInputWrapper}>
              <Ionicons name="time-outline" size={18} color={Colors.textSecondary} style={{ marginRight: 10 }} />
              <TextInput
                style={styles.manualInput}
                placeholder="Or enter duration manually..."
                placeholderTextColor={Colors.textSecondary}
                keyboardType="numeric"
                value={manualDuration}
                onChangeText={handleManualChange}
              />
              {manualDuration.length > 0 && (
                <Text style={styles.manualUnit} weight="500">min</Text>
              )}
            </View>
          </View>

        </ScrollView>

        {/* Continue Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.continueBtn, { shadowColor: Colors.primary }]}
            onPress={handleContinue}
            activeOpacity={0.85}
          >
            <Text style={styles.continueBtnText} weight="700">Continue</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFF" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  safeArea: { flex: 1 },
  blob1: {
    position: 'absolute', width: 260, height: 260, borderRadius: 130,
    backgroundColor: '#4C1D95', opacity: 0.13, top: -70, right: -70,
  },
  blob2: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: '#1E3A5F', opacity: 0.18, bottom: 160, left: -60,
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
    marginHorizontal: 20, marginTop: 24, marginBottom: 4,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginVertical: 20,
  },
  titleIconBg: {
    width: 54, height: 54, borderRadius: 17,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5,
    marginTop: 4
  },
  bigTitle: { fontSize: 28, color: '#FFF', letterSpacing: -0.4 },
  bigDesc: { fontSize: 13, color: Colors.textSecondary, marginTop: 3 },

  // Section
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 17, color: '#FFF', marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, color: Colors.textSecondary, marginBottom: 16 },

  // Intensity slider card
  sliderCard: {
    backgroundColor: Colors.cardBackground,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  track: {
    height: 10,
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'visible',
    position: 'relative',
  },
  trackSegment: {
    flex: 1,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 1,
  },
  thumb: {
    position: 'absolute',
    width: 22, height: 22,
    borderRadius: 11,
    top: -6,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  labelBtn: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  labelText: { fontSize: 13, color: Colors.textSecondary },
  intensityBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'center',
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  intensityBadgeText: { fontSize: 13 },

  // Duration chips
  chipsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  chip: {
    flex: 1, height: 44, borderRadius: 14,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1.5, borderColor: Colors.cardBorder,
    justifyContent: 'center', alignItems: 'center',
  },
  chipActive: {
    backgroundColor: 'rgba(41, 143, 80, 0.15)',
    borderColor: Colors.primary,
  },
  chipText: { fontSize: 13, color: Colors.textSecondary },
  chipTextActive: { color: Colors.primary },

  // Manual input
  manualInputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderWidth: 1.5, borderColor: Colors.cardBorder,
    borderRadius: 16, paddingHorizontal: 16, height: 52,
  },
  manualInput: {
    flex: 1, color: '#FFF', fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  manualUnit: { color: Colors.textSecondary, fontSize: 13 },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 12,
  },
  continueBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  continueBtnText: { color: '#FFF', fontSize: 17 },
});
