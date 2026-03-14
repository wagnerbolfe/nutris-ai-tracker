import { useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Colors } from "../constants/Colors";
import { useDate } from "../contexts/DateContext";
import { useRefresh } from "../contexts/RefreshContext";
import {
  DailyLog,
  getDailyLog,
  getUserProfile,
  saveUserProfile,
} from "../lib/firestore";
import { SegmentedHalfCircleProgress30 } from "./HalfProgress";
import { Text } from "./ThemedText";

export default function CaloriesCard() {
  const { selectedDateString } = useDate();
  const { user } = useUser();
  const { refreshKey } = useRefresh();
  const [log, setLog] = useState<DailyLog | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [editCalories, setEditCalories] = useState("");
  const [editProtein, setEditProtein] = useState("");
  const [editFat, setEditFat] = useState("");
  const [editCarbs, setEditCarbs] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Fetch log and user AI stats when Date changes
  useEffect(() => {
    async function fetchData() {
      if (!user?.id) return;
      setLoading(true);
      try {
        const [dailyData, userProfile] = await Promise.all([
          getDailyLog(user.id, selectedDateString),
          getUserProfile(user.id),
        ]);
        setLog(dailyData);
        setProfile(userProfile);
      } catch (e) {
        console.error("Error fetching data for CaloriesCard:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user?.id, selectedDateString, refreshKey]);

  // Safely parse AI targets (defaults if AI hasn't generated)
  const goalCalories = profile?.dailyCalories
    ? parseInt(profile.dailyCalories)
    : 2400;
  const goalProtein = profile?.protein ? parseInt(profile.protein) : 150;
  const goalFat = profile?.fats ? parseInt(profile.fats) : 70;
  const goalCarbs = profile?.carbs ? parseInt(profile.carbs) : 250;

  // Actual consumed data
  const netLoggedCalories = log?.totalCalories || 0;
  const caloriesBurned = log?.caloriesBurned || 0;
  const consumedProtein = log?.totalProtein || 0;
  const consumedFat = log?.totalFat || 0;
  const consumedCarbs = log?.totalCarbs || 0;

  const remainingCalories = goalCalories - netLoggedCalories - caloriesBurned;

  // Progress goes from 0 (nothing consumed) to 1 (fully consumed)
  const progress =
    goalCalories > 0
      ? Math.min(1, (netLoggedCalories + caloriesBurned) / goalCalories)
      : 0;

  // Remaining macros
  const remainingProtein = Math.max(0, goalProtein - consumedProtein);
  const remainingFat = Math.max(0, goalFat - consumedFat);
  const remainingCarbs = Math.max(0, goalCarbs - consumedCarbs);

  // Modal Handlers
  const openEditModal = () => {
    setEditCalories(goalCalories.toString());
    setEditProtein(goalProtein.toString());
    setEditFat(goalFat.toString());
    setEditCarbs(goalCarbs.toString());
    setEditModalVisible(true);
  };

  const handleSaveGoals = async () => {
    if (!user?.id) return;
    setSavingProfile(true);
    try {
      const payload = {
        dailyCalories: editCalories,
        protein: editProtein,
        fats: editFat,
        carbs: editCarbs,
      };

      // Merge updating goal fields
      await saveUserProfile(user.id, payload);

      // Optimistically update local UI profile
      setProfile((prev: any) => ({ ...prev, ...payload }));
      setEditModalVisible(false);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to update nutrition goals.");
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <View style={styles.cardContainer}>
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} weight="700">
            Calories
          </Text>
          <Text style={styles.subtitle} weight="500">
            Remaining = Goal - Food - Exercise
          </Text>
        </View>

        <TouchableOpacity
          style={styles.editBtn}
          onPress={openEditModal}
          activeOpacity={0.7}
        >
          <Ionicons name="pencil" size={16} color={Colors.textSecondary} />
          <Text style={styles.editText} weight="600">
            Edit
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.progressContainer}>
        {loading ? (
          <View
            style={{
              height: 160,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : (
          <SegmentedHalfCircleProgress30
            progress={progress}
            size={250}
            strokeWidth={40}
            value={remainingCalories}
            label="Remaining"
            segments={20}
            gapAngle={16}
          />
        )}
      </View>

      <View style={styles.macrosContainer}>
        <View style={styles.macroItem}>
          <View
            style={[
              styles.macroIconBg,
              { backgroundColor: "rgba(56, 189, 248, 0.15)" },
            ]}
          >
            <Ionicons name="fish" size={18} color="#38BDF8" />
          </View>
          <View style={styles.macroTextContainer}>
            <Text style={styles.macroValue} weight="700">
              {remainingProtein}g
            </Text>
            <Text style={styles.macroLabel}>Protein left</Text>
          </View>
        </View>

        <View style={styles.macroItem}>
          <View
            style={[
              styles.macroIconBg,
              { backgroundColor: "rgba(250, 204, 21, 0.15)" },
            ]}
          >
            <Ionicons name="water" size={18} color="#FACC15" />
          </View>
          <View style={styles.macroTextContainer}>
            <Text style={styles.macroValue} weight="700">
              {remainingFat}g
            </Text>
            <Text style={styles.macroLabel}>Fat left</Text>
          </View>
        </View>

        <View style={styles.macroItem}>
          <View
            style={[
              styles.macroIconBg,
              { backgroundColor: "rgba(74, 222, 128, 0.15)" },
            ]}
          >
            <Ionicons name="leaf" size={18} color="#4ADE80" />
          </View>
          <View style={styles.macroTextContainer}>
            <Text style={styles.macroValue} weight="700">
              {remainingCarbs}g
            </Text>
            <Text style={styles.macroLabel}>Carbs left</Text>
          </View>
        </View>
      </View>

      {/* Edit Goals Modal */}
      <Modal
        visible={isEditModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={{ width: "100%" }}
            >
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle} weight="700">
                    Edit Targets
                  </Text>
                  <TouchableOpacity
                    onPress={() => setEditModalVisible(false)}
                    style={styles.closeBtn}
                  >
                    <Ionicons
                      name="close"
                      size={24}
                      color={Colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.modalSubtitle}>
                  Update your primary AI-generated nutritional bases manually.
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel} weight="600">
                    Total Calories
                  </Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="flame"
                      size={18}
                      color={Colors.primary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.modalInput}
                      keyboardType="numeric"
                      value={editCalories}
                      onChangeText={setEditCalories}
                    />
                  </View>
                </View>

                {/* Macro Edit Row */}
                <View style={styles.macroEditRow}>
                  <View
                    style={[styles.inputGroup, { flex: 1, marginRight: 6 }]}
                  >
                    <Text style={styles.inputLabel} weight="600">
                      Protein (g)
                    </Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons
                        name="fish"
                        size={16}
                        color="#38BDF8"
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.modalInput}
                        keyboardType="numeric"
                        value={editProtein}
                        onChangeText={setEditProtein}
                      />
                    </View>
                  </View>

                  <View
                    style={[
                      styles.inputGroup,
                      { flex: 1, marginHorizontal: 3 },
                    ]}
                  >
                    <Text style={styles.inputLabel} weight="600">
                      Fat (g)
                    </Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons
                        name="water"
                        size={16}
                        color="#FACC15"
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.modalInput}
                        keyboardType="numeric"
                        value={editFat}
                        onChangeText={setEditFat}
                      />
                    </View>
                  </View>

                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 6 }]}>
                    <Text style={styles.inputLabel} weight="600">
                      Carbs (g)
                    </Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons
                        name="leaf"
                        size={16}
                        color="#4ADE80"
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.modalInput}
                        keyboardType="numeric"
                        value={editCarbs}
                        onChangeText={setEditCarbs}
                      />
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.modalSaveBtn,
                    savingProfile && { opacity: 0.7 },
                  ]}
                  onPress={handleSaveGoals}
                  disabled={savingProfile}
                  activeOpacity={0.8}
                >
                  {savingProfile ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.modalSaveText} weight="700">
                      Apply Changes
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: Colors.cardBackground,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    color: "#FFF",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  editText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  progressContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 24,
  },
  macrosContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    gap: 12,
  },
  macroItem: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "rgba(41, 143, 80, 0.1)",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(41, 143, 80, 0.2)",
    gap: 8,
  },
  macroTextContainer: {
    alignItems: "center",
  },
  macroIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  macroValue: {
    fontSize: 13,
    color: "#FFF",
    marginBottom: 2,
  },
  macroLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
    padding: 16,
  },
  modalContainer: {
    backgroundColor: "#1E1E2D",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    color: "#FFF",
  },
  closeBtn: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  macroEditRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  inputLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 50,
  },
  inputIcon: {
    marginRight: 8,
  },
  modalInput: {
    flex: 1,
    color: "#FFF",
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  modalSaveBtn: {
    backgroundColor: Colors.primary,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalSaveText: {
    color: "#FFF",
    fontSize: 16,
  },
});
