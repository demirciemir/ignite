import { useColorScheme } from 'react-native';
import { useStore } from './store';

const lightColors = {
  background: '#F2F2F7',
  card: '#FFFFFF',
  text: '#1C1C1E',
  textMuted: '#8E8E93',
  accent: '#FF3B30',
  success: '#34C759',
  buttonText: '#FFFFFF',
  textInverse: '#FFFFFF',
  buttonSecondary: '#E5E5EA',
  border: '#E5E5EA',
  overlay: 'rgba(255, 255, 255, 0.9)',
};

const darkColors = {
  background: '#000000',
  card: '#1C1C1E',
  text: '#FFFFFF',
  textMuted: '#8E8E93',
  accent: '#FF453A',
  success: '#32D74B',
  buttonText: '#FFFFFF',
  textInverse: '#1C1C1E',
  buttonSecondary: '#2C2C2E',
  border: '#38383A',
  overlay: 'rgba(0, 0, 0, 0.9)',
};

const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

const borderRadius = {
  sm: 8,
  md: 16,
  card: 24,
  button: 16,
  pill: 9999,
};

const animation = {
  spring: {
    damping: 20,
    stiffness: 200,
    mass: 0.8,
  },
  bouncy: {
    damping: 15,
    stiffness: 250,
    mass: 0.8,
  }
};

export const theme = {
  colors: lightColors, // Fallback for statically used places
  spacing,
  borderRadius,
  animation,
} as const;

export function useAppTheme() {
  const systemScheme = useColorScheme();
  const themePref = useStore((s) => s.themePreference);
  
  const isDark = themePref === 'dark' || (themePref === 'system' && systemScheme === 'dark');
  
  return {
    colors: isDark ? darkColors : lightColors,
    spacing,
    borderRadius,
    animation,
    isDark,
  };
}
