import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs, usePathname, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Alert, Modal, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { DateProvider } from '../../contexts/DateContext';
import { FabModalProvider, useFabModal } from '../../contexts/FabModalContext';
import { RefreshProvider } from '../../contexts/RefreshContext';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../components/ThemedText';

// ─── Action Option Card ──────────────────────────────────────────────────────
interface ActionOption {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  bg: string;
  onPress: () => void;
  premium?: boolean;
}

function ActionCard({ option }: { option: ActionOption }) {
  return (
    <TouchableOpacity
      style={styles.actionCard}
      onPress={option.onPress}
      activeOpacity={0.8}
    >
      {option.premium && (
        <View style={styles.premiumBadge}>
          <Ionicons name="star" size={9} color="#FACC15" />
          <Text style={styles.premiumText} weight="700">PRO</Text>
        </View>
      )}
      <View style={[styles.actionIconBg, { backgroundColor: option.bg }]}>
        <Ionicons name={option.icon} size={26} color={option.color} />
      </View>
      <Text style={styles.actionLabel} weight="600">{option.label}</Text>
    </TouchableOpacity>
  );
}

// ─── Custom Tab Bar ──────────────────────────────────────────────────────────
const MAIN_TAB_PATHS = ['/', '/analytics', '/profile'];

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const [showModal, setShowModal] = useState(false);
  const { registerOpen } = useFabModal();

  useEffect(() => {
    registerOpen(() => setShowModal(true));
  }, []);

  // Hide tab bar on sub-screens
  if (!MAIN_TAB_PATHS.includes(pathname)) return null;

  const actions: ActionOption[] = [
    {
      icon: 'barbell-outline',
      label: 'Log Exercise',
      color: '#A78BFA',
      bg: 'rgba(167, 139, 250, 0.15)',
      onPress: () => {
        setShowModal(false);
        router.push('/(home)/log-exercise');
      },
    },
    {
      icon: 'water-outline',
      label: 'Add Drink Water',
      color: '#38BDF8',
      bg: 'rgba(56, 189, 248, 0.15)',
      onPress: () => {
        setShowModal(false);
        router.push('/(home)/water-intake');
      },
    },
    {
      icon: 'fast-food-outline',
      label: 'Food Database',
      color: '#4ADE80',
      bg: 'rgba(74, 222, 128, 0.15)',
      onPress: () => {
        setShowModal(false);
        router.push('/(home)/add-activity');
      },
    },
    {
      icon: 'scan-outline',
      label: 'Scan Food',
      color: '#FACC15',
      bg: 'rgba(250, 204, 21, 0.15)',
      premium: true,
      onPress: () => {
        Alert.alert('Premium Feature', 'Scan Food is available for Pro users only. Upgrade to unlock!');
      },
    },
  ];

  return (
    <>
      {/* ─── Bottom Sheet Modal ─── */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom + 100, 120) }]}>
                {/* 2×2 Grid */}
                <View style={styles.optionsGrid}>
                  {actions.map((opt, i) => (
                    <ActionCard key={i} option={opt} />
                  ))}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ─── Tab Bar ─── */}
      <View style={[styles.tabBarContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.tabsWrapper}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            let iconName: keyof typeof Ionicons.glyphMap = 'help-outline';
            if (route.name === 'index') {
              iconName = isFocused ? 'home' : 'home-outline';
            } else if (route.name === 'analytics') {
              iconName = isFocused ? 'analytics' : 'analytics-outline';
            } else if (route.name === 'profile') {
              iconName = isFocused ? 'person' : 'person-outline';
            }

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                onPress={onPress}
                style={styles.tabItem}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={iconName}
                  size={24}
                  color={isFocused ? Colors.primary : Colors.textMuted}
                />
                {isFocused && <View style={styles.activeDot} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.fabButton}
          onPress={() => setShowModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color="#FFF" />
        </TouchableOpacity>
      </View>
    </>
  );
}

export default function HomeLayout() {
  return (
    <FabModalProvider>
      <RefreshProvider>
        <DateProvider>
          <Tabs
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{ headerShown: false }}
          >
            <Tabs.Screen name="index" options={{ title: 'Home' }} />
            <Tabs.Screen name="analytics" options={{ title: 'Analytics' }} />
            <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
          </Tabs>
        </DateProvider>
      </RefreshProvider>
    </FabModalProvider>
  );
}

const styles = StyleSheet.create({
  // ─── Tab Bar ───────────────────────────────────────────────────────────────
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  tabsWrapper: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#1E1E2D',
    borderRadius: 30,
    height: 60,
    alignItems: 'center',
    justifyContent: 'space-around',
    marginRight: 15,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  activeDot: {
    position: 'absolute',
    bottom: 8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  fabButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  // ─── Modal Sheet ───────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
  },
  sheetHandle: {},
  sheetTitle: {},
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  // ─── Action Card ───────────────────────────────────────────────────────────
  actionCard: {
    width: '47%',
    backgroundColor: '#1E1E2D',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    gap: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  actionIconBg: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: 13,
    color: '#FFF',
    textAlign: 'center',
  },
  premiumBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(250, 204, 21, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  premiumText: {
    fontSize: 9,
    color: '#FACC15',
  },
});

