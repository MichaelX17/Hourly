import { BottomNav, BottomTab } from '@/components/BottomNav';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import * as DocumentPicker from 'expo-document-picker';
import { File as FSFile, Paths } from 'expo-file-system';
import { StorageAccessFramework } from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import {
  Animated,
  Modal,
  NativeModules,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import { createCurrentWeekStyles } from './tabStyles';
import { useAppTheme } from './ThemeContext';
import { TopBar } from './TopBar';

const isBlurAvailable = !!NativeModules.ExpoBlur;

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

const useCurrentWeekStyles = () => {
  const { colors } = useAppTheme();
  const styles = createCurrentWeekStyles(colors);
  return { styles, colors };
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
  onDelete: (week: WeekData) => void;
  onView: (week: WeekData) => void;
  onExport: (week: WeekData) => void;
};

const WeekCard = ({ data, onEdit, onDelete, onView, onExport }: WeekCardProps) => {
  const { headline, body, label } = useTypography();
  const { styles, colors } = useCurrentWeekStyles();

  return (
    <View style={styles.weekCard}>
      <TouchableOpacity style={styles.weekCardTouchable} onPress={() => onView(data)} activeOpacity={0.85}>
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
                    ? { backgroundColor: colors.primaryFixed }
                    : { backgroundColor: colors.surfaceContainerHigh },
                ]}
              >
                <Text
                  style={[
                    styles.dayLetter,
                    isActive ? { color: colors.primary } : { color: colors.outline },
                    label,
                  ]}
                >
                  {letter}
                </Text>
              </View>
            );
          })}
        </View>
        <MaterialIcons name="arrow-forward" size={20} color={colors.outlineVariant} />
      </View>
    </TouchableOpacity>
    <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.surfaceContainerHigh }}>
      <TouchableOpacity
        style={[styles.editWeekButton, { flex: 1 }]}
        onPress={() => onEdit(data)}
      >
        <MaterialIcons name="edit" size={16} color={colors.primary} />
        <Text style={[styles.editWeekText, body]}>Edit</Text>
      </TouchableOpacity>
      <View style={{ width: 1, backgroundColor: colors.surfaceContainerHigh }} />
      <TouchableOpacity
        style={[styles.editWeekButton, { flex: 1 }]}
        onPress={() => onExport(data)}
      >
        <MaterialIcons name="file-upload" size={16} color={colors.tertiary} />
        <Text style={[styles.editWeekText, { color: colors.tertiary }, body]}>Export</Text>
      </TouchableOpacity>
      <View style={{ width: 1, backgroundColor: colors.surfaceContainerHigh }} />
      <TouchableOpacity
        style={[styles.editWeekButton, { flex: 1 }]}
        onPress={() => onDelete(data)}
      >
        <MaterialIcons name="delete-outline" size={16} color={colors.error} />
        <Text style={[styles.editWeekText, { color: colors.error }, body]}>Delete</Text>
      </TouchableOpacity>
    </View>
  </View>
  );
};

// ---- Week View Modal ----
type WeekViewModalProps = {
  week: WeekData | null;
  onClose: () => void;
  onAlert: (title: string, message: string, type: 'success' | 'error') => void;
};

