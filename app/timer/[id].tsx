import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, ScrollView, AppState, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter, Redirect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Notifications from 'expo-notifications';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore, IntervalBlock, Workout } from '../../src/store';
import { useAppTheme } from '../../src/theme';
import Animated, { 
  FadeIn, FadeOut, FadeInRight, FadeOutLeft, FadeInDown, FadeInUp, ZoomIn, ZoomOut, runOnJS,
  useSharedValue, useAnimatedStyle, useAnimatedProps, withSpring, withTiming,
  interpolateColor, Extrapolation, interpolate, Easing
} from 'react-native-reanimated';
import { Play, Pause, X, SkipForward, ArrowLeft, CheckCircle2, Check, Timer, Activity, Zap } from 'lucide-react-native';
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



const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function getTimerPosition(blocks: IntervalBlock[], elapsed: number) {
  let accumulated = 0;

  for (let index = 0; index < blocks.length; index++) {
    const block = blocks[index];
    const durationWithGap = block.durationSeconds + 1;

    if (elapsed < accumulated + durationWithGap) {
      return {
        blockIdx: index,
        timeLeft: Math.max(0, accumulated + block.durationSeconds - elapsed),
        finished: false,
      };
    }

    accumulated += durationWithGap;
  }

  return {
    blockIdx: Math.max(0, blocks.length - 1),
    timeLeft: 0,
    finished: true,
  };
}

export default function ActiveTimer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const workout = useStore((s) => s.workouts.find((item) => item.id === id));

  if (!workout) return <Redirect href="/" />;

  return <TimerSession workout={workout} />;
}

