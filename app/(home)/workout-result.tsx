import { useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "../../components/ThemedText";
import { Colors } from "../../constants/Colors";
import { useDate } from "../../contexts/DateContext";
import { useRefresh } from "../../contexts/RefreshContext";
import { getUserProfile, logActivity } from "../../lib/firestore";

// MET values (ACSM / Compendium of Physical Activities)
// Same reference used by Apple Fitness, Fitbit, Google Fit for non-HR estimates
const MET: Record<string, Record<string, number>> = {
  run: { Low: 6.0, Medium: 9.0, High: 12.0 },
  weight: { Low: 3.0, Medium: 5.0, High: 6.0 },
};

function getAge(birthdate: string): number {
  let date: Date;
  if (birthdate.includes("-")) {
    date = new Date(birthdate);
  } else {
    const [day, month, year] = birthdate.split("/");
    date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const m = today.getMonth() - date.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < date.getDate())) age--;
  return age;
}

// Formula: Active Calories = MET × weight(kg) × time(h)
// Adjusted for gender and age — matches Fitbit / Google Fit baseline estimate
function calculateCalories(
  type: string,
  intensity: string,
  durationMin: number,
  weightKg: number,
  age: number,
  gender: string,
): number {
  const met = MET[type]?.[intensity] ?? 6.0;
  let calories = met * weightKg * (durationMin / 60);
  if (gender.toLowerCase().startsWith("f")) calories *= 0.9;
  if (age > 60) calories *= 0.88;
  else if (age > 40) calories *= 0.94;
  return Math.round(calories);
}

export default function WorkoutResultScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { selectedDateString } = useDate();
  const { triggerRefresh } = useRefresh();

  const params = useLocalSearchParams<{
    type: string;
    title: string;
    intensity: string;
    duration: string;
  }>();
  const type = params.type ?? "run";
  const title = params.title ?? "Workout";
  const intensity = params.intensity ?? "Medium";
  const duration = parseInt(params.duration ?? "30");

  const [calories, setCalories] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState(false);

  useEffect(() => {
    async function calculate() {
      if (!user?.id) return;
      try {
        const profile = await getUserProfile(user.id);
        const weightKg = parseFloat(profile?.weightKg ?? "70");
        const age = profile?.birthdate ? getAge(profile.birthdate) : 30;
        const gender = profile?.gender ?? "male";
        setCalories(
          calculateCalories(type, intensity, duration, weightKg, age, gender),
        );
      } catch (e) {
        console.error(e);
        setCalories(
          Math.round((MET[type]?.Medium ?? 6.0) * 70 * (duration / 60)),
        );
      } finally {
        setLoading(false);
      }
    }
    calculate();
  }, [user?.id]);

  const handleLog = async () => {
    if (!user?.id || calories === null) return;
    setLogging(true);
    try {
      await logActivity(user.id, selectedDateString, calories, 0, 0, 0, 0, {
        type,
        description: `${title} · ${intensity} · ${duration} min`,
      });
      triggerRefresh();
      router.navigate('/(home)');
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to log workout. Please try again.");
    } finally {
      setLogging(false);
    }
  };

  const accentColor = type === "run" ? "#4ADE80" : "#A78BFA";
  const flameColor = !calories
    ? "#F87171"
    : calories < 200
      ? "#4ADE80"
      : calories < 400
        ? "#FACC15"
        : "#F87171";

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={Colors.backgroundGradient}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.centerContent}>
          {loading ? (
            <ActivityIndicator color={Colors.primary} size="large" />
          ) : (
            <>
              {/* Fire icon */}
              <View
                style={[
                  styles.flameCircle,
                  {
                    borderColor: `${flameColor}50`,
                    backgroundColor: `${flameColor}18`,
                  },
                ]}
              >
                <Ionicons name="flame" size={80} color={flameColor} />
              </View>

              <Text style={styles.burnedLabel} weight="500">
                Your Workout Burned
              </Text>

              <Text
                style={[styles.caloriesValue, { color: flameColor }]}
                weight="800"
              >
                {calories}
              </Text>
              <Text style={styles.calsUnit} weight="600">
                Cals
              </Text>

              {/* Summary chips */}
              <View style={styles.summaryRow}>
                <View
                  style={[
                    styles.chip,
                    {
                      borderColor: `${accentColor}40`,
                      backgroundColor: `${accentColor}12`,
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      type === "run" ? "bicycle-outline" : "barbell-outline"
                    }
                    size={13}
                    color={accentColor}
                  />
                  <Text
                    style={[styles.chipText, { color: accentColor }]}
                    weight="600"
                  >
                    {title}
                  </Text>
                </View>
                <View style={styles.chip}>
                  <Ionicons name="flash-outline" size={13} color="#FACC15" />
                  <Text
                    style={[styles.chipText, { color: "#FACC15" }]}
                    weight="600"
                  >
                    {intensity}
                  </Text>
                </View>
                <View style={styles.chip}>
                  <Ionicons
                    name="time-outline"
                    size={13}
                    color={Colors.textSecondary}
                  />
                  <Text
                    style={[styles.chipText, { color: Colors.textSecondary }]}
                    weight="600"
                  >
                    {duration} min
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.logBtn,
              (logging || loading) && styles.logBtnDisabled,
            ]}
            onPress={handleLog}
            disabled={logging || loading}
            activeOpacity={0.85}
          >
            {logging ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="flame" size={20} color="#FFF" />
                <Text style={styles.logBtnText} weight="700">
                  Log Workout
                </Text>
              </>
            )}
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
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#7C2020",
    opacity: 0.1,
    top: -80,
    right: -80,
  },
  blob2: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#1E3A5F",
    opacity: 0.15,
    bottom: 160,
    left: -70,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 24,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 14,
  },
  flameCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 8,
  },
  burnedLabel: {
    fontSize: 16,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  caloriesValue: { fontSize: 80, letterSpacing: -3, lineHeight: 88 },
  calsUnit: { fontSize: 20, color: Colors.textSecondary, marginTop: -8 },
  summaryRow: { flexDirection: "row", gap: 8, marginTop: 16 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 20,
  },
  chipText: { fontSize: 12 },
  footer: { paddingHorizontal: 20, paddingBottom: 8 },
  logBtn: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#F87171",
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#F87171",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  logBtnDisabled: { opacity: 0.45 },
  logBtnText: { color: "#FFF", fontSize: 17 },
});
