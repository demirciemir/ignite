import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../src/theme';
import { useStore } from '../src/store';
import Animated, { FadeIn, FadeInDown, FadeOut, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { Target, Flame, Activity, ArrowRight, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Welcome to Ignite',
    description: 'The ultimate minimalist focus timer to help you build discipline and reach your goals.',
    icon: (color: string) => <Target size={80} color={color} strokeWidth={1.5} />,
  },
  {
    id: '2',
    title: 'Keep the Flame Alive',
    description: 'Consistency is key. Complete at least one session every day to maintain your streak.',
    icon: (color: string) => <Flame size={80} color={color} strokeWidth={1.5} />,
  },
  {
    id: '3',
    title: 'Track Your Growth',
    description: 'Monitor your focus time, rounds, and total workouts with detailed statistics.',
    icon: (color: string) => <Activity size={80} color={color} strokeWidth={1.5} />,
  }
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const t = useAppTheme();
  const setHasSeenOnboarding = useStore(s => s.setHasSeenOnboarding);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < SLIDES.length - 1) {
      setStep(s => s + 1);
    } else {
      setHasSeenOnboarding(true);
      router.replace('/');
    }
  };

  const slide = SLIDES[step];

  return (
    <View style={[styles.container, { backgroundColor: t.colors.background }]}>
      <View style={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }]}>
        
        <View style={styles.topSection}>
          <Animated.View 
            key={`icon-${slide.id}`}
            entering={FadeIn.duration(400)}
            exiting={FadeOut.duration(200)}
            style={styles.iconContainer}
          >
            {slide.icon(t.colors.text)}
          </Animated.View>

          <Animated.View 
            key={`text-${slide.id}`}
            entering={SlideInRight.duration(400).springify()}
            exiting={SlideOutLeft.duration(200)}
            style={styles.textContainer}
          >
            <Text style={[styles.title, { color: t.colors.text }]}>{slide.title}</Text>
            <Text style={[styles.description, { color: t.colors.textMuted }]}>{slide.description}</Text>
          </Animated.View>
        </View>

        <View style={styles.bottomSection}>
          <View style={styles.dotsContainer}>
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
          </View>

          <Pressable 
            style={[styles.nextButton, { backgroundColor: t.colors.text }]}
            onPress={handleNext}
          >
            <Text style={[styles.nextButtonText, { color: t.colors.background }]}>
              {step === SLIDES.length - 1 ? "Let's Go" : "Next"}
            </Text>
            {step === SLIDES.length - 1 ? (
              <Check size={20} color={t.colors.background} />
            ) : (
              <ArrowRight size={20} color={t.colors.background} />
            )}
          </Pressable>
        </View>
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
    justifyContent: 'space-between',
  },
  topSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    gap: 32,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    width: 24,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 12,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
});
