import { View, StyleSheet, ViewProps } from 'react-native';
import { theme } from '../theme';

export function BentoCard({ style, children, ...props }: ViewProps) {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.lg,
    overflow: 'hidden',
  }
});
