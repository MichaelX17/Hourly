import { BottomNav, BottomTab } from '@/components/BottomNav';
import { useI18n } from '@/i18n';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { createMonthlyInsightsStyles } from './tabStyles';
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

const useMonthlyInsightsStyles = () => {
  const { colors } = useAppTheme();
  const styles = createMonthlyInsightsStyles(colors);
  return { styles, colors };
};

// ---------------------------------------------------------------------
// 3. Data Models
// ---------------------------------------------------------------------
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

type Session = {
  id: string;
  title: string;
  date: string;
  category: string;
  duration: string;
  durationHours: number;
  icon: string;
  color: string;
  borderColor: string;
};

// ---------------------------------------------------------------------
// 4. Helper Functions
// ---------------------------------------------------------------------
const formatHoursLabel = (hours: number): string => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
};

const getWeekNumber = (date: Date): number => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

const getDayOfWeek = (date: Date): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
};

// ---------------------------------------------------------------------
// 5. Data Calculation Functions
// ---------------------------------------------------------------------
const calculateMonthlyMetrics = (weeks: WeekData[]) => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  let totalHours = 0;
  let daysWorked = 0;
  const dayHours: { [key: string]: number } = {};
  const weekHours: { [key: number]: number } = {};

  weeks.forEach(week => {
    if (week.dayEntries) {
      week.dayEntries.forEach(entry => {
        // Parse YYYY-MM-DD as local date to avoid UTC timezone shift
        const [y, m, d] = entry.date.split('-').map(Number);
        if (m - 1 !== currentMonth || y !== currentYear) return;
        totalHours += entry.hours;
        if (entry.hours > 0) daysWorked++;
        const entryDate = new Date(y, m - 1, d);
        const dayKey = getDayOfWeek(entryDate);
        dayHours[dayKey] = (dayHours[dayKey] || 0) + entry.hours;
        const weekNum = getWeekNumber(entryDate);
        weekHours[weekNum] = (weekHours[weekNum] || 0) + entry.hours;
      });
    }
  });

  const averageDaily = daysWorked > 0 ? totalHours / daysWorked : 0;
  const goalHours = 8 * daysWorked; // Assume 8 hours goal per day
  const goalCompletion = goalHours > 0 ? Math.round((totalHours / goalHours) * 100) : 0;

  // Peak day
  let peakDay = 'Tuesday'; // default
  let peakHours = 0;
  Object.entries(dayHours).forEach(([day, hours]) => {
    if (hours > peakHours) {
      peakHours = hours;
      peakDay = day;
    }
  });

  return {
    totalHours,
    averageDaily,
    goalCompletion,
    daysWorked,
    weekHours,
    peakDay,
    peakHours,
  };
};

const getWeekMonday = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday = 1
  d.setDate(d.getDate() + diff);
  return d;
};

const formatWeekLabel = (date: Date, locale: string = 'en'): string => {
  const dateLocale = locale === 'es' ? 'es-ES' : 'en-US';
  return date.toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' });
};

type WeekBarData = {
  label: string;
  hours: number;
  heightPercent: number;
  color: string;
};

const generateWeeklyData = (rawWeeks: WeekData[], colors: any, locale: string = 'en'): WeekBarData[] => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Build week-hours map counting only days in the current month
  const weekHours: { [key: number]: number } = {};
  rawWeeks.forEach(week => {
    if (week.dayEntries) {
      week.dayEntries.forEach(entry => {
        const [y, m, d] = entry.date.split('-').map(Number);
        if (m - 1 !== currentMonth || y !== currentYear) return;
        const entryDate = new Date(y, m - 1, d);
        const weekNum = getWeekNumber(entryDate);
        weekHours[weekNum] = (weekHours[weekNum] || 0) + entry.hours;
      });
    }
  });

  // Get last 4 weeks with real date labels
  const weeks: WeekBarData[] = [];
  for (let i = 3; i >= 0; i--) {
    const weekDate = new Date(today);
    weekDate.setDate(today.getDate() - (i * 7));
    const weekNum = getWeekNumber(weekDate);
    const hours = weekHours[weekNum] || 0;
    const monday = getWeekMonday(weekDate);
    weeks.push({
      label: formatWeekLabel(monday, locale),
      hours,
      heightPercent: 0, // calculated below
      color: i === 0 ? colors.primary : `${colors.primary}35`,
    });
  }

  // Dynamic max: use 40h as baseline, stretch only if a week exceeds it
  const maxHours = Math.max(...weeks.map(w => w.hours), 40);
  weeks.forEach(w => {
    w.heightPercent = (w.hours / maxHours) * 100;
  });

  return weeks;
};

