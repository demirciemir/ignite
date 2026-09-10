import { Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Link } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { StreakWidget } from '../src/components/StreakWidget';
import { BentoCard } from '../src/components/BentoCard';
import { useStore } from '../src/store';
import { theme } from '../src/theme';

export default function Home() {
  const workouts = useStore((s) => s.workouts);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StreakWidget />

      <Text style={styles.sectionTitle}>Your Workouts</Text>
      {workouts.length === 0 ? (
        <Text style={styles.empty}>No workouts yet.</Text>
      ) : (
        workouts.map((w) => (
          <Link key={w.id} href={`/timer/${w.id}`} asChild>
            <Pressable
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Workout: ${w.name}`}
              onPress={handlePress}
              style={({ pressed }) => [
                styles.workoutCardWrapper,
                pressed && styles.pressed,
              ]}
            >
              <BentoCard style={styles.workoutCard}>
                <Text style={styles.workoutName}>{w.name}</Text>
              </BentoCard>
            </Pressable>
          </Link>
        ))
      )}

      <Link href="/builder" asChild>
        <Pressable
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Create a new workout"
          onPress={handlePress}
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.addButtonText}>+ Create Workout</Text>
        </Pressable>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, gap: theme.spacing.lg, paddingTop: 60 },
  sectionTitle: { fontSize: 22, fontWeight: '700', color: theme.colors.text, marginTop: theme.spacing.md },
  empty: { color: theme.colors.textMuted },
  workoutCardWrapper: { borderRadius: theme.borderRadius.card },
  workoutCard: { marginBottom: theme.spacing.md },
  workoutName: { fontSize: 18, fontWeight: '600', color: theme.colors.text },
  addButton: { backgroundColor: theme.colors.text, padding: theme.spacing.lg, borderRadius: theme.borderRadius.button, alignItems: 'center' },
  addButtonText: { color: theme.colors.buttonText, fontSize: 16, fontWeight: '700' },
  pressed: { opacity: 0.8 },
});
