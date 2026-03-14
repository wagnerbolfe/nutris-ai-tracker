import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Text } from '../../components/ThemedText';
import { Colors } from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useDate } from '../../contexts/DateContext';
import { useUser } from '@clerk/expo';
import { logActivity } from '../../lib/firestore';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AddActivityScreen() {
  const router = useRouter();
  const { selectedDate, selectedDateString } = useDate();
  const { user } = useUser();

  const [loading, setLoading] = useState(false);
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [carbs, setCarbs] = useState('');
  const [water, setWater] = useState('');

  const handleSave = async () => {
    if (!user?.id) return;
    
    // Parse to numbers or default to 0
    const calVal = parseInt(calories) || 0;
    const proVal = parseInt(protein) || 0;
    const fatVal = parseInt(fat) || 0;
    const carbVal = parseInt(carbs) || 0;
    const waterVal = parseFloat(water) || 0;

    if (calVal === 0 && proVal === 0 && fatVal === 0 && carbVal === 0 && waterVal === 0) {
      Alert.alert('Error', 'Please enter at least one value to log.');
      return;
    }

    setLoading(true);
    try {
      await logActivity(user.id, selectedDateString, calVal, proVal, fatVal, carbVal, waterVal);
      // Navigate cleanly back
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(home)');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to log activity. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const friendlyDate = selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={Colors.backgroundGradient} style={StyleSheet.absoluteFillObject} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} weight="700">Add Log</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.dateText} weight="600">{friendlyDate}</Text>
        <Text style={styles.subtitle}>Enter the nutritional profile of your meal or activity.</Text>

        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel} weight="600">Calories (kcal)</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="flame" size={20} color={Colors.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. 450"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="numeric"
                value={calories}
                onChangeText={setCalories}
              />
            </View>
          </View>

          <View style={styles.macroRow}>
            {/* Protein */}
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel} weight="600">Protein (g)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="fish" size={16} color="#38BDF8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="numeric"
                  value={protein}
                  onChangeText={setProtein}
                />
              </View>
            </View>

            {/* Fat */}
            <View style={[styles.inputGroup, { flex: 1, marginHorizontal: 4 }]}>
              <Text style={styles.inputLabel} weight="600">Fat (g)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="water" size={16} color="#FACC15" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="numeric"
                  value={fat}
                  onChangeText={setFat}
                />
              </View>
            </View>

            {/* Carbs */}
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel} weight="600">Carbs (g)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="leaf" size={16} color="#4ADE80" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="numeric"
                  value={carbs}
                  onChangeText={setCarbs}
                />
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel} weight="600">Water (Liters)</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="water-outline" size={20} color="#38BDF8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. 1.5"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="decimal-pad"
                value={water}
                onChangeText={setWater}
              />
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.saveBtn, loading && styles.saveBtnDisabled]} 
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.saveBtnText} weight="700">Save Log</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    color: '#FFF',
  },
  content: {
    paddingHorizontal: 24,
  },
  dateText: {
    color: Colors.primary,
    fontSize: 16,
    marginBottom: 4,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: 32,
  },
  formCard: {
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
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
    height: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Inter_500Medium', // Safe direct style inject
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 16,
  }
});
