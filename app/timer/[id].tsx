import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, ScrollView } from 'react-native';
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
import { Play, Pause, X, SkipForward, ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.75;
const STROKE_WIDTH = 8;
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

  const [state, setState] = useState<'idle' | 'countdown' | 'running' | 'paused' | 'resuming' | 'finished'>('idle');
  const [blockIdx, setBlockIdx] = useState(0);
  const [countdown, setCountdown] = useState(3);
  
  const currentBlock = blocks[blockIdx] || blocks[0];
  const [timeLeft, setTimeLeft] = useState(currentBlock.durationSeconds);
  
  const progress = useSharedValue(1);
  const svgOpacity = useSharedValue(1);
  const resumeProgress = useSharedValue(0);
  const scrollRef = useRef<ScrollView>(null);

  // Sound players
  const workSound = useAudioPlayer(require('../../assets/sounds/work.wav'));
  const restSound = useAudioPlayer(require('../../assets/sounds/rest.wav'));
  const completeSound = useAudioPlayer(require('../../assets/sounds/complete.wav'));
  const tickSound = useAudioPlayer(require('../../assets/sounds/tick.wav'));
  const goSound = useAudioPlayer(require('../../assets/sounds/go.wav'));

  const playSound = async (type: 'work' | 'rest' | 'complete' | 'tick' | 'go') => {
    try {
      if (type === 'work') { await workSound.seekTo(0); workSound.play(); }
      else if (type === 'rest') { await restSound.seekTo(0); restSound.play(); }
      else if (type === 'tick') { await tickSound.seekTo(0); tickSound.play(); }
      else if (type === 'go') { await goSound.seekTo(0); goSound.play(); }
      else { await completeSound.seekTo(0); completeSound.play(); }
    } catch (e) {
      console.warn("Could not play sound", e);
    }
  };

  const playTick = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    playSound('tick');
  };
  const playEnd = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    playSound('go');
  };

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
      const timerId = setTimeout(() => {
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
      return () => clearTimeout(timerId);
    }
  }, [timeLeft, state, blockIdx]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (state === 'countdown') {
      interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            playEnd();
            setState('running');
            playSound(currentBlock.type);
            return 0;
          }
          playTick();
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [state]);

  useEffect(() => {
    if (state === 'running') {
      const target = timeLeft / currentBlock.durationSeconds;
      progress.value = withTiming(target, { duration: 1000 });
    }
  }, [timeLeft, state]);

  // Scroll to active item in timeline
  useEffect(() => {
    if (scrollRef.current && state === 'running') {
      const ITEM_WIDTH = 120; // approximate width of timeline item
      const x = Math.max(0, blockIdx * ITEM_WIDTH - width / 2 + ITEM_WIDTH / 2);
      scrollRef.current.scrollTo({ x, animated: true });
    }
  }, [blockIdx, state]);

  const handleStart = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setState('countdown');
    playTick();
  };

  const handlePause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    svgOpacity.value = withTiming(0.3, { duration: 300 });
    setState('paused');
  };

  const handleResume = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setState('resuming');
    resumeProgress.value = 0;
    const currentTarget = timeLeft / currentBlock.durationSeconds;
    resumeProgress.value = withTiming(currentTarget, { duration: 1000 }, () => {
      svgOpacity.value = 1;
      runOnJS(setState)('running');
    });
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (blockIdx < blocks.length - 1) {
      const nextIdx = blockIdx + 1;
      const nextType = blocks[nextIdx].type;
      setBlockIdx(nextIdx);
      setTimeLeft(blocks[nextIdx].durationSeconds);
      progress.value = 1;
      playSound(nextType);
      if (state === 'paused') {
        svgOpacity.value = withTiming(1, { duration: 300 });
        setState('running');
      }
    } else {
      setState('finished');
      playSound('complete');
    }
  };

  const handleClose = () => {
    router.back();
  };

  const animatedCircleProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
      strokeOpacity: svgOpacity.value
    };
  });

  const resumeCircleProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: CIRCUMFERENCE * (1 - resumeProgress.value)
    };
  });

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isWork = currentBlock.type === 'work';
  const themeColor = isWork ? t.colors.accent : '#007AFF';
  const trackColor = t.colors.card;

  const accumulatedTimes = useMemo(() => {
    let total = 0;
    return blocks.map(b => {
      const start = total;
      total += b.durationSeconds;
      return start;
    });
  }, [blocks]);

  return (
    <Animated.View entering={FadeIn.duration(400)} style={[styles.container, { backgroundColor: t.colors.background }]}>
      {state === 'finished' ? (
        <Animated.View entering={FadeIn.delay(300).duration(400)} style={[styles.finishedView, StyleSheet.absoluteFill]}>
          <Animated.View entering={FadeIn.delay(500).duration(500)}>
            <CheckCircle2 size={100} color={t.colors.success} />
          </Animated.View>
          <Text style={[styles.finishedTitle, { color: t.colors.text, marginTop: 24 }]}>Workout Complete!</Text>
          <Text style={[styles.finishedSub, { color: t.colors.textMuted }]}>Great job crushing {workout.name}.</Text>
          <Pressable onPress={handleClose} style={[styles.finishedBtn, { backgroundColor: t.colors.card }]}>
            <ArrowLeft size={32} color={t.colors.text} />
          </Pressable>
        </Animated.View>
      ) : (
        <Animated.View exiting={FadeOut} style={[StyleSheet.absoluteFill, { alignItems: 'center' }]}>
          <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
            <Pressable onPress={handleClose} style={[styles.iconBtn, { backgroundColor: t.colors.card }]}>
              <X size={24} color={t.colors.text} />
            </Pressable>
            <Text style={[styles.workoutTitle, { color: t.colors.text }]}>
              {workout.name}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={{ flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center', marginTop: -20 }}>
            <Animated.View 
              key={`wrap-${blockIdx}`}
              entering={FadeIn.duration(400)}
              exiting={FadeOut.duration(400)}
              style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}
            >
              <View style={styles.timerWrapper}>
                <View>
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
                    {state === 'resuming' && (
                      <AnimatedCircle
                        cx={CIRCLE_SIZE / 2}
                        cy={CIRCLE_SIZE / 2}
                        r={RADIUS}
                        stroke={themeColor}
                        strokeWidth={STROKE_WIDTH}
                        fill="transparent"
                        strokeDasharray={CIRCUMFERENCE}
                        strokeLinecap="round"
                        animatedProps={resumeCircleProps}
                        transform={`rotate(-90 ${CIRCLE_SIZE / 2} ${CIRCLE_SIZE / 2})`}
                      />
                    )}
                  </Svg>
                </View>
                <View style={styles.timeDisplay}>
                  {state === 'countdown' ? (
                    <Animated.Text 
                      key={`cd-${countdown}`} 
                      entering={ZoomIn.springify().damping(14).withInitialValues({ transform: [{ scale: 0.3 }] })} 
                      exiting={ZoomOut.duration(150)}
                      style={[styles.timeText, { color: t.colors.text, fontSize: 100 }]}
                    >
                      {countdown}
                    </Animated.Text>
                  ) : (
                    <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)} style={{ alignItems: 'center' }}>
                      <Text style={[styles.timeText, { color: t.colors.text }]}>
                        {formatTime(timeLeft)}
                      </Text>
                      <Text style={[styles.subTimeText, { color: t.colors.textMuted }]}>
                        {formatTime(currentBlock.durationSeconds)}
                      </Text>
                    </Animated.View>
                  )}
                </View>
              </View>

              {/* Step info below ring */}
              <View style={styles.stepInfoContainer}>
                <Text style={[styles.stepText, { color: t.colors.textMuted }]}>STEP {blockIdx + 1} / {blocks.length}</Text>
                <Text style={[styles.blockNameText, { color: t.colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
                  {currentBlock.name || (isWork ? 'Work' : 'Rest')}
                </Text>
              </View>
            </Animated.View>
          </View>

          {/* Timeline ScrollView */}
          <View style={styles.timelineContainer}>
            <ScrollView 
              ref={scrollRef}
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.timelineContent}
            >
              {blocks.map((b, i) => {
                const isActive = i === blockIdx;
                const isPast = i < blockIdx;
                const isFuture = i > blockIdx;
                return (
                  <View key={i} style={[
                    styles.timelineItem, 
                    isActive && [styles.timelineItemActive, { backgroundColor: t.colors.card }]
                  ]}>
                    <Text style={[
                      styles.timelineName, 
                      { 
                        color: isActive ? t.colors.text : (isPast ? t.colors.textMuted : t.colors.text),
                        opacity: isFuture ? 0.4 : 1
                      }
                    ]}>
                      {b.name || (b.type === 'work' ? 'Work' : 'Rest')}
                    </Text>
                    <Text style={[
                      styles.timelineTime, 
                      { 
                        color: isActive ? t.colors.textMuted : (isPast ? t.colors.textMuted : t.colors.text),
                        opacity: isFuture ? 0.3 : 1
                      }
                    ]}>
                      @ {formatTime(accumulatedTimes[i])}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>

          <View style={[styles.controls, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            {state === 'idle' || state === 'countdown' ? (
              <Pressable onPress={state === 'idle' ? handleStart : undefined} style={[styles.startBtn, { backgroundColor: t.colors.text, opacity: state === 'countdown' ? 0.5 : 1 }]}>
                <Text style={[styles.startBtnText, { color: t.colors.background }]}>Start Workout</Text>
              </Pressable>
            ) : (
              <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.pillControls}>
                <Pressable 
                  onPress={state === 'paused' ? handleResume : handlePause} 
                  style={[styles.pillBtn, { backgroundColor: 'rgba(255, 149, 0, 0.15)' }, state === 'resuming' && { opacity: 0.5 }]}
                  disabled={state === 'resuming'}
                >
                  {state === 'paused' || state === 'resuming' ? <Play size={24} color="#FF9500" fill="#FF9500" /> : <Pause size={24} color="#FF9500" fill="#FF9500" />}
                  <Text style={[styles.pillBtnText, { color: '#FF9500' }]}>{state === 'paused' || state === 'resuming' ? 'Resume' : 'Pause'}</Text>
                </Pressable>
                
                <Pressable 
                  onPress={handleSkip} 
                  style={[styles.pillBtn, { backgroundColor: t.colors.text }, state === 'resuming' && { opacity: 0.5 }]}
                  disabled={state === 'resuming'}
                >
                  <SkipForward size={24} color={t.colors.background} fill={t.colors.background} />
                  <Text style={[styles.pillBtnText, { color: t.colors.background }]}>Next</Text>
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
  iconBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  workoutTitle: { fontSize: 18, fontWeight: '700', letterSpacing: 0.5 },
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
    fontSize: 72,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  subTimeText: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 4,
  },
  stepInfoContainer: {
    alignItems: 'center',
    marginTop: 32,
    paddingHorizontal: 32,
  },
  stepText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  blockNameText: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: 8,
    textAlign: 'center',
  },
  timelineContainer: {
    width: '100%',
    height: 80,
    marginBottom: 16,
  },
  timelineContent: {
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 16,
  },
  timelineItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  timelineItemActive: {
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  timelineName: {
    fontSize: 14,
    fontWeight: '700',
  },
  timelineTime: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  controls: {
    width: '100%',
    paddingHorizontal: 24,
    minHeight: 100, // Prevents layout jump when hiding controls
    justifyContent: 'flex-end',
  },
  startBtn: {
    width: '100%',
    paddingVertical: 20,
    borderRadius: 9999,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  startBtnText: { fontSize: 20, fontWeight: '800' },
  pillControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  pillBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pillBtnText: {
    fontSize: 18,
    fontWeight: '700',
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
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  }
});
