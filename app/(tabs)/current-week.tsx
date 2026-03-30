import { BottomNav, BottomTab } from '@/components/BottomNav';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// ---------------------------------------------------------------------
// 1. Color Palette (from the original Tailwind config)
// ---------------------------------------------------------------------
const Colors = {
  primary: '#004f59',
  onPrimary: '#ffffff',
  primaryContainer: '#006975',
  onPrimaryContainer: '#6beaff',
  primaryFixed: '#9cf0ff',
  primaryFixedDim: '#00daf3',
  secondary: '#4c56af',
  onSecondary: '#ffffff',
  secondaryContainer: '#959efd',
  onSecondaryContainer: '#27308a',
  secondaryFixed: '#e0e0ff',
  secondaryFixedDim: '#bdc2ff',
  tertiary: '#00531e',
  onTertiary: '#ffffff',
  tertiaryContainer: '#006e2a',
  onTertiaryContainer: '#54f67a',
  tertiaryFixed: '#69ff87',
  tertiaryFixedDim: '#3ce36a',
  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',
  background: '#f7f9fc',
  onBackground: '#191c1e',
  surface: '#f7f9fc',
  onSurface: '#191c1e',
  surfaceVariant: '#e0e3e6',
  onSurfaceVariant: '#424654',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f2f4f7',
  surfaceContainer: '#eceef1',
  surfaceContainerHigh: '#e6e8eb',
  surfaceContainerHighest: '#e0e3e6',
  inverseSurface: '#2d3133',
  inverseOnSurface: '#eff1f4',
  inversePrimary: '#00daf3',
  outline: '#737785',
  outlineVariant: '#c3c6d6',
  surfaceTint: '#006875',
};

// ---------------------------------------------------------------------
// 2. Typography Helpers (using system fonts)
// ---------------------------------------------------------------------
const useTypography = () => {
  const fontsLoaded = true; // System fonts are always available

  const headline = { fontWeight: '800' as const };
  const body = { fontWeight: '400' as const };
  const label = { fontWeight: '600' as const };

  return { fontsLoaded, headline, body, label };
};

// ---------------------------------------------------------------------
// 3. Data Models
// ---------------------------------------------------------------------
type DayStatus = 'active' | 'inactive';

type DayEntry = {
  date: string;
  hours: number;
  note?: string;
};

type WeekData = {
  id: string;
  dateRange: string;
  totalHours: string;
  activeDays: number;
  totalDays: number;
  goalPercentage: number;
  days: DayStatus[]; // day dots
  dayEntries?: DayEntry[];
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  customLabel?: string; // e.g., "Vacation"
  customLabelColor?: string;
  barColor?: string;
};

const weeksData: WeekData[] = []; // Eliminar registros placeholder, iniciar vacío y crear desde UI.

// ---------------------------------------------------------------------
// 4. Components
// ---------------------------------------------------------------------

// ---- Week Card ----
type WeekCardProps = {
  data: WeekData;
  onEdit: (week: WeekData) => void;
};

