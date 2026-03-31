import { BottomNav, BottomTab } from '@/components/BottomNav';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Modal,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { createWeekDetailsStyles } from './tabStyles';
import { useAppTheme } from './ThemeContext';
import { TopBar } from './TopBar';




// ---------------------------------------------------------------------
// 2. Tipografía usando fuentes del sistema
// ---------------------------------------------------------------------
const typography = {
  headline: {
    fontFamily: 'System',
    fontWeight: '800' as const, // Equivalente a Manrope ExtraBold
  },
  body: {
    fontFamily: 'System',
    fontWeight: '400' as const,
  },
  label: {
    fontFamily: 'System',
    fontWeight: '600' as const,
  },
};

const useWeekDetailsStyles = () => {
  const { colors } = useAppTheme();
  const styles = createWeekDetailsStyles(colors);
  return { styles, colors };
};

// ---------------------------------------------------------------------
// 3. Modelos de datos
// ---------------------------------------------------------------------
type Session = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  iconColor?: string; // Color del ícono (para diferenciar)
};

type DayData = {
  id: string;
  dayName: string;
  dayNumber: number;
  month: string;
  sessions: Session[];
  totalHours: number;
  isPeak?: boolean; // Para marcar el día más productivo
};

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
  days: ('active' | 'inactive')[];
  dayEntries?: DayEntry[];
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  customLabel?: string;
  customLabelColor?: string;
  barColor?: string;
};

const getShortDayName = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
};

const getMonthName = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'long' });
};

const mapWeekToDayData = (week: WeekData, colors: any): DayData[] => {
  if (!week?.dayEntries?.length) return [];

  const maxHours = Math.max(...week.dayEntries.map(entry => entry.hours), 0);

  return week.dayEntries.map((entry) => {
    const date = new Date(entry.date);
    return {
      id: entry.date,
      dayName: getShortDayName(entry.date),
      dayNumber: date.getDate(),
      month: getMonthName(entry.date),
      sessions: entry.hours > 0
        ? [{
            id: `${entry.date}-work`,
            title: entry.note || 'Tracked Work',
            startTime: 'N/A',
            endTime: 'N/A',
            durationHours: entry.hours,
            iconColor: colors.primary,
          }]
        : [],
      totalHours: entry.hours,
      isPeak: entry.hours === maxHours && maxHours > 0,
    } as DayData;
  });
};

const calculateSummaryFromDays = (days: DayData[]) => {
  const totalHours = days.reduce((sum, day) => sum + (day.totalHours || 0), 0);
  const totalSessions = days.reduce((sum, day) => sum + day.sessions.length, 0);
  const averageSession = totalSessions > 0 ? totalHours / totalSessions : 0;

  return {
    totalHours,
    totalSessions,
    averageSession,
  };
};

// Datos de ejemplo (basados en el HTML)
const daysData: DayData[] = []; // Replaced placeholder data with empty initial state; se llenará desde AsyncStorage.


// ---------------------------------------------------------------------
// 4. Componentes
// ---------------------------------------------------------------------

