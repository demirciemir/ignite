export const theme = {
  colors: {
    background: '#F2F2F7', // iOS grouped background
    card: '#FFFFFF',
    text: '#1C1C1E',
    textMuted: '#8E8E93',
    accent: '#FF3B30', // Flame/streak accent
    success: '#34C759',
    buttonText: '#FFFFFF',
    textInverse: '#FFFFFF',
    buttonSecondary: '#E5E5EA',
    border: '#E5E5EA',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 8,
    md: 16,
    card: 24,
    button: 16,
    pill: 9999,
  },
  animation: {
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
  }
} as const;
