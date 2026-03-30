import { BottomNav, BottomTab } from '@/components/BottomNav';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { usePathname, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Animated,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { createTodayStyles } from './tabStyles';
import { useAppTheme } from './ThemeContext';
import { TopBar } from './TopBar';



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

const useTodayStyles = () => {
  const { colors } = useAppTheme();
  const styles = createTodayStyles(colors);
  return { styles, colors };
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

const buildTimelineData = (colors: Record<string, string>): TimelineEntry[] => [
  {
    id: '1',
    title: 'System Architecture',
    startTime: '09:00 AM',
    endTime: '11:30 AM',
    duration: '2h 30m',
    durationHours: 2.5,
    icon: 'architecture',
    iconColor: colors.primary,
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
    iconColor: colors.secondary,
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
    iconColor: colors.tertiary,
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
  const { styles } = useTodayStyles();
  const [currentTime, setCurrentTime] = useState(new Date());
  const progressAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const now = currentTime;
    const secondsSinceMidnight = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const totalDaySeconds = 24 * 3600;
    const progressPercent = Math.min(100, Math.max(0, (secondsSinceMidnight / totalDaySeconds) * 100));
    Animated.timing(progressAnim, {
      toValue: progressPercent,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [currentTime, progressAnim]);

  const now = currentTime;
  const secondsSinceMidnight = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const totalDaySeconds = 24 * 3600;
  const progressPercent = Math.min(100, Math.max(0, (secondsSinceMidnight / totalDaySeconds) * 100));
  const formattedCurrentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const elapsedHours = Math.floor(secondsSinceMidnight / 3600);
  const elapsedMinutes = Math.floor((secondsSinceMidnight % 3600) / 60);
  const formattedElapsed = `${elapsedHours.toString().padStart(2, '0')}h ${elapsedMinutes.toString().padStart(2, '0')}m`;
  const remainingHours = 23 - elapsedHours;
  const remainingMinutes = 59 - elapsedMinutes;
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
        <Animated.View style={[styles.progressBarFill, { width: progressAnim.interpolate({
          inputRange: [0, 100],
          outputRange: ['0%', '100%'],
        }) }]} />
      </View>
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
//             colors={[colors.primary, colors.primaryContainer]}
//             start={{ x: 0, y: 0 }}
//             end={{ x: 1, y: 1 }}
//             style={styles.stopButtonGradient}
//           >
//             <MaterialIcons name="stop-circle" size={24} color={colors.onPrimary} />
//             <Text style={[styles.stopButtonText, typography.headline]}>Stop Session</Text>
//           </LinearGradient>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// ---- Lista de últimos 5 días trabajados ----
const DaySummaryItem = ({ entry }: { entry: DaySummaryEntry }) => {
  const { styles } = useTodayStyles();
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
//         backgroundColor: `${colors.tertiaryContainer}10`,
//         color: colors.tertiary,
//       };
//     }
//     return {
//       backgroundColor: colors.surfaceContainerHighest,
//       color: colors.onSurfaceVariant,
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
  const { styles, colors } = useTodayStyles();
  return (
    <TouchableOpacity style={styles.fab} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={[colors.primary, colors.primaryContainer]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fabGradient}
      >
        <MaterialIcons name="add" size={28} color={colors.onPrimary} />
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
  const { mode, colors, toggleMode } = useAppTheme();
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
          console.log('Loaded weeks:', parsed);
          setWeeks(parsed);
        } else {
          console.log('No weeks stored');
        }
      } catch (error) {
        console.warn('Unable to load weeks', error);
      }
    };

    loadWeeksFromStorage();
  }, []);

  useEffect(() => {
    const summary = getLast5DaySummaryFromWeeks(weeks);
    console.log('Day summary:', summary);
    setDaySummary(summary);
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

  // const handleFabPress = () => {
  //   alert('Add new session');
  // };

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
              <MaterialIcons name="chevron-right" size={16} color={colors.primary} />
            </View>
          </TouchableOpacity>
        </View>

        {timelineData.map((entry) => (
          <TimelineEntryItem key={entry.id} entry={entry} />
        ))} */}
      </ScrollView>
    );
  };

  const styles = createTodayStyles(colors);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <TopBar title="Today" mode={mode} onToggleTheme={toggleMode} onAvatarPress={() => alert('Profile pressed')} />
      {renderContent()}
      <BottomNav activeTab={activeTab} onTabPress={handleNavPress} />
      {/* <FAB onPress={handleFabPress} /> */}
    </SafeAreaView>
  );
}
