import { useUser } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Keyboard, KeyboardAvoidingView, Modal, Platform, StyleSheet, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { useDate } from '../contexts/DateContext';
import { DailyLog, getDailyLog, getUserProfile, saveUserProfile } from '../lib/firestore';
import { Text } from './ThemedText';

export default function WaterIntakeCard() {
  const { selectedDateString } = useDate();
  const { user } = useUser();
  const [log, setLog] = useState<DailyLog | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [editWater, setEditWater] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Images
  const FULL_GLASS = require('../assets/images/full_glass.png');
  const HALF_GLASS = require('../assets/images/half_glass.png');
  const EMPTY_GLASS = require('../assets/images/empty_glass.png');

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
        console.error('Error fetching data for WaterIntakeCard:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user?.id, selectedDateString]);

  // Safely parse AI targets (Liters)
  // Default to 8 glasses (2.0 Liters) if undefined
  const goalWater = profile?.dailyWater ? parseFloat(profile.dailyWater) : 2.0;

  // Actual consumed data (Liters)
  const consumedWater = log?.totalWater || 0;

  // Convert to glasses
  // Ensure the UI always displays exactly 9 glasses. The volume of each glass adapts to the user's goal.
  const totalGlassesGoal = 9;
  const glassVolume = goalWater / totalGlassesGoal;
  
  // How many completely full glasses
  const fullGlassesCount = Math.floor(consumedWater / glassVolume);
  // Remainder to see if we have a half glass
  const remainderWater = consumedWater - (fullGlassesCount * glassVolume);
  const hasHalfGlass = remainderWater >= (glassVolume / 2) && remainderWater < glassVolume;

  const glassesLeft = Math.max(0, totalGlassesGoal - (consumedWater / glassVolume));

  const progressPercent = goalWater > 0 ? Math.min(100, Math.round((consumedWater / goalWater) * 100)) : 0;

  // Modal Handlers
  const openEditModal = () => {
    setEditWater(goalWater.toString());
    setEditModalVisible(true);
  };

  const handleSaveGoals = async () => {
    if (!user?.id) return;
    setSavingProfile(true);
    try {
      const payload = {
        dailyWater: editWater,
      };
      
      // Merge updating goal fields
      await saveUserProfile(user.id, payload);
      
      // Optimistically update local UI profile
      setProfile((prev: any) => ({ ...prev, ...payload }));
      setEditModalVisible(false);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to update water goal.');
    } finally {
      setSavingProfile(false);
    }
  };

  const renderGlasses = () => {
    const glasses = [];
    let currentConsumed = fullGlassesCount;
    let addedHalf = false;

    // Render always exactly 9 glasses
    for (let i = 0; i < 9; i++) {
        let source;
        if (currentConsumed > 0) {
            source = FULL_GLASS;
            currentConsumed--;
        } else if (hasHalfGlass && !addedHalf) {
            source = HALF_GLASS;
            addedHalf = true;
        } else {
            source = EMPTY_GLASS;
        }

        glasses.push(
            <Image 
                key={`glass-${i}`} 
                source={source} 
                style={styles.glassImg} 
                resizeMode="contain" 
            />
        );
    }
    return glasses;
  };

  return (
    <View style={styles.cardContainer}>
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} weight="700">Water</Text>
          <Text style={styles.subtitle} weight="500">{consumedWater.toFixed(2)}L / {goalWater.toFixed(2)}L ({progressPercent}% of your daily goal)</Text>
        </View>
        
        <TouchableOpacity style={styles.editBtn} onPress={openEditModal} activeOpacity={0.7}>
          <Ionicons name="pencil" size={16} color={Colors.textSecondary} />
          <Text style={styles.editText} weight="600">Edit</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.glassesWrapper}>
        {loading ? (
          <View style={{ height: 80, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator color="#38BDF8" />
          </View>
        ) : (
          <View style={styles.glassesContainer}>
            {renderGlasses()}
          </View>
        )}
      </View>
      
      <View style={styles.footerRow}>
         <View style={[styles.macroIconBg, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
            <Ionicons name="water" size={16} color="#38BDF8" />
          </View>
          <Text style={styles.footerText} weight="600">{Math.ceil(glassesLeft)} glasses water left</Text>
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
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={{ width: '100%' }}
            >
              <View style={styles.modalContainer}>
                
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle} weight="700">Edit Water Goal</Text>
                  <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.closeBtn}>
                    <Ionicons name="close" size={24} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.modalSubtitle}>Update your daily water intake target.</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel} weight="600">Water Goal (Liters)</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="water-outline" size={18} color="#38BDF8" style={styles.inputIcon} />
                    <TextInput 
                      style={styles.modalInput} 
                      keyboardType="decimal-pad" 
                      value={editWater} 
                      onChangeText={setEditWater} 
                    />
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.modalSaveBtn, savingProfile && { opacity: 0.7 }]} 
                  onPress={handleSaveGoals} 
                  disabled={savingProfile}
                  activeOpacity={0.8}
                >
                  {savingProfile ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.modalSaveText} weight="700">Apply Changes</Text>
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    color: '#FFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  editText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  glassesWrapper: {
    minHeight: 60,
    marginBottom: 16,
    marginTop: 16,
  },
  glassesContainer: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 3,
  },
  glassImg: {
    width: 34,
    height: 34,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  macroIconBg: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  footerText: {
    fontSize: 14,
    color: '#FFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: '#1E1E2D',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    color: '#FFF',
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
  inputLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
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
    color: '#FFF',
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  modalSaveBtn: {
    backgroundColor: '#38BDF8',
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalSaveText: {
    color: '#FFF',
    fontSize: 16,
  }
});
