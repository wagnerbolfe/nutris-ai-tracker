import { useUser } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { useDate } from '../contexts/DateContext';
import { useFabModal } from '../contexts/FabModalContext';
import { ActivityEntry, getActivityEntries } from '../lib/firestore';
import { Text } from './ThemedText';

function formatTime(loggedAt: any): string {
  if (!loggedAt) return '';
  const date = loggedAt.toDate ? loggedAt.toDate() : new Date(loggedAt);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function hasValues(entry: ActivityEntry): boolean {
  return entry.calories > 0 || entry.protein > 0 || entry.fat > 0 || entry.carbs > 0 || entry.water > 0;
}

type IconName = keyof typeof Ionicons.glyphMap;

const TYPE_CONFIG: Record<string, { icon: IconName; color: string; bg: string; label: string }> = {
  manual:  { icon: 'flame',            color: '#F87171', bg: 'rgba(248, 113, 113, 0.15)', label: 'Manual Entry' },
  run:     { icon: 'bicycle-outline',  color: '#4ADE80', bg: 'rgba(74, 222, 128, 0.15)', label: 'Run' },
  weight:  { icon: 'barbell-outline',  color: '#A78BFA', bg: 'rgba(167, 139, 250, 0.15)', label: 'Weight Lifting' },
  water:   { icon: 'water-outline',    color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.15)', label: 'Water' },
  food:    { icon: 'fast-food-outline', color: '#4ADE80', bg: 'rgba(74, 222, 128, 0.15)', label: 'Food' },
};
const DEFAULT_CONFIG = { icon: 'restaurant-outline' as IconName, color: Colors.primary, bg: 'rgba(41, 143, 80, 0.1)', label: 'Activity' };

function EntryRow({ entry }: { entry: ActivityEntry }) {
  const config = entry.type ? (TYPE_CONFIG[entry.type] ?? DEFAULT_CONFIG) : DEFAULT_CONFIG;

  const macros = [];
  if (entry.calories > 0) macros.push({ icon: 'flame' as const, color: '#FF6B35', label: `${entry.calories} kcal` });
  if (entry.protein > 0) macros.push({ icon: 'fish' as const, color: '#38BDF8', label: `${entry.protein}g protein` });
  if (entry.fat > 0) macros.push({ icon: 'water' as const, color: '#FACC15', label: `${entry.fat}g fat` });
  if (entry.carbs > 0) macros.push({ icon: 'leaf' as const, color: '#4ADE80', label: `${entry.carbs}g carbs` });
  if (entry.water > 0) macros.push({ icon: 'water-outline' as const, color: '#38BDF8', label: `${entry.water}L water` });

  return (
    <View style={styles.entryRow}>
      <View style={[styles.entryIconWrapper, { backgroundColor: config.bg, borderColor: `${config.color}30` }]}>
        <Ionicons name={config.icon} size={16} color={config.color} />
      </View>
      <Text style={[styles.entryLabel, { color: config.color }]} weight="600" numberOfLines={1}>
        {entry.description || config.label}
      </Text>
      <View style={styles.entryMacroRow}>
        {macros.map((m, i) => (
          <View key={i} style={styles.macroTag}>
            <Ionicons name={m.icon} size={11} color={m.color} />
            <Text style={[styles.macroTagText, { color: m.color }]} weight="600">{m.label}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.entryTime} weight="400">{formatTime(entry.loggedAt)}</Text>
    </View>
  );
}

export default function RecentActivityCard() {
  const { selectedDateString } = useDate();
  const { user } = useUser();
  const { openFabModal } = useFabModal();
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEntries() {
      if (!user?.id) return;
      setLoading(true);
      try {
        const data = await getActivityEntries(user.id, selectedDateString);
        setEntries(data.filter(hasValues));
      } catch (e) {
        console.error('Error fetching activity entries:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchEntries();
  }, [user?.id, selectedDateString]);

  return (
    <View style={styles.cardContainer}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.title} weight="700">Recent Activity</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText} weight="700">{entries.length}</Text>
        </View>
      </View>

      {/* Body */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : entries.length === 0 ? (
        // Empty State
        <View style={styles.emptyState}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="nutrition-outline" size={36} color={Colors.primary} />
          </View>
          <Text style={styles.emptyTitle} weight="700">No Activity Yet</Text>
          <Text style={styles.emptySubtitle} weight="400">
            Tap the button below to log your meals, workouts or water intake for today.
          </Text>
          <TouchableOpacity style={styles.emptyHint} onPress={openFabModal} activeOpacity={0.8}>
            <Ionicons name="add-circle-outline" size={16} color={Colors.primary} />
            <Text style={[styles.emptyHintText, { color: Colors.primary }]} weight="600">Add your first entry for this day</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.entryList}>
          {entries.map((entry) => (
            <EntryRow key={entry.id} entry={entry} />
          ))}
        </View>
      )}
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
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    color: '#FFF',
  },
  badge: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
  },
  centered: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(41, 143, 80, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(41, 143, 80, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    color: '#FFF',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  emptyHighlight: {
    color: Colors.primary,
    fontSize: 13,
  },
  emptyHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  emptyHintText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  // Entry list
  entryList: {
    gap: 6,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  entryIconWrapper: {
    width: 30,
    height: 30,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    flexShrink: 0,
  },
  entryLabel: {
    fontSize: 12,
    flexShrink: 1,
    maxWidth: 90,
  },
  entryMacroRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 4,
    flex: 1,
  },
  macroTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  macroTagText: {
    fontSize: 11,
  },
  entryTime: {
    fontSize: 10,
    color: Colors.textSecondary,
    flexShrink: 0,
  },
});
