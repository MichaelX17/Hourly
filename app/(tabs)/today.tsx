import { BottomNav, BottomTab } from '@/components/BottomNav';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { usePathname, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// ---------------------------------------------------------------------
// 1. Color Palette (del HTML)
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
// 2. Tipografía usando fuentes del sistema
// ---------------------------------------------------------------------
const typography = {
  headline: {
    fontFamily: 'System',
    fontWeight: '800' as const,
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

// ---------------------------------------------------------------------
// 3. Datos de ejemplo
// ---------------------------------------------------------------------
type TimelineEntry = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  duration: string;
  durationHours: number;
  icon: string;
  iconColor: string;
  category: string;
  categoryType: 'billable' | 'meeting' | 'other';
};

const timelineData: TimelineEntry[] = [
  {
    id: '1',
    title: 'System Architecture',
    startTime: '09:00 AM',
    endTime: '11:30 AM',
    duration: '2h 30m',
    durationHours: 2.5,
    icon: 'architecture',
    iconColor: Colors.primary,
    category: 'Billable',
    categoryType: 'billable',
  },
  {
    id: '2',
    title: 'Client Discovery Call',
    startTime: '12:15 PM',
    endTime: '01:00 PM',
    duration: '0h 45m',
    durationHours: 0.75,
    icon: 'groups',
    iconColor: Colors.secondary,
    category: 'Meeting',
    categoryType: 'meeting',
  },
  {
    id: '3',
    title: 'Content Strategy',
    startTime: '01:30 PM',
    endTime: '02:45 PM',
    duration: '1h 15m',
    durationHours: 1.25,
    icon: 'edit-note',
    iconColor: Colors.tertiary,
    category: 'Billable',
    categoryType: 'billable',
  },
];

type DaySummaryEntry = {
  id: string;
  dayName: string;
  workedHours: number;
  workedLabel: string;
  progressPercent: number;
};

type WeekData = {
  id: string;
  dateRange: string;
  dayEntries?: { date: string; hours: number; }[];
};

const daySummaryData: DaySummaryEntry[] = [
  { id: 'd1', dayName: 'Mon', workedHours: 7.2, workedLabel: '7h 12m', progressPercent: (7.2 / 8) * 100 },
  { id: 'd2', dayName: 'Tue', workedHours: 8.0, workedLabel: '8h 00m', progressPercent: 100 },
  { id: 'd3', dayName: 'Wed', workedHours: 6.5, workedLabel: '6h 30m', progressPercent: (6.5 / 8) * 100 },
  { id: 'd4', dayName: 'Thu', workedHours: 7.0, workedLabel: '7h 00m', progressPercent: (7.0 / 8) * 100 },
  { id: 'd5', dayName: 'Fri', workedHours: 8.0, workedLabel: '8h 00m', progressPercent: 100 },
];

const getShortDayName = (date: Date): string => {
  return date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3);
};

const getLast5DaySummaryFromWeeks = (weeks: WeekData[]): DaySummaryEntry[] => {
  const dailyMap = new Map<string, number>();

  weeks.forEach((week) => {
    week.dayEntries?.forEach((entry) => {
      const total = dailyMap.get(entry.date) || 0;
      dailyMap.set(entry.date, total + entry.hours);
    });
  });

  if (dailyMap.size === 0) {
    return [];
  }

  const sortedDates = Array.from(dailyMap.keys())
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    .slice(0, 5);

  return sortedDates.map((date) => {
    const hours = dailyMap.get(date) || 0;
    const d = new Date(date);
    const dayName = getShortDayName(d);
    const workedLabel = `${Math.floor(hours)}h ${Math.round((hours % 1) * 60)
      .toString()
      .padStart(2, '0')}m`;

    return {
      id: date,
      dayName,
      workedHours: hours,
      workedLabel,
      progressPercent: Math.min(100, Math.round((hours / 8) * 100)),
    };
  });
};

// ---------------------------------------------------------------------
// 4. Componentes
// ---------------------------------------------------------------------

const getDayProgress = () => {
  const now = new Date();
  const secondsSinceMidnight = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const totalDaySeconds = 24 * 3600;
  const progressPercent = Math.min(100, Math.max(0, (secondsSinceMidnight / totalDaySeconds) * 100));
  return {
    now,
    secondsSinceMidnight,
    progressPercent,
    elapsedHours: Math.floor(secondsSinceMidnight / 3600),
    elapsedMinutes: Math.floor((secondsSinceMidnight % 3600) / 60),
    elapsedSeconds: secondsSinceMidnight % 60,
    remainingHours: 23 - Math.floor(secondsSinceMidnight / 3600),
    remainingMinutes: 59 - Math.floor((secondsSinceMidnight % 3600) / 60),
  };
};

// ---- Sección de progreso diario (avance del día en tiempo)
const DailyProgress = () => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const { now, progressPercent, elapsedHours, elapsedMinutes, elapsedSeconds, remainingHours, remainingMinutes } = getDayProgress();
  const formattedCurrentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formattedElapsed = `${elapsedHours.toString().padStart(2, '0')}h ${elapsedMinutes.toString().padStart(2, '0')}m`;
  const formattedRemaining = `${remainingHours.toString().padStart(2, '0')}h ${remainingMinutes.toString().padStart(2, '0')}m`;

  return (
    <View style={styles.progressSection}>
      <View>
        <Text style={[styles.progressLabel, typography.label]}>DAY TIME PROGRESS</Text>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressCurrent, typography.headline]}>{formattedCurrentTime}</Text>
          <Text style={[styles.progressGoal, typography.label]}>{Math.round(progressPercent)}%</Text>
        </View>
      </View>
      <Text style={[styles.progressSubText, typography.body]}>{`Elapsed: ${formattedElapsed} · Remaining: ${formattedRemaining}`}</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
      </View>
    </View>
  );
};

