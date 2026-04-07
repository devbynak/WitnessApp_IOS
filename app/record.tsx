import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions, CameraRecordingOptions } from 'expo-camera';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useWitnessStore } from '../store/useWitnessStore';
import { Colors, FontFamily, Radius, Shadows } from '../constants/tokens';
import { Entry } from '../types';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const PROMPTS = [
  "What are you not saying?",
  "What happened today that you haven't told anyone?",
  "If someone could see exactly how you feel right now — what would they see?",
  "What do you wish someone had said to you today?",
  "Finish this: I keep thinking about...",
  "What's the thing you've been carrying longest?",
  "Who do you wish was here right now?",
];

const GRIEF_PROMPTS = [
  "Tell me about them. What do you miss most?",
  "What's something they would have said today?",
  "What are you carrying that you haven't been able to put down?",
  "What do you wish you had told them?",
  "What are you most grateful they gave you?",
  "If they could see you right now, what would they want you to know?",
];

const MIN_RECORDING_SECONDS = 2;

export default function RecordScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const isFirstEntry = params.isFirstEntry === 'true';
  const isUnsentMode = params.isUnsent === 'true';
  const isGriefMode = params.isGrief === 'true';
  const recipientName = (params.recipientName as string) ?? '';

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [isVoiceOnly, setIsVoiceOnly] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showPrompt, setShowPrompt] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [showTimer, setShowTimer] = useState(false);

  const cameraRef = useRef<CameraView>(null);
  const recordingRef = useRef<InstanceType<typeof Audio.Recording> | null>(null);
  // Hold the Promise from recordAsync so we can await it in stopRecording
  const videoPromiseRef = useRef<Promise<{ uri: string } | undefined> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hesitationRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hapticRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerShowRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elapsedRef = useRef(0); // track elapsed without re-render race

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.15)).current;
  const promptOpacity = useRef(new Animated.Value(0)).current;

  const { addEntry, isTonightMode } = useWitnessStore();

  useEffect(() => {
    requestPermissions();
    startAmbientPulse();
    startHesitationTimer();
    return () => cleanup();
  }, []);

  async function requestPermissions() {
    if (!cameraPermission?.granted) await requestCameraPermission();
    if (!micPermission?.granted) await requestMicPermission();
  }

  function startAmbientPulse() {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 3000, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.25, duration: 3000, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, { toValue: 1, duration: 3000, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.15, duration: 3000, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }

  function startHesitationTimer() {
    hesitationRef.current = setTimeout(() => {
      const activePrompts = isGriefMode ? GRIEF_PROMPTS : PROMPTS;
      const shuffled = [...activePrompts].sort(() => Math.random() - 0.5);
      setCurrentPrompt(shuffled[0]);
      setShowPrompt(true);
      Animated.timing(promptOpacity, { toValue: 1, duration: 600, useNativeDriver: true }).start();
      setTimeout(() => {
        Animated.timing(promptOpacity, { toValue: 0, duration: 600, useNativeDriver: true }).start(
          () => setShowPrompt(false)
        );
      }, 4000);
    }, 5000);
  }

  function cleanup() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (hesitationRef.current) clearTimeout(hesitationRef.current);
    if (hapticRef.current) clearInterval(hapticRef.current);
    if (timerShowRef.current) clearTimeout(timerShowRef.current);
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  async function startRecording() {
    if (hesitationRef.current) clearTimeout(hesitationRef.current);
    setShowPrompt(false);
    setIsRecording(true);
    elapsedRef.current = 0;
    setElapsed(0);
    setShowTimer(false);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    timerRef.current = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed((e) => e + 1);
    }, 1000);

    // Show timer only after 30s
    timerShowRef.current = setTimeout(() => setShowTimer(true), 30000);

    // Haptic pulse every 30 seconds
    hapticRef.current = setInterval(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 30000);

    if (isVoiceOnly) {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
    } else {
      // Store the Promise — don't await it here; it resolves when stopRecording is called
      videoPromiseRef.current = cameraRef.current?.recordAsync({} as CameraRecordingOptions) ?? null;
    }
  }

  async function stopRecording() {
    // Guard: don't stop if recording was too short (accidental tap)
    if (elapsedRef.current < MIN_RECORDING_SECONDS) {
      setIsRecording(false);
      cleanup();
      return;
    }

    setIsRecording(false);
    cleanup();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    const duration = elapsedRef.current;
    let uri: string | null = null;

    if (isVoiceOnly && recordingRef.current) {
      await recordingRef.current.stopAndUnloadAsync();
      uri = recordingRef.current.getURI();
    } else {
      // Stop the camera recording — this causes the videoPromiseRef Promise to resolve
      cameraRef.current?.stopRecording();
      // Await the Promise to get the actual URI
      const result = await videoPromiseRef.current;
      uri = result?.uri ?? null;
    }

    const entry: Entry = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      duration,
      mood: null,
      aiReflection: null,
      transcript: null,
      videoUri: uri,
      isVoiceOnly,
      isUnsentLetter: isUnsentMode,
      recipientName: isUnsentMode ? recipientName : undefined,
      isGriefMode: isGriefMode,
      createdAt: Date.now(),
      isSynced: false,
    };

    addEntry(entry);
    router.replace({ pathname: '/reflect', params: { entryId: entry.id } });
  }

  const permissionsGranted = cameraPermission?.granted && micPermission?.granted;

  if (!permissionsGranted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          Witness needs camera and microphone access to record your diary.
        </Text>
        <Pressable style={styles.permissionBtn} onPress={requestPermissions}>
          <Text style={styles.permissionBtnText}>Allow Access</Text>
        </Pressable>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!isVoiceOnly ? (
        <>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="front"
            mode="video"
          />
          <LinearGradient
            colors={['rgba(18,20,22,0.4)', 'rgba(18,20,22,0)', 'rgba(18,20,22,0)', 'rgba(18,20,22,0.9)']}
            locations={[0, 0.2, 0.75, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        </>
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.voiceBg]}>
          <WaveformVisualizer isRecording={isRecording} />
        </View>
      )}

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={styles.closeIcon}>✕</Text>
        </Pressable>
        {isRecording && (
          <View style={styles.recordingBadge}>
            <RecordingDot />
            <Text style={styles.recordingBadgeText}>
              {isUnsentMode ? `To ${recipientName}` : isVoiceOnly ? 'Voice Mode' : 'Video Mode'}
            </Text>
          </View>
        )}
        {/* Timer — only shown after 30s */}
        {isRecording && showTimer && (
          <Text style={styles.timerText}>{formatTime(elapsed)}</Text>
        )}
      </View>

      {/* Prompt overlay */}
      {showPrompt && !isRecording && (
        <Animated.View style={[styles.promptOverlay, { opacity: promptOpacity }]}>
          <Text style={styles.promptText}>{currentPrompt}</Text>
        </Animated.View>
      )}

      {/* Bottom controls */}
      <View style={[styles.bottomControls, { paddingBottom: insets.bottom + 32 }]}>
        {/* Voice/Video toggle — only when not recording */}
        {!isRecording && (
          <Pressable
            style={styles.toggleBtn}
            onPress={() => setIsVoiceOnly(!isVoiceOnly)}
          >
            <Text style={styles.toggleIcon}>{isVoiceOnly ? '🎥' : '🎙️'}</Text>
            <Text style={styles.toggleText}>
              Switch to {isVoiceOnly ? 'Video' : 'Voice only'}
            </Text>
          </Pressable>
        )}

        {!isRecording && (
          <Text style={styles.holdHint}>Hold to record</Text>
        )}

        {/* Record Button */}
        <View style={styles.recordBtnContainer}>
          <Animated.View
            style={[
              styles.recordGlow,
              { opacity: glowAnim, transform: [{ scale: pulseAnim }] },
            ]}
          />
          <Animated.View
            style={[
              styles.recordGlowOuter,
              { opacity: Animated.multiply(glowAnim, 0.5), transform: [{ scale: Animated.multiply(pulseAnim, 1.3) }] },
            ]}
          />
          <Pressable
            onPressIn={startRecording}
            onPressOut={stopRecording}
            style={styles.recordBtn}
          >
            <LinearGradient
              colors={isRecording
                ? [Colors.error, Colors.errorContainer]
                : [Colors.primary, Colors.primaryContainer === '#1c1200' ? '#a07800' : Colors.primaryContainer]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.recordBtnGradient}
            >
              <Text style={styles.recordBtnIcon}>{isRecording ? '⏹' : '●'}</Text>
            </LinearGradient>
          </Pressable>
        </View>

        <View style={styles.ambientRow}>
          <Text style={styles.ambientText}>End-to-End Encrypted · Private</Text>
        </View>
      </View>
    </View>
  );
}

