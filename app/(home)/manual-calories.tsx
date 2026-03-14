import { useUser } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../components/ThemedText';
import { Colors } from '../../constants/Colors';
import { useDate } from '../../contexts/DateContext';
import { useRefresh } from '../../contexts/RefreshContext';
import { logActivity } from '../../lib/firestore';

const QUICK_CALS = [100, 200, 300, 500];

export default function ManualCaloriesScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { selectedDateString } = useDate();
  const { triggerRefresh } = useRefresh();
  const inputRef = useRef<TextInput>(null);

  const [calories, setCalories] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const accentColor = '#F87171';
  const calVal = parseInt(calories) || 0;
  const isFilled = calVal > 0;

  // Flame intensity based on calorie value
  const flameColor = calVal === 0
    ? 'rgba(255,255,255,0.15)'
    : calVal < 200 ? '#4ADE80'
    : calVal < 400 ? '#FACC15'
    : '#F87171';

  const handleLog = async () => {
    if (!user?.id || calVal === 0) {
      Alert.alert('Enter Calories', 'Please enter a calorie value greater than 0.');
      return;
    }
    setLoading(true);
    try {
      // Log burned calories as positive so remaining = goal - burned
      await logActivity(user.id, selectedDateString, calVal, 0, 0, 0, 0, {
        type: 'manual',
        description: description.trim() || undefined,
      });
      triggerRefresh();
      router.dismiss(2);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to log calories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <LinearGradient colors={Colors.backgroundGradient} style={StyleSheet.absoluteFillObject} />
        <View style={styles.blob1} />
        <View style={styles.blob2} />

        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            {/* Back */}
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={22} color="#FFF" />
            </TouchableOpacity>

            {/* Title */}
            <View style={styles.titleRow}>
              <View style={[styles.titleIconBg, { backgroundColor: `${accentColor}20`, borderColor: `${accentColor}50` }]}>
                <Ionicons name="flame" size={26} color={accentColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bigTitle} weight="800">Manual Entry</Text>
                <Text style={styles.subtitle} weight="400">Enter the kcal you burned in your workout</Text>
              </View>
            </View>

            {/* Flame Visual */}
            <View style={styles.flameCenter}>
              <View style={[styles.flameOuter, { borderColor: `${flameColor}40`, shadowColor: flameColor }]}>
                <View style={[styles.flameInner, { backgroundColor: `${flameColor}18` }]}>
                  <Ionicons name="flame" size={56} color={flameColor} />
                </View>
              </View>
              {isFilled && (
                <Text style={[styles.calsBigText, { color: flameColor }]} weight="800">
                  {calVal} kcal
                </Text>
              )}
              {!isFilled && (
                <Text style={styles.calsPlaceholder} weight="400">Tap to enter calories</Text>
              )}
            </View>

            {/* Quick Select Chips */}
            <View style={styles.quickRow}>
              {QUICK_CALS.map((q) => (
                <TouchableOpacity
                  key={q}
                  style={[styles.quickChip, calories === q.toString() && styles.quickChipActive]}
                  onPress={() => { setCalories(q.toString()); Keyboard.dismiss(); }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="flame-outline" size={13} color={calories === q.toString() ? '#F87171' : Colors.textSecondary} />
                  <Text
                    style={[styles.quickChipText, calories === q.toString() && { color: '#F87171' }]}
                    weight={calories === q.toString() ? '700' : '400'}
                  >
                    {q}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Input */}
            <View style={styles.inputSection}>
              <TouchableOpacity style={styles.inputWrapper} onPress={() => inputRef.current?.focus()} activeOpacity={0.9}>
                <Ionicons name="flame" size={22} color="#F87171" />
                <TextInput
                  ref={inputRef}
                  style={styles.input}
                  placeholder="Enter calories burned..."
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="numeric"
                  value={calories}
                  onChangeText={setCalories}
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                />
                <Text style={styles.unit} weight="500">kcal</Text>
              </TouchableOpacity>
            </View>

            {/* Description */}
            <View style={styles.descSection}>
              <View style={styles.descHeader}>
                <Text style={styles.descLabel} weight="500">Activity description</Text>
                <Text style={styles.descOptional} weight="400">optional</Text>
              </View>
              <TextInput
                style={styles.descInput}
                placeholder="e.g. Morning run on the treadmill..."
                placeholderTextColor={Colors.textSecondary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                maxLength={200}
                returnKeyType="done"
                blurOnSubmit
              />
            </View>

            {/* Log Button */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.logBtn, !isFilled && styles.logBtnDisabled]}
                onPress={handleLog}
                disabled={loading || !isFilled}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="flame" size={20} color="#FFF" />
                    <Text style={styles.logBtnText} weight="700">Log Calories</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  safeArea: { flex: 1 },
  blob1: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: '#7C2020', opacity: 0.12, top: -80, right: -80,
  },
  blob2: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    backgroundColor: '#1E3A5F', opacity: 0.15, bottom: 180, left: -70,
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
    marginHorizontal: 20, marginTop: 24, marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 24,
  },
  bigTitle: { fontSize: 28, color: '#FFF', letterSpacing: -0.5, marginBottom: 6 },
  subtitle: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  titleIconBg: {
    width: 54, height: 54, borderRadius: 17,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5,
    marginTop: 4,
  },

  // Flame
  flameCenter: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingTop: 40,
    paddingBottom: 40,
    gap: 12,
  },
  flameOuter: {
    width: 130, height: 130, borderRadius: 65,
    borderWidth: 2,
    justifyContent: 'center', alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  flameInner: {
    width: 100, height: 100, borderRadius: 50,
    justifyContent: 'center', alignItems: 'center',
  },
  calsBigText: { fontSize: 38, letterSpacing: -1 },
  calsPlaceholder: { fontSize: 14, color: Colors.textSecondary },

  // Quick chips
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  quickChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1.5, borderColor: Colors.cardBorder,
    borderRadius: 20,
  },
  quickChipActive: {
    borderColor: '#F87171',
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
  },
  quickChipText: { fontSize: 13, color: Colors.textSecondary },

  // Input
  inputSection: { paddingHorizontal: 20, marginBottom: 16 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20, paddingHorizontal: 18, height: 60,
    gap: 12,
  },
  input: {
    flex: 1, color: '#FFF', fontSize: 18,
    fontFamily: 'Inter_500Medium',
  },
  unit: { color: Colors.textSecondary, fontSize: 14 },

  // Description
  descSection: { paddingHorizontal: 20, marginBottom: 24, marginTop: 16},
  descHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 10,
  },
  descLabel: { fontSize: 13, color: Colors.textSecondary },
  descOptional: {
    fontSize: 11, color: Colors.textSecondary,
    opacity: 0.55,
    marginLeft: 2,
    fontStyle: 'italic',
  },
  descInput: {
    backgroundColor: Colors.cardBackground,
    borderWidth: 1.5, borderColor: Colors.cardBorder,
    borderRadius: 16,
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14,
    color: '#FFF', fontSize: 14,
    fontFamily: 'Inter_400Regular',
    minHeight: 88,
    textAlignVertical: 'top',
  },

  // Footer
  footer: { paddingHorizontal: 20, paddingBottom: 8 },
  logBtn: {
    flexDirection: 'row', gap: 10,
    backgroundColor: '#F87171',
    height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#F87171',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  logBtnDisabled: { opacity: 0.45 },
  logBtnText: { color: '#FFF', fontSize: 17 },
});
