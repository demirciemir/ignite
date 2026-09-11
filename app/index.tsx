import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Link, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Swipeable } from 'react-native-gesture-handler';
import { useStore } from '../src/store';
import { useAppTheme } from '../src/theme';
import { Play, Settings, Plus, Trash2, Edit2, Timer, Flame } from 'lucide-react-native';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Home() {
  const workouts = useStore((s) => s.workouts);
  const streakDays = useStore((s) => s.streakDays);
  const removeWorkout = useStore((s) => s.removeWorkout);
  const insets = useSafeAreaInsets();
  const t = useAppTheme();
  const router = useRouter();

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
              <Flame size={16} color="#FF9500" fill="#FF9500" />
              <Text style={[styles.streakText, { color: t.colors.text }]}>{streakDays}</Text>
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
                          <Text style={[styles.workoutSub, { color: t.colors.textMuted }]}>{w.blocks.length} blocks</Text>
                        </View>
                      </View>
                      <View style={[styles.actionPill, { backgroundColor: t.colors.background }]}>
                        <Text style={[styles.actionText, { color: t.colors.text }]}>Start</Text>
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
  actionPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  actionText: { fontSize: 14, fontWeight: '700' },
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
