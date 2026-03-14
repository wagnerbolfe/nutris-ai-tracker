import { useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "../../components/ThemedText";
import { Colors } from "../../constants/Colors";
import { useDate } from "../../contexts/DateContext";
import { useRefresh } from "../../contexts/RefreshContext";
import { logActivity } from "../../lib/firestore";

const HALF_GLASS_ML = 250; // each tap = 250 ml (half glass)
const MAX_HALVES = 8; // max = 4 full glasses

const IMG_EMPTY = require("../../assets/images/empty_glass.png");
const IMG_HALF = require("../../assets/images/half_glass.png");
const IMG_FULL = require("../../assets/images/full_glass.png");

type GlassType = "empty" | "half" | "full";

function buildGlasses(count: number): GlassType[] {
  if (count === 0) return ["empty"];
  const glasses: GlassType[] = [];
  const full = Math.floor(count / 2);
  const half = count % 2 === 1;
  for (let i = 0; i < full; i++) glasses.push("full");
  if (half) glasses.push("half");
  return glasses;
}

function imgFor(type: GlassType) {
  if (type === "full") return IMG_FULL;
  if (type === "half") return IMG_HALF;
  return IMG_EMPTY;
}

export default function WaterIntakeScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { selectedDateString } = useDate();
  const { triggerRefresh } = useRefresh();

  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const totalMl = count * HALF_GLASS_ML;
  const glasses = buildGlasses(count);
  const imgSize = glasses.length <= 1 ? 200 : glasses.length === 2 ? 150 : 110;

  const handleLog = async () => {
    if (!user?.id || totalMl === 0) {
      Alert.alert("Add Water", "Please add at least half a glass of water.");
      return;
    }
    setLoading(true);
    try {
      await logActivity(
        user.id,
        selectedDateString,
        0,
        0,
        0,
        0,
        totalMl / 1000,
        {
          type: "water",
          description: `${totalMl} ml water`,
        },
      );
      triggerRefresh();
      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to log water. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={Colors.backgroundGradient}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      <SafeAreaView style={styles.safeArea}>
        {/* Back */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </TouchableOpacity>

        {/* Title */}
        <View style={styles.titleSection}>
          <View style={styles.titleIconBg}>
            <Ionicons name="water" size={26} color="#38BDF8" />
          </View>
          <Text style={styles.title} weight="800">
            Add Water Intake
          </Text>
          <Text style={styles.subtitle} weight="400">
            Track your daily hydration
          </Text>
        </View>

        {/* Glass display */}
        <View style={styles.glassArea}>
          <View style={styles.glassRow}>
            {glasses.map((type, i) => (
              <Image
                key={i}
                source={imgFor(type)}
                style={{ width: imgSize, height: imgSize }}
                resizeMode="contain"
              />
            ))}
          </View>
        </View>

        {/* Counter */}
        <View style={styles.counterRow}>
          <TouchableOpacity
            style={[
              styles.counterBtn,
              count === 0 && styles.counterBtnDisabled,
            ]}
            onPress={() => setCount((c) => Math.max(0, c - 1))}
            disabled={count === 0}
            activeOpacity={0.8}
          >
            <Ionicons
              name="remove"
              size={30}
              color={count === 0 ? Colors.textSecondary : "#38BDF8"}
            />
          </TouchableOpacity>

          <View style={styles.mlDisplay}>
            <Text style={styles.mlValue} weight="800">
              {totalMl}
            </Text>
            <Text style={styles.mlUnit} weight="500">
              ml
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.counterBtn,
              count === MAX_HALVES && styles.counterBtnDisabled,
            ]}
            onPress={() => setCount((c) => Math.min(MAX_HALVES, c + 1))}
            disabled={count === MAX_HALVES}
            activeOpacity={0.8}
          >
            <Ionicons
              name="add"
              size={30}
              color={count === MAX_HALVES ? Colors.textSecondary : "#38BDF8"}
            />
          </TouchableOpacity>
        </View>

        {count === MAX_HALVES && (
          <Text style={styles.maxNote} weight="400">
            Maximum 4 glasses reached
          </Text>
        )}

        {/* Log Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.logBtn,
              (loading || totalMl === 0) && styles.logBtnDisabled,
            ]}
            onPress={handleLog}
            disabled={loading || totalMl === 0}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="water" size={20} color="#FFF" />
                <Text style={styles.logBtnText} weight="700">
                  Log Water
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
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "#0E3A5F",
    opacity: 0.2,
    top: -60,
    right: -80,
  },
  blob2: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#0A2A4A",
    opacity: 0.25,
    bottom: 160,
    left: -60,
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
  titleSection: {
    alignItems: "center",
    paddingTop: 28,
    paddingBottom: 8,
    gap: 8,
  },
  titleIconBg: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    borderWidth: 1.5,
    borderColor: "rgba(56, 189, 248, 0.35)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  title: { fontSize: 28, color: "#FFF", letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: Colors.textSecondary },

  // Glass area
  glassArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  glassRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 12,
    flexWrap: "wrap",
  },

  // Counter
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 28,
    paddingBottom: 8,
  },
  counterBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    borderWidth: 1.5,
    borderColor: "rgba(56, 189, 248, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  counterBtnDisabled: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.1)",
  },
  mlDisplay: {
    alignItems: "center",
    minWidth: 100,
  },
  mlValue: { fontSize: 52, color: "#38BDF8", letterSpacing: -2 },
  mlUnit: { fontSize: 16, color: Colors.textSecondary, marginTop: -6 },
  maxNote: {
    textAlign: "center",
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },

  // Footer
  footer: { paddingHorizontal: 20, paddingBottom: 8, paddingTop: 64 },
  logBtn: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#38BDF8",
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#38BDF8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  logBtnDisabled: { opacity: 0.4 },
  logBtnText: { color: "#FFF", fontSize: 17 },
});
