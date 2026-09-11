import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '../src/store';
import { useAppTheme } from '../src/theme';
import { Flame, X, Calendar, RefreshCw } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export default function StreakModal() {
  const router = useRouter();
  const t = useAppTheme();
  const { streakDays, workoutDates, lastRestoreDate, restoreStreak } = useStore();

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleRestore = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    restoreStreak();
  };

  // Basic check: Can they restore? (Not today, and streak is lost, etc. Just simple rule for now)
  const canRestore = !lastRestoreDate || (new Date().getTime() - new Date(lastRestoreDate).getTime() > 7 * 24 * 60 * 60 * 1000);

  return (
    <View style={[styles.container, { backgroundColor: t.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: t.colors.text }]}>Streak Details</Text>
        <Pressable onPress={handleClose} style={[styles.closeBtn, { backgroundColor: t.colors.card }]}>
          <X size={24} color={t.colors.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: t.colors.card }]}>
          <Flame size={48} color="#FF9500" fill="#FF9500" />
          <Text style={[styles.streakText, { color: t.colors.text }]}>{streakDays} Day Streak</Text>
          <Text style={[styles.subText, { color: t.colors.textMuted }]}>Keep it up!</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: t.colors.text }]}>Total Workouts</Text>
          <View style={[styles.statRow, { backgroundColor: t.colors.card }]}>
            <Calendar size={24} color={t.colors.text} />
            <Text style={[styles.statText, { color: t.colors.text }]}>{workoutDates.length} days logged</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: t.colors.text }]}>Streak Restore</Text>
          <Text style={[styles.desc, { color: t.colors.textMuted }]}>
            If you missed yesterday, you can restore your streak. You get 1 restore per week.
          </Text>
          
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
              Dün off day miydi? Streak'i yenile
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: 48,
  },
  title: { fontSize: 24, fontWeight: '800' },
  closeBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center'
  },
  content: { padding: 24, gap: 32 },
  card: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 24,
  },
  streakText: { fontSize: 32, fontWeight: '900', marginTop: 16 },
  subText: { fontSize: 16, fontWeight: '600', marginTop: 4 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 16,
  },
  statText: { fontSize: 16, fontWeight: '600' },
  desc: { fontSize: 14, lineHeight: 20 },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    marginTop: 8,
  },
  restoreBtnText: { fontSize: 16, fontWeight: '700' }
});
