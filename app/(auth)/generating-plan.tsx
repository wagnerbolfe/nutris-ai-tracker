import { useUser } from '@clerk/expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Brain02Icon, CheckmarkCircle01Icon, Dumbbell01Icon, FlashIcon, Loading02Icon } from 'hugeicons-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { saveUserProfile } from '../../lib/firestore';
import { generateUserPlan } from '../../lib/gemini';

const LOADING_STEPS = [
  { text: 'Analyzing your profile...', icon: Brain02Icon },
  { text: 'Calculating your calorie needs...', icon: FlashIcon },
  { text: 'Balancing your macronutrients...', icon: Dumbbell01Icon },
  { text: 'Finalizing your personalized plan...', icon: CheckmarkCircle01Icon },
];

export default function GeneratingPlanScreen() {
  const router = useRouter();
  const { user } = useUser();
  const params = useLocalSearchParams();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Animations
  const progressAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  // Setup spinning animation for the active loading icon
  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [spinAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  useEffect(() => {
    // Progress bar animation
    const nextProgress = ((currentStepIndex + 1) / LOADING_STEPS.length) * 100;
    Animated.timing(progressAnim, {
      toValue: nextProgress,
      duration: 1500, // Make it take a bit to fill per step
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, [currentStepIndex, progressAnim]);

  useEffect(() => {
    let isMounted = true;
    let stepInterval: ReturnType<typeof setInterval>;

    // Fast-forward through the dummy steps (0 to length - 2)
    // The last step (length - 1) waits for the AI to actually finish
    stepInterval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < LOADING_STEPS.length - 2) return prev + 1;
        clearInterval(stepInterval);
        return prev;
      });
    }, 2000);

    const generateAndSave = async () => {
      try {
        if (!user?.id) throw new Error('User not found');

        const {
          gender,
          goal,
          workoutDays,
          birthdate,
          heightFeet,
          weightKg,
        } = params as Record<string, string>;

        // 1. Call Gemini AI
        const aiPlan = await generateUserPlan({
          gender,
          goal,
          workoutDays,
          birthdate,
          heightFeet,
          weightKg,
        });

        // 2. Prepare full payload
        const payload = {
          fullName: user.fullName || null,
          email: user.primaryEmailAddress?.emailAddress || null,
          gender: gender || '',
          goal: goal || '',
          workoutDays: workoutDays || '',
          birthdate: birthdate || '',
          heightFeet: heightFeet || '',
          weightKg: weightKg || '',
          hasCompletedOnboarding: true,
          ...aiPlan, // Merge AI metrics (dailyCalories, protein, carbs, fats, waterIntake, planSummary, fitnessTips)
        };

        // 3. Save to Firestore
        await saveUserProfile(user.id, payload);

        // 4. Update local storage
        await AsyncStorage.setItem('hasCompletedOnboarding', 'true');

        if (isMounted) {
          // Force to last step if API was faster than simulation
          clearInterval(stepInterval);
          setCurrentStepIndex(LOADING_STEPS.length - 1);
          Animated.timing(progressAnim, {
            toValue: 100,
            duration: 500,
            useNativeDriver: false,
          }).start();
          
          // Small delay before navigating to let user see "Finalizing..." checkmark
          setTimeout(() => {
            if (isMounted) router.replace('/(home)');
          }, 1500);
        }
      } catch (err) {
        console.error('Error in generating-plan:', err);
        if (isMounted) {
          clearInterval(stepInterval);
          setError('Failed to generate your plan. Please try again.');
        }
      }
    };

    generateAndSave();

    return () => {
      isMounted = false;
      clearInterval(stepInterval);
    };
  }, []);

  const CurrentIcon = LOADING_STEPS[currentStepIndex].icon;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={Colors.backgroundGradient}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.content}>
        <View style={styles.headerArea}>
          <Text style={styles.mainTitle}>Crafting Your AI Plan</Text>
          <Text style={styles.subtitle}>Our AI is calculating your optimal macros based on your unique metabolic profile.</Text>
        </View>

        <View style={styles.listContainer}>
          {LOADING_STEPS.map((step, index) => {
            const isCompleted = index < currentStepIndex || (index === LOADING_STEPS.length - 1 && currentStepIndex === LOADING_STEPS.length);
            const isActive = index === currentStepIndex && !isCompleted;
            const isPending = index > currentStepIndex;

            const StepIcon = step.icon;

            return (
              <View key={index} style={[styles.listItem, isPending && styles.listItemPending]}>
                <View style={[styles.iconBox, isCompleted && styles.iconBoxCompleted, isActive && styles.iconBoxActive]}>
                  {isCompleted ? (
                    <CheckmarkCircle01Icon size={24} color="#fff" variant="stroke" />
                  ) : isActive ? (
                    <Animated.View style={{ transform: [{ rotate: spin }] }}>
                       <Loading02Icon size={24} color={Colors.primary} variant="stroke" />
                    </Animated.View>
                  ) : (
                    <StepIcon size={24} color={Colors.textSecondary} variant="stroke" />
                  )}
                </View>
                <Text style={[
                  styles.listText, 
                  isCompleted && styles.listTextCompleted,
                  isActive && styles.listTextActive
                ]}>
                  {step.text}
                </Text>
              </View>
            );
          })}
        </View>
        
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </Animated.View>
        </View>
        <Text style={styles.workingText}>This might take a few seconds...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  listContainer: {
    width: '100%',
    gap: 20,
    marginBottom: 40,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  listItemPending: {
    opacity: 0.5,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconBoxActive: {
    backgroundColor: 'rgba(41, 143, 80, 0.15)',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  iconBoxCompleted: {
    backgroundColor: Colors.primary,
  },
  listText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  listTextActive: {
    color: Colors.text,
    fontWeight: '600',
  },
  listTextCompleted: {
    color: Colors.text,
    fontWeight: '500',
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.cardBorder,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  workingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  errorText: {
    color: Colors.errorText,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    backgroundColor: Colors.errorBackground,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
  }
});
