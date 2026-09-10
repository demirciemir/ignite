import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter, Redirect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../src/store';
import { theme } from '../../src/theme';

export default function ActiveTimer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const workout = useStore((s) => s.workouts.find((w) => w.id === id));
  const insets = useSafeAreaInsets();

  // Minimal placeholder state for timer
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleEndWorkout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  if (!workout) {
    return <Redirect href="/" />;
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.workoutName, { top: Math.max(insets.top, 60) }]}>{workout.name}</Text>
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>{timeLeft}</Text>
        <Text style={styles.statusText}>WORK</Text>
      </View>
      <Pressable
        style={({ pressed }) => [styles.stopBtn, { bottom: Math.max(insets.bottom, 60) }, pressed && styles.pressed]}
        onPress={handleEndWorkout}
      >
        <Text style={styles.stopBtnText}>End Workout</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutName: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.textMuted,
    position: 'absolute',
  },
  timeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 300,
    width: 300,
    borderRadius: 150,
    backgroundColor: theme.colors.card,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 2,
  },
  timeText: {
    fontSize: 80,
    fontWeight: '900',
    color: theme.colors.text,
    fontVariant: ['tabular-nums'],
  },
  statusText: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.accent,
    marginTop: 10,
  },
  stopBtn: {
    position: 'absolute',
    paddingHorizontal: 40,
    paddingVertical: 20,
    backgroundColor: theme.colors.text,
    borderRadius: 30,
  },
  stopBtnText: {
    color: theme.colors.buttonText,
    fontSize: 18,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
  },
});
