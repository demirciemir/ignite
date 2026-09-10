import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter, Redirect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAudioPlayer } from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore, IntervalBlock } from '../../src/store';
import { useAppTheme } from '../../src/theme';
import Animated, { 
  FadeIn, FadeOut, FadeInRight, FadeOutLeft, ZoomIn, ZoomOut, runOnJS,
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
  const fillProgress = useSharedValue(0);
  const [isResuming, setIsResuming] = useState(false);

  // Sound players
  const workSound = useAudioPlayer(require('../../assets/sounds/work.wav'));
  const restSound = useAudioPlayer(require('../../assets/sounds/rest.wav'));
  const completeSound = useAudioPlayer(require('../../assets/sounds/complete.wav'));

  const playSound = async (type: 'work' | 'rest' | 'complete') => {
    try {
      if (type === 'work') { await workSound.seekTo(0); workSound.play(); }
      else if (type === 'rest') { await restSound.seekTo(0); restSound.play(); }
      else { await completeSound.seekTo(0); completeSound.play(); }
    } catch (e) {
      console.warn("Could not play sound", e);
    }
  };

  // Sound/Haptics helpers
  const playTick = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
  const playEnd = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (state === 'running') {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 0) return 0;
          if (prev === 1) playEnd();
          else if (prev <= 4) playTick();
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [state]);

  useEffect(() => {
    if (state === 'running' && timeLeft === 0) {
      const t = setTimeout(() => {
        if (blockIdx < blocks.length - 1) {
          const nextIdx = blockIdx + 1;
          const nextType = blocks[nextIdx].type;
          setBlockIdx(nextIdx);
          setTimeLeft(blocks[nextIdx].durationSeconds);
          progress.value = 1;
          playSound(nextType);
        } else {
          setState('finished');
          playSound('complete');
        }
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [timeLeft, state, blockIdx]);

  useEffect(() => {
    if (state === 'idle') {
      progress.value = withSpring(1);
    } else if (state === 'finished') {
      progress.value = withTiming(0, { duration: 500 });
    } else {
      const currentDur = currentBlock.durationSeconds;
      const target = timeLeft / currentDur;
      if (timeLeft === currentDur) {
        progress.value = target;
      } else {
        progress.value = withTiming(target, { duration: 1000 });
      }
    }
  }, [timeLeft, state, currentBlock.durationSeconds]);

  const animatedCircleProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
    };
  });

  const animatedBgStyle = useAnimatedStyle(() => {
    if (state === 'finished') {
      return { backgroundColor: withTiming(t.colors.success, { duration: 800 }) };
    }
    const isWork = currentBlock.type === 'work';
    const activeColor = isWork ? '#FF3B30' : '#007AFF'; // Red for work, Blue for rest
    const bg = state === 'idle' ? t.colors.background : activeColor;
    return {
      backgroundColor: withTiming(bg, { duration: 800 }),
    };
  });

  const dimStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(state === 'paused' ? 0.3 : 1, { duration: 300 }),
      transform: [{ scale: withTiming(state === 'paused' ? 0.95 : 1, { duration: 300 }) }]
    };
  }, [state]);

  const fillAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: `${fillProgress.value * 100}%`
    };
  });

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setState('running');
    playSound(currentBlock.type);
  };

  const handlePause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setState('paused');
    setIsResuming(false);
    fillProgress.value = 0;
  };

  const handleResume = () => {
    if (isResuming) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsResuming(true);
    fillProgress.value = 0;
    fillProgress.value = withTiming(1, { duration: 1000 }, (finished) => {
      if (finished) {
        runOnJS(setState)('running');
        runOnJS(setIsResuming)(false);
      }
    });
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (blockIdx < blocks.length - 1) {
      const nextIdx = blockIdx + 1;
      setBlockIdx(nextIdx);
      setTimeLeft(blocks[nextIdx].durationSeconds);
      progress.value = 1;
      playSound(blocks[nextIdx].type);
    } else {
      setState('finished');
      playSound('complete');
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

  return (
    <Animated.View style={[styles.container, animatedBgStyle]}>
      {state === 'finished' ? (
        <Animated.View entering={FadeIn.delay(300).springify()} style={[styles.finishedView, StyleSheet.absoluteFill]}>
          <Text style={styles.finishedTitle}>Workout Complete!</Text>
          <Text style={styles.finishedSub}>Great job crushing {workout.name}.</Text>
          <Pressable onPress={handleClose} style={styles.finishedBtn}>
            <Text style={[styles.finishedBtnText, { color: t.colors.success }]}>Back to Dashboard</Text>
          </Pressable>
        </Animated.View>
      ) : (
        <Animated.View exiting={FadeOut} style={[StyleSheet.absoluteFill, { alignItems: 'center' }]}>
          <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
            <Pressable onPress={handleClose} style={styles.iconBtn}>
              <X size={28} color={themeColor} />
            </Pressable>
            <Text style={[styles.workoutTitle, { color: themeColor }]}>
              {blockIdx + 1} / {blocks.length}
            </Text>
            <View style={{ width: 28 }} />
          </View>

          <View style={{ flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' }}>
            <Animated.View 
              key={blockIdx}
              entering={FadeInRight.duration(300)}
              exiting={FadeOutLeft.duration(300)}
              style={styles.timerWrapper}
            >
              <Animated.View style={[styles.timerWrapper, dimStyle]}>
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
              </Animated.View>
            </Animated.View>

            {state === 'paused' && (
              <Animated.View 
                entering={ZoomIn.duration(200)} 
                exiting={ZoomOut.duration(200)}
                style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}
                pointerEvents="box-none"
              >
                <Pressable onPress={handleResume} style={[styles.hugePlayBtn, { backgroundColor: t.colors.text, overflow: 'hidden' }]}>
                  <Animated.View style={[{
                    position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: t.colors.success
                  }, fillAnimatedStyle]} />
                  <Play size={48} color={t.colors.background} fill={t.colors.background} style={{ zIndex: 10 }} />
                </Pressable>
              </Animated.View>
            )}
          </View>

          <View style={[styles.controls, { paddingBottom: Math.max(insets.bottom, 40) }]}>
            {state === 'idle' ? (
              <Pressable onPress={handleStart} style={[styles.mainBtn, { backgroundColor: t.colors.text }]}>
                <Text style={[styles.mainBtnText, { color: t.colors.background }]}>Start Workout</Text>
              </Pressable>
            ) : state === 'paused' ? null : (
              <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.activeControls}>
                <Pressable onPress={handlePause} style={[styles.controlBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Pause size={32} color="#FFF" fill="#FFF" />
                </Pressable>
                <Pressable onPress={handleSkip} style={[styles.controlBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <SkipForward size={32} color="#FFF" />
                </Pressable>
              </Animated.View>
            )}
          </View>
        </Animated.View>
      )}
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
    minHeight: 120, // Prevents layout jump when hiding controls
    justifyContent: 'flex-end',
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
  hugePlayBtn: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 8, // Optical centering for play icon
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
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
