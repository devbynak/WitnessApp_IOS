import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  ScrollView,
  Linking,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useWitnessStore } from '../store/useWitnessStore';
import { Colors, FontFamily, Radius, MoodColors, Shadows, Mood } from '../constants/tokens';
import { transcribeAudio } from '../services/transcription';
import { analyzeEntry } from '../services/ai';

const MOODS: Mood[] = ['heavy', 'hopeful', 'angry', 'calm', 'confused', 'numb', 'grateful'];

const MOOD_EMOJIS: Record<Mood, string> = {
  heavy: '🌑',
  hopeful: '🌱',
  angry: '🔥',
  calm: '🌊',
  confused: '🌀',
  numb: '❄️',
  grateful: '✨',
};

type LoadingPhase = 'listening' | 'analyzing' | 'done';

export default function ReflectScreen() {
  const insets = useSafeAreaInsets();
  const { entryId } = useLocalSearchParams<{ entryId: string }>();
  const { entries, settings, updateEntry, deleteEntry } = useWitnessStore();
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>('listening');
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [reflection, setReflection] = useState('');
  const [hasCrisis, setHasCrisis] = useState(false);
  const [apiError, setApiError] = useState(false);

  const spinAnim = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslate = useRef(new Animated.Value(20)).current;
  const spinLoop = useRef<Animated.CompositeAnimation | null>(null);

  const entry = entries.find((e) => e.id === entryId);

  useEffect(() => {
    startSpinner();
    runAIPipeline();
    return () => spinLoop.current?.stop();
  }, []);

  function startSpinner() {
    spinLoop.current = Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 1500, useNativeDriver: true })
    );
    spinLoop.current.start();
  }

  async function runAIPipeline() {
    if (!entry) {
      // Entry not found — show fallback and let user navigate away
      setSelectedMood('calm');
      setLoadingPhase('done');
      spinLoop.current?.stop();
      Animated.timing(cardOpacity, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      return;
    }

    try {
      const videoUri = entry.videoUri ?? null;

      // Step 1: Transcription
      let transcript = '';
      if (videoUri && settings.aiEnabled) {
        setLoadingPhase('listening');
        transcript = await transcribeAudio(videoUri);
      }

      // Step 2: AI analysis
      setLoadingPhase('analyzing');
      let mood: Mood = 'calm';
      let reflectionText = '';
      let crisisFlag = false;
      let hadError = false;

        if (settings.aiEnabled) {
        try {
          const result = await analyzeEntry(transcript, entry.isGriefMode);
          mood = result.mood;
          reflectionText = result.reflection;
          crisisFlag = result.hasCrisisLanguage;
        } catch {
          hadError = true;
          setApiError(true);
        }
      }

      // Step 3: Persist results
      if (entryId) {
        updateEntry(entryId, {
          transcript: transcript || null,
          mood,
          aiReflection: reflectionText || null,
        });
      }

      // Step 4: Update UI
      setReflection(reflectionText);
      setSelectedMood(mood);
      setHasCrisis(crisisFlag);
      setLoadingPhase('done');
      setApiError(hadError);

      spinLoop.current?.stop();

      Animated.parallel([
        Animated.timing(cardOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(cardTranslate, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]).start();
    } catch (error) {
      console.error('Reflect pipeline error:', error);
      // Fallback — still show UI with defaults
      const fallbackMood: Mood = 'calm';
      setSelectedMood(fallbackMood);
      setReflection('');
      setLoadingPhase('done');
      setApiError(true);
      spinLoop.current?.stop();
      if (entryId) updateEntry(entryId, { mood: fallbackMood });
      Animated.parallel([
        Animated.timing(cardOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(cardTranslate, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]).start();
    }
  }

  function handleKeep() {
    router.replace('/(tabs)');
  }

  function handleDelete() {
    // No confirmation dialog per spec — immediate delete
    if (entryId) deleteEntry(entryId);
    router.replace('/(tabs)');
  }

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const isProcessing = loadingPhase !== 'done';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar} />
        <Text style={styles.brandName}>Witness</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Video/Audio Preview */}
        <View style={styles.videoPreview}>
          {isProcessing ? (
            <View style={styles.processingOverlay}>
              <View style={styles.spinnerContainer}>
                <Animated.View style={[styles.spinnerOuter, { transform: [{ rotate: spin }] }]} />
                <Animated.View
                  style={[
                    styles.spinnerInner,
                    {
                      transform: [{
                        rotate: spinAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '-360deg'],
                        }),
                      }],
                    },
                  ]}
                />
              </View>
              <Text style={styles.processingLabel}>
                {loadingPhase === 'listening' ? 'Listening...' : 'Almost there.'}
              </Text>
            </View>
          ) : (
            <Pressable
              style={styles.videoThumbnail}
              onPress={() => entry && router.push({ pathname: '/playback', params: { entryId: entry.id } })}
            >
              <Text style={styles.videoIcon}>{entry?.isVoiceOnly ? '🎙️' : '🎬'}</Text>
              <Text style={styles.videoDuration}>
                {entry ? formatDuration(entry.duration) : '—'}
              </Text>
              <Text style={styles.tapToPlay}>Tap to play</Text>
            </Pressable>
          )}
        </View>

        {/* Error notice */}
        {!isProcessing && apiError && (
          <View style={styles.errorNotice}>
            <Text style={styles.errorNoticeText}>Couldn't connect. Entry saved.</Text>
          </View>
        )}

        {/* AI Reflection Card */}
        {!isProcessing && (
          <Animated.View
            style={[
              styles.reflectionCard,
              { opacity: cardOpacity, transform: [{ translateY: cardTranslate }] },
            ]}
          >
            {hasCrisis ? (
              // Crisis support card
              <View style={styles.crisisCard}>
                <Text style={styles.crisisText}>
                  You said something heavy today.{'\n'}You don't have to carry it alone.
                </Text>
                <Pressable
                  style={styles.crisisBtn}
                  onPress={() => Linking.openURL('https://icallhelpline.org')}
                >
                  <Text style={styles.crisisBtnText}>Talk to someone →</Text>
                </Pressable>
              </View>
            ) : (
              // Normal reflection
              <View style={styles.reflectionHeader}>
                <Text style={styles.reflectionStar}>✦</Text>
                <View style={styles.reflectionHeaderText}>
                  <Text style={styles.reflectionLabel}>Observation</Text>
                  <Text style={styles.reflectionText}>
                    {reflection || "Your entry has been saved."}
                  </Text>
                </View>
              </View>
            )}

            {/* Mood tag */}
            <View style={styles.moodRow}>
              <Text style={styles.moodAssignedLabel}>Mood:</Text>
              <View
                style={[
                  styles.moodTag,
                  selectedMood && { borderColor: MoodColors[selectedMood] + '40' },
                ]}
              >
                <View
                  style={[
                    styles.moodDot,
                    { backgroundColor: selectedMood ? MoodColors[selectedMood] : Colors.outline },
                  ]}
                />
                <Text style={styles.moodTagText}>
                  {selectedMood ? `${MOOD_EMOJIS[selectedMood]} ${selectedMood}` : '—'}
                </Text>
              </View>
            </View>

            {/* Mood override */}
            <Text style={styles.overrideLabel}>Change mood:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.moodScroll}>
              {MOODS.map((mood) => (
                <Pressable
                  key={mood}
                  style={[
                    styles.moodChip,
                    selectedMood === mood && { backgroundColor: MoodColors[mood] + '33', borderColor: MoodColors[mood] },
                  ]}
                  onPress={() => {
                    setSelectedMood(mood);
                    if (entryId) updateEntry(entryId, { mood });
                  }}
                >
                  <Text style={styles.moodChipText}>{MOOD_EMOJIS[mood]} {mood}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Action Buttons — no confirmation on delete per spec */}
        {!isProcessing && (
          <Animated.View style={[styles.actionRow, { opacity: cardOpacity }]}>
            <Pressable style={styles.deleteBtn} onPress={handleDelete}>
              <Text style={styles.deleteBtnText}>Delete it</Text>
            </Pressable>
            <Pressable style={styles.keepBtn} onPress={handleKeep}>
              <LinearGradient
                colors={[Colors.primary, '#a07800']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.keepBtnGradient}
              >
                <Text style={styles.keepBtnText}>Keep it</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m === 0) return `${sec}s`;
  return `${m}m ${sec.toString().padStart(2, '0')}s`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainerHighest,
  },
  brandName: {
    fontFamily: FontFamily.headline,
    fontSize: 16,
    color: Colors.primary,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 24,
  },
  videoPreview: {
    aspectRatio: 9 / 14,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...Shadows.amberAura,
  },
  processingOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  spinnerContainer: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerOuter: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderTopColor: Colors.primary,
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  spinnerInner: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderBottomColor: Colors.secondary + '66',
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  processingLabel: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    color: Colors.onSurfaceVariant,
    opacity: 0.7,
  },
  videoThumbnail: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  videoIcon: { fontSize: 48 },
  videoDuration: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.tertiary,
  },
  tapToPlay: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    color: Colors.primary,
    opacity: 0.6,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  errorNotice: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Radius.md,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  errorNoticeText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    opacity: 0.7,
  },
  reflectionCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.xl,
    padding: 24,
    gap: 16,
  },
  crisisCard: {
    gap: 16,
  },
  crisisText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 17,
    color: Colors.onSurface,
    lineHeight: 28,
  },
  crisisBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.primary + '66',
    alignSelf: 'flex-start',
  },
  crisisBtnText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 14,
    color: Colors.primary,
    letterSpacing: 0.3,
  },
  reflectionHeader: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  reflectionStar: {
    fontSize: 24,
    color: Colors.primary,
    marginTop: 2,
  },
  reflectionHeaderText: { flex: 1, gap: 6 },
  reflectionLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 10,
    color: Colors.secondary,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  reflectionText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 16,
    color: Colors.onSurface,
    lineHeight: 26,
  },
  moodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  moodAssignedLabel: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    color: Colors.tertiary,
    letterSpacing: 0.5,
  },
  moodTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  moodDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  moodTagText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 12,
    color: Colors.onSurface,
    textTransform: 'capitalize',
  },
  overrideLabel: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    letterSpacing: 1,
    textTransform: 'uppercase',
    opacity: 0.6,
  },
  moodScroll: { marginHorizontal: -4 },
  moodChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Radius.full,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  moodChipText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    textTransform: 'capitalize',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  deleteBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Radius.full,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + '26',
  },
  deleteBtnText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: Colors.onSurfaceVariant,
  },
  keepBtn: {
    flex: 1,
    borderRadius: Radius.full,
    overflow: 'hidden',
    ...Shadows.amberAura,
  },
  keepBtnGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  keepBtnText: {
    fontFamily: FontFamily.headlineXBold,
    fontSize: 15,
    color: Colors.onPrimary,
  },
});
