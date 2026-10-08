import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../src/theme';
import { useStore } from '../src/store';
import Animated, { FadeInUp, ZoomIn, FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { Target, Flame, Activity, ArrowRight, Check, Zap, Sparkles, TrendingUp, Star } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';

const SLIDES = [
  {
    id: '1',
    title: 'BUILD DISCIPLINE.',
    description: 'The ultimate minimalist focus timer to help you stay sharp and crush your goals.',
    color: '#10B981', // Emerald
    Icon: Target,
    Particles: [
      { Comp: Zap, size: 28, top: -70, left: -60, delay: 300 },
      { Comp: Sparkles, size: 20, top: -10, right: -70, delay: 450 },
      { Comp: Star, size: 16, bottom: -50, left: -40, delay: 600 },
    ]
  },
  {
    id: '2',
    title: 'IGNITE STREAKS.',
    description: 'Consistency is everything. Complete at least one session every day to keep your flame alive.',
    color: '#FF9500', // Orange
    Icon: Flame,
    Particles: [
      { Comp: Sparkles, size: 24, top: -80, left: -30, delay: 350 },
      { Comp: Sparkles, size: 16, top: 20, right: -80, delay: 500 },
      { Comp: Sparkles, size: 20, bottom: -60, left: -50, delay: 650 },
    ]
  },
  {
    id: '3',
    title: 'TRACK GROWTH.',
    description: 'Monitor your total focus time, rest periods, and completed rounds with brutalist precision.',
    color: '#0A84FF', // Blue
    Icon: Activity,
    Particles: [
      { Comp: TrendingUp, size: 28, top: -70, right: -60, delay: 400 },
      { Comp: Star, size: 16, top: 40, left: -80, delay: 550 },
      { Comp: Sparkles, size: 20, bottom: -50, right: -40, delay: 700 },
    ]
  }
];

export default function Onboarding() {
  const hapticsEnabled = useStore(s => s.hapticsEnabled);
  const [step, setStep] = useState(0);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const t = useAppTheme();
  const setHasSeenOnboarding = useStore(s => s.setHasSeenOnboarding);

  const handleNext = async () => {
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < SLIDES.length - 1) {
      setStep(s => s + 1);
    } else {
      // Ask for notification permissions exactly when onboarding finishes
      await Notifications.requestPermissionsAsync();
      setHasSeenOnboarding(true);
      router.replace('/');
    }
  };

  const slide = SLIDES[step];

  return (
    <View style={[styles.container, { backgroundColor: t.colors.background }]}>
      
      {/* Top half is centered dynamically */}
      <View style={[styles.content, { paddingTop: insets.top + 40 }]}>
        
        <View style={styles.topSection}>
          <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 60 }}>
            {/* Background Rings */}
            <Animated.View 
              key={`ring1-${slide.id}`} 
              entering={ZoomIn.duration(800).springify()} 
              style={{ position: 'absolute', width: 320, height: 320, borderRadius: 160, backgroundColor: slide.color, opacity: 0.05 }} 
            />
            <Animated.View 
              key={`ring2-${slide.id}`} 
              entering={ZoomIn.delay(100).duration(800).springify()} 
              style={{ position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: slide.color, opacity: 0.1 }} 
            />
            <Animated.View 
              key={`ring3-${slide.id}`} 
              entering={ZoomIn.delay(200).duration(800).springify()} 
              style={{ position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: slide.color, opacity: 0.15, shadowColor: slide.color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 30, elevation: 10 }} 
            />
            
            {/* Center Icon */}
            <Animated.View 
              key={`icon-${slide.id}`}
              entering={ZoomIn.delay(300).springify()}
              style={{ alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
            >
              <slide.Icon size={72} color={slide.color} strokeWidth={2} />
            </Animated.View>

            {/* Particles */}
            {slide.Particles.map((p, i) => (
              <Animated.View
                key={`particle-${slide.id}-${i}`}
                entering={ZoomIn.delay(p.delay).springify().damping(12).mass(0.5)}
                style={{ position: 'absolute', top: p.top, left: p.left, right: p.right, bottom: p.bottom, zIndex: 15 }}
              >
                <p.Comp size={p.size} color={slide.color} fill={slide.color} strokeWidth={1.5} />
              </Animated.View>
            ))}
          </View>

          {/* Texts */}
          <Animated.View 
            key={`text-${slide.id}`}
            entering={FadeInRight.duration(800).springify().damping(20).stiffness(60).mass(1.2)}
            exiting={FadeOutLeft.duration(400)}
            style={styles.textContainer}
          >
            <Text style={[styles.title, { color: t.colors.text }]}>{slide.title}</Text>
            <Text style={[styles.description, { color: t.colors.textMuted }]}>{slide.description}</Text>
          </Animated.View>
        </View>
      </View>

      {/* Bottom Section Pinned to perfectly align with other screens */}
      <View style={[styles.bottomContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        
        {/* Pagination Dots */}
        <Animated.View entering={FadeInUp.delay(500)} style={styles.dotsContainer}>
          {SLIDES.map((_, i) => (
            <View 
              key={i} 
              style={[
                styles.dot, 
                { backgroundColor: i === step ? t.colors.text : t.colors.border },
                i === step && styles.activeDot
              ]} 
            />
          ))}
        </Animated.View>

        {/* Action Button matching Timer exact sizing */}
        <Animated.View entering={FadeInUp.delay(600).springify().damping(14).mass(0.8)} style={{ width: '100%' }}>
          <Pressable 
            style={[
              styles.nextButton, 
              { backgroundColor: step === SLIDES.length - 1 ? '#10B981' : t.colors.text },
              step === SLIDES.length - 1 && { shadowColor: '#10B981', shadowOpacity: 0.3, shadowRadius: 15, elevation: 5 }
            ]}
            onPress={handleNext}
          >
            <Text style={[
              styles.nextButtonText, 
              { color: step === SLIDES.length - 1 ? '#FFFFFF' : t.colors.background }
            ]}>
              {step === SLIDES.length - 1 ? "LET'S GO" : "NEXT"}
            </Text>
            {step === SLIDES.length - 1 ? (
              <Check size={24} color="#FFFFFF" strokeWidth={3} />
            ) : (
              <ArrowRight size={24} color={t.colors.background} strokeWidth={3} />
            )}
          </Pressable>
        </Animated.View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  topSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: -2,
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 10,
    opacity: 0.9,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minHeight: 120, // Prevents jump
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    width: 28,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 20, // EXACT same as Start Session
    borderRadius: 9999,  // Pill shape
    gap: 12,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '800',
  },
});
