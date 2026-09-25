import React, { useMemo, useState } from 'react';
import Animated, { FadeInUp, FadeInDown, ZoomIn } from "react-native-reanimated";
import Svg, { Text as SvgText } from 'react-native-svg';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../src/store';
import { useAppTheme } from '../src/theme';
import * as Haptics from 'expo-haptics';
import { Flame, Check, Sparkles, RefreshCw, X, Snowflake, ChevronDown, ChevronUp, ChevronRight, Timer, Award, Activity, Dumbbell, Zap, Crown, BarChart2 } from 'lucide-react-native';

interface CalendarDay {
  id: string;
  name: string;
  date: number;
  isLogged: boolean;
  isRestored: boolean;
  prevIsLogged: boolean;
  nextIsLogged: boolean;
  isCurrentMonth: boolean;
  isToday: boolean;
}


const OutlineText = ({ text, color, outlineColor, fontSize, strokeWidth = 4 }: any) => {
  const styles = { fontSize, fontWeight: '900' as const, letterSpacing: -2, fontVariant: ['tabular-nums'] as any[] };
  const strokes = [
    { top: -strokeWidth, left: -strokeWidth },
    { top: -strokeWidth, left: strokeWidth },
    { top: strokeWidth, left: -strokeWidth },
    { top: strokeWidth, left: strokeWidth },
    { top: 0, left: -strokeWidth },
    { top: 0, left: strokeWidth },
    { top: -strokeWidth, left: 0 },
    { top: strokeWidth, left: 0 },
  ];
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      {strokes.map((pos, i) => (
        <Text key={i} style={[styles, { position: 'absolute', color: outlineColor, ...pos }]}>
          {text}
        </Text>
      ))}
      <Text style={[styles, { color }]}>{text}</Text>
    </View>
  );
};

