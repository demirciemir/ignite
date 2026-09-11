import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '../src/store';
import { useAppTheme } from '../src/theme';
import { Flame, Check, RefreshCw, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export default function StreakModal() {
  const router = useRouter();
  const t = useAppTheme();
  const { 
    streakDays, 
    workoutDates, 
    lastRestoreDate, 
    lastWorkoutDate,
    totalWorkoutsLogged, 
    totalMinutesLogged, 
    restoreStreak 
  } = useStore();

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleRestore = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    restoreStreak();
  };

  // Determine actual display streak
  const today = new Date().toLocaleDateString('en-CA');
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toLocaleDateString('en-CA');

  let displayStreak = streakDays;
  if (lastWorkoutDate && lastWorkoutDate !== today && lastWorkoutDate !== yesterdayStr) {
    displayStreak = 0; // It's broken!
  }

  // Restore logic
  const canRestore = displayStreak === 0 && streakDays > 0 && 
    (!lastRestoreDate || (new Date().getTime() - new Date(lastRestoreDate).getTime() > 7 * 24 * 60 * 60 * 1000));

  // Calendar logic (last 7 days, ending today)
  const calendarDays = useMemo(() => {
    const days = [];
    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-CA');
      const dayName = dayNames[d.getDay()];
      const isLogged = workoutDates.includes(dateStr);
      days.push({ id: i, name: dayName, date: d.getDate(), isLogged });
    }
    return days;
  }, [workoutDates]);

  return (
    <View style={[styles.container, { backgroundColor: t.colors.background }]}>
      {/* Top Handle / Close */}
      <View style={styles.topBar}>
        <View style={{ width: 32 }} />
        <View style={[styles.handle, { backgroundColor: t.colors.border }]} />
        <Pressable onPress={handleClose} style={styles.closeBtn}>
          <X size={24} color={t.colors.textMuted} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Flame Header */}
        <View style={styles.hero}>
          <View style={[styles.flameCircle, { borderColor: t.colors.border }]}>
            <Flame size={48} color="#FF9500" fill="#FF9500" />
          </View>
          <Text style={[styles.streakNumber, { color: t.colors.text }]}>{displayStreak}</Text>
          <Text style={[styles.streakTitle, { color: t.colors.text }]}>Day Streak</Text>
          <Text style={[styles.streakSub, { color: t.colors.textMuted }]}>You are doing really great!</Text>
        </View>

        {/* Calendar Row */}
        <View style={styles.calendarRow}>
          {calendarDays.map((day) => (
            <View key={day.id} style={styles.calendarCol}>
              <Text style={[styles.dayName, { color: day.isLogged ? t.colors.text : t.colors.textMuted }]}>
                {day.name}
              </Text>
              {day.isLogged ? (
                <View style={[styles.dayCircle, styles.dayCircleLogged, { backgroundColor: '#FF9500' }]}>
                  <Check size={16} color="#FFF" />
                </View>
              ) : (
                <View style={styles.dayCircle}>
                  <Text style={[styles.dayDate, { color: t.colors.text }]}>{day.date}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Stats Card */}
        <View style={styles.statsContainer}>
          <View style={[styles.statsHeader, { backgroundColor: t.colors.border + '80' }]}>
            <Text style={[styles.statsTitle, { color: t.colors.textMuted }]}>Your Stats</Text>
          </View>
          <View style={[styles.statsCard, { backgroundColor: t.colors.card }]}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: t.colors.textMuted }]}>Days</Text>
                <Text style={[styles.statValue, { color: t.colors.text }]}>{workoutDates.length}</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: t.colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: t.colors.textMuted }]}>Workouts</Text>
                <Text style={[styles.statValue, { color: t.colors.text }]}>{totalWorkoutsLogged}</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: t.colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: t.colors.textMuted }]}>Minutes</Text>
                <Text style={[styles.statValue, { color: t.colors.text }]}>{totalMinutesLogged}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Restore Streak Button */}
        {(canRestore || displayStreak === 0) && (
          <View style={styles.restoreSection}>
            <Pressable 
              onPress={canRestore ? handleRestore : undefined} 
              style={[
                styles.restoreBtn, 
                { backgroundColor: canRestore ? '#FF9500' : t.colors.card },
                !canRestore && { opacity: 0.5 }
              ]}
            >
              <RefreshCw size={20} color={canRestore ? '#FFF' : t.colors.textMuted} />
              <Text style={[styles.restoreBtnText, { color: canRestore ? '#FFF' : t.colors.textMuted }]}>
                {canRestore ? "Restore Streak" : "Streak broken"}
              </Text>
            </Pressable>
            {canRestore && (
              <Text style={[styles.restoreDesc, { color: t.colors.textMuted }]}>
                Use your weekly streak repair to recover your progress.
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
  calendarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 48,
    paddingHorizontal: 8,
  },
  calendarCol: {
    alignItems: 'center',
    gap: 12,
  },
  dayName: {
    fontSize: 12,
    fontWeight: '700',
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleLogged: {
    shadowColor: '#FF9500',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  dayDate: {
    fontSize: 14,
    fontWeight: '700',
  },
  statsContainer: {
    width: '100%',
    marginBottom: 32,
  },
  statsHeader: {
    alignItems: 'center',
    paddingVertical: 12,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginBottom: -20, // overlap card
    zIndex: 0,
  },
  statsTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statsCard: {
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
    zIndex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  statDivider: {
    width: 1,
    height: 32,
    opacity: 0.5,
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
