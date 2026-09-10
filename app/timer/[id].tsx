import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter, Redirect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore, IntervalBlock } from '../../src/store';
import { useAppTheme } from '../../src/theme';
import Animated, { 
  FadeIn, FadeOut, 
  useSharedValue, useAnimatedStyle, useAnimatedProps, withSpring, withTiming,
  interpolateColor, Extrapolation, interpolate
} from 'react-native-reanimated';
import { Play, Pause, X, SkipForward } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.8;
const STROKE_WIDTH = 20;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function ActiveTimer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useAppTheme();
  const insets = useSafeAreaInsets();
  
  const workout = useStore((s) => s.workouts.find((w) => w.id === id));
  
  if (!workout) return <Redirect href="/" />;
  
  const blocks = workout.blocks as IntervalBlock[];

  const [state, setState] = useState<'idle' | 'running' | 'paused' | 'finished'>('idle');
  const [blockIdx, setBlockIdx] = useState(0);
  
  const currentBlock = blocks[blockIdx] || blocks[0];
  const [timeLeft, setTimeLeft] = useState(currentBlock.durationSeconds);
  
  const progress = useSharedValue(1);

  // Sound/Haptics helpers
  const playTick = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
  const playEnd = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (state === 'running') {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            playEnd();
            if (blockIdx < blocks.length - 1) {
              // We hit 0 for this block, jump to next block
              // Wait! If we jump to next block instantly, we skip the 0s animation.
              // Let's defer it slightly.
              setTimeout(() => {
                setBlockIdx(b => b + 1);
                const nextDur = blocks[blockIdx + 1].durationSeconds;
                setTimeLeft(nextDur);
                progress.value = 1;
              }, 100);
              return 0; // return 0 visually for a fraction
            } else {
              setTimeout(() => setState('finished'), 100);
              return 0;
            }
          }
          if (prev <= 4) playTick();
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [state, blockIdx]);

  useEffect(() => {
    if (state === 'idle') {
      progress.value = withSpring(1);
    } else {
      const currentDur = currentBlock.durationSeconds;
      const target = timeLeft / currentDur;
      // Animate linearly so the bar drains perfectly synced with the seconds
      progress.value = withTiming(target, { duration: 1000 });
    }
  }, [timeLeft, state]);

  const animatedCircleProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
    };
  });

  const animatedBgStyle = useAnimatedStyle(() => {
    const isWork = currentBlock.type === 'work';
    const activeColor = isWork ? '#FF3B30' : '#007AFF'; // Red for work, Blue for rest
    const bg = state === 'idle' ? t.colors.background : activeColor;
    return {
      backgroundColor: withTiming(bg, { duration: 500 }),
    };
  });

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setState('running');
  };

  const handlePause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setState(state === 'running' ? 'paused' : 'running');
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (blockIdx < blocks.length - 1) {
      setBlockIdx(b => b + 1);
      setTimeLeft(blocks[blockIdx + 1].durationSeconds);
      progress.value = 1;
    } else {
      setState('finished');
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m > 0 ? m + ':' : ''}${s.toString().padStart(2, '0')}`;
  };

  const isWork = currentBlock.type === 'work';
  const themeColor = state === 'idle' ? t.colors.text : '#FFFFFF';
  const trackColor = state === 'idle' ? t.colors.border : 'rgba(255,255,255,0.2)';

  if (state === 'finished') {
    return (
      <View style={[styles.container, { backgroundColor: t.colors.success }]}>
        <Animated.View entering={FadeIn.springify()} style={styles.finishedView}>
          <Text style={styles.finishedTitle}>Workout Complete!</Text>
          <Text style={styles.finishedSub}>Great job crushing {workout.name}.</Text>
          <Pressable onPress={handleClose} style={styles.finishedBtn}>
            <Text style={[styles.finishedBtnText, { color: t.colors.success }]}>Back to Dashboard</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, animatedBgStyle]}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Pressable onPress={handleClose} style={styles.iconBtn}>
          <X size={28} color={themeColor} />
        </Pressable>
        <Text style={[styles.workoutTitle, { color: themeColor }]}>
          {blockIdx + 1} / {blocks.length}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.timerWrapper}>
        <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
          <Circle
            cx={CIRCLE_SIZE / 2}
            cy={CIRCLE_SIZE / 2}
            r={RADIUS}
            stroke={trackColor}
            strokeWidth={STROKE_WIDTH}
            fill="transparent"
          />
          <AnimatedCircle
            cx={CIRCLE_SIZE / 2}
            cy={CIRCLE_SIZE / 2}
            r={RADIUS}
            stroke={themeColor}
            strokeWidth={STROKE_WIDTH}
            fill="transparent"
            strokeDasharray={CIRCUMFERENCE}
            strokeLinecap="round"
            animatedProps={animatedCircleProps}
            transform={`rotate(-90 ${CIRCLE_SIZE / 2} ${CIRCLE_SIZE / 2})`}
          />
        </Svg>
        <View style={styles.timeDisplay}>
          <Text style={[styles.timeText, { color: themeColor }]}>
            {formatTime(timeLeft)}
          </Text>
          <Text style={[styles.statusText, { color: themeColor }]}>
            {state === 'idle' ? 'READY' : (isWork ? 'WORK' : 'REST')}
          </Text>
        </View>
      </View>

      <View style={[styles.controls, { paddingBottom: Math.max(insets.bottom, 40) }]}>
        {state === 'idle' ? (
          <Pressable onPress={handleStart} style={[styles.mainBtn, { backgroundColor: t.colors.text }]}>
            <Text style={[styles.mainBtnText, { color: t.colors.background }]}>Start Workout</Text>
          </Pressable>
        ) : (
          <View style={styles.activeControls}>
            <Pressable onPress={handlePause} style={[styles.controlBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              {state === 'running' ? <Pause size={32} color="#FFF" /> : <Play size={32} color="#FFF" />}
            </Pressable>
            <Pressable onPress={handleSkip} style={[styles.controlBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <SkipForward size={32} color="#FFF" />
            </Pressable>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center' },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconBtn: { padding: 8 },
  workoutTitle: { fontSize: 18, fontWeight: '700', letterSpacing: 1 },
  timerWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeDisplay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 80,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    letterSpacing: -2,
  },
  statusText: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 8,
    opacity: 0.8,
  },
  controls: {
    width: '100%',
    paddingHorizontal: 32,
  },
  mainBtn: {
    width: '100%',
    paddingVertical: 20,
    borderRadius: 9999,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  mainBtnText: { fontSize: 20, fontWeight: '800' },
  activeControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  controlBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishedView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishedTitle: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 8,
  },
  finishedSub: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  finishedBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    marginTop: 40,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  finishedBtnText: {
    fontSize: 18,
    fontWeight: '800',
  }
});
