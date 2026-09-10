import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { Link } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { StreakWidget } from '../src/components/StreakWidget';
import { useStore } from '../src/store';
import { theme } from '../src/theme';
import { Play, Settings, Home as HomeIcon, Activity, Plus } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Home() {
  const workouts = useStore((s) => s.workouts);
  const insets = useSafeAreaInsets();

  const handlePress = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  return (
    <View style={styles.wrapper}>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 20), paddingBottom: 100 }]}
      >
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Ready to train?</Text>
              <Text style={styles.headerTitle}>Dashboard</Text>
            </View>
            <Pressable onPress={handlePress} style={styles.profileBtn}>
              <Settings size={24} color={theme.colors.text} />
            </Pressable>
          </View>
          
          <StreakWidget />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Workouts</Text>
            <Text style={styles.countBadge}>{workouts.length}</Text>
          </View>
          
          {workouts.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No workouts yet. Tap + to create one.</Text>
            </View>
          ) : (
            workouts.map((w, index) => (
              <Animated.View key={w.id} entering={FadeInDown.delay(200 + (index * 50)).springify()}>
                <Link href={`/timer/${w.id}`} asChild>
                  <Pressable
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={`Workout: ${w.name}`}
                    onPress={handlePress}
                    style={({ pressed }) => [styles.workoutCardWrapper, pressed && styles.pressed]}
                  >
                    <View style={styles.workoutCard}>
                      <View style={styles.workoutInfo}>
                        <View style={styles.playIconBox}>
                          <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
                        </View>
                        <View>
                          <Text style={styles.workoutName}>{w.name}</Text>
                          <Text style={styles.workoutSub}>{w.blocks.length} blocks</Text>
                        </View>
                      </View>
                      <View style={styles.actionPill}>
                        <Text style={styles.actionText}>Start</Text>
                      </View>
                    </View>
                  </Pressable>
                </Link>
              </Animated.View>
            ))
          )}
        </Animated.View>
      </ScrollView>

      {/* Fake Tab Bar for Premium Vibe */}
      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.tabItem}>
          <HomeIcon size={24} color={theme.colors.text} />
          <Text style={[styles.tabLabel, { color: theme.colors.text }]}>Home</Text>
        </View>
        <Link href="/builder" asChild>
          <Pressable onPress={handlePress} style={styles.fabBtn}>
            <Plus size={32} color="#FFFFFF" />
          </Pressable>
        </Link>
        <View style={styles.tabItem}>
          <Activity size={24} color={theme.colors.textMuted} />
          <Text style={styles.tabLabel}>Stats</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: theme.colors.background },
  container: { flex: 1 },
  content: { padding: theme.spacing.lg, gap: theme.spacing.lg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  greeting: { fontSize: 16, color: theme.colors.textMuted, fontWeight: '600' },
  headerTitle: { fontSize: 32, fontWeight: '800', color: theme.colors.text },
  profileBtn: {
    width: 48,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.md, marginBottom: theme.spacing.xs },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: theme.colors.text },
  countBadge: { 
    marginLeft: 8, 
    backgroundColor: theme.colors.border, 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 10,
    overflow: 'hidden',
    fontWeight: '700',
    color: theme.colors.textMuted,
  },
  empty: { alignItems: 'center', padding: 40, backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 24 },
  emptyText: { color: theme.colors.textMuted, fontSize: 16, fontWeight: '500' },
  workoutCardWrapper: { marginBottom: theme.spacing.md },
  workoutCard: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 15,
    elevation: 3,
  },
  workoutInfo: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  playIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutName: { fontSize: 18, fontWeight: '800', color: theme.colors.text },
  workoutSub: { fontSize: 14, color: theme.colors.textMuted, fontWeight: '500', marginTop: 2 },
  actionPill: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  actionText: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  pressed: { transform: [{ scale: 0.97 }] }, // Emil Kowalski principle
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderTopWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 16,
  },
  tabItem: { alignItems: 'center', gap: 4, width: 80 },
  tabLabel: { fontSize: 12, fontWeight: '600', color: theme.colors.textMuted },
  fabBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -30,
    shadowColor: theme.colors.text,
    shadowOpacity: 0.3,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  }
});