/** Calculate trend % comparing current week vs previous week hours. */
const calculateWeeklyTrend = (weeklyData: WeekBarData[]): number | null => {
  if (weeklyData.length < 2) return null;
  const current = weeklyData[weeklyData.length - 1].hours;
  const previous = weeklyData[weeklyData.length - 2].hours;
  if (previous === 0 && current === 0) return null;
  if (previous === 0) return 100; // went from 0 to something
  return Math.round(((current - previous) / previous) * 100);
};

const generateSessionsData = (weeks: WeekData[], colors: any, locale: string = 'en'): Session[] => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const dayEntries: { date: Date; hours: number; note?: string }[] = [];

  weeks.forEach(week => {
    if (week.dayEntries) {
      week.dayEntries.forEach(entry => {
        const [y, m, d] = entry.date.split('-').map(Number);
        const entryDate = new Date(y, m - 1, d);
        if (m - 1 === currentMonth && y === currentYear && entry.hours > 0) {
          dayEntries.push({ date: entryDate, hours: entry.hours, note: entry.note });
        }
      });
    }
  });

  // Sort by hours descending, take top 3
  dayEntries.sort((a, b) => b.hours - a.hours);
  const topEntries = dayEntries.slice(0, 3);

  const icons = ['rocket-launch', 'palette', 'forum'];
  const categories = ['Single Focus', 'Creative Review', 'Meetings'];
  const palette = [colors.primary, colors.secondary, colors.tertiary];

  return topEntries.map((entry, idx) => ({
    id: entry.date.toISOString(),
    title: entry.note || `Work Session on ${entry.date.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US')}`,
    date: entry.date.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { month: 'short', day: 'numeric' }),
    category: categories[idx % categories.length],
    duration: formatHoursLabel(entry.hours),
    durationHours: entry.hours,
    icon: icons[idx % icons.length],
    color: palette[idx % palette.length],
    borderColor: palette[idx % palette.length],
  }));
};

// ---------------------------------------------------------------------
// 6. Componentes
// ---------------------------------------------------------------------

// ---- Tarjeta métrica ----
const MetricCard = ({
  icon,
  iconColor,
  label,
  value,
  trend,
  trendPositive = true,
  gradientColors,
  textColor,
  labelColor,
}: {
  icon: string;
  iconColor?: string;
  label: string;
  value: string;
  trend?: string;
  trendPositive?: boolean;
  gradientColors?: [string, string];
  textColor?: string;
  labelColor?: string;
}) => {
  const { styles, colors } = useMonthlyInsightsStyles();
  textColor = textColor ?? colors.onSurface;
  labelColor = labelColor ?? colors.onSurfaceVariant;
  const cardContent = (
    <>
      <View style={styles.metricHeader}>
        <MaterialIcons name={icon as any} size={28} color={iconColor || colors.primary} />
        {trend && (
          <View style={[styles.trendBadge, trendPositive && styles.trendPositive]}>
            <Text style={[styles.trendText, typography.label]}>{trend}</Text>
          </View>
        )}
      </View>
      <View style={styles.metricFooter}>
        <Text style={[styles.metricLabel, typography.label, { color: labelColor }]}>
          {label}
        </Text>
        <Text style={[styles.metricValue, typography.headline, { color: textColor }]}>
          {value}
        </Text>
      </View>
    </>
  );

  if (gradientColors) {
    return (
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.metricCard, styles.gradientCard]}
      >
        {cardContent}
      </LinearGradient>
    );
  }

  return <View style={styles.metricCard}>{cardContent}</View>;
};

