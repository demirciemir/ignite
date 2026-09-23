import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../src/theme';
import { useStore, WorkoutLog } from '../src/store';
import { ChevronLeft, CalendarDays, Activity, Timer, PlayCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const formatHMS = (totalSecs: number) => {
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export default function History() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const t = useAppTheme();
  
  const history = useStore(s => s.history || []);

  const renderItem = ({ item }: { item: WorkoutLog }) => {
    const d = new Date(item.date);
    const dateStr = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={[styles.card, { backgroundColor: t.colors.card, borderColor: t.colors.border }]}>
        <View style={[styles.cardHeader, { borderBottomColor: t.colors.border }]}>
          <View style={styles.dateContainer}>
            <CalendarDays size={16} color={t.colors.textMuted} />
            <Text style={[styles.dateText, { color: t.colors.text }]}>{dateStr} - {timeStr}</Text>
          </View>
          <Text style={[styles.totalTime, { color: t.colors.accent }]}>{formatHMS(item.totalDurationSeconds)}</Text>
        </View>

        <View style={styles.cardBody}>
          <Text style={[styles.workoutName, { color: t.colors.text }]}>{item.workoutName}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={[styles.statLabel, { color: t.colors.textMuted }]}>İş (Work)</Text>
              <Text style={[styles.statValue, { color: '#FF3B30' }]}>{formatHMS(item.workDurationSeconds)}</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={[styles.statLabel, { color: t.colors.textMuted }]}>Mola (Rest)</Text>
              <Text style={[styles.statValue, { color: '#0A84FF' }]}>{formatHMS(item.restDurationSeconds)}</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={[styles.statLabel, { color: t.colors.textMuted }]}>Tur (Rounds)</Text>
              <Text style={[styles.statValue, { color: t.colors.text }]}>{item.roundsCompleted}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: t.colors.background }]}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Pressable 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }} 
          style={[styles.backBtn, { backgroundColor: t.colors.card }]}
        >
          <ChevronLeft size={24} color={t.colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: t.colors.text }]}>Geçmiş</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 40 }]}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Activity size={48} color={t.colors.border} style={{ marginBottom: 16 }} />
            <Text style={[styles.emptyText, { color: t.colors.textMuted }]}>Henüz tamamlanmış bir idman yok.</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  listContent: {
    padding: 20,
    gap: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalTime: {
    fontSize: 14,
    fontWeight: '800',
  },
  cardBody: {
    padding: 16,
  },
  workoutName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCol: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
  }
});
