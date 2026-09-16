import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../src/store';
import { useAppTheme } from '../src/theme';
import { ChevronLeft, Bug } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export default function Debug() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const t = useAppTheme();
  
  const store = useStore();

  const handlePress = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  const shiftDays = (days: number) => {
    handlePress();
    const target = new Date();
    target.setDate(target.getDate() + days);
    const targetStr = target.toLocaleDateString('en-CA');
    
    useStore.setState({ lastWorkoutDate: targetStr });
    
    // Also shift all workout dates for realism
    const newDates = store.workoutDates.map(d => {
        const date = new Date(d);
        date.setDate(date.getDate() + days);
        return date.toLocaleDateString('en-CA');
    });
    useStore.setState({ workoutDates: newDates });
  };

  const triggerStreakAnimation = () => {
    handlePress();
    useStore.setState({ justEarnedStreak: true });
    router.replace('/');
  };

  const forceBreakStreak = () => {
    handlePress();
    // Move last workout to 3 days ago
    shiftDays(-3);
  };

  const resetRestoreCooldown = () => {
    handlePress();
    useStore.setState({ lastRestoreDate: null });
  };

  const setStreakToFive = () => {
    handlePress();
    useStore.setState({ streakDays: 5 });
  };

  return (
    <View style={[styles.container, { backgroundColor: t.colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={28} color={t.colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: t.colors.text }]}>Debug Tools</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.card, { backgroundColor: t.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: t.colors.textMuted }]}>STATE</Text>
          <Text style={{ color: t.colors.text }}>Streak Days: {store.streakDays}</Text>
          <Text style={{ color: t.colors.text }}>Last Workout: {store.lastWorkoutDate}</Text>
          <Text style={{ color: t.colors.text }}>Last Restore: {store.lastRestoreDate}</Text>
          <Text style={{ color: t.colors.text }}>Total Workouts: {store.totalWorkoutsLogged}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: t.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: t.colors.textMuted }]}>ACTIONS</Text>
          
          <Pressable style={[styles.btn, { backgroundColor: t.colors.border }]} onPress={triggerStreakAnimation}>
            <Text style={[styles.btnText, { color: t.colors.text }]}>Test Main Screen Animation</Text>
          </Pressable>
          
          <Pressable style={[styles.btn, { backgroundColor: t.colors.border }]} onPress={setStreakToFive}>
            <Text style={[styles.btnText, { color: t.colors.text }]}>Set Streak to 5</Text>
          </Pressable>

          <Pressable style={[styles.btn, { backgroundColor: t.colors.accent }]} onPress={() => shiftDays(-2)}>
            <Text style={[styles.btnText, { color: '#FFF' }]}>Simulate Missing 1 Day</Text>
          </Pressable>

          <Pressable style={[styles.btn, { backgroundColor: t.colors.accent }]} onPress={forceBreakStreak}>
            <Text style={[styles.btnText, { color: '#FFF' }]}>Simulate Missing 2 Days</Text>
          </Pressable>
          
          <Pressable style={[styles.btn, { backgroundColor: t.colors.border }]} onPress={resetRestoreCooldown}>
            <Text style={[styles.btnText, { color: t.colors.text }]}>Reset Restore Cooldown</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backBtn: { padding: 4, marginLeft: -4 },
  title: { fontSize: 20, fontWeight: '700' },
  content: { padding: 16 },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  btn: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  btnText: {
    fontWeight: '600',
  }
});
