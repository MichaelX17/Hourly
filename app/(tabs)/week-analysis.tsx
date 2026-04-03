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
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { createWeekAnalysisStyles } from './tabStyles';
import { useAppTheme } from './ThemeContext';
import { TopBar } from './TopBar';

// ---------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------
const typography = {
  headline: { fontFamily: 'System', fontWeight: '800' as const },
  body: { fontFamily: 'System', fontWeight: '400' as const },
  label: { fontFamily: 'System', fontWeight: '600' as const },
};

// ---------------------------------------------------------------------
// Data Models
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

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------
const useWeekAnalysisStyles = () => {
  const { colors } = useAppTheme();
  const styles = createWeekAnalysisStyles(colors);
  return { styles, colors };
};

const formatHM = (hours: number) => {
  const h = Math.floor(hours);
  const m = Math.round((hours % 1) * 60);
  return `${h}h ${m}m`;
};

const getDayLabel = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
};

/** Consistency score 0-100: measures how evenly hours are spread across active days */
const calcConsistency = (entries: DayEntry[]): number => {
  const active = entries.filter((e) => e.hours > 0);
  if (active.length <= 1) return active.length === 1 ? 100 : 0;
  const mean = active.reduce((s, e) => s + e.hours, 0) / active.length;
  const variance = active.reduce((s, e) => s + Math.pow(e.hours - mean, 2), 0) / active.length;
  const cv = Math.sqrt(variance) / mean; // coefficient of variation
  return Math.round(Math.max(0, Math.min(100, (1 - cv) * 100)));
};

/** Longest consecutive days with hours > 0 */
const calcStreak = (entries: DayEntry[]): number => {
  let max = 0;
  let curr = 0;
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  for (const e of sorted) {
    if (e.hours > 0) {
      curr++;
      if (curr > max) max = curr;
    } else {
      curr = 0;
    }
  }
  return max;
};

// ---------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------

/** Week-over-Week Comparison */
const WeekComparison = ({
  current,
  previous,
}: {
  current: WeekData | null;
  previous: WeekData | null;
}) => {
  const { styles, colors } = useWeekAnalysisStyles();

  const curHours = current ? parseFloat(current.totalHours) || 0 : 0;
  const prevHours = previous ? parseFloat(previous.totalHours) || 0 : 0;
  const delta = curHours - prevHours;
  const pctChange = prevHours > 0 ? Math.round((delta / prevHours) * 100) : 0;
  const isUp = delta >= 0;

  const curActive = current?.dayEntries?.filter((e) => e.hours > 0).length ?? 0;
  const prevActive = previous?.dayEntries?.filter((e) => e.hours > 0).length ?? 0;
  const activeDelta = curActive - prevActive;

  return (
    <View style={styles.comparisonCard}>
      <Text style={[styles.sectionLabel, typography.label]}>Week over Week</Text>
      <View style={styles.comparisonRow}>
        {/* Hours delta */}
        <View style={styles.comparisonMetric}>
          <View style={[styles.deltaChip, isUp ? styles.deltaUp : styles.deltaDown]}>
            <MaterialIcons
              name={isUp ? 'trending-up' : 'trending-down'}
              size={16}
              color={isUp ? colors.tertiary : colors.error}
            />
            <Text
              style={[
                styles.deltaText,
                typography.label,
                { color: isUp ? colors.tertiary : colors.error },
              ]}
            >
              {isUp ? '+' : ''}
              {formatHM(delta)}
            </Text>
          </View>
          <Text style={[styles.comparisonMetricLabel, typography.body]}>hours vs prev</Text>
        </View>

        {/* Percentage change */}
        <View style={styles.comparisonMetric}>
          <Text style={[styles.comparisonBigNum, typography.headline, { color: isUp ? colors.tertiary : colors.error }]}>
            {isUp ? '+' : ''}
            {pctChange}%
          </Text>
          <Text style={[styles.comparisonMetricLabel, typography.body]}>change</Text>
        </View>

        {/* Active days delta */}
        <View style={styles.comparisonMetric}>
          <Text style={[styles.comparisonBigNum, typography.headline]}>
            {activeDelta >= 0 ? '+' : ''}
            {activeDelta}
          </Text>
          <Text style={[styles.comparisonMetricLabel, typography.body]}>active days</Text>
        </View>
      </View>

      {previous && (
        <Text style={[styles.comparisonFooter, typography.body]}>
          Compared to {previous.dateRange}
        </Text>
      )}
      {!previous && (
        <Text style={[styles.comparisonFooter, typography.body]}>
          No previous week to compare
        </Text>
      )}
    </View>
  );
};