const WeekCard = ({ data, onEdit }: WeekCardProps) => {
  const router = useRouter();
  const { headline, body, label } = useTypography();

  const handlePress = () => {
    router.push({
      pathname: '/week-details',
      params: { weekId: data.id },
    });
  };

  return (
    <View style={styles.weekCard}>
      <TouchableOpacity style={styles.weekCardTouchable} onPress={handlePress} activeOpacity={0.85}>
        {data.isActive && (
          <View style={styles.activeBadge}>
            <Text style={[styles.activeBadgeText, label]}>Active</Text>
          </View>
        )}
        <View>
          <Text style={[styles.dateRangeText, body]}>{data.dateRange}</Text>
          <Text style={[styles.totalHoursText, headline]}>{data.totalHours}</Text>
        </View>
        <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressLabel, body]}>
            {data.activeDays}/{data.totalDays} days with activity
          </Text>
          {data.customLabel ? (
            <Text style={[styles.customLabel, { color: data.customLabelColor }]}>
              {data.customLabel}
            </Text>
          ) : (
            <Text style={[styles.goalText, body]}>{data.goalPercentage}% of goal</Text>
          )}
        </View>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(data.goalPercentage, 100)}%`,
                backgroundColor: data.barColor,
              },
            ]}
          />
        </View>
      </View>
      <View style={styles.dayIndicators}>
        <View style={styles.dayRow}>
          {data.days.map((status, idx) => {
            const letters = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
            const letter = letters[idx] ?? '-';
            const isActive = status === 'active';
            return (
              <View
                key={idx}
                style={[
                  styles.dayCircle,
                  isActive
                    ? { backgroundColor: Colors.primaryFixed }
                    : { backgroundColor: Colors.surfaceContainerHigh },
                ]}
              >
                <Text
                  style={[
                    styles.dayLetter,
                    isActive ? { color: Colors.primary } : { color: Colors.outline },
                    label,
                  ]}
                >
                  {letter}
                </Text>
              </View>
            );
          })}
        </View>
        <MaterialIcons name="arrow-forward" size={20} color={Colors.outlineVariant} />
      </View>
    </TouchableOpacity>
    <TouchableOpacity style={styles.editWeekButton} onPress={() => onEdit(data)}>
      <MaterialIcons name="edit" size={16} color={Colors.primary} />
      <Text style={[styles.editWeekText, body]}>Edit</Text>
    </TouchableOpacity>
  </View>
  );
};

const formatDateLabel = (date: Date) => {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatHoursLabel = (totalHours: number) => {
  const h = Math.floor(totalHours);
  const m = Math.round((totalHours % 1) * 60);
  return `${h}h ${m.toString().padStart(2, '0')}m`;
};

const addDays = (date: Date, days: number) => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
};

const isValidIsoDate = (value: string) => {
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
};

// ---------------------------------------------------------------------
// 5. Main Screen
// ---------------------------------------------------------------------
export default function CurrentWeek() {
  const router = useRouter();
  const { fontsLoaded, headline, body } = useTypography();
  const insets = useSafeAreaInsets();

  const [activeAppTab, setActiveAppTab] = useState<BottomTab>('weekly');
  const [weeks, setWeeks] = useState<WeekData[]>(weeksData);
  const [showWeekModal, setShowWeekModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedWeekId, setSelectedWeekId] = useState<string | null>(null);
  const [weekStart, setWeekStart] = useState('');
  const [weekDays, setWeekDays] = useState(5);
  const [dayHours, setDayHours] = useState<number[]>(Array(5).fill(0));
  const [showDatePicker, setShowDatePicker] = useState(false);

  const routeMap: Record<BottomTab, string> = {
    today: '/today',
    weekly: '/current-week',
    monthly: '/monthly-insights',
    'week-details': '/week-details',
    stats: '/today',
    settings: '/today',
  };

  const handleNavPress = (tab: BottomTab) => {
    setActiveAppTab(tab);
    const route = routeMap[tab];
    if (route) router.push(route as any);
  };

  const today = new Date();
  const minStartDate = addDays(today, -6);

  const adjustWeekStart = (offsetDays: number) => {
    const current = isValidIsoDate(weekStart) ? new Date(`${weekStart}T00:00:00`) : today;
    const adjusted = addDays(current, offsetDays);
    if (adjusted > today) return;
    if (adjusted < minStartDate) return;
    setWeekStart(adjusted.toISOString().slice(0, 10));
  };

  const setWeekStartToToday = () => {
    setWeekStart(today.toISOString().slice(0, 10));
  };

  const handleEditWeek = (week: WeekData) => {
    setModalMode('edit');
    setSelectedWeekId(week.id);
    setWeekStart(week.startDate ?? '');
    setWeekDays(week.totalDays);
    setDayHours(week.dayEntries?.map((entry) => entry.hours) ?? Array(week.totalDays).fill(0));
    setShowWeekModal(true);
  };

  const handleDayCountChange = (value: number) => {
    const newCount = Math.min(7, Math.max(1, value));
    setWeekDays(newCount);
    setDayHours((prev) => {
      const next = [...prev];
      while (next.length < newCount) next.push(0);
      next.length = newCount;
      return next;
    });
  };

  const resetWeekForm = () => {
    setWeekStart('');
    setWeekDays(5);
    setDayHours(Array(5).fill(0));
    setSelectedWeekId(null);
    setModalMode('create');
  };

  const handleSaveWeek = async () => {
    if (!isValidIsoDate(weekStart)) {
      Alert.alert('Invalid date', 'Please enter start date in YYYY-MM-DD format.');
      return;
    }

    const start = new Date(`${weekStart}T00:00:00`);
    if (start > today || start < minStartDate) {
      Alert.alert('Date out of range', 'Start date must be between 6 days ago and today.');
      return;
    }

    if (weekDays < 1 || weekDays > 7) {
      Alert.alert('Invalid week length', 'Weeks must contain 1 to 7 days.');
      return;
    }

    const dayEntries: DayEntry[] = [];
    let total = 0;
    for (let i = 0; i < weekDays; i++) {
      const dayDate = addDays(start, i);
      const hours = Number(dayHours[i] ?? 0);
      dayEntries.push({ date: dayDate.toISOString().slice(0, 10), hours });
      total += hours > 0 ? hours : 0;
    }

    const activeDays = dayEntries.filter((d) => d.hours > 0).length;
    const end = addDays(start, weekDays - 1);

    const newWeek: WeekData = {
      id: selectedWeekId || `${Date.now()}`,
      dateRange: `${formatDateLabel(start)} - ${formatDateLabel(end)}`,
      totalHours: formatHoursLabel(total),
      activeDays,
      totalDays: weekDays,
      goalPercentage: weekDays > 0 ? Math.round((activeDays / weekDays) * 100) : 0,
      days: dayEntries.map((entry) => (entry.hours > 0 ? 'active' : 'inactive')),
      dayEntries,
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      barColor: Colors.secondaryContainer,
    };

    if (modalMode === 'edit' && selectedWeekId) {
      setWeeks((prev) => prev.map((w) => (w.id === selectedWeekId ? newWeek : w)));
      Alert.alert('Week updated', 'Week changes have been saved.');
    } else {
      setWeeks((prev) => [newWeek, ...prev]);
      Alert.alert('Week created', 'New week created successfully.');
    }

    setShowWeekModal(false);
    resetWeekForm();
  };

  const STORAGE_KEY = '@hourly/weeks';

  useEffect(() => {
    const loadWeeks = async () => {
      try {
        const json = await AsyncStorage.getItem(STORAGE_KEY);
        if (json) {
          const savedWeeks: WeekData[] = JSON.parse(json);
          setWeeks(savedWeeks);
        }
      } catch (error) {
        console.warn('Unable to load weeks from storage', error);
      }
    };
    loadWeeks();
  }, []);

  useEffect(() => {
    const saveWeeks = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(weeks));
      } catch (error) {
        console.warn('Unable to save weeks to storage', error);
      }
    };

    saveWeeks();
  }, [weeks]);

  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const monthHours = weeks.reduce((sum, week) => {
    return (
      sum +
      (week.dayEntries
        ? week.dayEntries.reduce((dSum, entry) => {
            const entryDate = new Date(entry.date);
            if (entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear) {
              return dSum + entry.hours;
            }
            return dSum;
          }, 0)
        : 0)
    );
  }, 0);

  const monthDaysWorked = weeks.reduce((sum, week) => {
    return (
      sum +
      (week.dayEntries
        ? week.dayEntries.reduce((dSum, entry) => {
            const entryDate = new Date(entry.date);
            if (entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear && entry.hours > 0) {
              return dSum + 1;
            }
            return dSum;
          }, 0)
        : 0)
    );
  }, 0);

  if (!fontsLoaded) {
    return null; // Or a splash screen
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <View style={[styles.topBar, { paddingTop: insets.top || 16 }]}> 
        <View style={styles.profileSection}>
          <Text style={[styles.logoText, headline]}>Weekly</Text>
        </View>
        <TouchableOpacity onPress={() => alert('Settings')}>
          <MaterialIcons name="settings" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>
      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.hero}>
          <Text style={[styles.heroTitle, headline]}>Weeks Overview</Text>
          <Text style={[styles.heroSubtitle, body]}>
            Review your journey. Fluid architecting of your most valuable resource:{' '}
            <Text style={styles.highlight}>time</Text>.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.outlineButton, { backgroundColor: Colors.surfaceContainerHigh }]}
            onPress={() => {
              setModalMode('create');
              setShowWeekModal(true);
            }}
          >
            <MaterialIcons name="add" size={24} color={Colors.primary} />
            <Text style={[styles.outlineButtonText, headline]}>Add Week</Text>
          </TouchableOpacity>
        </View>

        <Modal visible={showWeekModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <ScrollView
                style={styles.modalCardScroll}
                contentContainerStyle={{ paddingBottom: 16 }}
                showsVerticalScrollIndicator={false}
              >
                <Text style={[styles.modalTitle, headline]}>
                  {modalMode === 'edit' ? 'Edit Week' : 'Create New Week'}
                </Text>
                <Text style={styles.modalLabel}>Start date *</Text>
                <TouchableOpacity
                  style={[styles.modalInput, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={{ color: weekStart ? Colors.onSurface : Colors.onSurfaceVariant }}>
                    {weekStart || 'Select start date'}
                  </Text>
                  <Text style={{ color: Colors.onSurfaceVariant }}>📅</Text>
                </TouchableOpacity>

                {showDatePicker && Platform.OS !== 'web' && (
                  <DateTimePicker
                    value={isValidIsoDate(weekStart) ? new Date(`${weekStart}T00:00:00`) : today}
                    mode="date"
                    display="default"
                    maximumDate={today}
                    minimumDate={minStartDate}
                    onChange={(_, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        const iso = selectedDate.toISOString().slice(0, 10);
                        setWeekStart(iso);
                      }
                    }}
                  />
                )}

                <Text style={styles.modalLabel}>Days in week (1-7)</Text>
                <View style={styles.rowInput}>
                <TouchableOpacity
                  style={styles.smallButton}
                  onPress={() => handleDayCountChange(weekDays - 1)}
                >
                  <Text style={styles.smallButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={[styles.modalValue, body]}>{weekDays}</Text>
                <TouchableOpacity
                  style={styles.smallButton}
                  onPress={() => handleDayCountChange(weekDays + 1)}
                >
                  <Text style={styles.smallButtonText}>+</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.modalLabel}>Hours per day</Text>
              {Array.from({ length: weekDays }).map((_, index) => {
                let dayDateLabel = '';
                if (isValidIsoDate(weekStart)) {
                  dayDateLabel = formatDateLabel(addDays(new Date(`${weekStart}T00:00:00`), index));
                }
                return (
                  <View key={index} style={styles.dayEntryRow}>
                    <Text style={styles.dayEntryLabel}>Day {index + 1}{dayDateLabel ? ` (${dayDateLabel})` : ''}</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="0"
                      value={dayHours[index]?.toString() ?? '0'}
                      keyboardType="decimal-pad"
                      onChangeText={(text) => {
                        const parsed = Number(text.replace(',', '.'));
                        setDayHours((prev) => {
                          const next = [...prev];
                          next[index] = Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
                          return next;
                        });
                      }}
                    />
                  </View>
                );
              })}

              </ScrollView>
              <View style={styles.modalActions}
                accessible
                accessibilityRole="button"
              >
                <TouchableOpacity
                  style={[styles.outlineButton, { flex: 1, marginRight: 8 }]}
                  onPress={() => {
                    setShowWeekModal(false);
                    resetWeekForm();
                  }}
                >
                  <Text style={[styles.outlineButtonText, body]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.gradientButton, { flex: 1, marginLeft: 8 }]}
                  onPress={handleSaveWeek}
                >
                  <Text style={[styles.buttonText, headline]}>{modalMode === 'edit' ? 'Update' : 'Create'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Weeks Cards */}
        {weeks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, body]}>No weeks yet. Create one to begin tracking your hours.</Text>
          </View>
        ) : (
          weeks.map((week) => <WeekCard key={week.id} data={week} onEdit={handleEditWeek} />)
        )}

        {/* Monthly summary */}
        <View style={styles.monthlySummary}>
          <Text style={[styles.monthlySummaryTitle, body]}>Current month totals</Text>
          <Text style={[styles.monthlySummaryValue, headline]}>{formatHoursLabel(monthHours)}</Text>
          <Text style={[styles.monthlySummarySub, body]}>{monthDaysWorked} days worked</Text>
        </View>
      </ScrollView>
      <BottomNav activeTab={activeAppTab} onTabPress={handleNavPress} />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------
// 6. Styles
// ---------------------------------------------------------------------
const { width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  // Top Bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: Colors.background,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  logoText: {
    fontSize: 24,
    color: Colors.primary,
  },
  // Hero
  hero: {
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 32,
    color: Colors.onBackground,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: Colors.onSurfaceVariant,
    lineHeight: 24,
  },
  highlight: {
    color: Colors.primary,
  },
  // Action Row
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  gradientButton: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    minHeight: 48,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  buttonText: {
    fontSize: 16,
    color: Colors.onPrimary,
  },
  outlineButtonText: {
    fontSize: 16,
    color: Colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCardScroll: {
    flexGrow: 1,
    width: '100%',
  },
  modalCard: {
    width: '92%',
    maxHeight: '88%',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 12,
    color: Colors.onBackground,
  },
  modalLabel: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 8,
    marginBottom: 4,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.surfaceContainerHigh,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  rowInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  smallButton: {
    minWidth: 36,
    minHeight: 36,
    borderRadius: 8,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallButtonText: {
    fontSize: 20,
    color: Colors.primary,
  },
  modalValue: {
    fontSize: 16,
    color: Colors.onBackground,
    width: 40,
    textAlign: 'center',
  },
  dayEntryRow: {
    marginBottom: 6,
  },
  dayEntryLabel: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginBottom: 3,
  },
  datePickerInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  emptyState: {
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: Colors.surfaceContainerLow,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.outlineVariant,
    textAlign: 'center',
  },
  monthlySummary: {
    marginTop: 12,
    borderRadius: 16,
    backgroundColor: Colors.surfaceContainerLow,
    padding: 16,
    alignItems: 'center',
  },
  monthlySummaryTitle: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginBottom: 4,
  },
  monthlySummaryValue: {
    fontSize: 24,
    color: Colors.primary,
    fontWeight: '800',
    marginBottom: 2,
  },
  monthlySummarySub: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
  },
  // Week Card
  weekCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: Colors.inverseSurface,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  weekCardTouchable: {
    width: '100%',
  },
  editWeekButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  editWeekText: {
    fontSize: 14,
    color: Colors.primary,
    marginLeft: 6,
  },
  activeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: Colors.primaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    fontSize: 12,
    color: Colors.primary,
  },
  dateRangeText: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    marginBottom: 4,
  },
  totalHoursText: {
    fontSize: 28,
    color: Colors.onSurface,
    marginBottom: 16,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
  },
  goalText: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
  },
  customLabel: {
    fontSize: 14,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  dayIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLetter: {
    fontSize: 14,
  },
  // Timer Card
  timerCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: Colors.inverseSurface,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  timerLeft: {
    flex: 1,
  },
  pulseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
    position: 'absolute',
  },
  staticDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
  },
  trackingLabel: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
  },
  timerDisplay: {
    fontSize: 32,
    color: Colors.onSurface,
    marginBottom: 4,
  },
  projectName: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
  },
  stopButton: {
    backgroundColor: Colors.error,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  stopButtonText: {
    fontSize: 16,
    color: Colors.onError,
  },
  // Summary Card
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: Colors.inverseSurface,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 20,
    color: Colors.onSurface,
    marginBottom: 8,
  },
  summaryHours: {
    fontSize: 32,
    color: Colors.primary,
    marginBottom: 16,
  },
  efficiencyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  efficiencyLabel: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
  },
  efficiencyValue: {
    fontSize: 20,
    color: Colors.onSurface,
  },
  efficiencyBarContainer: {
    height: 8,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 4,
    overflow: 'hidden',
  },
  efficiencyFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
});