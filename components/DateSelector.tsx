import React, { useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/Colors';

// Helper to get an array of recent and upcoming dates
const getDates = () => {
  const dates = [];
  const today = new Date();
  // Generate dates from 14 days ago to 7 days ahead
  for (let i = -14; i <= 7; i++) {
    const date = new Date();
    date.setDate(today.getDate() + i);
    dates.push(date);
  }
  return dates;
};

const DATES = getDates();

export default function DateSelector() {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<string>(today.toDateString());
  const flatListRef = useRef<FlatList>(null);

  // Auto-scroll to today initially
  useEffect(() => {
    const todayIndex = DATES.findIndex((d) => d.toDateString() === today.toDateString());
    if (todayIndex !== -1 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: todayIndex, animated: true, viewPosition: 0.5 });
      }, 500);
    }
  }, []);

  const renderItem = ({ item }: { item: Date }) => {
    const isToday = item.toDateString() === today.toDateString();
    const isSelected = item.toDateString() === selectedDate;
    
    // Format Day (Mon, Tue, etc.) and Date (1, 2, 3...)
    const dayStr = item.toLocaleDateString('en-US', { weekday: 'short' });
    const dateNum = item.getDate().toString();

    return (
      <TouchableOpacity 
        style={[
          styles.dateItemContainer,
          isSelected && styles.dateItemSelected
        ]}
        onPress={() => setSelectedDate(item.toDateString())}
        activeOpacity={0.7}
      >
        <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
          {dayStr}
        </Text>
        <View style={[
          styles.dateCircle, 
          isSelected && styles.dateCircleSelected,
          isToday && !isSelected && styles.dateCircleToday
        ]}>
          <Text style={[
            styles.dateText, 
            isSelected && styles.dateTextSelected,
            isToday && !isSelected && styles.dateTextToday
          ]}>
            {dateNum}
          </Text>
        </View>
        {isToday && (
           <View style={[styles.todayDot, isSelected && styles.todayDotSelected]} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={DATES}
        keyExtractor={(item) => item.toDateString()}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        getItemLayout={(_, index) => ({
          length: 64, // Approximate width of item + margin
          offset: 64 * index,
          index,
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 12, // Space between items
  },
  dateItemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 52,
    height: 80,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dateItemSelected: {
    backgroundColor: 'rgba(41, 143, 80, 0.1)',
    borderColor: 'rgba(41, 143, 80, 0.3)',
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  dayTextSelected: {
    color: Colors.primary,
  },
  dateCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateCircleSelected: {
    backgroundColor: Colors.primary,
  },
  dateCircleToday: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  dateTextSelected: {
    color: '#FFF',
  },
  dateTextToday: {
    color: '#FFF',
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textSecondary,
    marginTop: 6,
  },
  todayDotSelected: {
    backgroundColor: Colors.primary,
  }
});
