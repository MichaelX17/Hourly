import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
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
// 1. Color Palette (misma que en el HTML)
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

// Datos de ejemplo (basados en el HTML)
const daysData: DayData[] = [
  {
    id: 'mon',
    dayName: 'Mon',
    dayNumber: 21,
    month: 'August',
    sessions: [
      {
        id: 's1',
        title: 'Deep Work: UI Design',
        startTime: '09:00 AM',
        endTime: '12:30 PM',
        durationHours: 3.5,
        iconColor: Colors.tertiary,
      },
      {
        id: 's2',
        title: 'Weekly Sync Meeting',
        startTime: '01:30 PM',
        endTime: '02:45 PM',
        durationHours: 1.25,
        iconColor: Colors.secondary,
      },
      {
        id: 's3',
        title: 'Frontend Implementation',
        startTime: '03:00 PM',
        endTime: '06:00 PM',
        durationHours: 3,
        iconColor: Colors.primary,
      },
    ],
    totalHours: 7.75, // 7h 45m
  },
  {
    id: 'tue',
    dayName: 'Tue',
    dayNumber: 22,
    month: 'August',
    sessions: [
      {
        id: 's4',
        title: 'Design System Workshop',
        startTime: '08:00 AM',
        endTime: '10:30 AM',
        durationHours: 2.5,
        iconColor: Colors.tertiary,
      },
      {
        id: 's5',
        title: 'Code Review',
        startTime: '11:00 AM',
        endTime: '12:00 PM',
        durationHours: 1,
        iconColor: Colors.secondary,
      },
      {
        id: 's6',
        title: 'Client Call',
        startTime: '01:00 PM',
        endTime: '02:00 PM',
        durationHours: 1,
        iconColor: Colors.primary,
      },
      {
        id: 's7',
        title: 'Feature Implementation',
        startTime: '02:30 PM',
        endTime: '05:30 PM',
        durationHours: 3,
        iconColor: Colors.tertiary,
      },
      {
        id: 's8',
        title: 'Documentation',
        startTime: '06:00 PM',
        endTime: '07:00 PM',
        durationHours: 1,
        iconColor: Colors.secondary,
      },
    ],
    totalHours: 9.5, // 9h 30m
    isPeak: true,
  },
  {
    id: 'wed',
    dayName: 'Wed',
    dayNumber: 23,
    month: 'August',
    sessions: [
      {
        id: 's9',
        title: 'Morning Planning',
        startTime: '09:00 AM',
        endTime: '10:00 AM',
        durationHours: 1,
        iconColor: Colors.primary,
      },
      {
        id: 's10',
        title: 'Development Sprint',
        startTime: '10:30 AM',
        endTime: '03:30 PM',
        durationHours: 5,
        iconColor: Colors.tertiary,
      },
    ],
    totalHours: 6.25, // 6h 15m
  },
  {
    id: 'thu',
    dayName: 'Thu',
    dayNumber: 24,
    month: 'August',
    sessions: [
      {
        id: 's11',
        title: 'Backlog Grooming',
        startTime: '09:30 AM',
        endTime: '11:00 AM',
        durationHours: 1.5,
        iconColor: Colors.secondary,
      },
      {
        id: 's12',
        title: 'Development',
        startTime: '11:30 AM',
        endTime: '02:30 PM',
        durationHours: 3,
        iconColor: Colors.tertiary,
      },
      {
        id: 's13',
        title: 'Team Sync',
        startTime: '03:00 PM',
        endTime: '04:00 PM',
        durationHours: 1,
        iconColor: Colors.primary,
      },
      {
        id: 's14',
        title: 'Documentation',
        startTime: '04:30 PM',
        endTime: '06:30 PM',
        durationHours: 2,
        iconColor: Colors.secondary,
      },
    ],
    totalHours: 8.0,
  },
];

// ---------------------------------------------------------------------
// 4. Componentes
// ---------------------------------------------------------------------

// ---- Barra superior ----
const TopBar = ({ onBack, onSettings }: { onBack: () => void; onSettings: () => void }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.topBar, { paddingTop: insets.top || 16 }]}>
      <View style={styles.topBarLeft}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.logoText, typography.headline]}>Hourly</Text>
      </View>
      <View style={styles.topBarRight}>
        <TouchableOpacity onPress={onSettings}>
          <MaterialIcons name="settings" size={24} color={Colors.primary} style={styles.settingsIcon} />
        </TouchableOpacity>
        <Image
          source={{
            uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAdK5lnX5Vn9qGQ_UlFEdj2YFYtpWfiSiWUcwh5Oe49V4IK29JVOOX68ieiWfdmuDD5zRPuLy5XM-Nx5B6eIiUC0NlJpyaYVgS8nvsAX0SWflBxxF4WZ5a4GvRVbFJ-q_9ZHxVrH0oOkv86YdQSranAcBtspnNSpQz5pIUWJMG9baw69WcdZsftYZGReWjZLE4vh8H7otWFRJ3x31JovM5McA6DSzMqaWb4lPY8tbdyDpoHfLT3mhwm8bIWvGgPQ8kRotaSE3HR_Mw',
          }}
          style={styles.avatar}
        />
      </View>
    </View>
  );
};

