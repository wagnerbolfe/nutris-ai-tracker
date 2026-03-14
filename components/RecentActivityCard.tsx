import { useUser } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { useDate } from '../contexts/DateContext';
import { useFabModal } from '../contexts/FabModalContext';
import { useRefresh } from '../contexts/RefreshContext';
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
  manual: { icon: 'flame',             color: '#F87171', bg: 'rgba(248, 113, 113, 0.15)', label: 'Manual Entry' },
  run:    { icon: 'bicycle-outline',   color: '#4ADE80', bg: 'rgba(74, 222, 128, 0.15)',  label: 'Run' },
  weight: { icon: 'barbell-outline',   color: '#A78BFA', bg: 'rgba(167, 139, 250, 0.15)', label: 'Weight Lifting' },
  water:  { icon: 'water-outline',     color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.15)',  label: 'Water' },
  food:   { icon: 'fast-food-outline', color: '#4ADE80', bg: 'rgba(74, 222, 128, 0.15)',  label: 'Food' },
};
const DEFAULT_CONFIG = { icon: 'restaurant-outline' as IconName, color: Colors.primary, bg: 'rgba(41, 143, 80, 0.1)', label: 'Activity' };

const EXERCISE_TYPES = new Set(['run', 'weight', 'manual']);

// Parses "Title · Intensity · 30 min" produced by workout-result.tsx
function parseWorkoutDesc(desc?: string): { name: string; intensity: string; duration: string } {
  if (!desc) return { name: '', intensity: '', duration: '' };
  const parts = desc.split(' · ');
  if (parts.length === 3) return { name: parts[0], intensity: parts[1], duration: parts[2] };
  return { name: desc, intensity: '', duration: '' };
}

// ─── Exercise Card ────────────────────────────────────────────────────────────
function ExerciseCard({ entry }: { entry: ActivityEntry }) {
  const config = TYPE_CONFIG[entry.type!] ?? DEFAULT_CONFIG;
  const isManual = entry.type === 'manual';
  const parsed = isManual
    ? { name: entry.description || config.label, intensity: '', duration: '' }
    : parseWorkoutDesc(entry.description);

  return (
    <View style={[styles.exerciseCard, { borderColor: `${config.color}20` }]}>
      <View style={styles.exerciseBody}>
        {/* Big icon — left */}
        <View style={[styles.exerciseBigIcon, { backgroundColor: config.bg, borderColor: `${config.color}35` }]}>
          <Ionicons name={config.icon} size={32} color={config.color} />
        </View>

        {/* Details — right */}
        <View style={styles.exerciseDetails}>
          <View style={styles.exerciseNameRow}>
            <Text style={[styles.exerciseName, { color: config.color }]} weight="700" numberOfLines={1}>
              {parsed.name || config.label}
            </Text>
            <Text style={styles.exerciseTime} weight="400">{formatTime(entry.loggedAt)}</Text>
          </View>

          <View style={styles.exerciseCalRow}>
            <Ionicons name="flame" size={13} color="#F87171" />
            <Text style={styles.exerciseCals} weight="700">{entry.calories} kcal burned</Text>
          </View>

          {(parsed.intensity || parsed.duration) && (
            <View style={styles.exerciseMeta}>
              {parsed.intensity !== '' && (
                <View style={styles.metaChip}>
                  <Ionicons name="flash-outline" size={11} color="#FACC15" />
                  <Text style={[styles.metaChipText, { color: '#FACC15' }]} weight="600">{parsed.intensity}</Text>
                </View>
              )}
              {parsed.duration !== '' && (
                <View style={styles.metaChip}>
                  <Ionicons name="time-outline" size={11} color={Colors.textSecondary} />
                  <Text style={[styles.metaChipText, { color: Colors.textSecondary }]} weight="600">{parsed.duration}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

// ─── Compact Row (food / water / generic) ─────────────────────────────────────
function CompactRow({ entry }: { entry: ActivityEntry }) {
  const config = entry.type ? (TYPE_CONFIG[entry.type] ?? DEFAULT_CONFIG) : DEFAULT_CONFIG;

  const macros: { icon: IconName; color: string; label: string }[] = [];
  if (entry.calories > 0) macros.push({ icon: 'flame',         color: '#FF6B35', label: `${entry.calories} kcal` });
  if (entry.protein  > 0) macros.push({ icon: 'fish',          color: '#38BDF8', label: `${entry.protein}g protein` });
  if (entry.fat      > 0) macros.push({ icon: 'water',         color: '#FACC15', label: `${entry.fat}g fat` });
  if (entry.carbs    > 0) macros.push({ icon: 'leaf',          color: '#4ADE80', label: `${entry.carbs}g carbs` });
  if (entry.water    > 0) macros.push({ icon: 'water-outline', color: '#38BDF8', label: `${entry.water}L water` });

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

function EntryRow({ entry }: { entry: ActivityEntry }) {
  if (entry.type && EXERCISE_TYPES.has(entry.type)) return <ExerciseCard entry={entry} />;
  return <CompactRow entry={entry} />;
}

// ─── Main Card ────────────────────────────────────────────────────────────────
export default function RecentActivityCard() {
  const { selectedDateString } = useDate();
  const { user } = useUser();
  const { openFabModal } = useFabModal();
  const { refreshKey } = useRefresh();
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
  }, [user?.id, selectedDateString, refreshKey]);

  return (
    <View style={styles.cardContainer}>
      <View style={styles.headerRow}>
        <Text style={styles.title} weight="700">Recent Activity</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText} weight="700">{entries.length}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : entries.length === 0 ? (
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
            <Text style={[styles.emptyHintText, { color: Colors.primary }]} weight="600">
              Add your first entry for this day
            </Text>
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
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  title:     { fontSize: 18, color: '#FFF' },
  badge: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: { color: '#FFF', fontSize: 12 },
  centered:  { height: 80, justifyContent: 'center', alignItems: 'center' },

  // ── Empty state ──
  emptyState:      { alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8 },
  emptyIconCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(41, 143, 80, 0.1)',
    borderWidth: 1.5, borderColor: 'rgba(41, 143, 80, 0.3)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  emptyTitle:    { fontSize: 17, color: '#FFF', marginBottom: 8 },
  emptySubtitle: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  emptyHighlight:{ color: Colors.primary, fontSize: 13 },
  emptyHint: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  emptyHintText: { color: Colors.textSecondary, fontSize: 12 },

  // ── Entry list ──
  entryList: { gap: 8 },

  // ── Exercise card ──
  exerciseCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  exerciseTime: {
    fontSize: 11,
    color: Colors.textSecondary,
    alignSelf: 'flex-end',
  },
  exerciseBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  exerciseBigIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    flexShrink: 0,
  },
  exerciseDetails: { flex: 1, gap: 5 },
  exerciseNameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  exerciseName:    { fontSize: 15, flex: 1 },
  exerciseCalRow:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  exerciseCals:    { fontSize: 13, color: '#F87171' },
  exerciseMeta:    { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8,
  },
  metaChipText: { fontSize: 11 },

  // ── Compact row ──
  entryRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14, paddingHorizontal: 10, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  entryIconWrapper: {
    width: 30, height: 30, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, flexShrink: 0,
  },
  entryLabel:    { fontSize: 12, flexShrink: 1, maxWidth: 90 },
  entryMacroRow: { flexDirection: 'row', flexWrap: 'nowrap', gap: 4, flex: 1 },
  macroTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  macroTagText: { fontSize: 11 },
  entryTime:    { fontSize: 10, color: Colors.textSecondary, flexShrink: 0 },
});
