import { View, Text, StyleSheet } from 'react-native';
import { useStore } from '../store';
import { useAppTheme } from '../theme';
import { Flame, Calendar, Trophy } from 'lucide-react-native';

export function StreakWidget() {
  const streakDays = useStore((s) => s.streakDays);
  const t = useAppTheme();

  return (
    <View style={[styles.card, { backgroundColor: t.colors.card, borderColor: t.colors.border }]} accessible={true} accessibilityRole="summary" accessibilityLabel={`Current streak: ${streakDays} days`}>
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: t.colors.accent + '20' }]}>
          <Flame size={28} color={t.colors.accent} fill={t.colors.accent} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: t.colors.text }]}>Current Streak</Text>
          <Text style={[styles.subtitle, { color: t.colors.textMuted }]}>Consistency is key</Text>
        </View>
      </View>

      <View style={[styles.statsRow, { backgroundColor: t.colors.background }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: t.colors.text }]}>{streakDays}</Text>
          <Text style={[styles.statLabel, { color: t.colors.textMuted }]}>Days</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: t.colors.border }]} />
        <View style={styles.statItem}>
          <Trophy size={24} color="#FFD60A" />
          <Text style={[styles.statLabel, { color: t.colors.textMuted }]}>Pro</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: t.colors.border }]} />
        <View style={styles.statItem}>
          <Calendar size={24} color={t.colors.textMuted} />
          <Text style={[styles.statLabel, { color: t.colors.textMuted }]}>Log</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 15,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: { marginLeft: 16 },
  title: { fontSize: 20, fontWeight: '800' },
  subtitle: { fontSize: 14, marginTop: 2 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 16,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  divider: { width: 1, height: 30 }
});
