import { View, Text, StyleSheet } from 'react-native';
import { useStore } from '../store';
import { BentoCard } from './BentoCard';
import { theme } from '../theme';
import { Flame, Calendar, Trophy } from 'lucide-react-native';

export function StreakWidget() {
  const streakDays = useStore((s) => s.streakDays);

  return (
    <BentoCard style={styles.card} accessible={true} accessibilityRole="summary" accessibilityLabel={`Current streak: ${streakDays} days`}>
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <Flame size={28} color="#FF3B30" fill="#FF3B30" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Current Streak</Text>
          <Text style={styles.subtitle}>Consistency is key</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{streakDays}</Text>
          <Text style={styles.statLabel}>Days</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Trophy size={24} color="#FFD60A" />
          <Text style={styles.statLabel}>Pro</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Calendar size={24} color={theme.colors.textMuted} />
          <Text style={styles.statLabel}>Log</Text>
        </View>
      </View>
    </BentoCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: theme.spacing.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: '#FFF0F0', // Light red
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    marginLeft: theme.spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F8F9',
    borderRadius: 16,
    padding: theme.spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: '#E5E5EA',
  }
});
