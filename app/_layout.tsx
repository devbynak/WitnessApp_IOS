import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, StyleSheet, View } from 'react-native';
import { Stack, router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useWitnessStore } from '../store/useWitnessStore';
import { Colors } from '../constants/tokens';
import LockScreen from '../components/LockScreen';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Manrope_700Bold,
    Manrope_800ExtraBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  const [storageLoaded, setStorageLoaded] = useState(false);

  const {
    loadFromStorage,
    checkTonightMode,
    settings,
    isUnlocked,
    setUnlocked,
    hasCompletedOnboarding,
  } = useWitnessStore();

  const appState = useRef(AppState.currentState);

  // Load storage first, then start tonight-mode interval
  useEffect(() => {
    loadFromStorage().then(() => {
      setStorageLoaded(true);
    });
    checkTonightMode();
    const interval = setInterval(checkTonightMode, 60000);
    return () => clearInterval(interval);
  }, []);

  // Deep-link from notification tap → open Record screen
  useEffect(() => {
    // Handle taps on notifications that arrive while app is running
    const sub = Notifications.addNotificationResponseReceivedListener(() => {
      router.push('/record');
    });
    // Handle tap when app was killed / backgrounded
    // Only act if the notification was tapped very recently (within 30s) so we
    // don't navigate to /record on every cold start due to a stale stored response.
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const ageMs = Date.now() - response.notification.date * 1000;
        if (ageMs < 30000) router.push('/record');
      }
    });
    return () => sub.remove();
  }, []);

  // Lock on background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (
        (nextState === 'background' || nextState === 'inactive') &&
        appState.current === 'active' &&
        settings.biometricEnabled &&
        settings.lockOnBackground
      ) {
        setUnlocked(false);
      }
      appState.current = nextState;
    });
    return () => subscription.remove();
  }, [settings.biometricEnabled, settings.lockOnBackground]);

  // Don't render anything until both fonts and storage are ready.
  // This ensures hasCompletedOnboarding has its correct persisted value
  // before any screen tries to read it.
  if (!fontsLoaded || !storageLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={Colors.surface} />

        {/* Stack is ALWAYS rendered so router.push/replace works from any screen */}
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.surface },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="onboarding"
            options={{ headerShown: false, animation: 'none', gestureEnabled: false }}
          />
          <Stack.Screen
            name="record"
            options={{ presentation: 'fullScreenModal', animation: 'fade' }}
          />
          <Stack.Screen
            name="reflect"
            options={{ animation: 'slide_from_bottom', gestureEnabled: false }}
          />
          <Stack.Screen
            name="playback"
            options={{ presentation: 'fullScreenModal', animation: 'fade' }}
          />
          <Stack.Screen
            name="auth"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen name="memory-threads" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="search" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen
            name="unsent-letter"
            options={{ presentation: 'fullScreenModal', animation: 'fade' }}
          />
          <Stack.Screen
            name="grief-mode"
            options={{ presentation: 'fullScreenModal', animation: 'fade' }}
          />
          <Stack.Screen name="yearly-rewind" options={{ animation: 'slide_from_right' }} />
        </Stack>

        {/* Biometric lock — floats above the Stack as a full-screen overlay.
            Only shown after onboarding is complete, so navigation still works during onboarding. */}
        {hasCompletedOnboarding && settings.biometricEnabled && !isUnlocked && (
          <View style={StyleSheet.absoluteFill}>
            <LockScreen />
          </View>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
