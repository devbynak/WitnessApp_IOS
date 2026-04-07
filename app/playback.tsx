import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  PanResponder,
  Alert,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useWitnessStore } from '../store/useWitnessStore';
import { Colors, FontFamily, MoodColors, Radius, Mood } from '../constants/tokens';

const { width: SCREEN_W } = Dimensions.get('window');
const SCRUBBER_WIDTH = SCREEN_W - 48;

const MOOD_EMOJIS: Record<Mood, string> = {
  heavy: '🌑',
  hopeful: '🌱',
  angry: '🔥',
  calm: '🌊',
  confused: '🌀',
  numb: '❄️',
  grateful: '✨',
};

export default function PlaybackScreen() {
  const insets = useSafeAreaInsets();
  const { entryId } = useLocalSearchParams<{ entryId: string }>();
  const { entries, deleteEntry, updateEntry } = useWitnessStore();
  const entry = entries.find((e) => e.id === entryId);

  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showMoodEditor, setShowMoodEditor] = useState(false);
  const [noteText, setNoteText] = useState('');
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialise note from entry
  useEffect(() => {
    if (entry?.note) setNoteText(entry.note);
  }, [entry?.id]);

  // Auto-start playback
  useEffect(() => {
    const timer = setTimeout(() => {
      videoRef.current?.playAsync();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Auto-hide controls after 3 seconds
  useEffect(() => {
    if (controlsVisible) {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => {
        if (isPlaying) fadeOutControls();
      }, 3000);
    }
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, [controlsVisible, isPlaying]);

  function fadeOutControls() {
    Animated.timing(controlsOpacity, { toValue: 0, duration: 500, useNativeDriver: true }).start(
      () => setControlsVisible(false)
    );
  }

  function showControls() {
    setControlsVisible(true);
    Animated.timing(controlsOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }

  function onPlaybackStatusUpdate(status: AVPlaybackStatus) {
    if (!status.isLoaded) return;
    setIsPlaying(status.isPlaying);
    setPosition(status.positionMillis ?? 0);
    setDuration(status.durationMillis ?? 0);
    if (status.didJustFinish) {
      setIsPlaying(false);
      showControls();
    }
  }

  async function togglePlayPause() {
    if (isPlaying) {
      await videoRef.current?.pauseAsync();
    } else {
      await videoRef.current?.playAsync();
    }
    showControls();
  }

  async function seekBack() {
    const newPos = Math.max(0, position - 15000);
    await videoRef.current?.setPositionAsync(newPos);
    showControls();
  }

  async function seekForward() {
    const newPos = Math.min(duration, position + 15000);
    await videoRef.current?.setPositionAsync(newPos);
    showControls();
  }

  async function seekTo(ratio: number) {
    const newPos = ratio * duration;
    await videoRef.current?.setPositionAsync(newPos);
  }

  const progressRatio = duration > 0 ? position / duration : 0;

  // Scrubber pan gesture
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => {
      const ratio = e.nativeEvent.locationX / SCRUBBER_WIDTH;
      seekTo(Math.max(0, Math.min(1, ratio)));
    },
    onPanResponderMove: (e) => {
      const ratio = e.nativeEvent.locationX / SCRUBBER_WIDTH;
      seekTo(Math.max(0, Math.min(1, ratio)));
    },
  });

  function formatTime(ms: number) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${m}:${(s % 60).toString().padStart(2, '0')}`;
  }

  function handleMoodChange(mood: Mood) {
    if (entryId) updateEntry(entryId, { mood });
    setShowMoodEditor(false);
  }

  function handleNoteSave() {
    if (entryId) updateEntry(entryId, { note: noteText.trim() });
  }

  function handleDelete() {
    Alert.alert(
      'Delete this entry?',
      'This recording will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (entryId) deleteEntry(entryId);
            router.back();
          },
        },
      ]
    );
  }

  if (!entry) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.errorText}>Entry not found.</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const MOODS: Mood[] = ['heavy', 'hopeful', 'angry', 'calm', 'confused', 'numb', 'grateful'];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
    <Pressable style={StyleSheet.absoluteFill} onPress={showControls}>
      {/* Video or voice-only background */}
      {entry.isVoiceOnly ? (
        <View style={styles.voiceBg}>
          <WaveformDisplay isPlaying={isPlaying} />
        </View>
      ) : (
        <Video
          ref={videoRef}
          source={{ uri: entry.videoUri ?? '' }}
          style={StyleSheet.absoluteFill}
          resizeMode={ResizeMode.COVER}
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
          shouldPlay={false}
        />
      )}

      {/* Unsent letter banner */}
      {entry.isUnsentLetter && entry.recipientName && (
        <View style={[styles.unsentBanner, { paddingTop: insets.top + 16 }]}>
          <Text style={styles.unsentText}>To {entry.recipientName}</Text>
        </View>
      )}

      {/* Controls overlay */}
      {controlsVisible && (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: controlsOpacity }]}>
          {/* Top bar */}
          <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
            <Pressable style={styles.deleteBtn} onPress={handleDelete}>
              <Text style={styles.deleteBtnIcon}>🗑</Text>
            </Pressable>
            <Pressable style={styles.closeBtn} onPress={() => router.back()}>
              <Text style={styles.closeIcon}>✕</Text>
            </Pressable>
          </View>

          {/* Bottom gradient + controls */}
          <LinearGradient
            colors={['transparent', 'rgba(18,20,22,0.95)']}
            style={[styles.bottomGradient, { paddingBottom: insets.bottom + 70 }]}
          >
            {/* Entry meta */}
            <View style={styles.entryMeta}>
              <Text style={styles.entryDate}>
                {new Date(entry.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
              {entry.mood && (
                <Pressable
                  style={[styles.moodPill, { borderColor: MoodColors[entry.mood] + '66' }]}
                  onPress={() => setShowMoodEditor(true)}
                >
                  <Text style={styles.moodPillText}>
                    {MOOD_EMOJIS[entry.mood]} {entry.mood}
                  </Text>
                  <Text style={styles.moodEditHint}> ✎</Text>
                </Pressable>
              )}
            </View>

            {/* AI reflection */}
            {entry.aiReflection ? (
              <Text style={styles.reflectionText} numberOfLines={3}>
                {entry.aiReflection}
              </Text>
            ) : null}

            {/* Transcript toggle */}
            {entry.transcript ? (
              <Pressable style={styles.transcriptToggle} onPress={() => setShowTranscript((v) => !v)}>
                <Text style={styles.transcriptToggleText}>
                  {showTranscript ? '▲ Hide transcript' : '▼ Show transcript'}
                </Text>
              </Pressable>
            ) : null}
            {showTranscript && entry.transcript ? (
              <ScrollView style={styles.transcriptBox} nestedScrollEnabled>
                <Text style={styles.transcriptText}>{entry.transcript}</Text>
              </ScrollView>
            ) : null}

            {/* Scrubber */}
            <View style={styles.scrubberRow} {...panResponder.panHandlers}>
              <View style={styles.scrubberTrack}>
                <View style={[styles.scrubberFill, { width: `${progressRatio * 100}%` }]} />
                <View style={[styles.scrubberThumb, { left: `${progressRatio * 100}%` }]} />
              </View>
            </View>
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{formatTime(position)}</Text>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>

            {/* Playback buttons */}
            <View style={styles.controls}>
              <Pressable style={styles.skipBtn} onPress={seekBack}>
                <Text style={styles.skipIcon}>↩</Text>
                <Text style={styles.skipLabel}>15</Text>
              </Pressable>

              <Pressable style={styles.playPauseBtn} onPress={togglePlayPause}>
                <LinearGradient
                  colors={[Colors.primary, '#a07800']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.playPauseBtnGradient}
                >
                  <Text style={styles.playPauseIcon}>{isPlaying ? '⏸' : '▶'}</Text>
                </LinearGradient>
              </Pressable>

              <Pressable style={styles.skipBtn} onPress={seekForward}>
                <Text style={styles.skipIcon}>↪</Text>
                <Text style={styles.skipLabel}>15</Text>
              </Pressable>
            </View>
          </LinearGradient>
        </Animated.View>
      )}
    </Pressable>

      {/* Mood editor sheet */}
      {showMoodEditor && (
        <View style={[styles.moodSheet, { paddingBottom: insets.bottom + 16 }]}>
          <Text style={styles.moodSheetTitle}>Change mood</Text>
          <View style={styles.moodSheetGrid}>
            {MOODS.map((m) => (
              <Pressable
                key={m}
                style={[
                  styles.moodSheetPill,
                  entry.mood === m && { backgroundColor: MoodColors[m] + '33', borderColor: MoodColors[m] },
                ]}
                onPress={() => handleMoodChange(m)}
              >
                <View style={[styles.moodSheetDot, { backgroundColor: MoodColors[m] }]} />
                <Text style={styles.moodSheetLabel}>{MOOD_EMOJIS[m]} {m}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable style={styles.moodSheetCancel} onPress={() => setShowMoodEditor(false)}>
            <Text style={styles.moodSheetCancelText}>Cancel</Text>
          </Pressable>
        </View>
      )}

      {/* Persistent note area — sits above the tab bar, below the video */}
      {!showMoodEditor && (
        <View style={[styles.noteArea, { bottom: insets.bottom + 6 }]}>
          <TextInput
            style={styles.noteInput}
            placeholder="Add a note..."
            placeholderTextColor={Colors.outline}
            value={noteText}
            onChangeText={setNoteText}
            onBlur={handleNoteSave}
            multiline
            returnKeyType="done"
            blurOnSubmit
          />
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

function WaveformDisplay({ isPlaying }: { isPlaying: boolean }) {
  const bars = Array.from({ length: 40 }, (_, i) => i);
  const animValues = useRef(bars.map(() => new Animated.Value(0.15))).current;

  useEffect(() => {
    if (!isPlaying) {
      animValues.forEach((v) => Animated.timing(v, { toValue: 0.15, duration: 400, useNativeDriver: false }).start());
      return;
    }
    const anims = animValues.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, { toValue: Math.random() * 0.7 + 0.2, duration: 250 + i * 15, useNativeDriver: false }),
          Animated.timing(v, { toValue: Math.random() * 0.2 + 0.1, duration: 200 + i * 10, useNativeDriver: false }),
        ])
      )
    );
    Animated.parallel(anims).start();
    return () => anims.forEach((a) => a.stop());
  }, [isPlaying]);

  return (
    <View style={waveStyles.container}>
      {bars.map((i) => (
        <Animated.View
          key={i}
          style={[
            waveStyles.bar,
            {
              height: animValues[i].interpolate({ inputRange: [0, 1], outputRange: ['3%', '55%'] }),
              opacity: animValues[i],
            },
          ]}
        />
      ))}
    </View>
  );
}

const waveStyles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 24,
  },
  bar: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 2,
    minHeight: 3,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  voiceBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.surface,
  },
  unsentBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  unsentText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    color: Colors.primary,
    letterSpacing: 1,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    zIndex: 10,
  },
  deleteBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainer + '80',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnIcon: {
    fontSize: 18,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainer + '80',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 16,
    color: Colors.onSurfaceVariant,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 48,
    gap: 12,
  },
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  entryDate: {
    fontFamily: FontFamily.headline,
    fontSize: 15,
    color: Colors.onSurface,
  },
  moodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    backgroundColor: Colors.surfaceContainer + '80',
  },
  moodPillText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    textTransform: 'capitalize',
  },
  reflectionText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    lineHeight: 22,
    opacity: 0.75,
  },
  scrubberRow: {
    paddingVertical: 12,
  },
  scrubberTrack: {
    height: 3,
    backgroundColor: Colors.outlineVariant + '40',
    borderRadius: 2,
    position: 'relative',
  },
  scrubberFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  scrubberThumb: {
    position: 'absolute',
    top: -5,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: Colors.primary,
    marginLeft: -6.5,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  timeText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    opacity: 0.5,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    paddingVertical: 8,
  },
  skipBtn: {
    alignItems: 'center',
    gap: 2,
  },
  skipIcon: {
    fontSize: 22,
    color: Colors.onSurface,
    opacity: 0.8,
  },
  skipLabel: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    opacity: 0.5,
  },
  playPauseBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
  },
  playPauseBtnGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPauseIcon: {
    fontSize: 28,
    color: Colors.onPrimary,
  },
  errorText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 16,
    color: Colors.onSurfaceVariant,
    marginBottom: 16,
  },
  backText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 14,
    color: Colors.primary,
  },
  transcriptToggle: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  transcriptToggleText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 12,
    color: Colors.primary,
    opacity: 0.8,
  },
  transcriptBox: {
    maxHeight: 120,
    backgroundColor: Colors.surfaceContainerLowest + 'cc',
    borderRadius: Radius.md,
    padding: 12,
  },
  transcriptText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    lineHeight: 20,
  },
  moodEditHint: {
    fontSize: 11,
    color: Colors.primary,
    opacity: 0.7,
  },
  // Mood editor sheet
  moodSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surfaceContainerLow,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: 24,
    gap: 16,
    zIndex: 100,
  },
  moodSheetTitle: {
    fontFamily: FontFamily.headline,
    fontSize: 16,
    color: Colors.onSurface,
    textAlign: 'center',
  },
  moodSheetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  moodSheetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  moodSheetDot: { width: 8, height: 8, borderRadius: 4 },
  moodSheetLabel: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    color: Colors.onSurface,
    textTransform: 'capitalize',
  },
  moodSheetCancel: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  moodSheetCancelText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 14,
    color: Colors.outline,
  },
  // Note area
  noteArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 24,
  },
  noteInput: {
    backgroundColor: Colors.surfaceContainer + 'BB',
    borderRadius: Radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.onSurface,
    lineHeight: 20,
    maxHeight: 80,
  },
});