// ---- Barra superior fija local ----
const TopBar = ({ onMenuPress, onAvatarPress }: { onMenuPress: () => void; onAvatarPress: () => void }) => {
  const insets = useSafeAreaInsets();
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <View style={[styles.topBar, { paddingTop: insets.top || 16 }]}> 
      <View style={styles.topBarLeft}>
        <TouchableOpacity onPress={onMenuPress} style={styles.menuButton}>
          <MaterialIcons name="menu" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>
      <View style={styles.topBarCenter}>
        <Text style={[styles.topBarTitle, typography.headline]}>Today</Text>
        <Text style={[styles.topBarDate, typography.label]}>{formattedDate}</Text>
      </View>
      <TouchableOpacity onPress={onAvatarPress}>
        <Image
          source={{
            uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBud6YSLnRmcdlGYa9eMKEtESa2K4DfE7hTW9J-WudDcF9C6uSXSGnMfCRDAmHBSKl-qoY32wxth2v65993p7CpSpVeBjllNzocXshWN8qG-gEjhnW7vk9jgH6LzOlOzQiCcoezwTRgRrqlnMElT1PduKiKZfhdG1qha5K7pzmrau5c98qAixhzuBliK408FP65_GSKrYjpAUX6nlmXdpWx8WZ5yuX4S5_pEjnlL68KDSCDKPC1o_1BV9yDygd3JYCpiiZn3uB7nl4',
          }}
          style={styles.avatar}
        />
      </TouchableOpacity>
    </View>
  );
};

// ---- Tarjeta de sesión activa con temporizador ----
// const ActiveSessionCard = () => {
//   const [seconds, setSeconds] = useState(1 * 3600 + 12 * 60 + 44); // 01:12:44
//   const [isRunning, setIsRunning] = useState(true);
//   const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
//   const pulseAnim = useRef(new Animated.Value(1)).current;

