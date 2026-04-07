import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily } from '../constants/tokens';
import { useWitnessStore } from '../store/useWitnessStore';

export default function LockScreen() {
  const insets = useSafeAreaInsets();
  const { setUnlocked } = useWitnessStore();
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in UI elements
    Animated.sequence([
      Animated.timing(titleOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(subtitleOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(btnOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    // Auto-trigger biometric after brief delay
    const timer = setTimeout(() => authenticate(), 400);
    return () => clearTimeout(timer);
  }, []);

  async function authenticate() {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        // No biometric available — unlock directly
        setUnlocked(true);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock your entries',
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setUnlocked(true);
      }
    } catch {
      // If auth fails or errors, show fallback button
    }
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 48 }]}>
      <View style={styles.content}>
        <Animated.Text style={[styles.title, { opacity: titleOpacity }]}>
          Witness
        </Animated.Text>
        <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
          Your entries are private.
        </Animated.Text>
      </View>

      <Animated.View style={{ opacity: btnOpacity }}>
        <Pressable style={styles.unlockBtn} onPress={authenticate}>
          <Text style={styles.unlockBtnText}>Unlock</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 120,
    paddingHorizontal: 32,
  },
  content: {
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontFamily: FontFamily.headlineXBold,
    fontSize: 48,
    color: Colors.onSurface,
    letterSpacing: -1,
  },
  subtitle: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    color: Colors.onSurfaceVariant,
    opacity: 0.6,
    letterSpacing: 0.3,
  },
  unlockBtn: {
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.primary + '66',
  },
  unlockBtnText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 14,
    color: Colors.primary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