function RecordingDot() {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.2, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={[styles.dot, { opacity }]} />;
}

function WaveformVisualizer({ isRecording }: { isRecording: boolean }) {
  const bars = Array.from({ length: 32 }, (_, i) => i);
  const animValues = useRef(bars.map(() => new Animated.Value(0.2))).current;

  useEffect(() => {
    if (!isRecording) {
      animValues.forEach((v) => Animated.timing(v, { toValue: 0.2, duration: 300, useNativeDriver: false }).start());
      return;
    }
    const animations = animValues.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, { toValue: Math.random() * 0.8 + 0.2, duration: 300 + i * 20, useNativeDriver: false }),
          Animated.timing(v, { toValue: Math.random() * 0.3 + 0.1, duration: 200 + i * 15, useNativeDriver: false }),
        ])
      )
    );
    Animated.parallel(animations).start();
    return () => animations.forEach((a) => a.stop());
  }, [isRecording]);

  return (
    <View style={styles.waveform}>
      {bars.map((i) => (
        <Animated.View
          key={i}
          style={[
            styles.waveBar,
            {
              height: animValues[i].interpolate({
                inputRange: [0, 1],
                outputRange: ['4%', '60%'],
              }),
              opacity: animValues[i],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  voiceBg: {
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 24,
  },
  permissionText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 16,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 26,
  },
  permissionBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  permissionBtnText: {
    fontFamily: FontFamily.headline,
    fontSize: 14,
    color: Colors.onPrimary,
    letterSpacing: 1,
  },
  backBtn: {
    paddingVertical: 8,
  },
  backBtnText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    opacity: 0.6,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 50,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainer + '66',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 16,
    color: Colors.onSurfaceVariant,
  },
  recordingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceContainer + '66',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
  },
  recordingBadgeText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  timerText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    opacity: 0.5,
    letterSpacing: 1,
  },
  promptOverlay: {
    position: 'absolute',
    top: '35%',
    left: 32,
    right: 32,
    alignItems: 'center',
    zIndex: 10,
  },
  promptText: {
    fontFamily: FontFamily.headlineXBold,
    fontSize: 28,
    color: Colors.onSurface,
    textAlign: 'center',
    lineHeight: 36,
    letterSpacing: -0.5,
    opacity: 0.9,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 24,
    paddingHorizontal: 32,
    zIndex: 20,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.surfaceContainerHigh + '66',
    borderRadius: Radius.full,
  },
  toggleIcon: { fontSize: 16 },
  toggleText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 12,
    color: Colors.secondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  holdHint: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    color: Colors.onSurface,
    opacity: 0.4,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  recordBtnContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 120,
  },
  recordGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primary,
    opacity: 0.2,
  },
  recordGlowOuter: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: Colors.primary,
    opacity: 0.1,
  },
  recordBtn: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    ...Shadows.amberAura,
  },
  recordBtnGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordBtnIcon: {
    fontSize: 36,
    color: Colors.onPrimary,
  },
  ambientRow: {
    alignItems: 'center',
  },
  ambientText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 9,
    color: Colors.secondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    opacity: 0.4,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 80,
    width: '80%',
  },
  waveBar: {
    flex: 1,
    backgroundColor: Colors.secondary,
    borderRadius: 2,
    minHeight: 4,
  },
});