// ---- Gráfico de barras ----
const BarChart = ({ weeklyData }: { weeklyData: WeekBarData[] }) => {
  const { styles, colors } = useMonthlyInsightsStyles();
  const { t } = useI18n();
  const maxBarHeight = 160; // altura máxima de la barra en píxeles

  const hasData = weeklyData.some(w => w.hours > 0);

  return (
    <View style={styles.chartContainer}>
      <View style={styles.chartHeader}>
        <View>
          <Text style={[styles.chartTitle, typography.headline]}>{t.monthlyInsights.weeklyTrends}</Text>
          <Text style={[styles.chartSubtitle, typography.body]}>{t.monthlyInsights.hoursWorkedLast4Weeks}</Text>
        </View>
        <View style={styles.legend}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.legendText, typography.label]}>{t.monthlyInsights.actual}</Text>
        </View>
      </View>

      {!hasData ? (
        <View style={{ height: 200, justifyContent: 'center', alignItems: 'center', gap: 8 }}>
          <MaterialIcons name="bar-chart" size={36} color={colors.outlineVariant} />
          <Text style={[{ fontSize: 13, color: colors.onSurfaceVariant, textAlign: 'center' }, typography.body]}>
            {t.monthlyInsights.noWeeklyData}
          </Text>
        </View>
      ) : (
        <View style={styles.barsContainer}>
          {weeklyData.map((item, idx) => (
            <View key={idx} style={styles.barItem}>
              {/* Hours label above bar */}
              <Text style={[{ fontSize: 11, color: item.hours > 0 ? colors.onSurface : colors.outlineVariant, marginBottom: 6 }, typography.label]}>
                {item.hours > 0 ? formatHoursLabel(item.hours) : '—'}
              </Text>
              <View style={styles.barWrapper}>
                <View style={styles.barBackground}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: (item.heightPercent / 100) * maxBarHeight,
                        backgroundColor: item.color,
                      },
                    ]}
                  />
                </View>
              </View>
              <Text style={[styles.barLabel, typography.label]}>{item.label}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// ---- Tarjeta "Peak Productivity" ----
const PeakProductivityCard = ({ peakDay, peakHours }: { peakDay: string; peakHours: number }) => {
  const { styles, colors } = useMonthlyInsightsStyles();
  const { t } = useI18n();

  const noData = peakHours === 0;

  // Translate English day name to localized name
  const englishDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayIndex = englishDays.indexOf(peakDay);
  const localizedPeakDay = dayIndex >= 0 ? t.common.daysFull[dayIndex] : peakDay;

  const getMessage = () => {
    if (noData) return t.monthlyInsights.notProductiveYet;
    if (peakHours > 4) return t.monthlyInsights.greatConsistency;
    return t.monthlyInsights.keepPushing;
  };

  return (
    <View style={styles.peakCard}>
      <View style={styles.peakBlur} />
      <View style={styles.peakContent}>
        <MaterialIcons name="bolt" size={32} color={colors.tertiary} style={styles.peakIcon} />
        <Text style={[styles.peakLabel, typography.label]}>{t.monthlyInsights.peakProductivity}</Text>
        {!noData && <Text style={[styles.peakDay, typography.headline]}>{localizedPeakDay}</Text>}
        <Text style={[styles.peakDescription, typography.body]}>
          {getMessage()}
        </Text>
      </View>
    </View>
  );
};

// ---- Componente de sesión ----
const SessionItem = ({ session }: { session: Session }) => {
  const { styles } = useMonthlyInsightsStyles();
  return (
    <View style={[styles.sessionCard, { borderLeftColor: session.borderColor }]}>
      <View style={styles.sessionLeft}>
        <View style={[styles.sessionIconBg, { backgroundColor: `${session.color}10` }]}>
          <MaterialIcons name={session.icon as any} size={24} color={session.color} />
        </View>
        <View>
          <Text style={[styles.sessionTitle, typography.headline]}>{session.title}</Text>
          <Text style={[styles.sessionMeta, typography.body]}>{session.date}</Text>
        </View>
      </View>
      <View style={styles.sessionRight}>
        <Text style={[styles.sessionDuration, typography.headline]}>{session.duration}</Text>
        <Text style={[styles.sessionCategory, typography.label]}>{session.category}</Text>
      </View>
    </View>
  );
};

// ---- Barra de progreso del mes ----
const MonthProgress = () => {
  const { styles } = useMonthlyInsightsStyles();
  const { t, locale } = useI18n();
  const now = new Date();
  const currentDay = now.getDate();
  const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const progressPercent = Math.min(100, (currentDay / totalDaysInMonth) * 100);
  const monthName = now.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { month: 'long', year: 'numeric' });

  return (
    <View style={styles.monthProgressSection}>
      <View style={styles.monthProgressHeader}>
        <Text style={[styles.monthProgressLabel, typography.label]}>{t.monthlyInsights.monthProgress}</Text>
        <Text style={[styles.monthProgressPercent, typography.label]}>{Math.round(progressPercent)}%</Text>
      </View>
      <Text style={[styles.monthProgressSub, typography.body]}>
        {t.monthlyInsights.dayOfMonth(currentDay, totalDaysInMonth, monthName)}
      </Text>
      <View style={styles.monthProgressBarContainer}>
        <View style={[styles.monthProgressBarFill, { width: `${progressPercent}%` }]} />
      </View>
    </View>
  );
};

// ---------------------------------------------------------------------
// 5. Pantalla principal
// ---------------------------------------------------------------------
export default function App() {
  const router = useRouter();
  const { mode, colors, toggleMode } = useAppTheme();
  const { t, locale } = useI18n();
  const styles = createMonthlyInsightsStyles(colors);
  const [activeAppTab, setActiveAppTab] = useState<BottomTab>('monthly');
  const [activeTab, setActiveTab] = useState<'weeks' | 'log' | 'stats'>('stats');
  const [weeks, setWeeks] = useState<WeekData[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [weeklyData, setWeeklyData] = useState<WeekBarData[]>([]);
  const [weeklyTrend, setWeeklyTrend] = useState<number | null>(null);
  const [sessionsData, setSessionsData] = useState<Session[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const routeMap: Record<BottomTab, string> = {
    today: '/today',
    weekly: '/current-week',
    monthly: '/monthly-insights',
    'week-analysis': '/week-analysis',
    stats: '/today',
    settings: '/today',
  };

  const handleNavPress = (tab: BottomTab) => {
    setActiveAppTab(tab);
    const route = routeMap[tab];
    if (route) router.push(route as any);
  };

  const emptyMetrics = {
    totalHours: 0,
    averageDaily: 0,
    goalCompletion: 0,
    daysWorked: 0,
    peakDay: 'Tuesday',
    peakHours: 0,
  };

  const loadWeeks = useCallback(async () => {
    try {
      if (Platform.OS === 'web' || !AsyncStorage) {
        setMetrics(emptyMetrics);
        setWeeklyData([]);
        setWeeklyTrend(null);
        setSessionsData([]);
        return;
      }

      const stored = await AsyncStorage.getItem('@hourly/weeks');
      if (stored) {
        const parsedWeeks: WeekData[] = JSON.parse(stored);
        setWeeks(parsedWeeks);
        const calculatedMetrics = calculateMonthlyMetrics(parsedWeeks);
        setMetrics(calculatedMetrics);
        const wd = generateWeeklyData(parsedWeeks, colors, locale);
        setWeeklyData(wd);
        setWeeklyTrend(calculateWeeklyTrend(wd));
        setSessionsData(generateSessionsData(parsedWeeks, colors, locale));
      } else {
        setMetrics(emptyMetrics);
        setWeeklyData([]);
        setWeeklyTrend(null);
        setSessionsData([]);
      }
    } catch (error) {
      console.log('AsyncStorage / loadWeeks error:', error);
      setMetrics(emptyMetrics);
      setWeeklyData([]);
      setWeeklyTrend(null);
      setSessionsData([]);
    }
  }, [colors, locale]);

  useFocusEffect(
    useCallback(() => {
      loadWeeks();
    }, [loadWeeks])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadWeeks();
    setRefreshing(false);
  }, [loadWeeks]);

  // Renderizado según pestaña activa
  const renderContent = () => {
    if (activeTab !== 'stats') {
      return (
        <View style={styles.placeholderScreen}>
          <Text style={[styles.placeholderTitle, typography.headline]}>
            {activeTab === 'weeks' ? t.monthlyInsights.weeksOverview : t.monthlyInsights.logScreen}
          </Text>
          <Text style={[styles.placeholderSub, typography.body]}>
            {activeTab === 'weeks' ? t.monthlyInsights.reviewYourJourney : t.monthlyInsights.trackDailyActivity}
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 80 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={[styles.headerSubtitle, typography.body]}>{t.monthlyInsights.yourProgress}</Text>
          <Text style={[styles.headerTitle, typography.headline]}>{t.topBar.monthlyInsights}</Text>
          <MonthProgress />
        </View>

        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          <MetricCard
            icon="schedule"
            iconColor={colors.primary}
            label={t.monthlyInsights.totalHoursThisMonth}
            value={metrics ? formatHoursLabel(metrics.totalHours) : '0h 0m'}
            trend={weeklyTrend !== null ? `${weeklyTrend >= 0 ? '+' : ''}${weeklyTrend}%` : undefined}
            trendPositive={weeklyTrend !== null && weeklyTrend >= 0}
          />
          <MetricCard
            icon="timelapse"
            iconColor={colors.secondary}
            label={t.monthlyInsights.averageDailyHours}
            value={metrics ? metrics.averageDaily.toFixed(1) : '0.0'}
          />
          <MetricCard
            icon="calendar-today"
            iconColor={colors.tertiary}
            label={t.monthlyInsights.daysWorked}
            value={metrics ? `${metrics.daysWorked}` : '0'}
          />
          <MetricCard
            icon="verified"
            iconColor="#ffffff"
            label={t.monthlyInsights.goalCompletionRate}
            value={metrics ? `${metrics.goalCompletion}%` : '0%'}
            gradientColors={[colors.primary, colors.tertiary]}
            textColor="#ffffff"
            labelColor="rgba(255,255,255,0.8)"
          />
        </View>

        {/* Chart + Peak Productivity */}
        <View style={styles.chartRow}>
          <View style={styles.chartColumn}>
            <BarChart weeklyData={weeklyData} />
          </View>
          <View style={styles.peakColumn}>
            <PeakProductivityCard peakDay={metrics?.peakDay || 'Tuesday'} peakHours={metrics?.peakHours ?? 0} />
          </View>
        </View>

        {/* Longest Sessions */}
        {/* <View style={styles.sessionsHeader}>
          <Text style={[styles.sessionsTitle, typography.headline]}>Longest Sessions</Text>
          <TouchableOpacity onPress={handleViewAll}>
            <Text style={[styles.viewAllButton, typography.label]}>View All</Text>
          </TouchableOpacity>
        </View>

        {sessionsData.length > 0 ? (
          sessionsData.map((session) => (
            <SessionItem key={session.id} session={session} />
          ))
        ) : (
          <View style={styles.emptySessions}>
            <Text style={[styles.emptyText, typography.body]}>No sessions recorded this month.</Text>
          </View>
        )} */}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <TopBar
        title={t.topBar.monthlyInsights}
        mode={mode}
        onToggleTheme={toggleMode}
        onAvatarPress={() => {}}
      />
      {renderContent()}
      <BottomNav activeTab={activeAppTab} onTabPress={handleNavPress} />
    </SafeAreaView>
  );
}