// ---- Bento Highlights ----
const BentoHighlights = () => {
  // Datos simulados para el día más productivo (Tuesday)
  const peakDay = daysData.find(d => d.isPeak)!;

  // Gráfico de barras (alturas aproximadas basadas en las horas de cada día)
  const barHeights = daysData.map(day => {
    const maxHours = 10;
    const height = (day.totalHours / maxHours) * 80;
    return Math.max(20, height);
  });

  return (
    <View style={styles.highlightsContainer}>
      {/* Tarjeta principal: Día más productivo */}
      <View style={[styles.peakCard, { borderLeftColor: Colors.tertiary }]}>
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
                  idx === 1 ? { backgroundColor: Colors.tertiary } : { backgroundColor: Colors.surfaceContainer },
                ]}
              />
            ))}
          </View>
        </View>
      </View>

      {/* Tarjetas secundarias */}
      <View style={styles.statsColumn}>
        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: `${Colors.primaryContainer}10` }]}>
            <MaterialIcons name="history" size={24} color={Colors.primary} />
          </View>
          <View>
            <Text style={[styles.statLabel, typography.label]}>Total Sessions</Text>
            <Text style={[styles.statValue, typography.headline]}>12</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: `${Colors.tertiaryContainer}10` }]}>
            <MaterialIcons name="timer" size={24} color={Colors.tertiary} />
          </View>
          <View>
            <Text style={[styles.statLabel, typography.label]}>Average Session</Text>
            <Text style={[styles.statValue, typography.headline]}>3.5h</Text>
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
            <Text style={[styles.dayInitial, typography.label, day.isPeak && { color: Colors.tertiary }]}>
              {day.dayName}
            </Text>
            <Text style={[styles.dayNumber, typography.headline, day.isPeak && { color: Colors.tertiary }]}>
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
            <Text style={[styles.totalHours, typography.headline, day.isPeak && { color: Colors.tertiary }]}>
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
            color={Colors.outlineVariant}
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
                  color={session.iconColor || Colors.primary}
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
const WeeklySummaryCard = () => {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.blurBackground1} />
      <View style={styles.blurBackground2} />
      <Text style={[styles.summaryLabel, typography.label]}>Total Weekly Impact</Text>
      <View style={styles.totalHoursWrapper}>
        <Text style={[styles.totalHoursLarge, typography.headline]}>42.5</Text>
        <Text style={[styles.totalHoursUnit, typography.headline]}>HRS</Text>
      </View>
      <View style={styles.trendContainer}>
        <MaterialIcons name="trending-up" size={20} color={Colors.tertiary} />
        <Text style={[styles.trendText, typography.body]}>12% more than last week</Text>
      </View>
    </View>
  );
};

// ---- Navegación inferior (similar a la anterior) ----
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
  const [activeTab, setActiveTab] = useState<Tab>('weeks');
  const [expandedDayId, setExpandedDayId] = useState<string>('mon'); // Lunes expandido por defecto
  const insets = useSafeAreaInsets();

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
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 80 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={[styles.heroSubtitle, typography.label]}>Detailed View</Text>
          <Text style={[styles.heroTitle, typography.headline]}>Current Week: Aug 21 - Aug 27</Text>
        </View>

        {/* Bento Highlights */}
        <BentoHighlights />

        {/* Daily Breakdown */}
        <View style={styles.dailyBreakdownHeader}>
          <Text style={[styles.dailyBreakdownTitle, typography.headline]}>Daily Breakdown</Text>
        </View>

        {daysData.map((day) => (
          <DayItem
            key={day.id}
            day={day}
            isExpanded={expandedDayId === day.id}
            onToggle={() => toggleDay(day.id)}
          />
        ))}

        {/* Weekly Summary Card */}
        <WeeklySummaryCard />
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <TopBar onBack={handleBack} onSettings={handleSettings} />
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
    gap: 16,
  },
  backButton: {
    padding: 4,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primary,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  settingsIcon: {
    marginRight: 4,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceContainerHighest,
  },
  // Hero
  heroSection: {
    marginBottom: 24,
  },
  heroSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: Colors.primary,
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.onBackground,
  },
  // Bento Highlights
  highlightsContainer: {
    marginBottom: 32,
  },
  peakCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.tertiary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  peakLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  peakDayName: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.onBackground,
    marginTop: 8,
  },
  peakFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 16,
  },
  peakHours: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.primary,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  bar: {
    width: 12,
    borderRadius: 6,
    backgroundColor: Colors.surfaceContainer,
  },
  statsColumn: {
    gap: 12,
  },
  statCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.onBackground,
  },
  // Daily Breakdown
  dailyBreakdownHeader: {
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  dailyBreakdownTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.onBackground,
  },
  dayCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 24,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  peakDayCard: {
    borderWidth: 2,
    borderColor: `${Colors.tertiary}30`,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  dayInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  dayCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  peakDayCircle: {
    backgroundColor: `${Colors.tertiaryContainer}20`,
  },
  dayInitial: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: Colors.onSurfaceVariant,
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.onBackground,
    lineHeight: 20,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.onBackground,
  },
  sessionCount: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  dayRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  totalHours: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
  },
  peakBadge: {
    backgroundColor: Colors.tertiaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    marginTop: 4,
  },
  peakBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.onTertiaryContainer,
    textTransform: 'uppercase',
  },
  sessionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  sessionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    padding: 16,
    borderRadius: 16,
  },
  sessionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  sessionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.onBackground,
  },
  sessionTime: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  sessionDuration: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.onBackground,
  },
  // Weekly Summary Card
  summaryCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 32,
    padding: 32,
    marginTop: 24,
    marginBottom: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    position: 'relative',
  },
  blurBackground1: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: `${Colors.tertiary}10`,
  },
  blurBackground2: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: `${Colors.primary}10`,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 16,
  },
  totalHoursWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    gap: 8,
  },
  totalHoursLarge: {
    fontSize: 96,
    fontWeight: '800',
    color: Colors.onBackground,
    lineHeight: 100,
  },
  totalHoursUnit: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.onSurfaceVariant,
  },
  trendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  trendText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.tertiary,
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
});