import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
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
        const entryDate = new Date(entry.date);
        if (entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear) {
          totalHours += entry.hours;
          if (entry.hours > 0) daysWorked++;
          const dayKey = getDayOfWeek(entryDate);
          dayHours[dayKey] = (dayHours[dayKey] || 0) + entry.hours;
          const weekNum = getWeekNumber(entryDate);
          weekHours[weekNum] = (weekHours[weekNum] || 0) + entry.hours;
        }
      });
    }
  });

  const averageDaily = daysWorked > 0 ? totalHours / daysWorked : 0;
  const goalHours = 8 * daysWorked; // Assume 8 hours goal per day
  const goalCompletion = goalHours > 0 ? Math.round((totalHours / goalHours) * 100) : 0;

  // Peak day
  let peakDay = 'Tuesday'; // default
  let maxHours = 0;
  Object.entries(dayHours).forEach(([day, hours]) => {
    if (hours > maxHours) {
      maxHours = hours;
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
  };
};

const generateWeeklyData = (weekHours: { [key: number]: number }) => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Get last 4 weeks
  const weeks = [];
  for (let i = 3; i >= 0; i--) {
    const weekDate = new Date(today);
    weekDate.setDate(today.getDate() - (i * 7));
    const weekNum = getWeekNumber(weekDate);
    const hours = weekHours[weekNum] || 0;
    const maxHours = 40; // Assume max 40 hours/week
    const heightPercent = maxHours > 0 ? Math.min((hours / maxHours) * 100, 100) : 0;
    weeks.push({
      week: `W${4 - i}`,
      heightPercent,
      color: i === 0 ? Colors.tertiary : Colors.primary, // Current week in tertiary
    });
  }
  return weeks;
};

