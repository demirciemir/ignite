import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../src/store';
import { useAppTheme } from '../src/theme';
import { Flame, Check, RefreshCw, X, Snowflake, ChevronDown, ChevronUp, Timer, Award } from 'lucide-react-native';

interface CalendarDay {
  id: string;
  name: string;
  date: number;
  isLogged: boolean;
  isRestored: boolean;
  prevIsLogged: boolean;
  nextIsLogged: boolean;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export default function StreakModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const t = useAppTheme();
  
  const { 
    streakDays, 
    lastWorkoutDate, 
    workoutDates, 
    restoredDates = [], 
    lastRestoreDate,
    totalWorkoutsLogged,
    totalMinutesLogged,
    restoreStreak
  } = useStore();

  const [expanded, setExpanded] = useState(false);

  const today = new Date().toLocaleDateString('en-CA');
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toLocaleDateString('en-CA');

  let displayStreak = streakDays;
  if (!lastWorkoutDate || (lastWorkoutDate !== today && lastWorkoutDate !== yesterdayStr)) {
    displayStreak = 0;
  }

  const isStreakActive = displayStreak > 0;

  const longestStreak = useMemo(() => {
    const all = [...new Set([...workoutDates, ...restoredDates])].sort();
    if (all.length === 0) return 0;
    
    let max = 1;
    let current = 1;
    for (let i = 1; i < all.length; i++) {
      const prev = new Date(all[i-1]);
      const curr = new Date(all[i]);
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (Math.round(diff) === 1) {
        current++;
        max = Math.max(max, current);
      } else {
        current = 1;
      }
    }
    return Math.max(max, displayStreak);
  }, [workoutDates, restoredDates, displayStreak]);

  const formattedTime = useMemo(() => {
    if (totalMinutesLogged < 60) return `${totalMinutesLogged}m`;
    const h = Math.floor(totalMinutesLogged / 60);
    const m = totalMinutesLogged % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }, [totalMinutesLogged]);

  const handleClose = () => router.back();

  const handleRestore = () => {
    restoreStreak();
  };

  // Restore logic
  const canRestore = displayStreak === 0 && streakDays > 0 && 
    (!lastRestoreDate || (new Date().getTime() - new Date(lastRestoreDate).getTime() > 7 * 24 * 60 * 60 * 1000));