//   useEffect(() => {
//     if (isRunning) {
//       intervalRef.current = setInterval(() => {
//         setSeconds((prev) => prev + 1);
//       }, 1000);
//     } else if (intervalRef.current) {
//       clearInterval(intervalRef.current);
//     }
//     return () => {
//       if (intervalRef.current) clearInterval(intervalRef.current);
//     };
//   }, [isRunning]);

//   useEffect(() => {
//     Animated.loop(
//       Animated.sequence([
//         Animated.timing(pulseAnim, {
//           toValue: 0.3,
//           duration: 1000,
//           useNativeDriver: true,
//         }),
//         Animated.timing(pulseAnim, {
//           toValue: 1,
//           duration: 1000,
//           useNativeDriver: true,
//         }),
//       ])
//     ).start();
//   }, []);

//   const formatTime = (totalSeconds: number) => {
//     const hrs = Math.floor(totalSeconds / 3600);
//     const mins = Math.floor((totalSeconds % 3600) / 60);
//     const secs = totalSeconds % 60;
//     return `${hrs.toString().padStart(2, '0')}:${mins
//       .toString()
//       .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
//   };

//   const handleStop = () => {
//     setIsRunning(false);
//   };

//   return (
//     <View style={styles.activeSessionCard}>
//       <View style={styles.glassOverlay} />
//       <View style={styles.cardContent}>
//         <View style={styles.activeBadge}>
//           <Animated.View style={[styles.pulseDot, { opacity: pulseAnim }]} />
//           <View style={styles.staticDot} />
//           <Text style={[styles.activeBadgeText, typography.label]}>Active Session</Text>
//         </View>
//         <Text style={[styles.sessionTitle, typography.headline]}>UI Design Refinement</Text>
//         <Text style={[styles.sessionProject, typography.body]}>Chronos Mobile App • Internal</Text>
//         <Text style={[styles.timerDisplay, typography.headline]}>{formatTime(seconds)}</Text>
//         <TouchableOpacity style={styles.stopButton} onPress={handleStop}>
//           <LinearGradient
//             colors={[Colors.primary, Colors.primaryContainer]}
//             start={{ x: 0, y: 0 }}
//             end={{ x: 1, y: 1 }}
//             style={styles.stopButtonGradient}
//           >
//             <MaterialIcons name="stop-circle" size={24} color={Colors.onPrimary} />
//             <Text style={[styles.stopButtonText, typography.headline]}>Stop Session</Text>
//           </LinearGradient>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// ---- Lista de últimos 5 días trabajados ----
const DaySummaryItem = ({ entry }: { entry: DaySummaryEntry }) => {
  return (
    <View style={styles.daySummaryRow}>
      <View style={styles.daySummaryLeft}>
        <Text style={[styles.daySummaryDay, typography.headline]}>{entry.dayName}</Text>
        <Text style={[styles.daySummaryWorked, typography.body]}>{entry.workedLabel}</Text>
      </View>
      <View style={styles.daySummaryBarContainer}>
        <View style={[styles.daySummaryBarFill, { width: `${Math.min(100, Math.max(0, entry.progressPercent))}%` }]} />
      </View>
    </View>
  );
};

// ---- Componente de entrada de línea de tiempo ----
// const TimelineEntryItem = ({ entry }: { entry: TimelineEntry }) => {
//   const getCategoryStyle = () => {
//     if (entry.categoryType === 'billable') {
//       return {
//         backgroundColor: `${Colors.tertiaryContainer}10`,
//         color: Colors.tertiary,
//       };
//     }
//     return {
//       backgroundColor: Colors.surfaceContainerHighest,
//       color: Colors.onSurfaceVariant,
//     };
//   };

//   const categoryStyle = getCategoryStyle();

