import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, ScrollView, AppState } from 'react-native';
import { useLocalSearchParams, useRouter, Redirect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Notifications from 'expo-notifications';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore, IntervalBlock } from '../../src/store';
import { useAppTheme } from '../../src/theme';
import Animated, { 
  FadeIn, FadeOut, FadeInRight, FadeOutLeft, ZoomIn, ZoomOut, runOnJS,
  useSharedValue, useAnimatedStyle, useAnimatedProps, withSpring, withTiming,
  interpolateColor, Extrapolation, interpolate, Easing
} from 'react-native-reanimated';
import { Play, Pause, X, SkipForward, ArrowLeft, CheckCircle2, Timer } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldShowBanner: false,
    shouldShowList: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

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
  const logWorkout = useStore((s) => s.logWorkout);
  
  if (!workout) return <Redirect href="/" />;
  
  const blocks = workout.blocks as IntervalBlock[];
  const totalRoutineDuration = useMemo(() => blocks.reduce((acc, b) => acc + b.durationSeconds, 0), [blocks]);

  // Absolute Time State
  const [state, setState] = useState<'idle' | 'countdown' | 'running' | 'paused' | 'resuming' | 'finished'>('idle');
  const [countdownStartTime, setCountdownStartTime] = useState<number | null>(null);
  const [runningStartTime, setRunningStartTime] = useState<number | null>(null);
  const [baseTotalElapsed, setBaseTotalElapsed] = useState(0);
  const [currentTotalElapsed, setCurrentTotalElapsed] = useState(0);

  // Derived UI State
  const [blockIdx, setBlockIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(blocks[0].durationSeconds);
  const prepTime = useStore((s) => s.prepTime);
  const setPrepTime = useStore((s) => s.setPrepTime);
  const [countdown, setCountdown] = useState(prepTime);

  useEffect(() => {
    if (state === 'idle') {
      setCountdown(prepTime);
    }
  }, [prepTime, state]);

  const cyclePrepTime = () => {
    Haptics.selectionAsync();
    const cycle = [0, 3, 5, 10, 15];
    const nextIdx = (cycle.indexOf(prepTime) + 1) % cycle.length;
    setPrepTime(cycle[nextIdx]);
  };
  
  const currentBlock = blocks[blockIdx] || blocks[0];
  
  const progress = useSharedValue(1);
  const svgOpacity = useSharedValue(1);
  const resumeProgress = useSharedValue(0);
  const scrollRef = useRef<ScrollView>(null);
  
  const prevBlockIdxRef = useRef(0);
  const prevTimeLeftRef = useRef(blocks[0].durationSeconds);

  // Sound players
  const workSound = useAudioPlayer(require('../../assets/sounds/work.wav'));
  const restSound = useAudioPlayer(require('../../assets/sounds/rest.wav'));
  const completeSound = useAudioPlayer(require('../../assets/sounds/complete.wav'));
  const tickSound = useAudioPlayer(require('../../assets/sounds/tick.wav'));
  const goSound = useAudioPlayer(require('../../assets/sounds/go.wav'));

  useEffect(() => {
    Notifications.requestPermissionsAsync();
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'mixWithOthers'
    }).catch(e => console.warn('Audio mode error', e));
  }, []);

  const playSound = async (type: 'work' | 'rest' | 'complete' | 'tick' | 'go') => {
    if (AppState.currentState !== 'active') return;
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
    if (AppState.currentState === 'active') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    }
    playSound('tick');
  };
  const playEnd = () => {
    if (AppState.currentState === 'active') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    playSound('go');
  };

  const scheduleNotifications = async (startTotalElapsed: number, prepOffset: number = 0) => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    if (prepOffset > 0 && startTotalElapsed === 0) {
       await Notifications.scheduleNotificationAsync({
          content: { title: `${blocks[0].type === 'work' ? 'Work' : 'Rest'} Time!`, body: blocks[0].name || `Session started`, sound: true },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: Math.max(1, prepOffset) } as Notifications.NotificationTriggerInput
       });
    }

    let accTime = 0;
    for (let i = 0; i < blocks.length; i++) {
        const blockEnd = accTime + blocks[i].durationSeconds;
        
        if (blockEnd > startTotalElapsed) {
            const secondsUntilEnd = prepOffset + (blockEnd - startTotalElapsed);
            
            if (i === blocks.length - 1) {
                await Notifications.scheduleNotificationAsync({
                    content: { title: "Session Complete!", body: `Great job completing ${workout.name}!`, sound: true },
                    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: Math.max(1, secondsUntilEnd) } as Notifications.NotificationTriggerInput
                });
            } else {
                const nextBlock = blocks[i + 1];
                const typeStr = nextBlock.type === 'work' ? 'Work' : 'Rest';
                await Notifications.scheduleNotificationAsync({
                    content: { title: `${typeStr} Time!`, body: nextBlock.name || `Next block started`, sound: true },
                    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: Math.max(1, secondsUntilEnd) } as Notifications.NotificationTriggerInput
                });
            }
        }
        accTime += blocks[i].durationSeconds;
    }
  };

  // 1. Countdown absolute timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (state === 'countdown' && countdownStartTime) {
      interval = setInterval(() => {
         const now = Date.now();
         const elapsed = Math.floor((now - countdownStartTime) / 1000);
         const remaining = prepTime - elapsed;
         
         if (remaining !== countdown) {
            if (remaining > 0) {
               setCountdown(remaining);
               playTick();
            } else {
               clearInterval(interval);
               playSound(blocks[0].type);
               setBaseTotalElapsed(0);
               setCurrentTotalElapsed(0);
               
               const startTime = Date.now();
               setRunningStartTime(startTime);
               
               runOnJS(setState)('running');
            }
         }
      }, 100);
    }
    return () => clearInterval(interval);
  }, [state, countdownStartTime, prepTime]);

  // 2. Running absolute timer (updates currentTotalElapsed)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (state === 'running' && runningStartTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const elapsedSinceResume = Math.floor((now - runningStartTime) / 1000);
        const newTotal = baseTotalElapsed + elapsedSinceResume;
        
        if (newTotal !== currentTotalElapsed) {
           setCurrentTotalElapsed(newTotal);
        }
      }, 100);
    }
    return () => clearInterval(interval);
  }, [state, runningStartTime, baseTotalElapsed, currentTotalElapsed]);

  // 3. Sync UI with currentTotalElapsed
  useEffect(() => {
    if (state !== 'running' && state !== 'idle') return;
    
    let acc = 0;
    let bIdx = blocks.length - 1;
    let tLeft = 0;
    let finished = false;

    for (let i = 0; i < blocks.length; i++) {
      if (currentTotalElapsed < acc + blocks[i].durationSeconds) {
         bIdx = i;
         tLeft = (acc + blocks[i].durationSeconds) - currentTotalElapsed;
         break;
      }
      acc += blocks[i].durationSeconds;
    }

    if (currentTotalElapsed >= totalRoutineDuration) {
       finished = true;
       tLeft = 0;
    }

    const prevBIdx = prevBlockIdxRef.current;
    const prevTLeft = prevTimeLeftRef.current;

    if (finished) {
       if (true) {
          Notifications.cancelAllScheduledNotificationsAsync();
          setState('finished');
          logWorkout(totalRoutineDuration);
          playSound('complete');
       }
    } else {
        if (bIdx > prevBIdx) {
            playSound(blocks[bIdx].type);
            progress.value = 1;
        } else if (tLeft !== prevTLeft) {
            if (tLeft === 0 && bIdx === blocks.length - 1) playEnd(); // last block end
            else if (tLeft <= 3 && tLeft > 0) playTick();
        }
    }

    prevBlockIdxRef.current = bIdx;
    prevTimeLeftRef.current = tLeft;
    setBlockIdx(bIdx);
    setTimeLeft(tLeft);
    
  }, [currentTotalElapsed, state, blocks, totalRoutineDuration]);

  // Sync circular progress animation
  useEffect(() => {
    if (state === 'idle') {
      progress.value = 1;
    } else if (state === 'running') {
      progress.value = withTiming(timeLeft / currentBlock.durationSeconds, { duration: 1000, easing: Easing.linear });
    }
  }, [timeLeft, currentBlock.durationSeconds, state]);

  const accumulatedTimes = useMemo(() => {
    const times = [];
    let acc = 0;
    for (let b of blocks) {
      times.push(acc);
      acc += b.durationSeconds;
    }
    return times;
  }, [blocks]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (scrollRef.current && state === 'running') {
      const ITEM_WIDTH = 120;
      const x = Math.max(0, blockIdx * ITEM_WIDTH - width / 2 + ITEM_WIDTH / 2);
      scrollRef.current.scrollTo({ x, animated: true });
    }
  }, [blockIdx, state]);

  const handleStart = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (prepTime === 0) {
       playSound(blocks[0].type);
       setBaseTotalElapsed(0);
       setCurrentTotalElapsed(0);
       const startTime = Date.now();
       setRunningStartTime(startTime);
       scheduleNotifications(0, 0);
       setState('running');
    } else {
       setState('countdown');
       setCountdownStartTime(Date.now());
       scheduleNotifications(0, prepTime);
       playTick();
    }
  };

  const handlePause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    svgOpacity.value = withTiming(0.3, { duration: 300 });
    Notifications.cancelAllScheduledNotificationsAsync();
    
    // Save where we paused
    setBaseTotalElapsed(currentTotalElapsed);
    setRunningStartTime(null);
    setState('paused');
  };

  const finishResume = (elapsedToUse: number) => {
    setRunningStartTime(Date.now());
    scheduleNotifications(elapsedToUse);
    setState('running');
  };

  const handleResume = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setState('resuming');
    resumeProgress.value = 0;
    const currentTarget = timeLeft / currentBlock.durationSeconds;
    const elapsedSnapshot = baseTotalElapsed;
    resumeProgress.value = withTiming(currentTarget, { duration: 1000 }, (isFinished) => {
      if (isFinished) {
        svgOpacity.value = 1;
        runOnJS(finishResume)(elapsedSnapshot);
      }
    });
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (blockIdx < blocks.length - 1) {
      const nextIdx = blockIdx + 1;
      const nextType = blocks[nextIdx].type;
      
      // Calculate new elapsed time to jump directly to the start of the next block
      const newElapsed = accumulatedTimes[nextIdx];
      
      if (state === 'running') {
          setBaseTotalElapsed(newElapsed);
          setRunningStartTime(Date.now());
          setCurrentTotalElapsed(newElapsed);
          scheduleNotifications(newElapsed);
      } else if (state === 'paused') {
          svgOpacity.value = withTiming(1, { duration: 300 });
          setBaseTotalElapsed(newElapsed);
          setRunningStartTime(Date.now());
          setCurrentTotalElapsed(newElapsed);
          scheduleNotifications(newElapsed);
          setState('running');
      }
    } else {
      Notifications.cancelAllScheduledNotificationsAsync();
      setState('finished');
      logWorkout(totalRoutineDuration);
      playSound('complete');
    }
  };

  const handleClose = () => {
    Notifications.cancelAllScheduledNotificationsAsync();
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

  const isWork = currentBlock.type === 'work';
  const themeColor = isWork ? t.colors.accent : t.colors.textMuted;

  return (
    <Animated.View entering={FadeIn.duration(400)} style={[styles.container, { backgroundColor: t.colors.background }]}>
      {state === 'finished' ? (
        <Animated.View entering={FadeIn.delay(300).duration(400)} style={[styles.finishedView, StyleSheet.absoluteFill]}>
          <Animated.View entering={FadeIn.delay(500).duration(500)}>
            <CheckCircle2 size={100} color={t.colors.success} />
          </Animated.View>
          <Text style={[styles.finishedTitle, { color: t.colors.text, marginTop: 24 }]}>Session Complete!</Text>
          <Text style={[styles.finishedSub, { color: t.colors.textMuted }]}>Great job completing {workout.name}.</Text>
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

          <View style={{ flex: 1, justifyContent: 'center', width: '100%', alignItems: 'center' }}>
            <Animated.View 
              key={`block-${blockIdx}`}
              entering={FadeIn.duration(400)} 
              exiting={FadeOut.duration(400)}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            >
              <View style={[styles.timerWrapper, { marginTop: 40 }]}>
                <View style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}>
                  <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
                    <Circle
                      cx={CIRCLE_SIZE / 2}
                      cy={CIRCLE_SIZE / 2}
                      r={RADIUS}
                      stroke={t.colors.border}
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
              <View style={{ flexDirection: 'row', gap: 12, width: '100%', opacity: state === 'countdown' ? 0.5 : 1 }}>
                <Pressable onPress={state === 'idle' ? handleStart : undefined} style={[styles.startBtn, { flex: 1, backgroundColor: t.colors.text }]}>
                  <Text style={[styles.startBtnText, { color: t.colors.background }]}>Start Session</Text>
                </Pressable>
                
                {state === 'idle' && (
                  <Pressable 
                    onPress={cyclePrepTime} 
                    style={[styles.prepBtn, { backgroundColor: t.colors.card }]}
                  >
                    <Timer size={20} color={t.colors.text} />
                    <Text style={{ color: t.colors.text, fontSize: 16, fontWeight: '700' }}>{prepTime > 0 ? prepTime + 's' : 'Off'}</Text>
                  </Pressable>
                )}
              </View>
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
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  startBtnText: { fontSize: 20, fontWeight: '800' },
  prepBtn: {
    width: 86,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
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
