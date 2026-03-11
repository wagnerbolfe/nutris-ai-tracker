import { useUser } from '@clerk/expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  CheckmarkCircle01Icon,
  Dumbbell01Icon,
  GraduateFemaleIcon,
  GraduateMaleIcon,
  MenuSquareIcon,
  RulerIcon,
  WeightScaleIcon
} from 'hugeicons-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { saveUserProfile } from '../../lib/firestore';



const TOTAL_STEPS = 5;

// Types
type Gender = 'Male' | 'Female' | 'Other' | null;
type Goal = 'Gain Weight' | 'Lose Weight' | 'Maintain' | null;
type WorkoutDays = '2-3 days' | '3-4 days' | '5-6 days' | null;

export default function StepFormScreen() {
  const router = useRouter();
  const { user } = useUser();

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form Data
  const [gender, setGender] = useState<Gender>(null);
  const [goal, setGoal] = useState<Goal>(null);
  const [workoutDays, setWorkoutDays] = useState<WorkoutDays>(null);
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [heightFeet, setHeightFeet] = useState('');
  const [weightKg, setWeightKg] = useState('');

  const progressPercentage = (currentStep / TOTAL_STEPS) * 100;

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1);
    } else {
      submitForm();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const submitForm = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const birthdate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      
      // Navigate using query parameters on a string url to be completely safe in Expo Router
      const params = new URLSearchParams({
        gender: gender || '',
        goal: goal || '',
        workoutDays: workoutDays || '',
        birthdate,
        heightFeet,
        weightKg,
      }).toString();

      router.replace(`/(auth)/generating-plan?${params}` as any);

    } catch (error: any) {
      console.error('Failed to navigate to generating plan:', error);
      Alert.alert('Navigation Error', error?.message || 'Failed to move to the next screen.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Step Content Renders ---

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>What is your Gender?</Text>
      <Text style={styles.subtitle}>Help us tailor recommendations for you</Text>

      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[styles.optionCard, gender === 'Male' && styles.optionCardActive]}
          onPress={() => setGender('Male')}
        >
          <View style={[styles.iconWrapper, gender === 'Male' && styles.iconWrapperActive]}>
            <GraduateMaleIcon size={32} color={gender === 'Male' ? Colors.primary : Colors.textSecondary} variant="stroke" />
          </View>
          <Text style={[styles.optionTitle, gender === 'Male' && styles.optionTitleActive]}>Male</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionCard, gender === 'Female' && styles.optionCardActive]}
          onPress={() => setGender('Female')}
        >
          <View style={[styles.iconWrapper, gender === 'Female' && styles.iconWrapperActive]}>
            <GraduateFemaleIcon size={32} color={gender === 'Female' ? Colors.primary : Colors.textSecondary} variant="stroke" />
          </View>
          <Text style={[styles.optionTitle, gender === 'Female' && styles.optionTitleActive]}>Female</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>What&apos;s your primary goal?</Text>
      <Text style={styles.subtitle}>Select the core focus of your journey</Text>

      <View style={styles.optionsVertical}>
        {[
          { label: 'Gain Weight', Icon: WeightScaleIcon },
          { label: 'Lose Weight', Icon: WeightScaleIcon },
          { label: 'Maintain', Icon: MenuSquareIcon },
        ].map((item) => (
          <TouchableOpacity
            key={item.label}
            style={[styles.optionRow, goal === item.label && styles.optionRowActive]}
            onPress={() => setGoal(item.label as Goal)}
          >
            <View style={styles.optionRowLeft}>
              <View style={[styles.iconWrapperSmall, goal === item.label && styles.iconWrapperActive]}>
                <item.Icon size={28} color={goal === item.label ? Colors.primary : Colors.textSecondary} />
              </View>
              <Text style={[styles.optionTitleRow, goal === item.label && styles.optionTitleActive]}>{item.label}</Text>
            </View>
            {goal === item.label && (
              <CheckmarkCircle01Icon size={24} color={Colors.primary} variant="stroke" />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Workout Details</Text>
      <Text style={styles.subtitle}>How often do you plan to work out?</Text>

      <View style={styles.optionsVertical}>
        {['2-3 days', '3-4 days', '5-6 days'].map((level) => (
          <TouchableOpacity
            key={level}
            style={[styles.optionRow, workoutDays === level && styles.optionRowActive]}
            onPress={() => setWorkoutDays(level as WorkoutDays)}
          >
            <View style={styles.optionRowLeft}>
              <View style={[styles.iconWrapperSmall, workoutDays === level && styles.iconWrapperActive]}>
                <Dumbbell01Icon size={28} color={workoutDays === level ? Colors.primary : Colors.textSecondary} variant="stroke" />
              </View>
              <Text style={[styles.optionTitleRow, workoutDays === level && styles.optionTitleActive]}>{level}</Text>
            </View>
             {workoutDays === level && (
              <CheckmarkCircle01Icon size={24} color={Colors.primary} variant="stroke" />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>When were you born?</Text>
      <Text style={styles.subtitle}>This helps us calculate your metrics accurately</Text>

      <View style={styles.dateContainer}>
        <View style={styles.dateInputWrapper}>
          <Text style={styles.dateLabel}>Day</Text>
          <TextInput
            style={styles.dateInput}
            keyboardType="number-pad"
            maxLength={2}
            placeholder="DD"
            placeholderTextColor={Colors.placeholderText}
            value={day}
            onChangeText={setDay}
          />
        </View>
        <View style={styles.dateInputWrapper}>
          <Text style={styles.dateLabel}>Month</Text>
          <TextInput
            style={styles.dateInput}
            keyboardType="number-pad"
            maxLength={2}
            placeholder="MM"
            placeholderTextColor={Colors.placeholderText}
            value={month}
            onChangeText={setMonth}
          />
        </View>
        <View style={styles.dateInputWrapperYear}>
          <Text style={styles.dateLabel}>Year</Text>
          <TextInput
            style={styles.dateInput}
            keyboardType="number-pad"
            maxLength={4}
            placeholder="YYYY"
            placeholderTextColor={Colors.placeholderText}
            value={year}
            onChangeText={setYear}
          />
        </View>
      </View>
    </View>
  );

  const renderStep5 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Height & Weight</Text>
      <Text style={styles.subtitle}>Almost done! Enter your current metrics</Text>

      <View style={styles.metricsContainer}>
        <View style={styles.metricCard}>
          <View style={styles.metricIconHeader}>
            <RulerIcon size={24} color={Colors.primary} variant="stroke" />
            <Text style={styles.metricCardTitle}>Height</Text>
          </View>
          <View style={styles.metricInputContainer}>
            <TextInput
              style={styles.metricInput}
              keyboardType="decimal-pad"
              placeholder="0.0"
              placeholderTextColor={Colors.placeholderText}
              value={heightFeet}
              onChangeText={setHeightFeet}
            />
            <Text style={styles.metricUnit}>ft</Text>
          </View>
        </View>

        <View style={styles.metricCard}>
           <View style={styles.metricIconHeader}>
            <WeightScaleIcon size={24} color={Colors.primary} variant="stroke" />
            <Text style={styles.metricCardTitle}>Weight</Text>
          </View>
          <View style={styles.metricInputContainer}>
             <TextInput
              style={styles.metricInput}
              keyboardType="decimal-pad"
              placeholder="0.0"
              placeholderTextColor={Colors.placeholderText}
              value={weightKg}
              onChangeText={setWeightKg}
            />
             <Text style={styles.metricUnit}>kg</Text>
          </View>
        </View>
      </View>
    </View>
  );

  // --- Main Render ---

  // Determine if next is disabled
  let isNextDisabled = false;
  if (currentStep === 1 && !gender) isNextDisabled = true;
  if (currentStep === 2 && !goal) isNextDisabled = true;
  if (currentStep === 3 && !workoutDays) isNextDisabled = true;
  if (currentStep === 4 && (!day || !month || !year || day.length > 2 || month.length > 2 || year.length !== 4)) isNextDisabled = true;
  if (currentStep === 5 && (!heightFeet || !weightKg)) isNextDisabled = true;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={Colors.backgroundGradient}
        style={StyleSheet.absoluteFillObject}
      />
      
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          disabled={currentStep === 1}
        >
          {currentStep > 1 && <ArrowLeft01Icon size={24} color={Colors.text} variant="stroke" />}
        </TouchableOpacity>
        <Text style={styles.stepIndicator}>
          <Text style={styles.stepCurrent}>{currentStep}</Text>
          <Text style={styles.stepTotal}> / {TOTAL_STEPS}</Text>
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}

        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.primaryBtn, isNextDisabled && styles.primaryBtnDisabled]}
          onPress={handleNext}
          disabled={isNextDisabled || isLoading}
        >
          <LinearGradient
            colors={isNextDisabled ? [Colors.cardBorder, Colors.cardBorder] : [Colors.primary, Colors.primaryDark]}
            style={styles.primaryBtnGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.primaryBtnText}>
                  {currentStep === TOTAL_STEPS ? 'Complete Setup' : 'Continue'}
                </Text>
                {currentStep < TOTAL_STEPS && <ArrowRight01Icon size={20} color="#fff" />}
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIndicator: {
    fontSize: 16,
    fontWeight: '600',
  },
  stepCurrent: {
    color: Colors.text,
  },
  stepTotal: {
    color: Colors.textSecondary,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: Colors.cardBorder,
    marginHorizontal: 24,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  stepContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 40,
    lineHeight: 22,
  },
  
  // Options (Grid)
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  optionCard: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 0.9,
  },
  optionCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.inputFocusedBackground,
  },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconWrapperActive: {
    backgroundColor: 'rgba(41, 143, 80, 0.1)',
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  optionTitleActive: {
    color: Colors.text,
  },
  
  // Options (Vertical Rows)
  optionsVertical: {
    gap: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.cardBackground,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    borderRadius: 20,
    padding: 20,
  },
  optionRowActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.inputFocusedBackground,
  },
  optionRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconWrapperSmall: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTitleRow: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textSecondary,
  },

  // Date inputs
  dateContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInputWrapper: {
    flex: 1,
  },
  dateInputWrapperYear: {
    flex: 1.5,
  },
  dateLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.inputLabel,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  dateInput: {
    backgroundColor: Colors.inputBackground,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    borderRadius: 14,
    height: 56,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: '500',
    color: Colors.text,
    textAlign: 'center',
  },

  // Metrics
  metricsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    borderRadius: 20,
    padding: 20,
  },
  metricIconHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  metricCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  metricInputContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  metricInput: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text,
    minWidth: 60,
    borderBottomWidth: 2,
    borderBottomColor: Colors.cardBorder,
    paddingBottom: 4,
  },
  metricUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },

  // Footer Button
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    backgroundColor: 'transparent',
  },
  primaryBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryBtnDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryBtnGradient: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