/** Daily Distribution — horizontal bar chart sorted by hours */
const DailyDistribution = ({ entries }: { entries: DayEntry[] }) => {
  const { styles, colors } = useWeekAnalysisStyles();
  const maxHours = Math.max(...entries.map((e) => e.hours), 1);
  const sorted = [...entries].sort((a, b) => b.hours - a.hours);

  return (
    <View style={styles.distributionCard}>
      <Text style={[styles.sectionLabel, typography.label]}>Daily Distribution</Text>
      {sorted.map((entry) => {
        const pct = (entry.hours / maxHours) * 100;
        const isTop = entry.hours === maxHours && maxHours > 0;
        return (
          <View key={entry.date} style={styles.distRow}>
            <Text style={[styles.distDayLabel, typography.label, isTop && { color: colors.tertiary }]}>
              {getDayLabel(entry.date)}
            </Text>
            <View style={styles.distBarTrack}>
              <View
                style={[
                  styles.distBarFill,
                  { width: `${Math.max(pct, 2)}%` },
                  isTop && { backgroundColor: colors.tertiary },
                ]}
              />
            </View>
            <Text style={[styles.distHours, typography.headline, isTop && { color: colors.tertiary }]}>
              {formatHM(entry.hours)}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

/** Consistency Score */
const ConsistencyScore = ({ entries }: { entries: DayEntry[] }) => {
  const { styles, colors } = useWeekAnalysisStyles();
  const score = calcConsistency(entries);
  const streak = calcStreak(entries);

  const getScoreColor = () => {
    if (score >= 75) return colors.tertiary;
    if (score >= 40) return colors.primary;
    return colors.error;
  };

  const getScoreLabel = () => {
    if (score >= 75) return 'Very Consistent';
    if (score >= 40) return 'Moderate';
    return 'Irregular';
  };

  const scoreColor = getScoreColor();
  const circumference = 2 * Math.PI * 42; // radius 42
  const strokeDash = (score / 100) * circumference;

  return (
    <View style={styles.consistencyCard}>
      <View style={styles.consistencyRow}>
        {/* Score ring */}
        <View style={styles.scoreRing}>
          <View style={[styles.scoreRingBg, { borderColor: colors.surfaceContainerHigh }]} />
          <View
            style={[
              styles.scoreRingFg,
              {
                borderColor: scoreColor,
                borderTopColor: scoreColor,
                borderRightColor: score > 25 ? scoreColor : 'transparent',
                borderBottomColor: score > 50 ? scoreColor : 'transparent',
                borderLeftColor: score > 75 ? scoreColor : 'transparent',
              },
            ]}
          />
          <View style={styles.scoreCenter}>
            <Text style={[styles.scoreNum, typography.headline, { color: scoreColor }]}>{score}</Text>
          </View>
        </View>

        <View style={styles.consistencyInfo}>
          <Text style={[styles.consistencyTitle, typography.headline]}>Consistency</Text>
          <View style={[styles.consistencyBadge, { backgroundColor: `${scoreColor}15` }]}>
            <Text style={[styles.consistencyBadgeText, typography.label, { color: scoreColor }]}>
              {getScoreLabel()}
            </Text>
          </View>
          <View style={styles.streakRow}>
            <MaterialIcons name="local-fire-department" size={18} color={colors.tertiary} />
            <Text style={[styles.streakText, typography.body]}>
              {streak} day{streak !== 1 ? 's' : ''} streak
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

/** Day Notes Feed — shows only days with notes */
const NotesFeed = ({ entries }: { entries: DayEntry[] }) => {
  const { styles, colors } = useWeekAnalysisStyles();
  const withNotes = entries.filter((e) => e.note && e.note.trim().length > 0);

  if (withNotes.length === 0) {
    return (
      <View style={styles.notesFeedCard}>
        <Text style={[styles.sectionLabel, typography.label]}>Day Notes</Text>
        <View style={styles.notesEmpty}>
          <MaterialIcons name="sticky-note-2" size={28} color={colors.outlineVariant} />
          <Text style={[styles.notesEmptyText, typography.body]}>
            No notes this week. Add notes when logging hours for them to appear here.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.notesFeedCard}>
      <Text style={[styles.sectionLabel, typography.label]}>Day Notes</Text>
      {withNotes.map((entry) => {
        const d = new Date(entry.date);
        return (
          <View key={entry.date} style={styles.noteItem}>
            <View style={styles.noteIconCol}>
              <View style={styles.noteDot} />
              <View style={styles.noteLine} />
            </View>
            <View style={styles.noteContent}>
              <View style={styles.noteHeader}>
                <Text style={[styles.noteDay, typography.label]}>
                  {d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </Text>
                <Text style={[styles.noteHours, typography.label]}>{formatHM(entry.hours)}</Text>
              </View>
              <Text style={[styles.noteText, typography.body]}>{entry.note}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

/** Goal Pacing Indicator */
const GoalPacing = ({
  week,
  entries,
}: {
  week: WeekData;
  entries: DayEntry[];
}) => {
  const { styles, colors } = useWeekAnalysisStyles();

  const totalHours = entries.reduce((s, e) => s + e.hours, 0);
  const goalHours = week.goalPercentage > 0 ? (totalHours / week.goalPercentage) * 100 : 40; // derive goal or default 40h
  const pct = goalHours > 0 ? Math.min((totalHours / goalHours) * 100, 100) : 0;

  // Projected: total so far / active days * 7
  const activeDays = entries.filter((e) => e.hours > 0).length;
  const totalDays = entries.length || 7;
  const elapsed = totalDays; // week is fully elapsed if viewing past weeks
  const projected = activeDays > 0 ? (totalHours / elapsed) * 7 : 0;
  const projectedDelta = projected - goalHours;
  const onTrack = projectedDelta >= 0;

  return (
    <View style={styles.pacingCard}>
      <Text style={[styles.sectionLabel, typography.label]}>Goal Pacing</Text>

      {/* Progress bar */}
      <View style={styles.pacingBarContainer}>
        <View style={styles.pacingBarTrack}>
          <View
            style={[styles.pacingBarFill, { width: `${Math.max(pct, 2)}%` }]}
          />
          {/* Goal marker */}
          <View style={[styles.pacingGoalMarker, { left: '100%' }]}>
            <View style={[styles.pacingGoalLine, { backgroundColor: colors.outlineVariant }]} />
          </View>
        </View>
      </View>

      <View style={styles.pacingLabels}>
        <Text style={[styles.pacingActual, typography.headline]}>{formatHM(totalHours)}</Text>
        <Text style={[styles.pacingGoal, typography.body]}>/ {formatHM(goalHours)} goal</Text>
      </View>

      {/* Projection */}
      <View style={[styles.pacingProjection, { backgroundColor: onTrack ? `${colors.tertiary}10` : `${colors.error}10` }]}>
        <MaterialIcons
          name={onTrack ? 'rocket-launch' : 'warning'}
          size={18}
          color={onTrack ? colors.tertiary : colors.error}
        />
        <Text style={[styles.pacingProjectionText, typography.body, { color: onTrack ? colors.tertiary : colors.error }]}>
          {onTrack
            ? `On track — projected ${formatHM(projected)} by week end`
            : `Behind pace — projected ${formatHM(projected)}, ${formatHM(Math.abs(projectedDelta))} short`}
        </Text>
      </View>
    </View>
  );
};

/** Week Picker Modal */
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
  const { styles } = useWeekAnalysisStyles();
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
// Main Screen
// ---------------------------------------------------------------------
export default function WeekAnalysisScreen() {
  const router = useRouter();
  const { mode, colors, toggleMode } = useAppTheme();
  const styles = createWeekAnalysisStyles(colors);
  const insets = useSafeAreaInsets();
  const [activeAppTab, setActiveAppTab] = useState<BottomTab>('week-analysis' as BottomTab);

  const [weeks, setWeeks] = useState<WeekData[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<WeekData | null>(null);
  const [previousWeek, setPreviousWeek] = useState<WeekData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showWeekPicker, setShowWeekPicker] = useState(false);

  const routeMap: Record<BottomTab, string> = {
    today: '/today',
    weekly: '/current-week',
    monthly: '/monthly-insights',
    'week-analysis': '/week-analysis',
    stats: '/today',
    settings: '/today',
  } as any;

  const handleNavPress = (tab: BottomTab) => {
    setActiveAppTab(tab);
    const route = (routeMap as any)[tab];
    if (route) router.push(route as any);
  };

  const loadWeeks = async () => {
    setIsLoading(true);
    try {
      const stored = await AsyncStorage.getItem('@hourly/weeks');
      if (stored) {
        const parsed: WeekData[] = JSON.parse(stored);
        setWeeks(parsed);
        const active = parsed.find((w) => w.isActive) || parsed[0] || null;
        setSelectedWeek(active);

        // Find previous week
        if (active) {
          const idx = parsed.findIndex((w) => w.id === active.id);
          setPreviousWeek(idx < parsed.length - 1 ? parsed[idx + 1] : null);
        }
      } else {
        setWeeks([]);
        setSelectedWeek(null);
        setPreviousWeek(null);
      }
    } catch (err) {
      console.warn('Error loading weeks:', err);
      setWeeks([]);
      setSelectedWeek(null);
      setPreviousWeek(null);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadWeeks();
    }, [])
  );

  const selectWeek = (week: WeekData) => {
    setSelectedWeek(week);
    const idx = weeks.findIndex((w) => w.id === week.id);
    setPreviousWeek(idx < weeks.length - 1 ? weeks[idx + 1] : null);
  };

  const entries = selectedWeek?.dayEntries ?? [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <TopBar
        title="Week Analysis"
        mode={mode}
        onToggleTheme={toggleMode}
        onAvatarPress={() => {}}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 160 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.heroSection}>
          <Text style={[styles.heroSubtitle, typography.label]}>Deep Dive</Text>
          <Text style={[styles.heroTitle, typography.headline]}>
            {selectedWeek ? selectedWeek.dateRange : 'Week Analysis'}
          </Text>
        </View>

        {!selectedWeek ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="analytics" size={48} color={colors.outlineVariant} />
            <Text style={[styles.emptyText, typography.body]}>
              No weekly records found. Create a week on the home screen to see analysis here.
            </Text>
          </View>
        ) : (
          <>
            <WeekComparison current={selectedWeek} previous={previousWeek} />
            <DailyDistribution entries={entries} />
            <ConsistencyScore entries={entries} />
            <GoalPacing week={selectedWeek} entries={entries} />
            <NotesFeed entries={entries} />
          </>
        )}
      </ScrollView>

      {/* Week selector floating button */}
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