const WeekViewModal = ({ week, onClose, onAlert }: WeekViewModalProps) => {
  const { headline, body, label } = useTypography();
  const { styles, colors } = useCurrentWeekStyles();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(60)).current;

  React.useEffect(() => {
    if (week) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 200 }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(60);
    }
  }, [week]);

  const shareCardRef = React.useRef<any>(null);
  const [isSharing, setIsSharing] = React.useState(false);

  if (!week) return null;

  const letters = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const handleShare = async () => {
    if (!shareCardRef.current) return;
    try {
      setIsSharing(true);
      // Small delay to ensure the hidden view has fully rendered
      await new Promise(resolve => setTimeout(resolve, 100));
      const uri = await captureRef(shareCardRef, { format: 'png', quality: 1 });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share week summary' });
    } catch {
      onAlert('Error', 'Could not share the week summary.', 'error');
    } finally {
      setIsSharing(false);
    }
  };

  const cardStyle = [
    {
      width: '100%' as const,
      maxHeight: '80%' as const,
      backgroundColor: colors.surface,
      borderRadius: 28,
      overflow: 'hidden' as const,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.35,
      shadowRadius: 24,
      elevation: 20,
    },
    { transform: [{ translateY: slideAnim }] },
  ];

  const accentColor = week.barColor ?? colors.primary;
  const goalReached = week.goalPercentage >= 100;

  const overlayContent = (
    <>
      <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onPress={onClose} />

      <Animated.View style={cardStyle}>
        {/* Accent strip */}
        <View style={{ height: 4, backgroundColor: accentColor }} />

        {/* Hero Header */}
        <View style={{ backgroundColor: accentColor + '12', padding: 20, paddingBottom: 22 }}>
          {/* Action buttons */}
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginBottom: 16 }}>
            <TouchableOpacity
              onPress={handleShare}
              disabled={isSharing}
              style={{
                width: 34, height: 34, borderRadius: 17,
                backgroundColor: colors.surface + 'cc',
                justifyContent: 'center', alignItems: 'center',
                opacity: isSharing ? 0.4 : 1,
              }}
            >
              <MaterialIcons name="share" size={17} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 34, height: 34, borderRadius: 17,
                backgroundColor: colors.surface + 'cc',
                justifyContent: 'center', alignItems: 'center',
              }}
            >
              <MaterialIcons name="close" size={19} color={colors.onSurface} />
            </TouchableOpacity>
          </View>

          {/* Date label */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 }}>
            <MaterialIcons name="date-range" size={12} color={accentColor} />
            <Text style={[{ fontSize: 12, color: accentColor }, label]}>{week.dateRange}</Text>
          </View>

          {/* Total hours */}
          <Text style={[{ fontSize: 48, color: colors.onSurface, lineHeight: 52 }, headline]}>
            {week.totalHours}
          </Text>
          <Text style={[{ fontSize: 12, color: colors.onSurfaceVariant, marginTop: 3 }, body]}>
            total this week
          </Text>

          {/* Badges */}
          {(week.isActive || week.customLabel) && (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              {week.isActive && (
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 5,
                  backgroundColor: accentColor, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
                }}>
                  <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.7)' }} />
                  <Text style={[{ fontSize: 11, color: '#fff' }, label]}>Active</Text>
                </View>
              )}
              {week.customLabel && (
                <View style={{
                  backgroundColor: (week.customLabelColor ?? colors.primary) + '22',
                  paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
                  borderWidth: 1, borderColor: (week.customLabelColor ?? colors.primary) + '55',
                }}>
                  <Text style={[{ fontSize: 11, color: week.customLabelColor ?? colors.primary }, label]}>
                    {week.customLabel}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 12 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Metrics strip */}
          <View style={{ backgroundColor: colors.surfaceContainerLow, borderRadius: 20, overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row' }}>
              <View style={{ flex: 1, padding: 16, alignItems: 'center' }}>
                <Text style={[{ fontSize: 28, color: colors.onSurface }, headline]}>{week.activeDays}</Text>
                <Text style={[{ fontSize: 11, color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 3 }, body]}>
                  active{'\n'}days
                </Text>
              </View>
              <View style={{ width: 1, backgroundColor: colors.surfaceContainerHigh, marginVertical: 12 }} />
              <View style={{ flex: 1, padding: 16, alignItems: 'center' }}>
                <Text style={[{ fontSize: 28, color: colors.onSurface }, headline]}>{week.totalDays}</Text>
                <Text style={[{ fontSize: 11, color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 3 }, body]}>
                  total{'\n'}days
                </Text>
              </View>
              <View style={{ width: 1, backgroundColor: colors.surfaceContainerHigh, marginVertical: 12 }} />
              <View style={{
                flex: 1, padding: 16, alignItems: 'center',
                backgroundColor: goalReached ? accentColor + '18' : 'transparent',
              }}>
                <Text style={[{ fontSize: 28, color: goalReached ? accentColor : colors.onSurface }, headline]}>
                  {week.goalPercentage}%
                </Text>
                <Text style={[{ fontSize: 11, color: goalReached ? accentColor : colors.onSurfaceVariant, textAlign: 'center', marginTop: 3 }, body]}>
                  {goalReached ? 'goal ✓' : 'of goal'}
                </Text>
              </View>
            </View>
          </View>

          {/* Progress */}
          <View style={{ backgroundColor: colors.surfaceContainerLow, borderRadius: 20, padding: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
              <Text style={[{ fontSize: 13, color: colors.onSurfaceVariant }, label]}>Weekly progress</Text>
              <Text style={[{ fontSize: 22, color: accentColor }, headline]}>{week.goalPercentage}%</Text>
            </View>
            <View style={{ height: 12, backgroundColor: colors.surfaceContainerHigh, borderRadius: 999, overflow: 'hidden' }}>
              <View style={{
                height: '100%',
                width: `${Math.min(week.goalPercentage, 100)}%`,
                backgroundColor: accentColor,
                borderRadius: 999,
              }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}>
              <Text style={[{ fontSize: 10, color: colors.onSurfaceVariant }, body]}>0%</Text>
              <Text style={[{ fontSize: 10, color: colors.onSurfaceVariant }, body]}>100%</Text>
            </View>
          </View>

          {/* Daily breakdown */}
          {week.dayEntries && week.dayEntries.length > 0 && (
            <View style={{ backgroundColor: colors.surfaceContainerLow, borderRadius: 20, padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                <MaterialIcons name="view-list" size={14} color={colors.onSurfaceVariant} />
                <Text style={[{ fontSize: 13, color: colors.onSurfaceVariant }, label]}>Daily breakdown</Text>
              </View>
              {week.dayEntries.map((entry, idx) => {
                const dayLabel = letters[idx] ?? `D${idx + 1}`;
                const isActive = entry.hours > 0;
                const maxHrs = Math.max(...week.dayEntries!.map((e) => e.hours), 1);
                const pct = (entry.hours / maxHrs) * 100;
                return (
                  <View
                    key={idx}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 10,
                      marginBottom: idx < week.dayEntries!.length - 1 ? 10 : 0,
                    }}
                  >
                    <View style={{
                      width: 36, height: 36, borderRadius: 10,
                      backgroundColor: isActive ? accentColor : colors.surfaceContainerHigh,
                      justifyContent: 'center', alignItems: 'center',
                    }}>
                      <Text style={[{ fontSize: 10, color: isActive ? '#fff' : colors.outline }, label]}>
                        {dayLabel}
                      </Text>
                    </View>
                    <View style={{ flex: 1, height: 6, backgroundColor: colors.surfaceContainerHigh, borderRadius: 999, overflow: 'hidden' }}>
                      <View style={{
                        height: '100%', width: `${pct}%`,
                        backgroundColor: accentColor, borderRadius: 999,
                        opacity: isActive ? 1 : 0,
                      }} />
                    </View>
                    <Text style={[{ fontSize: 12, color: isActive ? colors.onSurface : colors.outline, width: 40, textAlign: 'right' }, label]}>
                      {formatEntryTime(entry.hours)}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </>
  );

  const sharedStyle = { flex: 1, justifyContent: 'center' as const, alignItems: 'center' as const, padding: 24 };

  // Full-content card for sharing (off-screen, no scroll/height constraints)
  const shareCardContent = (
    <View
      ref={shareCardRef}
      style={{
        position: 'absolute',
        left: -9999,
        top: 0,
        width: 380,
        backgroundColor: colors.surface,
        borderRadius: 28,
        overflow: 'hidden',
      }}
      collapsable={false}
    >
      {/* Accent strip */}
      <View style={{ height: 4, backgroundColor: accentColor }} />

      {/* Hero Header */}
      <View style={{ backgroundColor: accentColor + '12', padding: 20, paddingBottom: 22 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 }}>
          <MaterialIcons name="date-range" size={12} color={accentColor} />
          <Text style={[{ fontSize: 12, color: accentColor }, label]}>{week.dateRange}</Text>
        </View>
        <Text style={[{ fontSize: 48, color: colors.onSurface, lineHeight: 52 }, headline]}>
          {week.totalHours}
        </Text>
        <Text style={[{ fontSize: 12, color: colors.onSurfaceVariant, marginTop: 3 }, body]}>
          total this week
        </Text>
        {(week.isActive || week.customLabel) && (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            {week.isActive && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: accentColor, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 }}>
                <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.7)' }} />
                <Text style={[{ fontSize: 11, color: '#fff' }, label]}>Active</Text>
              </View>
            )}
            {week.customLabel && (
              <View style={{ backgroundColor: (week.customLabelColor ?? colors.primary) + '22', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1, borderColor: (week.customLabelColor ?? colors.primary) + '55' }}>
                <Text style={[{ fontSize: 11, color: week.customLabelColor ?? colors.primary }, label]}>{week.customLabel}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Content */}
      <View style={{ padding: 16, gap: 12 }}>
        {/* Metrics */}
        <View style={{ backgroundColor: colors.surfaceContainerLow, borderRadius: 20, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row' }}>
            <View style={{ flex: 1, padding: 16, alignItems: 'center' }}>
              <Text style={[{ fontSize: 28, color: colors.onSurface }, headline]}>{week.activeDays}</Text>
              <Text style={[{ fontSize: 11, color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 3 }, body]}>active{'\n'}days</Text>
            </View>
            <View style={{ width: 1, backgroundColor: colors.surfaceContainerHigh, marginVertical: 12 }} />
            <View style={{ flex: 1, padding: 16, alignItems: 'center' }}>
              <Text style={[{ fontSize: 28, color: colors.onSurface }, headline]}>{week.totalDays}</Text>
              <Text style={[{ fontSize: 11, color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 3 }, body]}>total{'\n'}days</Text>
            </View>
            <View style={{ width: 1, backgroundColor: colors.surfaceContainerHigh, marginVertical: 12 }} />
            <View style={{ flex: 1, padding: 16, alignItems: 'center', backgroundColor: goalReached ? accentColor + '18' : 'transparent' }}>
              <Text style={[{ fontSize: 28, color: goalReached ? accentColor : colors.onSurface }, headline]}>{week.goalPercentage}%</Text>
              <Text style={[{ fontSize: 11, color: goalReached ? accentColor : colors.onSurfaceVariant, textAlign: 'center', marginTop: 3 }, body]}>{goalReached ? 'goal ✓' : 'of goal'}</Text>
            </View>
          </View>
        </View>

        {/* Progress */}
        <View style={{ backgroundColor: colors.surfaceContainerLow, borderRadius: 20, padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <Text style={[{ fontSize: 13, color: colors.onSurfaceVariant }, label]}>Weekly progress</Text>
            <Text style={[{ fontSize: 22, color: accentColor }, headline]}>{week.goalPercentage}%</Text>
          </View>
          <View style={{ height: 12, backgroundColor: colors.surfaceContainerHigh, borderRadius: 999, overflow: 'hidden' }}>
            <View style={{ height: '100%', width: `${Math.min(week.goalPercentage, 100)}%`, backgroundColor: accentColor, borderRadius: 999 }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}>
            <Text style={[{ fontSize: 10, color: colors.onSurfaceVariant }, body]}>0%</Text>
            <Text style={[{ fontSize: 10, color: colors.onSurfaceVariant }, body]}>100%</Text>
          </View>
        </View>

        {/* Daily breakdown */}
        {week.dayEntries && week.dayEntries.length > 0 && (
          <View style={{ backgroundColor: colors.surfaceContainerLow, borderRadius: 20, padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 }}>
              <MaterialIcons name="view-list" size={14} color={colors.onSurfaceVariant} />
              <Text style={[{ fontSize: 13, color: colors.onSurfaceVariant }, label]}>Daily breakdown</Text>
            </View>
            {week.dayEntries.map((entry, idx) => {
              const dayLabel = letters[idx] ?? `D${idx + 1}`;
              const isActive = entry.hours > 0;
              const maxHrs = Math.max(...week.dayEntries!.map((e) => e.hours), 1);
              const pct = (entry.hours / maxHrs) * 100;
              return (
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: idx < week.dayEntries!.length - 1 ? 10 : 0 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: isActive ? accentColor : colors.surfaceContainerHigh, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={[{ fontSize: 10, color: isActive ? '#fff' : colors.outline }, label]}>{dayLabel}</Text>
                  </View>
                  <View style={{ flex: 1, height: 6, backgroundColor: colors.surfaceContainerHigh, borderRadius: 999, overflow: 'hidden' }}>
                    <View style={{ height: '100%', width: `${pct}%`, backgroundColor: accentColor, borderRadius: 999, opacity: isActive ? 1 : 0 }} />
                  </View>
                  <Text style={[{ fontSize: 12, color: isActive ? colors.onSurface : colors.outline, width: 40, textAlign: 'right' }, label]}>
                    {formatEntryTime(entry.hours)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );

  return (
    <Modal visible={!!week} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
        {isBlurAvailable ? (
          <BlurView intensity={60} tint="dark" style={sharedStyle}>
            {overlayContent}
          </BlurView>
        ) : (
          <View style={[sharedStyle, { backgroundColor: 'rgba(0,0,0,0.75)' }]}>
            {overlayContent}
          </View>
        )}
        {shareCardContent}
      </Animated.View>
    </Modal>
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

// Short time display for individual entries: "45m", "1h", "1h 30m"
const formatEntryTime = (hours: number): string => {
  if (hours <= 0) return '—';
  const h = Math.floor(hours);
  const m = Math.round((hours % 1) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
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
// Overlap Detection & Import/Export Helpers
// ---------------------------------------------------------------------

/** Check if two date ranges overlap. Dates are ISO strings (YYYY-MM-DD). */
const rangesOverlap = (
  startA: string | undefined,
  endA: string | undefined,
  startB: string | undefined,
  endB: string | undefined,
): boolean => {
  if (!startA || !endA || !startB || !endB) return false;
  return startA <= endB && endA >= startB;
};

/** Find all existing weeks whose date ranges overlap with a candidate range. */
const findOverlapping = (
  candidateStart: string,
  candidateEnd: string,
  existing: WeekData[],
  excludeId?: string,
): WeekData[] => {
  return existing.filter(
    (w) => w.id !== excludeId && rangesOverlap(candidateStart, candidateEnd, w.startDate, w.endDate),
  );
};

type ExportPayload = {
  version: 1;
  appName: 'Hourly';
  exportDate: string;
  weeks: WeekData[];
};

const buildExportPayload = (weeks: WeekData[]): ExportPayload => ({
  version: 1,
  appName: 'Hourly',
  exportDate: new Date().toISOString(),
  weeks,
});

const isValidExportPayload = (data: any): data is ExportPayload => {
  return (
    data &&
    data.version === 1 &&
    data.appName === 'Hourly' &&
    Array.isArray(data.weeks) &&
    data.weeks.every(
      (w: any) => w.id && typeof w.dateRange === 'string' && typeof w.totalHours === 'string',
    )
  );
};

type ImportConflict = {
  imported: WeekData;
  existing: WeekData;
  choice: 'existing' | 'imported' | null;
};

/** Merge imported weeks into existing, returning { clean, conflicts }. */
const classifyImportedWeeks = (
  imported: WeekData[],
  existing: WeekData[],
): { clean: WeekData[]; conflicts: ImportConflict[] } => {
  const clean: WeekData[] = [];
  const conflicts: ImportConflict[] = [];

  for (const iw of imported) {
    // Skip exact duplicate IDs
    if (existing.some((e) => e.id === iw.id)) continue;

    const overlaps = findOverlapping(iw.startDate ?? '', iw.endDate ?? '', existing);
    if (overlaps.length > 0) {
      // Take the first overlap as the conflict (date ranges are unique per design)
      conflicts.push({ imported: iw, existing: overlaps[0], choice: null });
    } else {
      clean.push(iw);
    }
  }

  return { clean, conflicts };
};

/** Merge weeks sorted by startDate descending. */
const mergeAndSort = (a: WeekData[], b: WeekData[]): WeekData[] => {
  const merged = [...a, ...b];
  return merged.sort((x, y) => {
    const dateX = x.startDate ?? '';
    const dateY = y.startDate ?? '';
    return dateY.localeCompare(dateX); // newest first
  });
};

// ---------------------------------------------------------------------
// 5. Main Screen
// ---------------------------------------------------------------------
export default function CurrentWeek() {
  const router = useRouter();
  const { mode, colors, toggleMode } = useAppTheme();
  const { fontsLoaded, headline, body, label } = useTypography();
  const insets = useSafeAreaInsets();

  const [activeAppTab, setActiveAppTab] = useState<BottomTab>('weekly');
  const [selectedWeekForView, setSelectedWeekForView] = useState<WeekData | null>(null);
  const styles = createCurrentWeekStyles(colors);
  const [weeks, setWeeks] = useState<WeekData[]>(weeksData);
  const [showWeekModal, setShowWeekModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedWeekId, setSelectedWeekId] = useState<string | null>(null);
  const [weekToDelete, setWeekToDelete] = useState<WeekData | null>(null);
  const [weekStart, setWeekStart] = useState('');
  const [weekDays, setWeekDays] = useState(5);
  const [dayMinutes, setDayMinutes] = useState<number[]>(Array(5).fill(0));
  const [dayNotes, setDayNotes] = useState<string[]>(Array(5).fill(''));
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerTemp, setDatePickerTemp] = useState('');
  const [appAlert, setAppAlert] = useState<{ title: string; message: string; type: 'success' | 'error' } | null>(null);
  const [showImportConflicts, setShowImportConflicts] = useState(false);
  const [importConflicts, setImportConflicts] = useState<ImportConflict[]>([]);
  const [importClean, setImportClean] = useState<WeekData[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showDataMenu, setShowDataMenu] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [pendingExportWeeks, setPendingExportWeeks] = useState<WeekData[]>([]);

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

  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
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
    setDayMinutes(week.dayEntries?.map((entry) => Math.round(entry.hours * 60)) ?? Array(week.totalDays).fill(0));
    setDayNotes(week.dayEntries?.map((entry) => entry.note ?? '') ?? Array(week.totalDays).fill(''));
    setShowWeekModal(true);
  };

  const handleDeleteWeek = (week: WeekData) => {
    setWeekToDelete(week);
  };

  const handleDayCountChange = (value: number) => {
    const newCount = Math.min(7, Math.max(1, value));
    setWeekDays(newCount);
    setDayMinutes((prev) => {
      const next = [...prev];
      while (next.length < newCount) next.push(0);
      next.length = newCount;
      return next;
    });
    setDayNotes((prev) => {
      const next = [...prev];
      while (next.length < newCount) next.push('');
      next.length = newCount;
      return next;
    });
  };

  const resetWeekForm = () => {
    setWeekStart('');
    setWeekDays(5);
    setDayMinutes(Array(5).fill(0));
    setDayNotes(Array(5).fill(''));
    setSelectedDayIndex(null);
    setSelectedWeekId(null);
    setModalMode('create');
  };

  // ---- Export handlers ----
  const handleExportWeeks = (weeksToExport: WeekData[]) => {
    setPendingExportWeeks(weeksToExport);
    setShowExportModal(true);
  };

  const buildExportFile = (weeksToExport: WeekData[]) => {
    const payload = buildExportPayload(weeksToExport);
    const json = JSON.stringify(payload, null, 2);
    const fileName = weeksToExport.length === 1
      ? `hourly-week-${weeksToExport[0].startDate ?? 'export'}.json`
      : `hourly-all-weeks-${new Date().toISOString().slice(0, 10)}.json`;
    return { json, fileName };
  };

  const handleExportShare = async () => {
    setShowExportModal(false);
    try {
      const { json, fileName } = buildExportFile(pendingExportWeeks);
      const file = new FSFile(Paths.cache, fileName);
      file.write(json);
      await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Export weeks' });
    } catch {
      setAppAlert({ title: 'Export failed', message: 'Could not export weeks.', type: 'error' });
    }
  };

  const handleExportDownload = async () => {
    setShowExportModal(false);
    try {
      const { json, fileName } = buildExportFile(pendingExportWeeks);

      if (Platform.OS === 'android') {
        const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!permissions.granted) return;
        const fileUri = await StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          fileName.replace('.json', ''),
          'application/json',
        );
        await StorageAccessFramework.writeAsStringAsync(fileUri, json);
        setAppAlert({ title: 'Downloaded', message: `File saved as ${fileName}`, type: 'success' });
      } else {
        // iOS: save via share sheet (native "Save to Files")
        const file = new FSFile(Paths.cache, fileName);
        file.write(json);
        await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Save file' });
      }
    } catch {
      setAppAlert({ title: 'Download failed', message: 'Could not save the file.', type: 'error' });
    }
  };

  // ---- Import handler ----
  const handleImportWeeks = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const fileUri = result.assets[0].uri;
      const importedFile = new FSFile(fileUri);
      const content = await importedFile.text();

      let parsed: any;
      try {
        parsed = JSON.parse(content);
      } catch {
        setAppAlert({ title: 'Invalid file', message: 'The selected file is not valid JSON.', type: 'error' });
        return;
      }

      if (!isValidExportPayload(parsed)) {
        setAppAlert({ title: 'Invalid format', message: 'This file is not a valid Hourly export.', type: 'error' });
        return;
      }

      const { clean, conflicts } = classifyImportedWeeks(parsed.weeks, weeks);

      if (conflicts.length === 0) {
        // No conflicts — merge directly
        setWeeks((prev) => mergeAndSort(prev, clean));
        setAppAlert({
          title: 'Import successful',
          message: `${clean.length} week${clean.length !== 1 ? 's' : ''} imported.`,
          type: 'success',
        });
      } else {
        // Conflicts found — show resolution modal
        setImportClean(clean);
        setImportConflicts(conflicts.map((c) => ({ ...c, choice: null })));
        setShowImportConflicts(true);
      }
    } catch {
      setAppAlert({ title: 'Import failed', message: 'Could not read the selected file.', type: 'error' });
    }
  };

  const handleResolveConflicts = () => {
    // Check all conflicts have been resolved
    const unresolved = importConflicts.filter((c) => c.choice === null);
    if (unresolved.length > 0) {
      setAppAlert({ title: 'Resolve all conflicts', message: `${unresolved.length} conflict${unresolved.length !== 1 ? 's' : ''} still need your decision.`, type: 'error' });
      return;
    }

    let updatedWeeks = [...weeks];

    // Process conflicts
    for (const conflict of importConflicts) {
      if (conflict.choice === 'imported') {
        // Remove existing, add imported
        updatedWeeks = updatedWeeks.filter((w) => w.id !== conflict.existing.id);
        updatedWeeks.push(conflict.imported);
      }
      // If choice === 'existing', keep as-is (do nothing)
    }

    // Add clean (non-conflicting) imports
    updatedWeeks = mergeAndSort(updatedWeeks, importClean);

    setWeeks(updatedWeeks);
    setShowImportConflicts(false);
    setImportConflicts([]);
    setImportClean([]);

    const importedCount = importClean.length + importConflicts.filter((c) => c.choice === 'imported').length;
    setAppAlert({
      title: 'Import complete',
      message: `${importedCount} week${importedCount !== 1 ? 's' : ''} imported, ${importConflicts.filter((c) => c.choice === 'existing').length} kept existing.`,
      type: 'success',
    });
  };

  const handleSaveWeek = async () => {
    if (!isValidIsoDate(weekStart)) {
      setAppAlert({ title: 'Invalid date', message: 'Please enter start date in YYYY-MM-DD format.', type: 'error' });
      return;
    }

    const start = new Date(`${weekStart}T00:00:00`);
    if (start > today || start < minStartDate) {
      setAppAlert({ title: 'Date out of range', message: 'Start date must be between 6 days ago and today.', type: 'error' });
      return;
    }

    if (weekDays < 1 || weekDays > 7) {
      setAppAlert({ title: 'Invalid week length', message: 'Weeks must contain 1 to 7 days.', type: 'error' });
      return;
    }

    // Overlap check
    const candidateEnd = addDays(start, weekDays - 1);
    const overlapping = findOverlapping(
      start.toISOString().slice(0, 10),
      candidateEnd.toISOString().slice(0, 10),
      weeks,
      selectedWeekId ?? undefined,
    );
    if (overlapping.length > 0) {
      const conflictRange = overlapping[0].dateRange;
      setAppAlert({
        title: 'Date range conflict',
        message: `This week overlaps with an existing week (${conflictRange}). Each week must cover a unique date range.`,
        type: 'error',
      });
      return;
    }

    const dayEntries: DayEntry[] = [];
    let total = 0;
    for (let i = 0; i < weekDays; i++) {
      const dayDate = addDays(start, i);
      const mins = dayMinutes[i] ?? 0;
      const hours = mins / 60;
      const note = (dayNotes[i] ?? '').trim();
      dayEntries.push({ date: dayDate.toISOString().slice(0, 10), hours, ...(note ? { note } : {}) });
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
      barColor: colors.secondaryContainer,
    };

    if (modalMode === 'edit' && selectedWeekId) {
      setWeeks((prev) => prev.map((w) => (w.id === selectedWeekId ? newWeek : w)));
      setAppAlert({ title: 'Week updated', message: 'Week changes have been saved.', type: 'success' });
    } else {
      setWeeks((prev) => [newWeek, ...prev]);
      setAppAlert({ title: 'Week created', message: 'New week created successfully.', type: 'success' });
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
            const [y, m] = entry.date.split('-').map(Number);
            if (m - 1 === currentMonth && y === currentYear) {
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
            const [y, m] = entry.date.split('-').map(Number);
            if (m - 1 === currentMonth && y === currentYear && entry.hours > 0) {
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
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <TopBar
        title="Current Week"
        mode={mode}
        onToggleTheme={toggleMode}
        onAvatarPress={() => {}}
      />

      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              try {
                const json = await AsyncStorage.getItem(STORAGE_KEY);
                if (json) {
                  setWeeks(JSON.parse(json));
                }
              } catch (e) {
                console.warn('Refresh failed', e);
              } finally {
                setRefreshing(false);
              }
            }}
          />
        }
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
            style={[styles.outlineButton, { backgroundColor: colors.surfaceContainerHigh, flex: 1 }]}
            onPress={() => {
              setModalMode('create');
              setShowWeekModal(true);
            }}
          >
            <MaterialIcons name="add" size={24} color={colors.primary} />
            <Text style={[styles.outlineButtonText, headline]}>Add Week</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.outlineButton, { backgroundColor: colors.surfaceContainerHigh }]}
            onPress={() => setShowDataMenu(true)}
          >
            <MaterialIcons name="swap-vert" size={24} color={colors.tertiary} />
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
                  onPress={() => {
                    setDatePickerTemp(weekStart);
                    setShowDatePicker(true);
                  }}
                >
                  <Text style={{ color: weekStart ? colors.onSurface : colors.onSurfaceVariant }}>
                    {weekStart || 'Select start date'}
                  </Text>
                  <MaterialIcons name="calendar-today" size={16} color={colors.onSurfaceVariant} />
                </TouchableOpacity>

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

              <Text style={styles.modalLabel}>Time per day</Text>
              {Array.from({ length: weekDays }).map((_, index) => {
                let dayDateLabel = '';
                if (isValidIsoDate(weekStart)) {
                  dayDateLabel = formatDateLabel(addDays(new Date(`${weekStart}T00:00:00`), index));
                }
                const totalMins = dayMinutes[index] ?? 0;
                const displayH = Math.floor(totalMins / 60);
                const displayM = totalMins % 60;
                const hasTime = totalMins > 0;
                const notePreview = (dayNotes[index] ?? '').trim();
                return (
                  <TouchableOpacity
                    key={index}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: colors.surfaceContainerHigh,
                      borderRadius: 14,
                      padding: 14,
                      marginBottom: 8,
                    }}
                    onPress={() => setSelectedDayIndex(index)}
                  >
                    <View style={{
                      width: 36, height: 36, borderRadius: 10,
                      backgroundColor: hasTime ? colors.primary : colors.surfaceContainerHighest,
                      justifyContent: 'center', alignItems: 'center',
                    }}>
                      <Text style={[{ fontSize: 11, color: hasTime ? '#fff' : colors.outline }, label]}>
                        D{index + 1}
                      </Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[{ fontSize: 13, color: colors.onSurface }, label]}>
                        Day {index + 1}{dayDateLabel ? ` · ${dayDateLabel}` : ''}
                      </Text>
                      {notePreview ? (
                        <Text style={{ fontSize: 11, color: colors.onSurfaceVariant, marginTop: 2 }} numberOfLines={1}>
                          {notePreview}
                        </Text>
                      ) : null}
                    </View>
                    <Text style={[{
                      fontSize: 15,
                      color: hasTime ? colors.primary : colors.onSurfaceVariant,
                      marginRight: 4,
                    }, headline]}>
                      {hasTime ? `${displayH}h ${displayM.toString().padStart(2, '0')}m` : '—'}
                    </Text>
                    <MaterialIcons name="chevron-right" size={20} color={colors.outlineVariant} />
                  </TouchableOpacity>
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

        {/* Day Time Picker Bottom Sheet */}
        <Modal
          visible={selectedDayIndex !== null}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedDayIndex(null)}
        >
          <View style={{ flex: 1, justifyContent: 'flex-end' }}>
            <Pressable
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' }}
              onPress={() => setSelectedDayIndex(null)}
            />
            <View
              style={{
                backgroundColor: colors.surface,
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                padding: 24,
                paddingBottom: insets.bottom + 24,
                maxHeight: '85%',
              }}
            >
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.outlineVariant, alignSelf: 'center', marginBottom: 20 }} />

              {selectedDayIndex !== null && (() => {
                const idx = selectedDayIndex;
                const totalMins = dayMinutes[idx] ?? 0;
                const currentH = Math.floor(totalMins / 60);
                const currentM = totalMins % 60;
                let dayDateLabel = '';
                if (isValidIsoDate(weekStart)) {
                  dayDateLabel = ` · ${formatDateLabel(addDays(new Date(`${weekStart}T00:00:00`), idx))}`;
                }

                return (
                  <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    <Text style={[{ fontSize: 13, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1 }, label]}>
                      Day {idx + 1}{dayDateLabel}
                    </Text>

                    {/* Big time display */}
                    <Text style={[{ fontSize: 44, color: colors.onSurface, marginTop: 8, marginBottom: 20 }, headline]}>
                      {currentH}h {currentM.toString().padStart(2, '0')}m
                    </Text>

                    {/* Quick presets */}
                    <Text style={[{ fontSize: 12, color: colors.onSurfaceVariant, marginBottom: 8 }, label]}>
                      Quick set
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        {[0, 120, 240, 360, 480, 600].map((mins) => {
                          const isSelected = totalMins === mins;
                          const presetLabel = mins === 0 ? '0h' : `${mins / 60}h`;
                          return (
                            <TouchableOpacity
                              key={mins}
                              style={{
                                paddingHorizontal: 18,
                                paddingVertical: 10,
                                borderRadius: 12,
                                backgroundColor: isSelected ? colors.primary : colors.surfaceContainerHigh,
                              }}
                              onPress={() => {
                                setDayMinutes(prev => {
                                  const next = [...prev];
                                  next[idx] = mins;
                                  return next;
                                });
                              }}
                            >
                              <Text style={[{ fontSize: 14, color: isSelected ? '#fff' : colors.onSurface }, label]}>
                                {presetLabel}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </ScrollView>

                    {/* Hours grid */}
                    <Text style={[{ fontSize: 12, color: colors.onSurfaceVariant, marginBottom: 8 }, label]}>
                      Hours
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                      {Array.from({ length: 13 }, (_, h) => (
                        <TouchableOpacity
                          key={h}
                          style={{
                            width: 46,
                            height: 40,
                            borderRadius: 10,
                            backgroundColor: h === currentH ? colors.primary : colors.surfaceContainerHigh,
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                          onPress={() => {
                            setDayMinutes(prev => {
                              const next = [...prev];
                              next[idx] = h * 60 + currentM;
                              return next;
                            });
                          }}
                        >
                          <Text style={[{ fontSize: 14, color: h === currentH ? '#fff' : colors.onSurface }, label]}>
                            {h}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Minutes grid */}
                    <Text style={[{ fontSize: 12, color: colors.onSurfaceVariant, marginBottom: 8 }, label]}>
                      Minutes
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
                      {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                        <TouchableOpacity
                          key={m}
                          style={{
                            width: 50,
                            height: 40,
                            borderRadius: 10,
                            backgroundColor: m === currentM ? colors.primary : colors.surfaceContainerHigh,
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                          onPress={() => {
                            setDayMinutes(prev => {
                              const next = [...prev];
                              next[idx] = currentH * 60 + m;
                              return next;
                            });
                          }}
                        >
                          <Text style={[{ fontSize: 14, color: m === currentM ? '#fff' : colors.onSurface }, label]}>
                            {m.toString().padStart(2, '0')}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Notes input */}
                    <Text style={[{ fontSize: 12, color: colors.onSurfaceVariant, marginBottom: 8 }, label]}>
                      Note (optional)
                    </Text>
                    <TextInput
                      style={{
                        backgroundColor: colors.surfaceContainerHigh,
                        borderRadius: 12,
                        padding: 14,
                        color: colors.onSurface,
                        fontSize: 14,
                        minHeight: 60,
                        textAlignVertical: 'top',
                      }}
                      placeholder="Add a note for this day..."
                      placeholderTextColor={colors.onSurfaceVariant}
                      multiline
                      value={dayNotes[idx] ?? ''}
                      onChangeText={(text: string) => {
                        setDayNotes(prev => {
                          const next = [...prev];
                          next[idx] = text;
                          return next;
                        });
                      }}
                    />
                  </ScrollView>
                );
              })()}

              <TouchableOpacity
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: 'center',
                  marginTop: 16,
                }}
                onPress={() => setSelectedDayIndex(null)}
              >
                <Text style={[{ fontSize: 15, color: '#fff', fontWeight: '600' }, body]}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Weeks Cards */}
        {weeks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, body]}>No weeks yet. Create one to begin tracking your hours.</Text>
          </View>
        ) : (
          weeks.map((week) => (
            <WeekCard
              key={week.id}
              data={week}
              onEdit={handleEditWeek}
              onDelete={handleDeleteWeek}
              onView={(w) => setSelectedWeekForView(w)}
              onExport={(w) => handleExportWeeks([w])}
            />
          ))
        )}

        <WeekViewModal
          week={selectedWeekForView}
          onClose={() => setSelectedWeekForView(null)}
          onAlert={(title, message, type) => setAppAlert({ title, message, type })}
        />

        {/* Delete confirmation modal */}
        <Modal visible={!!weekToDelete} transparent animationType="fade" onRequestClose={() => setWeekToDelete(null)}>
          <Pressable
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
            onPress={() => setWeekToDelete(null)}
          >
            <Pressable
              style={{
                backgroundColor: colors.surface,
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                padding: 24,
                paddingBottom: insets.bottom + 24,
              }}
              onPress={() => {}}
            >
              {/* Handle */}
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.outlineVariant, alignSelf: 'center', marginBottom: 20 }} />

              {/* Icon */}
              <View style={{
                width: 56, height: 56, borderRadius: 28,
                backgroundColor: colors.errorContainer,
                justifyContent: 'center', alignItems: 'center',
                alignSelf: 'center', marginBottom: 16,
              }}>
                <MaterialIcons name="delete-outline" size={28} color={colors.error} />
              </View>

              <Text style={[{ fontSize: 18, color: colors.onSurface, textAlign: 'center', marginBottom: 8 }, headline]}>
                Delete week?
              </Text>
              <Text style={[{ fontSize: 14, color: colors.onSurfaceVariant, textAlign: 'center', lineHeight: 20, marginBottom: 28 }, body]}>
                {weekToDelete?.dateRange}
                {'\n'}This action cannot be undone.
              </Text>

              <TouchableOpacity
                style={{
                  backgroundColor: colors.error,
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: 'center',
                  marginBottom: 10,
                }}
                onPress={() => {
                  setWeeks((prev) => prev.filter((w) => w.id !== weekToDelete!.id));
                  setWeekToDelete(null);
                }}
              >
                <Text style={[{ fontSize: 15, color: '#fff' }, headline]}>Delete</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  backgroundColor: colors.surfaceContainerHigh,
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: 'center',
                }}
                onPress={() => setWeekToDelete(null)}
              >
                <Text style={[{ fontSize: 15, color: colors.onSurface }, body]}>Cancel</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Custom Date Picker bottom sheet */}
        <Modal
          visible={showDatePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <Pressable
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
            onPress={() => setShowDatePicker(false)}
          >
            <Pressable
              style={{
                backgroundColor: colors.surface,
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                padding: 24,
                paddingBottom: insets.bottom + 24,
              }}
              onPress={() => {}}
            >
              {/* Drag handle */}
              <View
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: colors.outlineVariant,
                  alignSelf: 'center',
                  marginBottom: 20,
                }}
              />
              <Text style={[{ fontSize: 18, fontWeight: '600', color: colors.onSurface, marginBottom: 4 }, headline]}>
                Select start date
              </Text>
              <Text style={[{ fontSize: 13, color: colors.onSurfaceVariant, marginBottom: 24 }, body]}>
                Choose from the last 7 days
              </Text>

              {/* Day chips */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 }}>
                {Array.from({ length: 7 }, (_, i) => addDays(minStartDate, i)).map((date) => {
                  const iso = date.toISOString().slice(0, 10);
                  const isSelected = datePickerTemp === iso;
                  const isToday = iso === today.toISOString().slice(0, 10);
                  const dayLabel = isToday
                    ? 'Today'
                    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
                  return (
                    <TouchableOpacity
                      key={iso}
                      onPress={() => setDatePickerTemp(iso)}
                      style={{
                        flex: 1,
                        marginHorizontal: 3,
                        paddingVertical: 10,
                        borderRadius: 12,
                        alignItems: 'center',
                        backgroundColor: isSelected ? colors.primary : colors.surfaceContainerHigh,
                      }}
                    >
                      <Text
                        style={[
                          { fontSize: 10, color: isSelected ? '#fff' : colors.onSurfaceVariant, marginBottom: 3 },
                          body,
                        ]}
                      >
                        {dayLabel}
                      </Text>
                      <Text
                        style={[
                          { fontSize: 16, fontWeight: '600', color: isSelected ? '#fff' : colors.onSurface },
                          headline,
                        ]}
                      >
                        {date.getDate()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Confirm */}
              <TouchableOpacity
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 16,
                  paddingVertical: 14,
                  alignItems: 'center',
                  marginBottom: 10,
                  opacity: datePickerTemp ? 1 : 0.4,
                }}
                disabled={!datePickerTemp}
                onPress={() => {
                  if (datePickerTemp) setWeekStart(datePickerTemp);
                  setShowDatePicker(false);
                }}
              >
                <Text style={[{ fontSize: 15, color: '#fff', fontWeight: '600' }, body]}>Confirm</Text>
              </TouchableOpacity>

              {/* Cancel */}
              <TouchableOpacity
                style={{ paddingVertical: 12, alignItems: 'center' }}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={[{ fontSize: 15, color: colors.onSurface }, body]}>Cancel</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>

        {/* App notification bottom sheet */}
        <Modal
          visible={!!appAlert}
          transparent
          animationType="fade"
          onRequestClose={() => setAppAlert(null)}
        >
          <Pressable
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
            onPress={() => setAppAlert(null)}
          >
            <Pressable
              style={{
                backgroundColor: colors.surface,
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                padding: 24,
                paddingBottom: insets.bottom + 24,
              }}
              onPress={() => {}}
            >
              {/* Drag handle */}
              <View
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: colors.outlineVariant,
                  alignSelf: 'center',
                  marginBottom: 20,
                }}
              />

              {/* Icon */}
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: appAlert?.type === 'success' ? colors.primaryFixed : colors.errorContainer,
                  justifyContent: 'center',
                  alignItems: 'center',
                  alignSelf: 'center',
                  marginBottom: 16,
                }}
              >
                <MaterialIcons
                  name={appAlert?.type === 'success' ? 'check-circle-outline' : 'error-outline'}
                  size={28}
                  color={appAlert?.type === 'success' ? colors.primary : colors.error}
                />
              </View>

              <Text style={[{ fontSize: 18, color: colors.onSurface, textAlign: 'center', marginBottom: 8 }, headline]}>
                {appAlert?.title}
              </Text>
              <Text style={[{ fontSize: 14, color: colors.onSurfaceVariant, textAlign: 'center', lineHeight: 20, marginBottom: 28 }, body]}>
                {appAlert?.message}
              </Text>

              <TouchableOpacity
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: 'center',
                }}
                onPress={() => setAppAlert(null)}
              >
                <Text style={[{ fontSize: 15, color: '#fff', fontWeight: '600' }, body]}>OK</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Data menu (import/export) */}
        <Modal visible={showDataMenu} transparent animationType="fade" onRequestClose={() => setShowDataMenu(false)}>
          <Pressable
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
            onPress={() => setShowDataMenu(false)}
          >
            <Pressable
              style={{
                backgroundColor: colors.surface,
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                padding: 24,
                paddingBottom: insets.bottom + 24,
              }}
              onPress={() => {}}
            >
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.outlineVariant, alignSelf: 'center', marginBottom: 20 }} />

              <View style={{
                width: 56, height: 56, borderRadius: 28,
                backgroundColor: colors.primaryFixed,
                justifyContent: 'center', alignItems: 'center',
                alignSelf: 'center', marginBottom: 16,
              }}>
                <MaterialIcons name="swap-vert" size={28} color={colors.primary} />
              </View>

              <Text style={[{ fontSize: 18, color: colors.onSurface, textAlign: 'center', marginBottom: 4 }, headline]}>
                Import & Export
              </Text>
              <Text style={[{ fontSize: 13, color: colors.onSurfaceVariant, textAlign: 'center', marginBottom: 24 }, body]}>
                Transfer your week data between devices
              </Text>

              <TouchableOpacity
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 14,
                  backgroundColor: colors.surfaceContainerLow,
                  borderRadius: 16, padding: 16, marginBottom: 10,
                }}
                onPress={() => { setShowDataMenu(false); handleImportWeeks(); }}
              >
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: `${colors.tertiary}15`, justifyContent: 'center', alignItems: 'center' }}>
                  <MaterialIcons name="file-download" size={22} color={colors.tertiary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[{ fontSize: 15, color: colors.onSurface }, headline]}>Import Weeks</Text>
                  <Text style={[{ fontSize: 12, color: colors.onSurfaceVariant, marginTop: 2 }, body]}>Load weeks from a JSON file</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={colors.outlineVariant} />
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 14,
                  backgroundColor: colors.surfaceContainerLow,
                  borderRadius: 16, padding: 16, marginBottom: 10,
                  opacity: weeks.length === 0 ? 0.4 : 1,
                }}
                disabled={weeks.length === 0}
                onPress={() => { setShowDataMenu(false); handleExportWeeks(weeks); }}
              >
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: `${colors.primary}15`, justifyContent: 'center', alignItems: 'center' }}>
                  <MaterialIcons name="file-upload" size={22} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[{ fontSize: 15, color: colors.onSurface }, headline]}>Export All Weeks</Text>
                  <Text style={[{ fontSize: 12, color: colors.onSurfaceVariant, marginTop: 2 }, body]}>
                    {weeks.length} week{weeks.length !== 1 ? 's' : ''} will be exported
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={colors.outlineVariant} />
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  backgroundColor: colors.surfaceContainerHigh,
                  borderRadius: 14, paddingVertical: 14,
                  alignItems: 'center', marginTop: 6,
                }}
                onPress={() => setShowDataMenu(false)}
              >
                <Text style={[{ fontSize: 15, color: colors.onSurface }, body]}>Close</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Export mode selection modal */}
        <Modal visible={showExportModal} transparent animationType="fade" onRequestClose={() => setShowExportModal(false)}>
          <Pressable
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
            onPress={() => setShowExportModal(false)}
          >
            <Pressable
              style={{
                backgroundColor: colors.surfaceContainer,
                borderRadius: 28, padding: 24, width: '85%',
                maxWidth: 360,
              }}
            >
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <View style={{
                  width: 52, height: 52, borderRadius: 16,
                  backgroundColor: `${colors.primary}15`,
                  justifyContent: 'center', alignItems: 'center', marginBottom: 12,
                }}>
                  <MaterialIcons name="file-upload" size={26} color={colors.primary} />
                </View>
                <Text style={[{ fontSize: 18, color: colors.onSurface }, headline]}>Export</Text>
                <Text style={[{ fontSize: 13, color: colors.onSurfaceVariant, marginTop: 4, textAlign: 'center' }, body]}>
                  {pendingExportWeeks.length === 1
                    ? 'How would you like to export this week?'
                    : `How would you like to export ${pendingExportWeeks.length} weeks?`}
                </Text>
              </View>

              <TouchableOpacity
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 14,
                  backgroundColor: colors.surfaceContainerLow,
                  borderRadius: 16, padding: 16, marginBottom: 10,
                }}
                onPress={handleExportShare}
              >
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: `${colors.tertiary}15`, justifyContent: 'center', alignItems: 'center' }}>
                  <MaterialIcons name="share" size={22} color={colors.tertiary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[{ fontSize: 15, color: colors.onSurface }, headline]}>Share</Text>
                  <Text style={[{ fontSize: 12, color: colors.onSurfaceVariant, marginTop: 2 }, body]}>Send via apps or AirDrop</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={colors.outlineVariant} />
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 14,
                  backgroundColor: colors.surfaceContainerLow,
                  borderRadius: 16, padding: 16, marginBottom: 10,
                }}
                onPress={handleExportDownload}
              >
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: `${colors.primary}15`, justifyContent: 'center', alignItems: 'center' }}>
                  <MaterialIcons name="save-alt" size={22} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[{ fontSize: 15, color: colors.onSurface }, headline]}>Download</Text>
                  <Text style={[{ fontSize: 12, color: colors.onSurfaceVariant, marginTop: 2 }, body]}>Save to device storage</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={colors.outlineVariant} />
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  backgroundColor: colors.surfaceContainerHigh,
                  borderRadius: 14, paddingVertical: 14,
                  alignItems: 'center', marginTop: 6,
                }}
                onPress={() => setShowExportModal(false)}
              >
                <Text style={[{ fontSize: 15, color: colors.onSurface }, body]}>Cancel</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Import conflict resolution modal */}
        <Modal visible={showImportConflicts} transparent animationType="slide" onRequestClose={() => setShowImportConflicts(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <View style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              maxHeight: '85%',
              paddingBottom: insets.bottom + 24,
            }}>
              <View style={{ paddingHorizontal: 24, paddingTop: 12 }}>
                <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.outlineVariant, alignSelf: 'center', marginBottom: 20 }} />

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <View style={{
                    width: 40, height: 40, borderRadius: 20,
                    backgroundColor: `${colors.tertiary}15`,
                    justifyContent: 'center', alignItems: 'center',
                  }}>
                    <MaterialIcons name="warning" size={22} color={colors.tertiary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[{ fontSize: 18, color: colors.onSurface }, headline]}>Date Conflicts</Text>
                    <Text style={[{ fontSize: 12, color: colors.onSurfaceVariant, marginTop: 2 }, body]}>
                      {importConflicts.length} conflict{importConflicts.length !== 1 ? 's' : ''} found
                      {importClean.length > 0 ? ` · ${importClean.length} will import cleanly` : ''}
                    </Text>
                  </View>
                </View>
              </View>

              <ScrollView style={{ paddingHorizontal: 24 }} contentContainerStyle={{ paddingBottom: 16, paddingTop: 16 }} showsVerticalScrollIndicator={false}>
                {importConflicts.map((conflict, idx) => (
                  <View key={idx} style={{
                    backgroundColor: colors.surfaceContainerLow,
                    borderRadius: 20, padding: 16, marginBottom: 14,
                    borderWidth: 1,
                    borderColor: conflict.choice ? `${colors.primary}30` : `${colors.tertiary}30`,
                  }}>
                    <Text style={[{ fontSize: 13, color: colors.onSurfaceVariant, marginBottom: 12, textAlign: 'center' }, label]}>
                      Overlapping date range
                    </Text>

                    {/* Existing week option */}
                    <TouchableOpacity
                      style={{
                        flexDirection: 'row', alignItems: 'center', gap: 12,
                        padding: 14, borderRadius: 14, marginBottom: 8,
                        backgroundColor: conflict.choice === 'existing' ? `${colors.primary}12` : colors.surfaceContainerHigh,
                        borderWidth: conflict.choice === 'existing' ? 1.5 : 0,
                        borderColor: colors.primary,
                      }}
                      onPress={() => {
                        setImportConflicts((prev) =>
                          prev.map((c, i) => i === idx ? { ...c, choice: 'existing' } : c)
                        );
                      }}
                    >
                      <MaterialIcons
                        name={conflict.choice === 'existing' ? 'radio-button-checked' : 'radio-button-unchecked'}
                        size={22}
                        color={conflict.choice === 'existing' ? colors.primary : colors.outlineVariant}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={[{ fontSize: 11, color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 }, label]}>
                          Keep Existing
                        </Text>
                        <Text style={[{ fontSize: 14, color: colors.onSurface, marginTop: 2 }, headline]}>
                          {conflict.existing.dateRange}
                        </Text>
                        <Text style={[{ fontSize: 12, color: colors.onSurfaceVariant, marginTop: 1 }, body]}>
                          {conflict.existing.totalHours} · {conflict.existing.activeDays}/{conflict.existing.totalDays} days
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Imported week option */}
                    <TouchableOpacity
                      style={{
                        flexDirection: 'row', alignItems: 'center', gap: 12,
                        padding: 14, borderRadius: 14,
                        backgroundColor: conflict.choice === 'imported' ? `${colors.tertiary}12` : colors.surfaceContainerHigh,
                        borderWidth: conflict.choice === 'imported' ? 1.5 : 0,
                        borderColor: colors.tertiary,
                      }}
                      onPress={() => {
                        setImportConflicts((prev) =>
                          prev.map((c, i) => i === idx ? { ...c, choice: 'imported' } : c)
                        );
                      }}
                    >
                      <MaterialIcons
                        name={conflict.choice === 'imported' ? 'radio-button-checked' : 'radio-button-unchecked'}
                        size={22}
                        color={conflict.choice === 'imported' ? colors.tertiary : colors.outlineVariant}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={[{ fontSize: 11, color: colors.tertiary, textTransform: 'uppercase', letterSpacing: 0.5 }, label]}>
                          Use Imported
                        </Text>
                        <Text style={[{ fontSize: 14, color: colors.onSurface, marginTop: 2 }, headline]}>
                          {conflict.imported.dateRange}
                        </Text>
                        <Text style={[{ fontSize: 12, color: colors.onSurfaceVariant, marginTop: 1 }, body]}>
                          {conflict.imported.totalHours} · {conflict.imported.activeDays}/{conflict.imported.totalDays} days
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>

              <View style={{ paddingHorizontal: 24, gap: 10 }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: importConflicts.every((c) => c.choice !== null) ? colors.primary : colors.surfaceContainerHigh,
                    borderRadius: 14, paddingVertical: 14,
                    alignItems: 'center',
                  }}
                  onPress={handleResolveConflicts}
                >
                  <Text style={[{
                    fontSize: 15,
                    color: importConflicts.every((c) => c.choice !== null) ? '#fff' : colors.onSurfaceVariant,
                  }, headline]}>
                    Confirm Import
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    backgroundColor: colors.surfaceContainerHigh,
                    borderRadius: 14, paddingVertical: 14,
                    alignItems: 'center',
                  }}
                  onPress={() => {
                    setShowImportConflicts(false);
                    setImportConflicts([]);
                    setImportClean([]);
                  }}
                >
                  <Text style={[{ fontSize: 15, color: colors.onSurface }, body]}>Cancel Import</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

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
