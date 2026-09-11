import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Dimensions } from 'react-native';
import { useStore } from '../src/store';
import { Link, useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Settings, Play, Trash2, Edit2, Timer, Flame, ChevronLeft } from 'lucide-react-native';
import { Swipeable } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../src/theme';
import Animated, { FadeInDown, Layout, useSharedValue, useAnimatedStyle, withSpring, withTiming, Easing } from 'react-native-reanimated';

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

  const [displayStreak, setDisplayStreak] = useState(computedStreak);
  const [showAnimation, setShowAnimation] = useState(false);
  const router = useRouter();

  const flameX = useSharedValue(width / 2 - 50);
  const flameY = useSharedValue(height / 2 - 50);
  const flameScale = useSharedValue(0);
  const flameOpacity = useSharedValue(0);

  useFocusEffect(
    useCallback(() => {
      // Re-evaluate displayStreak when screen comes into focus
      let currentComputed = streakDays;
      if (!lastWorkoutDate || (lastWorkoutDate !== today && lastWorkoutDate !== yesterdayStr)) {
        currentComputed = 0;
      }

      if (justEarnedStreak) {
        setDisplayStreak(currentComputed - 1); // hold the old value during animation
        setShowAnimation(true);
        
        flameX.value = width / 2 - 50;
        flameY.value = height / 2 - 50;
        flameScale.value = withSpring(3, { damping: 12 });
        flameOpacity.value = withTiming(1, { duration: 300 });

        setTimeout(() => {
          flameX.value = withTiming(width - 60, { duration: 600, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
          flameY.value = withTiming(insets.top + 100, { duration: 600, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }); // approximate streak pill y
          flameScale.value = withTiming(0.3, { duration: 600 });
          
          setTimeout(() => {
            flameOpacity.value = withTiming(0, { duration: 200 });
            setDisplayStreak(currentComputed);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setShowAnimation(false);
            clearStreakAnimation();
          }, 600);
        }, 1000);

      } else {
        setDisplayStreak(currentComputed);
      }
    }, [justEarnedStreak, streakDays, lastWorkoutDate])
  );

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

  const renderRightActions = (id: string) => {
    return (
      <View style={styles.swipeActions}>
        <Pressable style={[styles.swipeBtn, { backgroundColor: '#FF9500' }]} onPress={() => handleEdit(id)}>
          <Edit2 size={20} color="#FFF" />
        </Pressable>
        <Pressable style={[styles.swipeBtn, { backgroundColor: t.colors.accent }]} onPress={() => handleDelete(id)}>
          <Trash2 size={20} color="#FFF" />
        </Pressable>
      </View>
    );
  };

  return (
    <View style={[styles.wrapper, { backgroundColor: t.colors.background }]}>
      {showAnimation && (
        <Animated.View style={[{ position: 'absolute', top: 0, left: 0, zIndex: 9999 }, animatedFlameStyle]} pointerEvents="none">
          <Flame size={100} color="#FF9500" fill="#FF9500" />
        </Animated.View>
      )}

      <ScrollView 
        style={styles.container} 
        contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 20), paddingBottom: 100 }]}
      >
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[styles.appIconBox, { backgroundColor: t.colors.text }]}>
                <Timer size={24} color={t.colors.background} />
              </View>
              <Text style={[styles.headerTitle, { color: t.colors.text }]}>Timer App</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <View style={[styles.sectionHeader, { justifyContent: 'space-between' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.sectionTitle, { color: t.colors.text }]}>Your Workouts</Text>
              <Text style={[styles.countBadge, { backgroundColor: t.colors.border, color: t.colors.textMuted }]}>
                {workouts.length}
              </Text>
            </View>
            <Pressable 
              onPress={() => { handlePress(); router.push('/streak'); }}
              style={[styles.streakPill, { backgroundColor: t.colors.card }]}
            >
              <Flame size={16} color={displayStreak > 0 ? "#FF9500" : t.colors.textMuted} fill={displayStreak > 0 ? "#FF9500" : "transparent"} />
              <Text style={[styles.streakText, { color: displayStreak > 0 ? t.colors.text : t.colors.textMuted }]}>{displayStreak}</Text>
            </Pressable>
          </View>
          
          {workouts.length === 0 ? (
            <View style={[styles.empty, { backgroundColor: t.colors.card }]}>
              <Text style={[styles.emptyText, { color: t.colors.textMuted }]}>No workouts yet. Tap + to create one.</Text>
            </View>
          ) : (
            workouts.map((w, index) => (
              <Animated.View key={w.id} layout={Layout.springify()} entering={FadeInDown.delay(200 + (index * 50)).springify()}>
                <Swipeable renderRightActions={() => renderRightActions(w.id)} overshootRight={false}>
                  <Pressable
                    accessible={true}
                    accessibilityRole="button"
                    onPress={() => { handlePress(); router.push(`/timer/${w.id}`); }}
                    style={({ pressed }) => [styles.workoutCardWrapper, pressed && styles.pressed]}
                  >
                    <View style={[styles.workoutCard, { backgroundColor: t.colors.card }]}>
                      <View style={styles.workoutInfo}>
                        <View style={[styles.playIconBox, { backgroundColor: t.colors.text }]}>
                          <Play size={20} color={t.colors.background} fill={t.colors.background} />
                        </View>
                        <View>
                          <Text style={[styles.workoutName, { color: t.colors.text }]}>{w.name}</Text>
                          <Text style={[styles.workoutSub, { color: t.colors.textMuted }]}>
                            {w.blocks.length} blocks {"\u2022"} {Math.max(1, Math.round(w.blocks.reduce((acc: any, b: any) => acc + (b.durationSeconds || 0), 0) / 60))} min
                          </Text>
                        </View>
                      </View>
                      <View style={styles.swipeHint}>
                        <ChevronLeft size={20} color={t.colors.textMuted} opacity={0.5} />
                      </View>
                    </View>
                  </Pressable>
                </Swipeable>
              </Animated.View>
            ))
          )}
        </Animated.View>
      </ScrollView>

      {/* Fake Tab Bar */}
      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 20), backgroundColor: t.colors.background }]}>
        <View style={styles.tabItem}>
          {/* Left empty as requested */}
        </View>
        <Pressable 
          onPress={() => { handlePress(); router.push('/builder'); }} 
          style={[styles.fabBtn, { backgroundColor: t.colors.text, shadowColor: t.colors.text }]}
        >
          <Plus size={32} color={t.colors.background} />
        </Pressable>
        <Pressable 
          onPress={() => { handlePress(); router.push('/settings'); }}
          style={styles.tabItem}
        >
          <Settings size={24} color={t.colors.textMuted} />
          <Text style={[styles.tabLabel, { color: t.colors.textMuted }]}>Settings</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  container: { flex: 1 },
  content: { padding: 24, gap: 24 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  appIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: { fontSize: 16, fontWeight: '600' },
  headerTitle: { fontSize: 28, fontWeight: '800' },
  profileBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 22, fontWeight: '800' },
  countBadge: { 
    marginLeft: 8, 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 10,
    overflow: 'hidden',
    fontWeight: '700',
  },
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
  workoutCardWrapper: { marginBottom: 16 },
  workoutCard: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutName: { fontSize: 18, fontWeight: '800' },
  workoutSub: { fontSize: 14, fontWeight: '500', marginTop: 2 },
  swipeHint: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { transform: [{ scale: 0.97 }] },
  swipeActions: { flexDirection: 'row', alignItems: 'center', paddingBottom: 16, paddingLeft: 8 },
  swipeBtn: { width: 64, height: '100%', justifyContent: 'center', alignItems: 'center', borderRadius: 24, marginLeft: 8 },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 16,
  },
  tabItem: { alignItems: 'center', gap: 4, width: 80 },
  tabLabel: { fontSize: 12, fontWeight: '600' },
  fabBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -30,
    shadowOpacity: 0.3,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  }
});

