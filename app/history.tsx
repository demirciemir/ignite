import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../src/theme';
import { useStore, WorkoutLog } from '../src/store';
import { Activity } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';

const formatHMS = (totalSecs: number) => {
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export default function History() {
  const hapticsEnabled = useStore(s => s.hapticsEnabled);
  const insets = useSafeAreaInsets();
  const t = useAppTheme();
  
  const history = useStore(s => s.history || []);
  const [filterRoutine, setFilterRoutine] = React.useState('All');

  const routines = ['All', ...new Set(history.map(h => h.workoutName))];
  const filteredHistory = filterRoutine === 'All' ? history : history.filter(h => h.workoutName === filterRoutine);
  const sortedHistory = [...filteredHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const renderItem = ({ item, index }: { item: WorkoutLog; index: number }) => {
    const d = new Date(item.date);
    const dateStr = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const workRatio = item.totalDurationSeconds > 0 ? (item.workDurationSeconds / item.totalDurationSeconds) * 100 : 0;
    const restRatio = item.totalDurationSeconds > 0 ? (item.restDurationSeconds / item.totalDurationSeconds) * 100 : 0;

    return (
      <Animated.View 
        layout={Layout.springify()} 
        entering={FadeInDown.delay(100 + (index * 50)).springify().damping(14).mass(0.8)}
        style={[styles.card, { backgroundColor: t.colors.card }]}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.dateText, { color: t.colors.textMuted }]}>
            {dateStr} • {timeStr}
          </Text>
        </View>

        <View style={styles.cardBody}>
          <Text style={[styles.workoutName, { color: t.colors.text }]}>{item.workoutName}</Text>
          
          <View style={{ alignItems: 'flex-start', marginBottom: 20 }}>
            <Text style={{ fontSize: 10, color: t.colors.textMuted, fontWeight: '800', letterSpacing: 2, marginBottom: 4 }}>TOTAL TIME</Text>
            <Text style={{ fontSize: 32, fontWeight: '900', color: t.colors.text, fontVariant: ['tabular-nums'], letterSpacing: -1 }}>
              {formatHMS(item.totalDurationSeconds)}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#FF3B30', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>Work</Text>
              <Text style={{ color: t.colors.text, fontSize: 14, fontWeight: '800', marginTop: 2 }}>
                {formatHMS(item.workDurationSeconds)}
              </Text>
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={{ color: '#0A84FF', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>Rest</Text>
              <Text style={{ color: t.colors.text, fontSize: 14, fontWeight: '800', marginTop: 2 }}>
                {formatHMS(item.restDurationSeconds)}
              </Text>
            </View>
          </View>

          {/* Progress Bar Representation */}
          <View style={{ height: 6, borderRadius: 3, backgroundColor: t.colors.border, flexDirection: 'row', overflow: 'hidden' }}>
            <View style={{ width: `${workRatio}%`, backgroundColor: '#FF3B30', height: '100%' }} />
            <View style={{ width: `${restRatio}%`, backgroundColor: '#0A84FF', height: '100%' }} />
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: t.colors.background }]}>
            <View style={{ alignItems: 'center', marginBottom: 16, marginTop: 16 }}>
        <View style={[styles.dragIndicator, { backgroundColor: t.colors.border, marginBottom: 16 }]} />
        <Text style={[styles.title, { color: t.colors.text, textTransform: 'uppercase' }]}>History</Text>
      </View>

      {routines.length > 1 && (
        <View style={{ marginBottom: 8, height: 44 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
            {routines.map(r => {
              const isActive = filterRoutine === r;
              return (
                <Pressable
                  key={r}
                  onPress={() => {
                    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setFilterRoutine(r);
                  }}
                  style={[
                    styles.pill,
                    { backgroundColor: isActive ? t.colors.text : t.colors.card },
                  ]}
                >
                  <Text style={[styles.pillText, { color: isActive ? t.colors.background : t.colors.textMuted }]}>
                    {r.toUpperCase()}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      <FlatList
        data={sortedHistory} // Show newest first
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 40 }]}
        ListEmptyComponent={() => (
          <Animated.View entering={FadeInDown.springify()} style={styles.emptyContainer}>
            <Activity size={48} color={t.colors.border} style={{ marginBottom: 16 }} />
            <Text style={[styles.emptyText, { color: t.colors.textMuted }]}>NO WORKOUTS COMPLETED YET.</Text>
          </Animated.View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  dragIndicator: {
    width: 40,
    height: 5,
    borderRadius: 3,
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
    borderRadius: 9999, // Pill shape consistency
    alignItems: 'center',
    justifyContent: 'center',
  },

  pill: {
    paddingHorizontal: 20,
    justifyContent: 'center',
    borderRadius: 9999,
    height: 38,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {

    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -1,
  },
  listContent: {
    padding: 20,
    gap: 16,
  },
  card: {
    borderRadius: 24, // High radius for glassmorphism style
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  cardHeader: {
    padding: 20,
    paddingBottom: 0,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  cardBody: {
    padding: 20,
  },
  workoutName: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  }
});
