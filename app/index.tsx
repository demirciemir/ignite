import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Dimensions } from 'react-native';
import { useStore } from '../src/store';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Settings, Play, Trash2, Edit3, Flame } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../src/theme';
import Animated, { FadeInUp, FadeOutDown, Layout, useSharedValue, useAnimatedStyle, withSpring, withTiming, Easing } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export default function Home() {
  const workouts = useStore((s) => s.workouts);
  const { streakDays, lastWorkoutDate, justEarnedStreak, clearStreakAnimation } = useStore();
  const removeWorkout = useStore((s) => s.removeWorkout);
  const insets = useSafeAreaInsets();
  const t = useAppTheme();

  const today = new Date().toLocaleDateString('en-CA');
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toLocaleDateString('en-CA');

  let computedStreak = streakDays;
  if (!lastWorkoutDate || (lastWorkoutDate !== today && lastWorkoutDate !== yesterdayStr)) {
    computedStreak = 0;
  }

  const [displayStreak, setDisplayStreak] = useState(computedStreak - (justEarnedStreak ? 1 : 0));
  const router = useRouter();

  // Animation values
  const flameX = useSharedValue(width / 2 - 50);
  const flameY = useSharedValue(height / 2 - 50);
  const flameScale = useSharedValue(0);
  const flameOpacity = useSharedValue(0);

  useEffect(() => {
    if (justEarnedStreak) {
      // Start pop-in animation
      flameScale.value = withSpring(3, { damping: 12 });
      flameOpacity.value = withTiming(1, { duration: 300 });

      // Fly to top-right corner
      setTimeout(() => {
        flameX.value = withTiming(width - 60, { duration: 600, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
        flameY.value = withTiming(insets.top + 20, { duration: 600, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
        flameScale.value = withTiming(0.5, { duration: 600 });
        
        setTimeout(() => {
          flameOpacity.value = withTiming(0, { duration: 200 });
          setDisplayStreak(computedStreak);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          clearStreakAnimation();
        }, 600);
      }, 1000);
    } else {
      setDisplayStreak(computedStreak);
    }
  }, [justEarnedStreak, computedStreak]);

  const animatedFlameStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: flameX.value },
      { translateY: flameY.value },
      { scale: flameScale.value }
    ],
    opacity: flameOpacity.value,
  }));

  const handlePress = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  const handleDelete = (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    removeWorkout(id);
  };

  const handleEdit = (id: string) => {
    handlePress();
    router.push(`/builder?id=${id}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: t.colors.background }]}>
      {justEarnedStreak && (
        <Animated.View style={[{ position: 'absolute', top: 0, left: 0, zIndex: 9999 }, animatedFlameStyle]} pointerEvents="none">
          <Flame size={100} color="#FF9500" fill="#FF9500" />
        </Animated.View>
      )}

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: Math.max(insets.top, 24) }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: t.colors.text }]}>Your Workouts</Text>
          <Pressable 
            onPress={() => { handlePress(); router.push('/streak'); }}
            style={[styles.streakPill, { backgroundColor: t.colors.card }]}
          >
            <Flame size={16} color={displayStreak > 0 ? "#FF9500" : t.colors.textMuted} fill={displayStreak > 0 ? "#FF9500" : "transparent"} />
            <Text style={[styles.streakText, { color: displayStreak > 0 ? t.colors.text : t.colors.textMuted }]}>{displayStreak}</Text>
          </Pressable>
        </View>
        
        {workouts.length === 0 ? (
          <Animated.View entering={FadeInUp} style={[styles.empty, { backgroundColor: t.colors.card }]}>
            <Text style={[styles.emptyText, { color: t.colors.textMuted }]}>No workouts yet.</Text>
            <Text style={[styles.emptySub, { color: t.colors.textMuted }]}>Tap the + button below to create one.</Text>
          </Animated.View>
        ) : (
          workouts.map((w, i) => (
            <Animated.View 
              key={w.id} 
              entering={FadeInUp.delay(i * 100).springify()} 
              exiting={FadeOutDown}
              layout={Layout.springify()}
              style={styles.workoutCardWrapper}
            >
              <View style={[styles.workoutCard, { backgroundColor: t.colors.card }]}>
                <View style={styles.workoutHeader}>
                  <View style={styles.workoutInfo}>
                    <Text style={[styles.workoutName, { color: t.colors.text }]}>{w.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={[styles.workoutBlocks, { color: t.colors.textMuted }]}>{w.blocks.length} blocks</Text>
                      <View style={[styles.countBadge, { backgroundColor: t.colors.border }]}>
                        <Text style={{ fontSize: 10, color: t.colors.text, fontWeight: '800' }}>
                          {Math.round(w.blocks.reduce((acc: any, b: any) => acc + (b.durationSeconds || 0), 0) / 60)}m
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.cardActions}>
                    <Pressable onPress={() => handleEdit(w.id)} style={[styles.actionBtn, { backgroundColor: t.colors.border }]}>
                      <Edit3 size={18} color={t.colors.text} />
                    </Pressable>
                    <Pressable onPress={() => handleDelete(w.id)} style={[styles.actionBtn, { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]}>
                      <Trash2 size={18} color="#FF3B30" />
                    </Pressable>
                  </View>
                </View>
                <Pressable 
                  onPress={() => { handlePress(); router.push(`/timer/${w.id}`); }} 
                  style={[styles.playBtn, { backgroundColor: t.colors.accent }]}
                >
                  <Play size={20} color="#FFF" fill="#FFF" />
                  <Text style={styles.playBtnText}>Start</Text>
                </Pressable>
              </View>
            </Animated.View>
          ))
        )}
      </ScrollView>

      {/* Modern Bottom Tab Bar */}
      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 16), backgroundColor: t.colors.background, borderTopColor: t.colors.border }]}>
        <View style={styles.tabItem} />
        
        <View style={styles.tabItem}>
          <Pressable 
            onPress={() => { handlePress(); router.push('/builder'); }} 
            style={[styles.fab, { backgroundColor: t.colors.accent }]}
          >
            <Plus size={32} color="#FFF" />
          </Pressable>
        </View>

        <View style={styles.tabItem}>
          <Pressable onPress={() => router.push('/settings')} style={styles.tabBtn}>
            <Settings size={28} color={t.colors.textMuted} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 120 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  sectionTitle: { fontSize: 24, fontWeight: '800' },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  streakText: {
    fontSize: 16,
    fontWeight: '800',
  },
  empty: { alignItems: 'center', padding: 40, borderRadius: 24 },
  emptyText: { fontSize: 16, fontWeight: '500' },
  emptySub: { fontSize: 14, marginTop: 8 },
  workoutCardWrapper: { marginBottom: 16 },
  workoutCard: {
    borderRadius: 24,
    padding: 20,
    gap: 20,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  workoutInfo: { flex: 1, gap: 4 },
  workoutName: { fontSize: 18, fontWeight: '700' },
  workoutBlocks: { fontSize: 14, fontWeight: '500' },
  countBadge: { 
    marginLeft: 8, 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 10,
    overflow: 'hidden',
    fontWeight: '700',
  },
  cardActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  playBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  tabBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    borderTopWidth: 1, paddingHorizontal: 16,
    paddingTop: 12,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabBtn: { padding: 12 },
  fab: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
    marginTop: -32,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  }
});
