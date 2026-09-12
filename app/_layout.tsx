import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import { useAppTheme } from '../src/theme';

export default function RootLayout() {
  const t = useAppTheme();
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: t.colors.background }}>
      <BottomSheetModalProvider>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.colors.background } }}>
          <Stack.Screen name="index" />
          <Stack.Screen 
            name="builder" 
            options={{ presentation: 'modal', gestureEnabled: true, gestureDirection: 'vertical' }} 
          />
          <Stack.Screen 
            name="timer/[id]" 
            options={{ animation: 'slide_from_right' }} 
          />
          <Stack.Screen 
            name="settings" 
            options={{ presentation: 'modal', gestureEnabled: true, gestureDirection: 'vertical' }} 
          />
          <Stack.Screen 
            name="streak" 
            options={{ presentation: 'modal', gestureEnabled: true, gestureDirection: 'vertical' }} 
          />
        </Stack>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