// ---- Bento Highlights ----
const BentoHighlights = ({ days }: { days: DayData[] }) => {
  const { styles, colors } = useWeekDetailsStyles();
  // Usar el día más productivo calculado dinámicamente
  const peakDay = days.length
    ? days.reduce((best, current) => {
        if (!best || current.totalHours > best.totalHours) return current;
        return best;
      }, days[0])
    : { id: 'none', dayName: 'N/A', dayNumber: 0, month: '', sessions: [], totalHours: 0 };

  const maxHours = days.length ? Math.max(...days.map((day) => day.totalHours), 8) : 8;
  const barHeights = days.map(day => {
    const height = maxHours > 0 ? (day.totalHours / maxHours) * 80 : 20;
    return Math.max(20, height);
  });

  const { totalHours, totalSessions, averageSession } = calculateSummaryFromDays(days);

  return (
    <View style={styles.highlightsContainer}>
      {/* Tarjeta principal: Día más productivo */}
      <View style={[styles.peakCard, { borderLeftColor: colors.tertiary }]}>
        <Text style={[styles.peakLabel, typography.label]}>Most Productive Day</Text>
        <Text style={[styles.peakDayName, typography.headline]}>
          {peakDay.dayName === 'Tue' ? 'Tuesday' : peakDay.dayName}
        </Text>
        <View style={styles.peakFooter}>
          <Text style={[styles.peakHours, typography.headline]}>
            {Math.floor(peakDay.totalHours)}h {Math.round((peakDay.totalHours % 1) * 60)}m
          </Text>
          <View style={styles.barChart}>
            {barHeights.map((height, idx) => (
              <View
                key={idx}
                style={[
                  styles.bar,
                  { height },
                  idx === 1 ? { backgroundColor: colors.tertiary } : { backgroundColor: colors.surfaceContainer },
                ]}
              />
            ))}
          </View>
        </View>
      </View>

      {/* Tarjetas secundarias */}
      <View style={styles.statsColumn}>
        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: `${colors.primaryContainer}10` }]}>
            <MaterialIcons name="history" size={24} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.statLabel, typography.label]}>Total Sessions</Text>
            <Text style={[styles.statValue, typography.headline]}>{totalSessions}</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: `${colors.tertiaryContainer}10` }]}>
            <MaterialIcons name="timer" size={24} color={colors.tertiary} />
          </View>
          <View>
            <Text style={[styles.statLabel, typography.label]}>Average Session</Text>
            <Text style={[styles.statValue, typography.headline]}>{averageSession.toFixed(1)}h</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// ---- Componente para cada día (expandible) ----
