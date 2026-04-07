import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Linking,
} from 'react-native';
import { useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useWitnessStore } from '../store/useWitnessStore';
import { Colors, FontFamily } from '../constants/tokens';

type Step = 'welcome' | 'permissions' | 'record' | 'postsave';

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('welcome');
  const [cameraGranted, setCameraGranted] = useState(false);
  const [micGranted, setMicGranted] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  const { setOnboardingComplete, setUnlocked, entries } = useWitnessStore();

  // Animation values
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;
  const stepOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (step === 'welcome') {
      Animated.sequence([
        Animated.timing(titleOpacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.delay(500),
        Animated.timing(subtitleOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.delay(200),
        Animated.timing(btnOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]).start();
    } else {
      stepOpacity.setValue(0);
      Animated.timing(stepOpacity, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }
  }, [step]);

  // After first entry is saved, advance to postsave step
  useEffect(() => {
    if (step === 'record' && entries.length > 0) {
      setStep('postsave');
    }
  }, [entries.length, step]);

  async function handleCameraPermission() {
    if (cameraPermission?.granted) {
      setCameraGranted(true);
      return;
    }
    const result = await requestCameraPermission();
    if (result.granted) {
      setCameraGranted(true);
    } else {
      // Guide user to settings
      Linking.openSettings();
    }
  }

  async function handleMicPermission() {
    if (micPermission?.granted) {
      setMicGranted(true);
      return;
    }
    const result = await requestMicPermission();
    if (result.granted) {
      setMicGranted(true);
    } else {
      Linking.openSettings();
    }
  }

  function finishOnboarding() {
    setOnboardingComplete();
    setUnlocked(true);
  }

  function goToRecord() {
    router.push({ pathname: '/record', params: { isFirstEntry: 'true' } });
  }

  // STEP: WELCOME
  if (step === 'welcome') {
    return (
      <View style={[styles.container, { paddingBottom: insets.bottom + 48 }]}>
        <View style={styles.centerContent}>
          <Animated.Text style={[styles.bigTitle, { opacity: titleOpacity }]}>
            Witness
          </Animated.Text>
          <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
            A private space to say{'\n'}what you can't say out loud.
          </Animated.Text>
        </View>
        <Animated.View style={[styles.btnWrapper, { opacity: btnOpacity }]}>
          <Pressable style={styles.primaryBtn} onPress={() => setStep('permissions')}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryContainer === '#1c1200' ? '#a07800' : Colors.primaryContainer]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryBtnGradient}
            >
              <Text style={styles.primaryBtnText}>Start speaking</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  // STEP: PERMISSIONS
  if (step === 'permissions') {
    const allGranted = (cameraPermission?.granted || cameraGranted) && (micPermission?.granted || micGranted);
    return (
      <Animated.View style={[styles.container, { opacity: stepOpacity, paddingBottom: insets.bottom + 48 }]}>
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <Text style={styles.stepLabel}>Step 1 of 2</Text>
        </View>

        <View style={styles.centerContent}>
          <Text style={styles.stepTitle}>A few things first.</Text>
          <Text style={styles.stepSubtitle}>
            Witness needs access to your camera and microphone to record your entries.{'\n'}
            Nothing is ever shared.
          </Text>

          <View style={styles.permissionList}>
            <PermissionRow
              icon="🎥"
              label="Camera"
              description="To record video entries."
              granted={cameraPermission?.granted || cameraGranted}
              onRequest={handleCameraPermission}
            />
            <PermissionRow
              icon="🎙️"
              label="Microphone"
              description="To capture your voice."
              granted={micPermission?.granted || micGranted}
              onRequest={handleMicPermission}
            />
          </View>
        </View>

        <View style={styles.btnWrapper}>
          <Pressable
            style={[styles.primaryBtn, !allGranted && styles.primaryBtnDisabled]}
            onPress={() => allGranted && setStep('record')}
            disabled={!allGranted}
          >
            <LinearGradient
              colors={allGranted ? [Colors.primary, '#a07800'] : [Colors.surfaceContainerHigh, Colors.surfaceContainerHigh]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryBtnGradient}
            >
              <Text style={[styles.primaryBtnText, !allGranted && { color: Colors.onSurfaceVariant }]}>
                Continue
              </Text>
            </LinearGradient>
          </Pressable>
          <Pressable onPress={() => setStep('record')}>
            <Text style={styles.skipText}>Skip for now</Text>
          </Pressable>
        </View>
      </Animated.View>
    );
  }

  // STEP: FIRST RECORD PROMPT
  if (step === 'record') {
    return (
      <Animated.View style={[styles.container, { opacity: stepOpacity, paddingBottom: insets.bottom + 48 }]}>
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <Text style={styles.stepLabel}>Step 2 of 2</Text>
        </View>

        <View style={styles.centerContent}>
          <Text style={styles.stepTitle}>Your first entry.{'\n'}Say anything.</Text>
          <Text style={styles.stepSubtitle}>It doesn't have to make sense.</Text>
        </View>

        <View style={styles.btnWrapper}>
          <Pressable style={styles.recordCircleBtn} onPress={goToRecord}>
            <LinearGradient
              colors={[Colors.primary, '#a07800']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.recordCircleBtnGradient}
            >
              <Text style={styles.recordCircleIcon}>●</Text>
            </LinearGradient>
          </Pressable>
          <Text style={styles.holdHint}>Tap to open recorder</Text>
        </View>
      </Animated.View>
    );
  }

  // STEP: POST-SAVE — "We heard you."
  if (step === 'postsave') {
    return (
      <Animated.View style={[styles.container, { opacity: stepOpacity, paddingBottom: insets.bottom + 48 }]}>
        <View style={styles.centerContent}>
          <Text style={styles.stepTitle}>We heard you.</Text>
          <Text style={styles.stepSubtitle}>
            Want to save your entries safely across devices?
          </Text>
        </View>

        <View style={styles.btnWrapper}>
          <Pressable
            style={styles.primaryBtn}
            onPress={() => {
              finishOnboarding();
              router.push('/auth');
            }}
          >
            <LinearGradient
              colors={[Colors.primary, '#a07800']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryBtnGradient}
            >
              <Text style={styles.primaryBtnText}>Save it safely</Text>
            </LinearGradient>
          </Pressable>

          <Pressable onPress={finishOnboarding}>
            <Text style={styles.skipText}>Not yet — keep it local</Text>
          </Pressable>
        </View>
      </Animated.View>
    );
  }

  return null;
}

function PermissionRow({
  icon,
  label,
  description,
  granted,
  onRequest,
}: {
  icon: string;
  label: string;
  description: string;
  granted?: boolean;
  onRequest: () => void;
}) {
  return (
    <View style={permStyles.row}>
      <View style={permStyles.iconWrap}>
        <Text style={permStyles.icon}>{icon}</Text>
      </View>
      <View style={permStyles.text}>
        <Text style={permStyles.label}>{label}</Text>
        <Text style={permStyles.desc}>{description}</Text>
      </View>
      {granted ? (
        <View style={permStyles.grantedBadge}>
          <Text style={permStyles.grantedText}>Allowed</Text>
        </View>
      ) : (
        <Pressable style={permStyles.allowBtn} onPress={onRequest}>
          <Text style={permStyles.allowBtnText}>Allow</Text>
        </Pressable>
      )}
    </View>
  );
}

const permStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 16,
    padding: 20,
    width: '100%',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 22 },
  text: { flex: 1, gap: 2 },
  label: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 15,
    color: Colors.onSurface,
  },
  desc: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    opacity: 0.7,
  },
  grantedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  grantedText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 11,
    color: Colors.secondary,
    letterSpacing: 0.5,
  },
  allowBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: Colors.primary + '22',
    borderWidth: 1,
    borderColor: Colors.primary + '66',
  },
  allowBtnText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 12,
    color: Colors.primary,
    letterSpacing: 0.5,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingHorizontal: 32,
    justifyContent: 'space-between',
  },
  topBar: {
    alignItems: 'center',
  },
  stepLabel: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    opacity: 0.5,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingHorizontal: 8,
  },
  bigTitle: {
    fontFamily: FontFamily.headlineXBold,
    fontSize: 52,
    color: Colors.onSurface,
    letterSpacing: -2,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 16,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 26,
    opacity: 0.75,
  },
  stepTitle: {
    fontFamily: FontFamily.headlineXBold,
    fontSize: 32,
    color: Colors.onSurface,
    textAlign: 'center',
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  stepSubtitle: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.7,
  },
  permissionList: {
    width: '100%',
    gap: 12,
    marginTop: 8,
  },
  btnWrapper: {
    gap: 16,
    alignItems: 'center',
    paddingBottom: 8,
  },
  primaryBtn: {
    width: '100%',
    borderRadius: 100,
    overflow: 'hidden',
  },
  primaryBtnDisabled: {
    opacity: 0.5,
  },
  primaryBtnGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontFamily: FontFamily.headline,
    fontSize: 15,
    color: Colors.onPrimary,
    letterSpacing: 0.5,
  },
  skipText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    opacity: 0.6,
    letterSpacing: 0.3,
  },
  recordCircleBtn: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
  },
  recordCircleBtnGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordCircleIcon: {
    fontSize: 36,
    color: Colors.onPrimary,
  },
  holdHint: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    opacity: 0.4,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