//   return (
//     <TouchableOpacity style={styles.timelineItem} activeOpacity={0.7}>
//       <View style={styles.timelineLeft}>
//         <View style={[styles.timelineIconBg, { backgroundColor: `${entry.iconColor}10` }]}>
//           <MaterialIcons name={entry.icon as any} size={24} color={entry.iconColor} />
//         </View>
//         <View>
//           <Text style={[styles.timelineTitle, typography.headline]}>{entry.title}</Text>
//           <Text style={[styles.timelineTime, typography.body]}>
//             {entry.startTime} — {entry.endTime}
//           </Text>
//         </View>
//       </View>
//       <View style={styles.timelineRight}>
//         <Text style={[styles.timelineDuration, typography.headline]}>{entry.duration}</Text>
//         <View style={[styles.categoryBadge, { backgroundColor: categoryStyle.backgroundColor }]}>
//           <Text style={[styles.categoryText, typography.label, { color: categoryStyle.color }]}>
//             {entry.category}
//           </Text>
//         </View>
//       </View>
//     </TouchableOpacity>
//   );
// };

// ---- Botón de acción flotante (FAB) ----
const FAB = ({ onPress }: { onPress: () => void }) => {
  return (
    <TouchableOpacity style={styles.fab} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryContainer]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fabGradient}
      >
        <MaterialIcons name="add" size={28} color={Colors.onPrimary} />
      </LinearGradient>
    </TouchableOpacity>
  );
};