  // Calendar logic
  const calendarWeeks = useMemo(() => {
    const dayNames = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
    
    // Determine the range of dates to show
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let startDate = new Date(today);
    let endDate = new Date(today);

    if (expanded) {
      // Show full current month
      startDate.setDate(1);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0); // last day of month
    }

    // Adjust startDate to the previous Monday
    const startDay = startDate.getDay(); // 0 = Sun, 1 = Mon...
    const startOffset = startDay === 0 ? 6 : startDay - 1;
    startDate.setDate(startDate.getDate() - startOffset);

    // Adjust endDate to the next Sunday
    const endDay = endDate.getDay();
    const endOffset = endDay === 0 ? 0 : 7 - endDay;
    endDate.setDate(endDate.getDate() + endOffset);

    const weeks: CalendarDay[][] = [];
    let currentWeek: CalendarDay[] = [];
    let curr = new Date(startDate);

    const dateStrs: Date[] = [];
    while (curr <= endDate) {
      dateStrs.push(new Date(curr));
      curr.setDate(curr.getDate() + 1);
    }

    dateStrs.forEach((d, i) => {
      const dateStr = d.toLocaleDateString('en-CA');
      const isLogged = workoutDates.includes(dateStr);
      const isRestored = restoredDates.includes(dateStr);
      
      const prevDate = new Date(d);
      prevDate.setDate(prevDate.getDate() - 1);
      const prevStr = prevDate.toLocaleDateString('en-CA');
      
      const nextDate = new Date(d);
      nextDate.setDate(nextDate.getDate() + 1);
      const nextStr = nextDate.toLocaleDateString('en-CA');

      const prevIsLogged = workoutDates.includes(prevStr) || restoredDates.includes(prevStr);
      const nextIsLogged = workoutDates.includes(nextStr) || restoredDates.includes(nextStr);

      const isCurrentMonth = d.getMonth() === today.getMonth();
      const isToday = d.getTime() === today.getTime();

      currentWeek.push({
        id: dateStr,
        name: dayNames[currentWeek.length],
        date: d.getDate(),
        isLogged,
        isRestored,
        prevIsLogged,
        nextIsLogged,
        isCurrentMonth,
        isToday
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    // If not expanded, we only want the week that contains 'today'
    if (!expanded) {
      return weeks.filter(w => w.some(d => d.isToday));
    }

    return weeks;
  }, [workoutDates, restoredDates, expanded]);

  return (
    <View style={[styles.container, { backgroundColor: t.colors.background }]}>
      <View style={styles.topBar}>
        <View style={{ width: 32 }} />
        <View style={[styles.handle, { backgroundColor: t.colors.border }]} />
        <Pressable onPress={handleClose} style={styles.closeBtn}>
          <X size={24} color={t.colors.textMuted} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={styles.hero}>
          <View style={[styles.flameCircle, { borderColor: t.colors.border }]}>
            <Flame size={48} color={isStreakActive ? "#FF9500" : t.colors.textMuted} fill={isStreakActive ? "#FF9500" : "transparent"} />
          </View>
          <Text style={[styles.streakNumber, { color: t.colors.text }]}>{displayStreak}</Text>
          <Text style={[styles.streakTitle, { color: t.colors.text }]}>Day Streak</Text>
          <Text style={[styles.streakSub, { color: t.colors.textMuted }]}>
            {isStreakActive ? "You are doing really great!" : "Complete a session to ignite your streak."}
          </Text>
        </View>

        {/* Calendar Section */}
        <Pressable style={styles.calendarWrapper} onPress={() => setExpanded(!expanded)}>
          <View style={styles.calendarHeader}>
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day, i) => (
              <Text key={i} style={[styles.dayNameHeader, { color: t.colors.textMuted }]}>{day}</Text>
            ))}
          </View>
          
          <View style={styles.calendarGrid}>
            {calendarWeeks.map((week, wIdx) => (
              <View key={wIdx} style={styles.calendarRow}>
                {week.map((day) => {
                  const isActive = day.isLogged || day.isRestored;
                  const color = day.isRestored ? '#0A84FF' : '#FF9500';
                  const bgColor = day.isRestored ? 'rgba(10, 132, 255, 0.15)' : 'rgba(255, 149, 0, 0.15)';

                  return (
                    <View key={day.id} style={styles.calendarCol}>
                      {isActive && (
                        <View style={[StyleSheet.absoluteFill, { justifyContent: 'center' }]}>
                          {day.prevIsLogged && <View style={{ position: 'absolute', left: 0, width: '50%', height: 32, backgroundColor: bgColor }} />}
                          {day.nextIsLogged && <View style={{ position: 'absolute', right: 0, width: '50%', height: 32, backgroundColor: bgColor }} />}
                        </View>
                      )}
                      
                      <View style={[
                        styles.dayCircle,
                        isActive && { backgroundColor: color },
                        !isActive && day.isToday && { borderWidth: 2, borderColor: t.colors.border },
                        !isActive && !day.isToday && { backgroundColor: 'transparent' }
                      ]}>
                        <Text style={[
                          styles.dayNumber,
                          { color: isActive ? '#FFF' : (day.isCurrentMonth ? t.colors.text : t.colors.textMuted) },
                          (!day.isCurrentMonth && !isActive) && { opacity: 0.3 }
                        ]}>
                          {day.date}
                        </Text>
                        
                        {/* Snowflake droplet for restored days */}
                        {day.isRestored && (
                          <View style={[styles.restoredBadge, { borderColor: t.colors.background }]}>
                            <Snowflake size={10} color="#FFF" fill="#FFF" />
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
          
          <View style={styles.expandHint}>
            {expanded ? <ChevronUp size={20} color={t.colors.textMuted} /> : <ChevronDown size={20} color={t.colors.textMuted} />}
          </View>
        </Pressable>

        {/* Bento Stats */}
        <View style={styles.bentoStatsContainer}>
          <View style={[styles.bentoCard, { backgroundColor: t.colors.card }]}>
            <View style={[styles.bentoIcon, { backgroundColor: 'rgba(255, 149, 0, 0.15)' }]}>
              <Award size={20} color="#FF9500" />
            </View>
            <Text style={[styles.bentoValue, { color: t.colors.text }]}>{longestStreak} <Text style={{ fontSize: 16 }}>Days</Text></Text>
            <Text style={[styles.bentoLabel, { color: t.colors.textMuted }]}>Longest Streak</Text>
          </View>

          <View style={[styles.bentoCard, { backgroundColor: t.colors.card }]}>
            <View style={[styles.bentoIcon, { backgroundColor: 'rgba(10, 132, 255, 0.15)' }]}>
              <Timer size={20} color="#0A84FF" />
            </View>
            <Text style={[styles.bentoValue, { color: t.colors.text }]}>{formattedTime}</Text>
            <Text style={[styles.bentoLabel, { color: t.colors.textMuted }]}>Total Focus</Text>
          </View>
        </View>

        {/* Restore Streak Button */}
        {(canRestore || displayStreak === 0) && (
          <View style={styles.restoreSection}>
            <Pressable 
              onPress={canRestore ? handleRestore : undefined} 
              style={[
                styles.restoreBtn, 
                { backgroundColor: canRestore ? '#0A84FF' : t.colors.card },
                !canRestore && { opacity: 0.5 }
              ]}
            >
              {canRestore ? (
                <Snowflake size={20} color="#FFF" />
              ) : (
                <RefreshCw size={20} color={t.colors.textMuted} />
              )}
              <Text style={[styles.restoreBtnText, { color: canRestore ? '#FFF' : t.colors.textMuted }]}>
                {canRestore ? "Use Streak Freeze" : "Streak broken"}
              </Text>
            </Pressable>
            {canRestore ? (
              <Text style={[styles.restoreDesc, { color: t.colors.textMuted }]}>
                Use your weekly streak freeze to recover your progress and keep your streak alive.
              </Text>
            ) : (displayStreak > 0 && streakDays === 1) ? (
              <Text style={[styles.restoreDesc, { color: t.colors.textMuted }]}>
                You already started a new streak! Freeze can only be used before starting a new one.
              </Text>
            ) : (
              <Text style={[styles.restoreDesc, { color: t.colors.textMuted }]}>
                Streak Freeze is available once every 7 days when you break a streak.
              </Text>
            )}
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  content: { 
    padding: 24, 
    paddingTop: 16,
    alignItems: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 40,
  },
  flameCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  streakNumber: {
    fontSize: 72,
    fontWeight: '900',
    letterSpacing: -2,
    marginBottom: -8,
  },
  streakTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  streakSub: {
    fontSize: 14,
    fontWeight: '500',
  },
  calendarWrapper: {
    width: '100%',
    marginBottom: 32,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dayNameHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
  },
  calendarGrid: {
    width: '100%',
    gap: 12,
  },
  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  calendarCol: {
    flex: 1,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '700',
  },
  restoredBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    backgroundColor: '#0A84FF',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  expandHint: {
    alignItems: 'center',
    marginTop: 12,
    opacity: 0.5,
  },
  bentoStatsContainer: {
    width: '100%',
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  bentoCard: {
    flex: 1,
    borderRadius: 24,
    padding: 20,
    alignItems: 'flex-start',
  },
  bentoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  bentoValue: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  bentoLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  restoreSection: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  restoreBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 24,
    gap: 12,
  },
  restoreBtnText: {
    fontSize: 18,
    fontWeight: '800',
  },
  restoreDesc: {
    fontSize: 12,
    textAlign: 'center',
  }
});
