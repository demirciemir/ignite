import { View, Text, StyleSheet } from 'react-native';
import { BentoCard } from './BentoCard';
import { theme } from '../theme';
import { useStore } from '../store';

export function StreakWidget() {
  const streak = useStore((s) => s.streakDays);

  return (
    <BentoCard 
      style={styles.container}
      accessible={true}
      accessibilityLabel={`Streak: ${streak} days following your plan`}
      accessibilityRole="summary"
    >
      <Text style={styles.title}>Streak</Text>
      <View style={styles.flameContainer}>
        <Text style={styles.flame}>🔥</Text>
        <Text style={styles.number}>{streak}</Text>
      </View>
      <Text style={styles.subtitle}>Days following your plan</Text>
    </BentoCard>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: theme.colors.text },
  flameContainer: { alignItems: 'center', marginVertical: theme.spacing.md },
  flame: { fontSize: 48 },
  number: { fontSize: 40, fontWeight: '900', color: theme.colors.text, marginTop: -20 },
  subtitle: { fontSize: 14, color: theme.colors.textMuted }
});