// ---------------------------------------------------------------------
// 5. Pantalla principal
// ---------------------------------------------------------------------
export default function App() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<BottomTab>('today');
  const [weeks, setWeeks] = useState<WeekData[]>([]);
  const [daySummary, setDaySummary] = useState<DaySummaryEntry[]>([]);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (pathname === '/today') {
      setActiveTab('today');
    }
  }, [pathname]);

  useEffect(() => {
    const loadWeeksFromStorage = async () => {
      try {
        const stored = await AsyncStorage.getItem('@hourly/weeks');
        if (stored) {
          const parsed: WeekData[] = JSON.parse(stored);
          setWeeks(parsed);
        }
      } catch (error) {
        console.warn('Unable to load weeks', error);
      }
    };

    loadWeeksFromStorage();
  }, []);

  useEffect(() => {
    setDaySummary(getLast5DaySummaryFromWeeks(weeks));
  }, [weeks]);

  const routeMap: Record<BottomTab, string> = {
    today: '/today',
    weekly: '/current-week',
    monthly: '/monthly-insights',
    'week-details': '/week-details',
    stats: '/today',
    settings: '/today',
  };

  const handleNavPress = (tab: BottomTab) => {
    setActiveTab(tab);
    const route = routeMap[tab];
    if (route) {
      router.push(route as any);
    }
  };

  const handleSeeAll = () => {
    alert('See all timeline entries');
  };

  const handleFabPress = () => {
    alert('Add new session');
  };

  // Renderizado según pestaña activa
  const renderContent = () => {
    if (activeTab !== 'today') {
      return (
        <View style={styles.placeholderScreen}>
          <Text style={[styles.placeholderTitle, typography.headline]}>
            {activeTab === 'weekly' ? 'Weekly Overview' : activeTab === 'stats' ? 'Stats' : 'Settings'}
          </Text>
          <Text style={[styles.placeholderSub, typography.body]}>
            {activeTab === 'weekly'
              ? 'Review your journey'
              : activeTab === 'stats'
              ? 'Insights and analytics'
              : 'App preferences'}
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 80 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Daily Progress */}
        <DailyProgress />

        {/* Active Session Card */}
        {/* <ActiveSessionCard /> */}

        {/* Last 5 days summary */}
        <View style={styles.timelineSubHeader}>
          <Text style={[styles.timelineHeaderTitle, typography.headline]}>Last 5 Days</Text>
          <Text style={[styles.seeAllText, typography.label]}>8h goal</Text>
        </View>

        {daySummary.length === 0 ? (
          <View style={styles.noDaysCard}>
            <Text style={[styles.noDaysText, typography.body]}>No Days To Show</Text>
          </View>
        ) : (
          daySummary.map((entry) => <DaySummaryItem key={entry.id} entry={entry} />)
        )}

        {/* Timeline Section */}
        {/* <View style={styles.timelineHeader}>
          <Text style={[styles.timelineHeaderTitle, typography.headline]}>Timeline</Text>
          <TouchableOpacity onPress={handleSeeAll}>
            <View style={styles.seeAllButton}>
              <Text style={[styles.seeAllText, typography.label]}>See All</Text>
              <MaterialIcons name="chevron-right" size={16} color={Colors.primary} />
            </View>
          </TouchableOpacity>
        </View>

        {timelineData.map((entry) => (
          <TimelineEntryItem key={entry.id} entry={entry} />
        ))} */}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <TopBar onMenuPress={() => alert('Menu pressed')} onAvatarPress={() => alert('Profile pressed')} />
      {renderContent()}
      <BottomNav activeTab={activeTab} onTabPress={handleNavPress} />
      <FAB onPress={handleFabPress} />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------
// 6. Estilos
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
    paddingTop: 16,
  },
  // Top Bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 12,
    backgroundColor: 'rgba(248, 250, 252, 0.7)', // similar to bg-slate-50/70
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  topBarLeft: {
    width: 40,
  },
  menuButton: {
    padding: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  topBarCenter: {
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
  },
  topBarDate: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceContainerHighest,
    borderWidth: 2,
    borderColor: `${Colors.primary}10`,
  },
  // Daily Progress
  progressSection: {
    marginTop: 80, // espacio para la barra superior fija
    marginBottom: 24,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: `${Colors.primary}70`,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 16,
  },
  progressCurrent: {
    fontSize: 48,
    fontWeight: '800',
    color: Colors.primary,
  },
  progressGoal: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.onSurfaceVariant,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressSubText: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    marginTop: 4,
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 999,
  },
  // Active Session Card
  activeSessionCard: {
    borderRadius: 32,
    marginBottom: 24,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'rgba(255,255,255,0.7)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  glassOverlay: {
    position: 'absolute',
    top: -48,
    right: -48,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: `${Colors.tertiary}20`,
  },
  cardContent: {
    padding: 32,
    alignItems: 'center',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${Colors.tertiaryContainer}10`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 16,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.tertiary,
    position: 'absolute',
  },
  staticDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.tertiary,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: Colors.tertiary,
  },
  sessionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  sessionProject: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginBottom: 24,
    textAlign: 'center',
  },
  timerDisplay: {
    fontSize: 56,
    fontWeight: '800',
    color: Colors.onSurface,
    marginBottom: 32,
    fontVariant: ['tabular-nums'],
  },
  stopButton: {
    width: '100%',
    borderRadius: 999,
    overflow: 'hidden',
  },
  stopButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  stopButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.onPrimary,
  },
  // Timeline Header
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  timelineHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
  },
  timelineSubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 6,
  },
  daySummaryRow: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  daySummaryLeft: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  daySummaryDay: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
  },
  daySummaryWorked: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  daySummaryBarContainer: {
    height: 6,
    width: '100%',
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 999,
    overflow: 'hidden',
  },
  daySummaryBarFill: {
    height: '100%',
    backgroundColor: Colors.secondary,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  // Timeline Items
  timelineItem: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 24,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  timelineIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.onSurface,
    marginBottom: 4,
  },
  timelineTime: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  timelineRight: {
    alignItems: 'flex-end',
  },
  timelineDuration: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 4,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  // Bottom Navigation
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  },
  navItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  navItemActive: {
    backgroundColor: `${Colors.primary}10`,
  },
  navLabel: {
    fontSize: 10,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: Colors.outline,
  },
  navLabelActive: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  // FAB
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 112, // para no superponerse al bottom nav
    width: 64,
    height: 64,
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 20,
  },
  fabGradient: {
    flex: 1,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Placeholders
  placeholderScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  placeholderTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
  },
  placeholderSub: {
    fontSize: 16,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
  },
  noDaysCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.surfaceContainerHigh,
    backgroundColor: Colors.surfaceContainerLowest,
    paddingVertical: 20,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  noDaysText: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
});