function TimerSession({ workout }: { workout: Workout }) {
  const { width } = useWindowDimensions();
  const CIRCLE_SIZE = width * 0.75;
  const STROKE_WIDTH = 8;
  const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const router = useRouter();
  const t = useAppTheme();
  const insets = useSafeAreaInsets();
  
  const streakDays = useStore((s) => s.streakDays);
  const logWorkout = useStore((s) => s.logWorkout);
  const hapticsEnabled = useStore((s) => s.hapticsEnabled);
  const soundEnabled = useStore((s) => s.soundEnabled);
  
  const blocks = workout.blocks as IntervalBlock[];
  const totalRoutineDuration = useMemo(() => blocks.reduce((acc, b) => acc + b.durationSeconds, 0), [blocks]);
  const workDurationSeconds = useMemo(() => blocks.filter(b => b.type === 'work').reduce((acc, b) => acc + b.durationSeconds, 0), [blocks]);
  const restDurationSeconds = useMemo(() => blocks.filter(b => b.type === 'rest').reduce((acc, b) => acc + b.durationSeconds, 0), [blocks]);
  const roundsCompleted = useMemo(() => blocks.filter(b => b.type === 'work').length, [blocks]);

  // Absolute Time State
  const [state, setState] = useState<'idle' | 'countdown' | 'running' | 'paused' | 'resuming' | 'finished'>('idle');
  const [countdownStartTime, setCountdownStartTime] = useState<number | null>(null);
  const [runningStartTime, setRunningStartTime] = useState<number | null>(null);
  const [baseTotalElapsed, setBaseTotalElapsed] = useState(0);
  const [currentTotalElapsed, setCurrentTotalElapsed] = useState(0);

  // Derived UI State
  const { blockIdx, timeLeft, finished } = useMemo(
    () => getTimerPosition(blocks, currentTotalElapsed),
    [blocks, currentTotalElapsed]
  );
  const prepTime = useStore((s) => s.prepTime);
  const setPrepTime = useStore((s) => s.setPrepTime);
  const [countdown, setCountdown] = useState(prepTime);

  const cyclePrepTime = () => {
    if (hapticsEnabled) Haptics.selectionAsync();
    const cycle = [0, 3, 5, 10, 15];
    const nextIdx = (cycle.indexOf(prepTime) + 1) % cycle.length;
    const nextPrepTime = cycle[nextIdx];
    setPrepTime(nextPrepTime);
    setCountdown(nextPrepTime);
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
    if (AppState.currentState !== 'active' || !soundEnabled) return;
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
    playSound('tick');
  };
  const playEnd = () => {
    if (AppState.currentState === 'active' && hapticsEnabled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    playSound('go');
  };

  const scheduleNotifications = async (startTotalElapsed: number, prepOffset: number = 0) => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    if (prepOffset > 0 && startTotalElapsed === 0) {
       await Notifications.scheduleNotificationAsync({
          content: { 
            title: 'SESSION STARTED', 
            body: blocks[0].name ? `First up: ${blocks[0].name.toUpperCase()}` : `First up: ${blocks[0].type === 'work' ? 'WORK' : 'REST'}`, 
            sound: true 
          },
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
                    content: { 
                      title: "SESSION COMPLETE", 
                      body: `Routine: ${workout.name.toUpperCase()} is done.`, 
                      sound: true 
                    },
                    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: Math.max(1, secondsUntilEnd) } as Notifications.NotificationTriggerInput
                });
            } else {
                const nextBlock = blocks[i + 1];
                const typeStr = nextBlock.type === 'work' ? 'WORK' : 'REST';
                
                const title = `${typeStr} TIME`;
                const body = nextBlock.name 
                  ? `Up next: ${nextBlock.name.toUpperCase()}` 
                  : (nextBlock.type === 'work' ? 'Time to focus.' : 'Catch your breath.');

                await Notifications.scheduleNotificationAsync({
                    content: { title, body, sound: true },
                    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: Math.max(1, secondsUntilEnd) } as Notifications.NotificationTriggerInput
                });
            }
        }
        accTime += blocks[i].durationSeconds + 1;
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
            } else {
               clearInterval(interval);
               playSound(blocks[0].type);
               setBaseTotalElapsed(0);
               setCurrentTotalElapsed(0);
               
               // Calculate mathematical start time so background pauses during prep don't reset timer
               const startTime = countdownStartTime + (prepTime * 1000);
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
    
    const prevBIdx = prevBlockIdxRef.current;
    const prevTLeft = prevTimeLeftRef.current;

    if (finished) {
       Notifications.cancelAllScheduledNotificationsAsync();
       setTimeout(() => setState('finished'), 0);
       logWorkout({
           workoutId: workout.id,
           workoutName: workout.name,
           totalDurationSeconds: totalRoutineDuration,
           workDurationSeconds,
           restDurationSeconds,
           roundsCompleted
         });
       playSound('complete');
    } else {
        if (blockIdx > prevBIdx) {
            progress.value = 1;
            if (prevTLeft > 0) playSound(blocks[blockIdx].type);
        } else if (timeLeft !== prevTLeft) {
            if (timeLeft === 0) {
                if (blockIdx === blocks.length - 1) playEnd();
                else playSound(blocks[blockIdx + 1].type);
            }
            else if (timeLeft <= 3 && timeLeft > 0) playTick();
        }
    }

    prevBlockIdxRef.current = blockIdx;
    prevTimeLeftRef.current = timeLeft;
    
  }, [blockIdx, timeLeft, finished, state, blocks, totalRoutineDuration]);

  // Sync circular progress animation
  /* eslint-disable react-hooks/immutability -- Reanimated SharedValue is designed to be updated imperatively. */
  useEffect(() => {
    if (state === 'idle') {
      progress.value = 1;
    } else if (state === 'running') {
      progress.value = withTiming(timeLeft / currentBlock.durationSeconds, { duration: 1000, easing: Easing.linear });
    }
  }, [timeLeft, currentBlock.durationSeconds, state]);
  /* eslint-enable react-hooks/immutability */

  const accumulatedTimes = useMemo(() => {
    const times = [];
    let acc = 0;
    for (let b of blocks) {
      times.push(acc);
      acc += b.durationSeconds + 1;
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
    if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
    }
  };

  const handlePause = () => {
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
      logWorkout({
              workoutId: workout.id,
              workoutName: workout.name,
              totalDurationSeconds: totalRoutineDuration,
              workDurationSeconds,
              restDurationSeconds,
              roundsCompleted
            });
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
  const themeColor = isWork ? t.colors.accent : '#0A84FF';

  return (
    <Animated.View entering={FadeIn.duration(400)} style={[styles.container, { backgroundColor: t.colors.background }]}>
      {state === 'finished' ? (
        <Animated.View entering={FadeIn.duration(400)} style={[StyleSheet.absoluteFill, { backgroundColor: t.colors.background, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }]}>
          
          <View style={{ width: '100%', alignItems: 'center' }}>
            {/* Wrapper for the rings and icon to perfectly center them together */}
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              {/* Concentric expanding circles */}
              <Animated.View entering={ZoomIn.duration(1000).springify()} style={{ position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(16, 185, 129, 0.03)' }} />
              <Animated.View entering={ZoomIn.delay(100).duration(1000).springify()} style={{ position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(16, 185, 129, 0.06)' }} />
              
              <Animated.View entering={ZoomIn.delay(200).duration(800).springify()} style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(16, 185, 129, 0.15)', justifyContent: 'center', alignItems: 'center', shadowColor: '#10B981', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 30, elevation: 10 }}>
                <Check size={56} color="#10B981" strokeWidth={3} />
              </Animated.View>
            </View>

            {/* DONE Text Overlapping the Icon */}
            <Animated.Text entering={FadeIn.delay(400).duration(800)} style={{ color: t.colors.text, fontSize: 80, fontWeight: '900', letterSpacing: -4, textTransform: 'uppercase', marginTop: -34, zIndex: 10 }}>
              DONE.
            </Animated.Text>
            
            {/* great job text */}
            <Animated.Text entering={FadeInUp.delay(500).springify().damping(14).mass(0.8)} style={{ color: t.colors.textMuted, fontSize: 16, fontWeight: '500', letterSpacing: 1, marginTop: -5, opacity: 0.7 }}>
              great job.
            </Animated.Text>
          </View>

          {/* Spacer between Hero and Card */}
          <View style={{ height: 48 }} />

          {/* Bottom Group shifted down by 15px as requested */}
          <View style={{ width: '100%', alignItems: 'center', transform: [{ translateY: 45 }] }}>
            {/* Round Back Button Above */}
            <Animated.View entering={FadeInUp.delay(550).springify().damping(14).mass(0.8)}>
            <Pressable 
              onPress={() => {
                if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.replace('/' as any);
              }} 
              style={({ pressed }) => [{ width: 64, height: 64, borderRadius: 32, backgroundColor: t.colors.card, alignItems: 'center', justifyContent: 'center', marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 5 }, pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] }]}
            >
              <ArrowLeft size={32} color={t.colors.text} strokeWidth={2.5} />
            </Pressable>
          </Animated.View>

          {/* Master Card (Total Time) Below */}
          <Animated.View entering={FadeInUp.delay(650).springify().damping(14).mass(0.8)} style={{ width: '100%', backgroundColor: t.colors.card, borderRadius: 28, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5 }}>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 11, color: t.colors.textMuted, fontWeight: '800', letterSpacing: 3, marginBottom: 4 }}>TOTAL TIME</Text>
              <Text style={{ fontSize: 44, fontWeight: '900', color: t.colors.text, fontVariant: ['tabular-nums'], letterSpacing: -1 }}>
                {`${Math.floor(totalRoutineDuration / 60).toString().padStart(2, '0')}:${(totalRoutineDuration % 60).toString().padStart(2, '0')}`}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#FF3B30', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>Work</Text>
                <Text style={{ color: t.colors.text, fontSize: 16, fontWeight: '800', marginTop: 2 }}>
                  {`${Math.floor(workDurationSeconds / 60).toString().padStart(2, '0')}:${(workDurationSeconds % 60).toString().padStart(2, '0')}`}
                </Text>
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={{ color: '#0A84FF', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>Rest</Text>
                <Text style={{ color: t.colors.text, fontSize: 16, fontWeight: '800', marginTop: 2 }}>
                  {`${Math.floor(restDurationSeconds / 60).toString().padStart(2, '0')}:${(restDurationSeconds % 60).toString().padStart(2, '0')}`}
                </Text>
              </View>
            </View>

            {/* Progress Bar Representation */}
            <View style={{ height: 6, borderRadius: 3, backgroundColor: t.colors.border, flexDirection: 'row', overflow: 'hidden' }}>
              <View style={{ width: `${totalRoutineDuration > 0 ? (workDurationSeconds / totalRoutineDuration) * 100 : 0}%`, backgroundColor: '#FF3B30', height: '100%' }} />
              <View style={{ width: `${totalRoutineDuration > 0 ? (restDurationSeconds / totalRoutineDuration) * 100 : 0}%`, backgroundColor: '#0A84FF', height: '100%' }} />
            </View>
          </Animated.View>
          </View>

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
                      entering={FadeIn.duration(200)} 
                      exiting={FadeOut.duration(200)}
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
    textTransform: 'uppercase',
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
    textTransform: 'uppercase',
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
