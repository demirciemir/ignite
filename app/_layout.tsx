import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F2F2F7' } }}>
          <Stack.Screen name="index" />
          <Stack.Screen 
            name="builder" 
            options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom', gestureEnabled: true, gestureDirection: 'vertical' }} 
          />
          <Stack.Screen 
            name="timer/[id]" 
            options={{ animation: 'slide_from_right' }} 
          />
          <Stack.Screen 
            name="settings" 
            options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom', gestureEnabled: true, gestureDirection: 'vertical' }} 
          />
        </Stack>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