const DayItem = ({
  day,
  isExpanded,
  onToggle,
}: {
  day: DayData;
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  const { styles, colors } = useWeekDetailsStyles();
  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours % 1) * 60);
    return `${h}h ${m}m`;
  };

  return (
    <View style={[styles.dayCard, day.isPeak && styles.peakDayCard]}>
      <TouchableOpacity onPress={onToggle} style={styles.dayHeader}>
        <View style={styles.dayInfo}>
          <View style={[styles.dayCircle, day.isPeak && styles.peakDayCircle]}>
            <Text style={[styles.dayInitial, typography.label, day.isPeak && { color: colors.tertiary }]}>
              {day.dayName}
            </Text>
            <Text style={[styles.dayNumber, typography.headline, day.isPeak && { color: colors.tertiary }]}>
              {day.dayNumber}
            </Text>
          </View>
          <View>
            <Text style={[styles.dayTitle, typography.headline]}>
              {day.month} {day.dayNumber}
            </Text>
            <Text style={[styles.sessionCount, typography.body]}>
              {day.sessions.length} Sessions recorded
            </Text>
          </View>
        </View>
        <View style={styles.dayRight}>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.totalHours, typography.headline, day.isPeak && { color: colors.tertiary }]}>
              {formatHours(day.totalHours)}
            </Text>
            {day.isPeak && (
              <View style={styles.peakBadge}>
                <Text style={[styles.peakBadgeText, typography.label]}>Peak Performance</Text>
              </View>
            )}
          </View>
          <MaterialIcons
            name={isExpanded ? 'expand-less' : 'expand-more'}
            size={24}
            color={colors.outlineVariant}
          />
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.sessionsContainer}>
          {day.sessions.map((session) => (
            <View key={session.id} style={styles.sessionItem}>
              <View style={styles.sessionLeft}>
                <MaterialIcons
                  name="radio-button-checked"
                  size={20}
                  color={session.iconColor || colors.primary}
                />
                <View>
                  <Text style={[styles.sessionTitle, typography.body]}>{session.title}</Text>
                  <Text style={[styles.sessionTime, typography.label]}>
                    {session.startTime} - {session.endTime}
                  </Text>
                </View>
              </View>
              <Text style={[styles.sessionDuration, typography.body]}>{session.durationHours}h</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// ---- Tarjeta de resumen semanal (pulse) ----
const WeeklySummaryCard = ({ totalHours }: { totalHours: number }) => {
  const { styles, colors } = useWeekDetailsStyles();
  return (
    <View style={styles.summaryCard}>
      <View style={styles.blurBackground1} />
      <View style={styles.blurBackground2} />
      <Text style={[styles.summaryLabel, typography.label]}>Total Weekly Impact</Text>
      <View style={styles.totalHoursWrapper}>
        <Text style={[styles.totalHoursLarge, typography.headline]}>{totalHours.toFixed(1)}</Text>
        <Text style={[styles.totalHoursUnit, typography.headline]}>HRS</Text>
      </View>
      <View style={styles.trendContainer}>
        <MaterialIcons name="trending-up" size={20} color={colors.tertiary} />
        <Text style={[styles.trendText, typography.body]}>Overall goals reflect week activity</Text>
      </View>
    </View>
  );
};

// ---- Month Week Picker Modal ----
const WeekPickerModal = ({
  visible,
  weeks,
  selectedWeekId,
  onSelect,
  onClose,
}: {
  visible: boolean;
  weeks: WeekData[];
  selectedWeekId: string | null;
  onSelect: (week: WeekData) => void;
  onClose: () => void;
}) => {
  const { styles } = useWeekDetailsStyles();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.weekPickerOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.weekPickerSheet} onPress={() => {}}>
          <View style={styles.weekPickerHandle} />
          <Text style={[styles.weekPickerTitle, typography.headline]}>Select a Week</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {weeks.length === 0 ? (
              <View style={styles.weekPickerEmpty}>
                <Text style={[styles.weekPickerEmptyText, typography.body]}>No weeks recorded yet.</Text>
              </View>
            ) : (
              weeks.map((week) => {
                const isSelected = week.id === selectedWeekId;
                return (
                  <TouchableOpacity
                    key={week.id}
                    style={[styles.weekPickerItem, isSelected && styles.weekPickerItemSelected]}
                    onPress={() => { onSelect(week); onClose(); }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.weekPickerItemLeft}>
                      <Text style={[styles.weekPickerItemRange, typography.label, isSelected && styles.weekPickerItemRangeSelected]}>
                        {week.dateRange}
                      </Text>
                      {week.isActive && (
                        <View style={styles.weekPickerItemBadge}>
                          <Text style={[styles.weekPickerItemBadgeText, typography.label]}>Active</Text>
                        </View>
                      )}
                    </View>
                    {isSelected && (
                      <MaterialIcons name="check-circle" size={22} color={styles.weekPickerItemRangeSelected.color} />
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

// ---------------------------------------------------------------------
// 5. Pantalla principal
// ---------------------------------------------------------------------
export default function App() {
  const router = useRouter();
  const { mode, colors, toggleMode } = useAppTheme();
  const styles = createWeekDetailsStyles(colors);
  const [activeAppTab, setActiveAppTab] = useState<BottomTab>('week-details');
  const [activeTab, setActiveTab] = useState<'weeks' | 'log' | 'stats'>('weeks');
  const [expandedDayId, setExpandedDayId] = useState<string>('mon');
  const [weeks, setWeeks] = useState<WeekData[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<WeekData | null>(null);
  const [dayRecords, setDayRecords] = useState<DayData[]>(daysData);
  const [isLoadingWeek, setIsLoadingWeek] = useState<boolean>(true);
  const [showWeekPicker, setShowWeekPicker] = useState(false);
  const insets = useSafeAreaInsets();
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

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

  const handleBack = () => {
    // Simular navegación (puedes reemplazar con navigation.goBack() si usas React Navigation)
    alert('Back pressed');
  };

  const handleSettings = () => {
    alert('Settings pressed');
  };

  const toggleDay = (dayId: string) => {
    setExpandedDayId(expandedDayId === dayId ? '' : dayId);
  };

  const loadWeekRecords = async () => {
    setIsLoadingWeek(true);
    try {
      const stored = await AsyncStorage.getItem('@hourly/weeks');
      if (stored) {
        const parsedWeeks: WeekData[] = JSON.parse(stored);
        setWeeks(parsedWeeks);
        const activeOrLast = parsedWeeks.find((w) => w.isActive) || parsedWeeks[0] || null;
        setSelectedWeek(activeOrLast);

        if (activeOrLast) {
          const mapped = mapWeekToDayData(activeOrLast, colors);
          setDayRecords(mapped);
          setExpandedDayId(mapped[0]?.id ?? '');
        } else {
          setDayRecords([]);
        }
      } else {
        setWeeks([]);
        setSelectedWeek(null);
        setDayRecords([]);
      }
    } catch (error) {
      console.warn('Error loading week records:', error);
      setWeeks([]);
      setSelectedWeek(null);
      setDayRecords([]);
    } finally {
      setIsLoadingWeek(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadWeekRecords();
    }, [])
  );

  const selectWeek = (week: WeekData) => {
    setSelectedWeek(week);
    const mapped = mapWeekToDayData(week, colors);
    setDayRecords(mapped);
    setExpandedDayId(mapped[0]?.id ?? '');
  };

  // Renderizado según pestaña activa
  const renderContent = () => {
    if (activeTab !== 'weeks') {
      return (
        <View style={styles.placeholderScreen}>
          <Text style={[styles.placeholderTitle, typography.headline]}>
            {activeTab === 'log' ? 'Log Screen' : 'Stats Screen'}
          </Text>
          <Text style={[styles.placeholderSub, typography.body]}>
            {activeTab === 'log' ? 'Track your daily activity' : 'Insights and analytics'}
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 160 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={[styles.heroSubtitle, typography.label]}>Detailed View</Text>
          <Text style={[styles.heroTitle, typography.headline]}>{selectedWeek ? `Week: ${selectedWeek.dateRange}` : 'Week details'}</Text>
        </View>

        {!selectedWeek ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, typography.body]}>No weekly records found. Crea una semana en la pantalla de inicio para ver detalles aquí.</Text>
          </View>
        ) : (
          <>
            <BentoHighlights days={dayRecords} />

            <WeeklySummaryCard totalHours={calculateSummaryFromDays(dayRecords).totalHours} />

            {/* Day list */}
            {dayRecords.map((day) => (
              <DayItem
                key={day.id}
                day={day}
                isExpanded={expandedDayId === day.id}
                onToggle={() => toggleDay(day.id)}
              />
            ))}
          </>
        )}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <TopBar
        title="Week Details"
        mode={mode}
        onToggleTheme={toggleMode}
        onAvatarPress={() => alert('Profile pressed')}
      />
      {renderContent()}

      {/* Week selector button — floats above BottomNav */}
      <TouchableOpacity
        style={[
          styles.weekSelectorButton,
          { position: 'absolute', bottom: insets.bottom + 80, left: 24, right: 24, marginHorizontal: 0, marginBottom: 0 },
        ]}
        onPress={() => setShowWeekPicker(true)}
        activeOpacity={0.75}
      >
        <View style={styles.weekSelectorButtonLeft}>
          <Text style={[styles.weekSelectorButtonLabel, typography.label]}>Viewing Week</Text>
          <Text style={[styles.weekSelectorButtonRange, typography.headline]}>
            {selectedWeek ? selectedWeek.dateRange : 'No week selected'}
          </Text>
        </View>
        <MaterialIcons name="keyboard-arrow-up" size={24} color={colors.primary} />
      </TouchableOpacity>

      <BottomNav activeTab={activeAppTab} onTabPress={handleNavPress} />

      <WeekPickerModal
        visible={showWeekPicker}
        weeks={weeks}
        selectedWeekId={selectedWeek?.id ?? null}
        onSelect={selectWeek}
        onClose={() => setShowWeekPicker(false)}
      />
    </SafeAreaView>
  );
}