export default function StreakModal() {
  const hapticsEnabled = useStore(s => s.hapticsEnabled);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const t = useAppTheme();
  
  const { 
    streakDays, 
    lastWorkoutDate, 
    workoutDates, 
    restoredDates = [], 
    lastRestoreDate,
    totalWorkoutsLogged,
    totalMinutesLogged,
    totalWorkSeconds,
    totalRestSeconds,
    totalRounds,
    restoreStreak,
    history = []
  } = useStore();

  const [expanded, setExpanded] = useState(false);
  const [expandedStat, setExpandedStat] = useState<string | null>(null);

  const today = new Date().toLocaleDateString('en-CA');
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toLocaleDateString('en-CA');

  let displayStreak = streakDays;
  if (!lastWorkoutDate || (lastWorkoutDate !== today && lastWorkoutDate !== yesterdayStr)) {
    displayStreak = 0;
  }

  const isStreakActive = displayStreak > 0;

  const longestStreak = useMemo(() => {
    const all = [...new Set([...workoutDates, ...restoredDates])].sort();
    if (all.length === 0) return 0;
    
    let max = 1;
    let current = 1;
    for (let i = 1; i < all.length; i++) {
      const prev = new Date(all[i-1]);
      const curr = new Date(all[i]);
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (Math.round(diff) === 1) {
        current++;
        max = Math.max(max, current);
      } else {
        current = 1;
      }
    }
    return Math.max(max, displayStreak);
  }, [workoutDates, restoredDates, displayStreak]);

    
  const completedRoutines = history.length;
  
  const totalWorkSecs = totalWorkSeconds || 0;
  const totalRestSecs = totalRestSeconds || 0;
  const workRestRatio = totalRestSecs > 0 ? (totalWorkSecs / totalRestSecs).toFixed(1) + 'x' : (totalWorkSecs > 0 ? 'MAX' : '0.0x');
  
  const totalSessionTime = history.reduce((sum, h) => sum + (h.totalDurationSeconds || 0), 0);
  const avgRoutineSecs = completedRoutines > 0 ? Math.floor(totalSessionTime / completedRoutines) : 0;
  
  const favoriteRoutine = useMemo(() => {
    if (history.length === 0) return '-';
    const counts: Record<string, number> = {};
    let max = 0;
    let fav = '-';
    history.forEach(h => {
      if (!h.workoutName) return;
      counts[h.workoutName] = (counts[h.workoutName] || 0) + 1;
      if (counts[h.workoutName] > max) {
        max = counts[h.workoutName];
        fav = h.workoutName;
      }
    });
    return fav;
  }, [history]);

  const longestFocus = useMemo(() => {
    if (history.length === 0) return 0;
    return Math.max(...history.map(h => h.workDurationSeconds || 0));
  }, [history]);


  const formatDetailedTime = (totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    let res = [];
    if (h > 0) res.push(`${h} hours`);
    if (m > 0) res.push(`${m} minutes`);
    if (s > 0 && h === 0) res.push(`${s} seconds`);
    return res.join(' ') || '0 seconds';
  };

  const numRatio = totalRestSecs > 0 ? (totalWorkSecs / totalRestSecs) : 5;
  let ratioAdvice = "Optimal balance. You have a great work and recovery rhythm.";
  if (numRatio < 1.5) ratioAdvice = "You might be taking too many breaks. Try to increase your focus blocks.";
  if (numRatio > 4.0) ratioAdvice = "Very high intensity! Make sure you are not burning out and taking enough rest.";

  const toggleStat = (id: string) => {
    setExpandedStat(expandedStat === id ? null : id);
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const formatHMS = (totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formattedTime = useMemo(() => {
    return formatHMS(totalWorkSeconds || 0);
  }, [totalWorkSeconds]);

  const handleClose = () => router.back();

  const handleRestore = () => {
    restoreStreak();
  };

  // Restore logic
  const canRestore = displayStreak === 0 && streakDays > 0 && 
    (!lastRestoreDate || (new Date().getTime() - new Date(lastRestoreDate).getTime() > 7 * 24 * 60 * 60 * 1000));

  // Calendar logic
  const calendarWeeks = useMemo(() => {
    const dayNames = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
    
    // Determine the range of dates to show
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let startDate = new Date(today);
    let endDate = new Date(today);

    if (expanded) {
      // Show full current month
      startDate.setDate(1);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0); // last day of month
    }

    // Adjust startDate to the previous Monday
    const startDay = startDate.getDay(); // 0 = Sun, 1 = Mon...
    const startOffset = startDay === 0 ? 6 : startDay - 1;
    startDate.setDate(startDate.getDate() - startOffset);

    // Adjust endDate to the next Sunday
    const endDay = endDate.getDay();
    const endOffset = endDay === 0 ? 0 : 7 - endDay;
    endDate.setDate(endDate.getDate() + endOffset);

    const weeks: CalendarDay[][] = [];
    let currentWeek: CalendarDay[] = [];
    let curr = new Date(startDate);

    const dateStrs: Date[] = [];
    while (curr <= endDate) {
      dateStrs.push(new Date(curr));
      curr.setDate(curr.getDate() + 1);
    }

    dateStrs.forEach((d, i) => {
      const dateStr = d.toLocaleDateString('en-CA');
      const isLogged = workoutDates.includes(dateStr);
      const isRestored = restoredDates.includes(dateStr);
      
      const prevDate = new Date(d);
      prevDate.setDate(prevDate.getDate() - 1);
      const prevStr = prevDate.toLocaleDateString('en-CA');
      
      const nextDate = new Date(d);
      nextDate.setDate(nextDate.getDate() + 1);
      const nextStr = nextDate.toLocaleDateString('en-CA');

      const prevIsLogged = workoutDates.includes(prevStr) || restoredDates.includes(prevStr);
      const nextIsLogged = workoutDates.includes(nextStr) || restoredDates.includes(nextStr);

      const isCurrentMonth = d.getMonth() === today.getMonth();
      const isToday = d.getTime() === today.getTime();

      currentWeek.push({
        id: dateStr,
        name: dayNames[currentWeek.length],
        date: d.getDate(),
        isLogged,
        isRestored,
        prevIsLogged,
        nextIsLogged,
        isCurrentMonth,
        isToday
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    // If not expanded, we only want the week that contains 'today'
    if (!expanded) {
      return weeks.filter(w => w.some(d => d.isToday));
    }

    return weeks;
  }, [workoutDates, restoredDates, expanded]);

  return (
    <View style={[styles.container, { backgroundColor: t.colors.background }]}>
      <View style={[styles.topBar, { justifyContent: 'center' }]}>
          <View style={[styles.handle, { backgroundColor: t.colors.border }]} />
        </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
                        {/* Animated Rings & Flame Hero */}
        <View style={styles.hero}>
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 40 }}>
            
            {/* Concentric expanding orange rings */}
            <Animated.View entering={ZoomIn.duration(1000).springify()} style={{ position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: isStreakActive ? 'rgba(255, 149, 0, 0.05)' : 'rgba(150, 150, 150, 0.05)' }} />
            <Animated.View entering={ZoomIn.delay(100).duration(1000).springify()} style={{ position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: isStreakActive ? 'rgba(255, 149, 0, 0.1)' : 'rgba(150, 150, 150, 0.1)' }} />
            <Animated.View entering={ZoomIn.delay(200).duration(800).springify()} style={{ position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: isStreakActive ? 'rgba(255, 149, 0, 0.15)' : 'rgba(150, 150, 150, 0.15)' }} />
            
            {/* Massive Flame */}
            <Animated.View entering={ZoomIn.duration(800).springify()} style={{ alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
              <Flame size={120} color={isStreakActive ? "#FF9500" : t.colors.border} fill={isStreakActive ? "#FF9500" : "transparent"} strokeWidth={1} />
            </Animated.View>

            {/* Sparks popping out */}
            {isStreakActive && (
              <>
                <Animated.View entering={ZoomIn.delay(400).springify().damping(12).mass(0.5)} style={{ position: 'absolute', top: -10, left: 20 }}>
                  <Sparkles size={24} color="#FF9500" fill="#FF9500" />
                </Animated.View>
                <Animated.View entering={ZoomIn.delay(500).springify().damping(12).mass(0.5)} style={{ position: 'absolute', top: 30, right: 10 }}>
                  <Sparkles size={16} color="#FF9500" fill="#FF9500" />
                </Animated.View>
                <Animated.View entering={ZoomIn.delay(600).springify().damping(12).mass(0.5)} style={{ position: 'absolute', bottom: 50, left: -10 }}>
                  <Sparkles size={20} color="#FF9500" fill="#FF9500" />
                </Animated.View>
              </>
            )}
            
            {/* Outline Number Overlapping the Flame (No Box) */}
            <Animated.View entering={FadeInUp.delay(300).springify().damping(14).mass(0.8)} style={{ 
              marginTop: -50, // Overlaps the bottom of the flame
              zIndex: 10,
              shadowColor: '#000', 
              shadowOffset: { width: 0, height: 8 }, 
              shadowOpacity: 0.2, 
              shadowRadius: 15, 
              elevation: 10,
            }}>
              <Text style={{
                color: t.colors.text,
                fontSize: 90,
                fontWeight: '900',
                letterSpacing: -3,
                textShadowColor: t.colors.background === '#000000' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)',
                textShadowRadius: 10,
                textShadowOffset: { width: 0, height: 0 }
              }}>
                {displayStreak}
              </Text>
            </Animated.View>
          </View>

          {/* Titles */}
          <Animated.Text entering={FadeInUp.delay(400).springify().damping(14).mass(0.8)} style={{ color: t.colors.text, fontSize: 36, fontWeight: '900', letterSpacing: -1, marginTop: 12 }}>
            Streak
          </Animated.Text>
          <Animated.Text entering={FadeInUp.delay(500).springify().damping(14).mass(0.8)} style={{ color: t.colors.textMuted, fontSize: 15, fontWeight: '600', marginTop: 4, marginBottom: 8 }}>
            interval training days
          </Animated.Text>
        </View>

        {/* Calendar Section */}
        <Animated.View entering={FadeInUp.delay(550).springify().damping(14).mass(0.8)} style={{ width: '100%', marginBottom: 32 }}>
          <Pressable onPress={() => setExpanded(!expanded)}>
            <View style={styles.calendarHeader}>
              {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day, i) => (
                <Text key={i} style={[styles.dayNameHeader, { color: t.colors.textMuted }]}>{day}</Text>
              ))}
            </View>
            
            <View style={styles.calendarGrid}>
              {calendarWeeks.map((week, wIdx) => (
                <View key={wIdx} style={styles.calendarRow}>
                  {week.map((day) => {
                    const isActive = day.isLogged || day.isRestored;
                    const color = day.isRestored ? '#0A84FF' : '#FF9500';
                    const bgColor = day.isRestored ? 'rgba(10, 132, 255, 0.15)' : 'rgba(255, 149, 0, 0.15)';

                    return (
                      <View key={day.id} style={styles.calendarCol}>
                        {isActive && (
                          <View style={[StyleSheet.absoluteFill, { justifyContent: 'center' }]}>
                            {day.prevIsLogged && <View style={{ position: 'absolute', left: 0, width: '50%', height: 28, backgroundColor: bgColor }} />}
                            {day.nextIsLogged && <View style={{ position: 'absolute', right: 0, width: '50%', height: 28, backgroundColor: bgColor }} />}
                          </View>
                        )}
                        
                        <View style={[
                          styles.dayCircle,
                          isActive && { backgroundColor: color },
                          !isActive && day.isToday && { borderWidth: 2, borderColor: t.colors.border },
                          !isActive && !day.isToday && { backgroundColor: 'transparent' }
                        ]}>
                          <Text style={[
                            styles.dayNumber,
                            { color: isActive ? '#FFF' : (day.isCurrentMonth ? t.colors.text : t.colors.textMuted) },
                            (!day.isCurrentMonth && !isActive) && { opacity: 0.3 }
                          ]}>
                            {day.date}
                          </Text>
                          
                          {day.isRestored && (
                            <View style={[styles.restoredBadge, { borderColor: t.colors.background }]}>
                              <Snowflake size={10} color="#FFF" fill="#FFF" />
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
            
            <View style={styles.expandHint}>
              {expanded ? <ChevronUp size={20} color={t.colors.textMuted} /> : <ChevronDown size={20} color={t.colors.textMuted} />}
            </View>
          </Pressable>
        </Animated.View>

                                {/* Interactive Stats Cards */}
        <Animated.View entering={FadeInUp.delay(650).springify().damping(14).mass(0.8)} style={{ width: '100%', marginBottom: 32 }}>
          
          <Pressable onPress={() => toggleStat('focus')} style={[styles.horizontalCard, { backgroundColor: t.colors.card, flexDirection: 'column', alignItems: 'stretch' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.horizontalCardIcon, { backgroundColor: 'rgba(10, 132, 255, 0.15)' }]}>
                <Timer size={24} color="#0A84FF" />
              </View>
              <Text style={[styles.horizontalCardLabel, { color: t.colors.textMuted }]}>TOTAL FOCUS</Text>
              <Text style={[styles.horizontalCardValue, { color: t.colors.text }]}>{formattedTime}</Text>
              <ChevronRight size={20} color={t.colors.textMuted} style={{ marginLeft: 6, opacity: 0.7 }} />
            </View>
            {expandedStat === 'focus' && (
              <Animated.View entering={FadeInDown.duration(300).springify()} style={{ marginTop: 16, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.colors.border }}>
                <Text style={{ color: t.colors.text, fontSize: 16, fontWeight: '700', marginBottom: 4 }}>{formatDetailedTime(totalWorkSecs)}</Text>
                <Text style={{ color: t.colors.textMuted, fontSize: 14, lineHeight: 20 }}>The total amount of time you’ve spent in deep focus across all your routines. This excludes any rest periods.</Text>
              </Animated.View>
            )}
          </Pressable>

          <Pressable onPress={() => toggleStat('ratio')} style={[styles.horizontalCard, { backgroundColor: t.colors.card, flexDirection: 'column', alignItems: 'stretch' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.horizontalCardIcon, { backgroundColor: 'rgba(255, 149, 0, 0.15)' }]}>
                <Zap size={24} color="#FF9500" />
              </View>
              <Text style={[styles.horizontalCardLabel, { color: t.colors.textMuted }]}>WORK / REST RATIO</Text>
              <Text style={[styles.horizontalCardValue, { color: t.colors.text }]}>{workRestRatio}</Text>
              <ChevronRight size={20} color={t.colors.textMuted} style={{ marginLeft: 6, opacity: 0.7 }} />
            </View>
            {expandedStat === 'ratio' && (
              <Animated.View entering={FadeInDown.duration(300).springify()} style={{ marginTop: 16, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.colors.border }}>
                <Text style={{ color: t.colors.text, fontSize: 16, fontWeight: '700', marginBottom: 4 }}>You work {workRestRatio} longer than you rest.</Text>
                <Text style={{ color: t.colors.textMuted, fontSize: 14, lineHeight: 20 }}>{ratioAdvice}</Text>
              </Animated.View>
            )}
          </Pressable>

          <Pressable onPress={() => toggleStat('routines')} style={[styles.horizontalCard, { backgroundColor: t.colors.card, flexDirection: 'column', alignItems: 'stretch' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.horizontalCardIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <Dumbbell size={24} color="#10B981" />
              </View>
              <Text style={[styles.horizontalCardLabel, { color: t.colors.textMuted }]}>COMPLETED ROUTINES</Text>
              <Text style={[styles.horizontalCardValue, { color: t.colors.text }]}>{completedRoutines}</Text>
              <ChevronRight size={20} color={t.colors.textMuted} style={{ marginLeft: 6, opacity: 0.7 }} />
            </View>
            {expandedStat === 'routines' && (
              <Animated.View entering={FadeInDown.duration(300).springify()} style={{ marginTop: 16, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.colors.border }}>
                <Text style={{ color: t.colors.text, fontSize: 16, fontWeight: '700', marginBottom: 4 }}>{completedRoutines} Total Routines</Text>
                <Text style={{ color: t.colors.textMuted, fontSize: 14, lineHeight: 20 }}>The absolute number of times you have started and successfully finished a routine.</Text>
              </Animated.View>
            )}
          </Pressable>

          <Pressable onPress={() => toggleStat('favorite')} style={[styles.horizontalCard, { backgroundColor: t.colors.card, flexDirection: 'column', alignItems: 'stretch' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.horizontalCardIcon, { backgroundColor: 'rgba(255, 45, 85, 0.15)' }]}>
                <Crown size={24} color="#FF2D55" />
              </View>
              <Text style={[styles.horizontalCardLabel, { color: t.colors.textMuted }]}>FAVORITE ROUTINE</Text>
              <Text style={[styles.horizontalCardValue, { color: t.colors.text, fontSize: 18 }]} numberOfLines={1}>{favoriteRoutine}</Text>
              <ChevronRight size={20} color={t.colors.textMuted} style={{ marginLeft: 6, opacity: 0.7 }} />
            </View>
            {expandedStat === 'favorite' && (
              <Animated.View entering={FadeInDown.duration(300).springify()} style={{ marginTop: 16, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.colors.border }}>
                <Text style={{ color: t.colors.text, fontSize: 16, fontWeight: '700', marginBottom: 4 }}>Top Choice</Text>
                <Text style={{ color: t.colors.textMuted, fontSize: 14, lineHeight: 20 }}>The routine configuration you rely on the most for your daily sessions.</Text>
              </Animated.View>
            )}
          </Pressable>

          <Pressable onPress={() => toggleStat('average')} style={[styles.horizontalCard, { backgroundColor: t.colors.card, flexDirection: 'column', alignItems: 'stretch' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.horizontalCardIcon, { backgroundColor: 'rgba(142, 142, 147, 0.15)' }]}>
                <BarChart2 size={24} color="#8E8E93" />
              </View>
              <Text style={[styles.horizontalCardLabel, { color: t.colors.textMuted }]}>AVERAGE DURATION</Text>
              <Text style={[styles.horizontalCardValue, { color: t.colors.text }]}>{formatHMS(avgRoutineSecs)}</Text>
              <ChevronRight size={20} color={t.colors.textMuted} style={{ marginLeft: 6, opacity: 0.7 }} />
            </View>
            {expandedStat === 'average' && (
              <Animated.View entering={FadeInDown.duration(300).springify()} style={{ marginTop: 16, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.colors.border }}>
                <Text style={{ color: t.colors.text, fontSize: 16, fontWeight: '700', marginBottom: 4 }}>{formatDetailedTime(avgRoutineSecs)} per session</Text>
                <Text style={{ color: t.colors.textMuted, fontSize: 14, lineHeight: 20 }}>The typical duration of your routines, combining both work and rest periods.</Text>
              </Animated.View>
            )}
          </Pressable>

        </Animated.View>

        {/* Restore Streak Button */}
        {(canRestore || displayStreak === 0) && (
          <Animated.View entering={FadeInUp.delay(750).springify().damping(14).mass(0.8)} style={styles.restoreSection}>
            <Pressable 
              onPress={canRestore ? handleRestore : undefined} 
              style={[
                styles.restoreBtn, 
                { backgroundColor: canRestore ? '#0A84FF' : t.colors.card },
                !canRestore && { opacity: 0.5 }
              ]}
            >
              {canRestore ? (
                <Snowflake size={24} color="#FFF" />
              ) : (
                <RefreshCw size={24} color={t.colors.textMuted} />
              )}
              <Text style={[styles.restoreBtnText, { color: canRestore ? '#FFF' : t.colors.textMuted }]}>
                {canRestore ? "USE FREEZE" : "STREAK BROKEN"}
              </Text>
            </Pressable>
            {canRestore ? (
              <Text style={[styles.restoreDesc, { color: t.colors.textMuted }]}>
                Use your weekly streak freeze to recover your progress and keep your streak alive.
              </Text>
            ) : (displayStreak > 0 && streakDays === 1) ? (
              <Text style={[styles.restoreDesc, { color: t.colors.textMuted }]}>
                You already started a new streak! Freeze can only be used before starting a new one.
              </Text>
            ) : (
              <Text style={[styles.restoreDesc, { color: t.colors.textMuted }]}>
                Streak Freeze is available once every 7 days when you break a streak.
              </Text>
            )}
          </Animated.View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  content: { 
    padding: 24, 
    paddingTop: 16,
    alignItems: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 40,
  },
  flameCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  streakNumber: {
    fontSize: 80,
    fontWeight: '900',
    letterSpacing: -4,
    marginBottom: 0,
  },
  streakTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  streakSub: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  calendarWrapper: {
    width: '100%',
    marginBottom: 32,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dayNameHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
  },
  calendarGrid: {
    width: '100%',
    gap: 12,
  },
  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  calendarCol: {
    flex: 1,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '700',
  },
  restoredBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    backgroundColor: '#0A84FF',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  expandHint: {
    alignItems: 'center',
    marginTop: 12,
    opacity: 0.5,
  },

  horizontalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    marginBottom: 12,
  },
  horizontalCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  horizontalCardLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingRight: 8,
  },
  horizontalCardValue: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -1,
  },

  bentoStatsContainer: {
    width: '100%',
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  bentoCard: {
    flex: 1,
    borderRadius: 28,
    padding: 24,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  bentoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  bentoValue: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
  },
  bentoLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  restoreSection: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    width: '100%',
  },
  statBoxSmall: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
  },
  statBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  statBoxLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  statBoxValue: {
    fontSize: 18,
    fontWeight: '800',
  },

  restoreBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 9999,
    gap: 12,
  },
  restoreBtnText: {
    fontSize: 18,
    fontWeight: '800',
  },
  restoreDesc: {
    fontSize: 12,
    textAlign: 'center',
  }
});
