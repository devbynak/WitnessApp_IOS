import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, Radius, Shadows } from '../constants/tokens';
import { LinearGradient } from 'expo-linear-gradient';
import { useWitnessStore } from '../store/useWitnessStore';

// Moat feature: unsent letters — record to someone (never sent, never stored externally)
const PROMPTS = [
  "What would you say to them if they could hear you right now?",
  "What have you never gotten to say?",
  "What do you wish they understood?",
  "If you could have one last conversation, what would you start with?",
];

export default function UnsentLetterScreen() {
  const insets = useSafeAreaInsets();
  const { addEntry } = useWitnessStore();
  const [recipientName, setRecipientName] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const prompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];

  const handleStart = () => {
    if (!recipientName.trim()) return;
    // Navigate to record with unsent-letter mode
    router.push({ pathname: '/record', params: { isUnsent: 'true', recipientName: recipientName.trim() } });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Pressable style={styles.closeBtn} onPress={() => router.back()}>
        <Text style={styles.closeIcon}>✕</Text>
      </Pressable>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 60 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTag}>UNSENT LETTER</Text>
          <Text style={styles.heroTitle}>Say the unsaid.</Text>
          <Text style={styles.heroText}>
            Record a video "to" someone — someone you've lost, someone you're angry at, someone you miss. It will never be sent. It will never be stored outside this device. But saying it out loud changes something real.
          </Text>
        </View>

        {/* Recipient input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>This is for</Text>
          <TextInput
            style={styles.nameInput}
            placeholder="Their name..."
            placeholderTextColor={Colors.outline}
            value={recipientName}
            onChangeText={setRecipientName}
            returnKeyType="done"
            autoFocus
          />
        </View>

        {/* Prompt */}
        {recipientName.trim() && (
          <View style={styles.promptCard}>
            <Text style={styles.promptLabel}>When you're ready</Text>
            <Text style={styles.promptText}>{prompt}</Text>
          </View>
        )}

        {/* Safety note */}
        <View style={styles.safetyNote}>
          <Text style={styles.safetyIcon}>🔒</Text>
          <Text style={styles.safetyText}>
            This recording is never sent. The name is never stored anywhere outside this app. It's yours, and only yours.
          </Text>
        </View>

        {/* Start button */}
        <Pressable
          style={[styles.startBtn, !recipientName.trim() && styles.startBtnDisabled]}
          onPress={handleStart}
          disabled={!recipientName.trim()}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.primaryContainer]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.startBtnGradient}
          >
            <Text style={styles.startBtnText}>
              {recipientName.trim() ? `Record to ${recipientName}` : 'Enter a name to begin'}
            </Text>
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  closeBtn: {
    position: 'absolute', top: 60, right: 24, zIndex: 10,
    width: 40, height: 40, borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center', justifyContent: 'center',
  },
  closeIcon: { fontSize: 16, color: Colors.onSurfaceVariant },
  content: { paddingHorizontal: 24, paddingTop: 80, gap: 32 },
  heroSection: { gap: 12 },
  heroTag: {
    fontFamily: FontFamily.bodySemiBold, fontSize: 10,
    color: Colors.primary, letterSpacing: 3, textTransform: 'uppercase',
  },
  heroTitle: {
    fontFamily: FontFamily.headlineXBold, fontSize: 44,
    color: Colors.onSurface, letterSpacing: -1.5,
  },
  heroText: {
    fontFamily: FontFamily.bodyRegular, fontSize: 15,
    color: Colors.onSurfaceVariant, lineHeight: 24,
  },
  inputSection: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.xl, padding: 24, gap: 8,
  },
  inputLabel: {
    fontFamily: FontFamily.bodyRegular, fontSize: 11,
    color: Colors.tertiary, textTransform: 'uppercase', letterSpacing: 1.5,
  },
  nameInput: {
    fontFamily: FontFamily.headlineXBold, fontSize: 32,
    color: Colors.onSurface, letterSpacing: -0.5,
    // cursor in secondary teal
    cursorColor: Colors.secondary,
  } as any,
  promptCard: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radius.xl, padding: 24, gap: 8,
  },
  promptLabel: {
    fontFamily: FontFamily.bodyRegular, fontSize: 10,
    color: Colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1,
  },
  promptText: {
    fontFamily: FontFamily.headline, fontSize: 20,
    color: Colors.onSurface, lineHeight: 28,
  },
  safetyNote: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl, padding: 20,
  },
  safetyIcon: { fontSize: 20, flexShrink: 0 },
  safetyText: {
    fontFamily: FontFamily.bodyRegular, fontSize: 13,
    color: Colors.onSurfaceVariant, lineHeight: 20, flex: 1,
  },
  startBtn: { borderRadius: Radius.full, overflow: 'hidden', ...Shadows.amberAura },
  startBtnDisabled: { opacity: 0.4 },
  startBtnGradient: { padding: 20, alignItems: 'center' },
  startBtnText: {
    fontFamily: FontFamily.headline, fontSize: 16,
    color: Colors.onPrimary, letterSpacing: 0.3,
  },
});