const generateSessionsData = (weeks: WeekData[]): Session[] => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const dayEntries: { date: Date; hours: number; note?: string }[] = [];

  weeks.forEach(week => {
    if (week.dayEntries) {
      week.dayEntries.forEach(entry => {
        const entryDate = new Date(entry.date);
        if (entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear && entry.hours > 0) {
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
  const colors = [Colors.primary, Colors.secondary, Colors.tertiary];

  return topEntries.map((entry, idx) => ({
    id: entry.date.toISOString(),
    title: entry.note || `Work Session on ${entry.date.toLocaleDateString()}`,
    date: entry.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    category: categories[idx % categories.length],
    duration: formatHoursLabel(entry.hours),
    durationHours: entry.hours,
    icon: icons[idx % icons.length],
    color: colors[idx % colors.length],
    borderColor: colors[idx % colors.length],
  }));
};

// ---------------------------------------------------------------------
// 6. Componentes
// ---------------------------------------------------------------------

// ---- Barra superior ----
const TopBar = ({ onSettings }: { onSettings: () => void }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.topBar, { paddingTop: insets.top || 16 }]}>
      <View style={styles.topBarLeft}>
        <Image
          source={{
            uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDoEApOZsvxDcmAlm62WHhJyWqdXRT5m_q7ljJ5XX1fKkCTj-oSjNEYGC4CCbA88Hqj0pd5b786MX8nXmbZEz7QJzADhIK6J5wdFYH6ZOhKvRLpwYnBwoFs17wKDzvlw9V2Pd9ppDFLhDY06ph5WoJ6GgC62yClRGoK4XiK1sDpXD1AXlP8uIYSzv93s1VSXLC7lFFzvUGhccpJOtyXdguiQSBoD6nKTqAefEAnnxngigFg26IzY1rcg_wvw0bu1d1PZtdmQkATEwI',
          }}
          style={styles.avatar}
        />
        <Text style={[styles.logoText, typography.headline]}>Hourly</Text>
      </View>
      <TouchableOpacity onPress={onSettings}>
        <MaterialIcons name="settings" size={24} color={Colors.primary} />
      </TouchableOpacity>
    </View>
  );
};

// ---- Tarjeta métrica ----
const MetricCard = ({
  icon,
  iconColor,
  label,
  value,
  trend,
  trendPositive = true,
  gradientColors,
  textColor = Colors.onSurface,
  labelColor = Colors.onSurfaceVariant,
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
  const cardContent = (
    <>
      <View style={styles.metricHeader}>
        <MaterialIcons name={icon as any} size={28} color={iconColor || Colors.primary} />
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
const BarChart = ({ weeklyData }: { weeklyData: any[] }) => {
  const maxBarHeight = 160; // altura máxima de la barra en píxeles

  return (
    <View style={styles.chartContainer}>
      <View style={styles.chartHeader}>
        <View>
          <Text style={[styles.chartTitle, typography.headline]}>Weekly Trends</Text>
          <Text style={[styles.chartSubtitle, typography.body]}>Hours worked over the last 4 weeks</Text>
        </View>
        <View style={styles.legend}>
          <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
          <Text style={[styles.legendText, typography.label]}>Actual</Text>
        </View>
      </View>
      <View style={styles.barsContainer}>
        {weeklyData.map((item, idx) => (
          <View key={idx} style={styles.barItem}>
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
            <Text style={[styles.barLabel, typography.label]}>{item.week}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// ---- Tarjeta "Peak Productivity" ----
const PeakProductivityCard = ({ peakDay }: { peakDay: string }) => {
  return (
    <View style={styles.peakCard}>
      <View style={styles.peakBlur} />
      <View style={styles.peakContent}>
        <MaterialIcons name="bolt" size={32} color={Colors.tertiary} style={styles.peakIcon} />
        <Text style={[styles.peakLabel, typography.label]}>Peak Productivity</Text>
        <Text style={[styles.peakDay, typography.headline]}>{peakDay}</Text>
        <Text style={[styles.peakDescription, typography.body]}>
          Your most focused sessions usually start around 10:15 AM.
        </Text>
      </View>
    </View>
  );
};

// ---- Componente de sesión ----
const SessionItem = ({ session }: { session: Session }) => {
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

// ---- Navegación inferior ----
type Tab = 'weeks' | 'log' | 'stats';

const BottomNav = ({
  activeTab,
  onTabPress,
}: {
  activeTab: Tab;
  onTabPress: (tab: Tab) => void;
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bottomNav, { paddingBottom: insets.bottom || 12 }]}>
      <TouchableOpacity
        style={[styles.navItem, activeTab === 'weeks' && styles.navItemActive]}
        onPress={() => onTabPress('weeks')}
      >
        <MaterialIcons
          name="calendar-view-week"
          size={24}
          color={activeTab === 'weeks' ? Colors.primary : Colors.outline}
        />
        <Text style={[styles.navLabel, typography.label, activeTab === 'weeks' && styles.navLabelActive]}>
          Weeks
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navItem, activeTab === 'log' && styles.navItemActive]}
        onPress={() => onTabPress('log')}
      >
        <MaterialIcons
          name="add-circle-outline"
          size={24}
          color={activeTab === 'log' ? Colors.primary : Colors.outline}
        />
        <Text style={[styles.navLabel, typography.label, activeTab === 'log' && styles.navLabelActive]}>
          Log
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navItem, activeTab === 'stats' && styles.navItemActive]}
        onPress={() => onTabPress('stats')}
      >
        <MaterialIcons
          name="insights"
          size={24}
          color={activeTab === 'stats' ? Colors.primary : Colors.outline}
        />
        <Text style={[styles.navLabel, typography.label, activeTab === 'stats' && styles.navLabelActive]}>
          Stats
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// ---------------------------------------------------------------------
// 5. Pantalla principal
// ---------------------------------------------------------------------
export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('stats');
  const [weeks, setWeeks] = useState<WeekData[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [sessionsData, setSessionsData] = useState<Session[]>([]);
  const insets = useSafeAreaInsets();

  const loadWeeks = async () => {
    try {
      const stored = await AsyncStorage.getItem('@hourly/weeks');
      if (stored) {
        const parsedWeeks: WeekData[] = JSON.parse(stored);
        setWeeks(parsedWeeks);
        const calculatedMetrics = calculateMonthlyMetrics(parsedWeeks);
        setMetrics(calculatedMetrics);
        setWeeklyData(generateWeeklyData(calculatedMetrics.weekHours));
        setSessionsData(generateSessionsData(parsedWeeks));
      } else {
        setMetrics({
          totalHours: 0,
          averageDaily: 0,
          goalCompletion: 0,
          daysWorked: 0,
          peakDay: 'Tuesday',
        });
        setWeeklyData([]);
        setSessionsData([]);
      }
    } catch (error) {
      console.error('Error loading weeks:', error);
    }
  };

  useEffect(() => {
    loadWeeks();
  }, []);

  const handleSettings = () => {
    alert('Settings pressed');
  };

  const handleViewAll = () => {
    alert('View all sessions');
  };

  // Renderizado según pestaña activa
  const renderContent = () => {
    if (activeTab !== 'stats') {
      return (
        <View style={styles.placeholderScreen}>
          <Text style={[styles.placeholderTitle, typography.headline]}>
            {activeTab === 'weeks' ? 'Weeks Overview' : 'Log Screen'}
          </Text>
          <Text style={[styles.placeholderSub, typography.body]}>
            {activeTab === 'weeks' ? 'Review your journey' : 'Track your daily activity'}
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
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={[styles.headerSubtitle, typography.body]}>Your Progress</Text>
          <Text style={[styles.headerTitle, typography.headline]}>Monthly Insights</Text>
        </View>

        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          <MetricCard
            icon="schedule"
            iconColor={Colors.primary}
            label="Total Hours this month"
            value={metrics ? formatHoursLabel(metrics.totalHours) : '0h 0m'}
            trend="+12%"
            trendPositive
          />
          <MetricCard
            icon="timelapse"
            iconColor={Colors.secondary}
            label="Average daily hours"
            value={metrics ? metrics.averageDaily.toFixed(1) : '0.0'}
          />
          <MetricCard
            icon="calendar-today"
            iconColor={Colors.tertiary}
            label="Days worked"
            value={metrics ? `${metrics.daysWorked}` : '0'}
          />
          <MetricCard
            icon="verified"
            label="Goal completion rate"
            value={metrics ? `${metrics.goalCompletion}%` : '0%'}
            gradientColors={[Colors.primary, Colors.primaryContainer]}
            textColor={Colors.onPrimary}
            labelColor={Colors.primaryFixed}
          />
        </View>

        {/* Chart + Peak Productivity */}
        <View style={styles.chartRow}>
          <View style={styles.chartColumn}>
            <BarChart weeklyData={weeklyData} />
          </View>
          <View style={styles.peakColumn}>
            <PeakProductivityCard peakDay={metrics?.peakDay || 'Tuesday'} />
          </View>
        </View>

        {/* Longest Sessions */}
        <View style={styles.sessionsHeader}>
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
        )}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <TopBar onSettings={handleSettings} />
      {renderContent()}
      <BottomNav activeTab={activeTab} onTabPress={setActiveTab} />
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
    paddingBottom: 16,
    backgroundColor: Colors.background,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryContainer,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primary,
  },
  // Header
  headerSection: {
    marginBottom: 24,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primary,
  },
  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 16,
  },
  metricCard: {
    width: (screenWidth - 48 - 16) / 2, // dos columnas con 16px de gap
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 24,
    padding: 16,
    justifyContent: 'space-between',
    height: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 4,
  },
  gradientCard: {
    backgroundColor: 'transparent',
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  trendBadge: {
    backgroundColor: `${Colors.tertiary}30`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  trendPositive: {
    backgroundColor: `${Colors.tertiaryFixed}30`,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.tertiary,
  },
  metricFooter: {
    marginTop: 'auto',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  // Chart
  chartRow: {
    marginBottom: 32,
    gap: 16,
  },
  chartColumn: {
    marginBottom: 16,
  },
  chartContainer: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 32,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 4,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.onSurface,
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: Colors.onSurfaceVariant,
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 200,
    gap: 12,
  },
  barItem: {
    flex: 1,
    alignItems: 'center',
  },
  barWrapper: {
    width: '100%',
    height: 160,
    justifyContent: 'flex-end',
  },
  barBackground: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  barLabel: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.onSurfaceVariant,
  },
  // Peak Card
  peakColumn: {
    marginBottom: 16,
  },
  peakCard: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 32,
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
    height: 200,
    justifyContent: 'center',
  },
  peakBlur: {
    position: 'absolute',
    right: -16,
    top: -16,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: `${Colors.tertiaryFixed}20`,
  },
  peakContent: {
    zIndex: 2,
  },
  peakIcon: {
    marginBottom: 12,
  },
  peakLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: Colors.onSurfaceVariant,
    marginBottom: 6,
  },
  peakDay: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 8,
  },
  peakDescription: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    lineHeight: 20,
  },
  // Sessions
  sessionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sessionsTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  viewAllButton: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  sessionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 24,
    padding: 20,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  sessionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  sessionIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.onSurface,
    marginBottom: 4,
  },
  sessionMeta: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  sessionRight: {
    alignItems: 'flex-end',
  },
  sessionDuration: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 4,
  },
  sessionCategory: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: Colors.onSurfaceVariant,
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
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 8,
  },
  navItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  navItemActive: {
    backgroundColor: `${Colors.primaryFixedDim}20`,
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
  emptySessions: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
  },
});