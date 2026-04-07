import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontFamily, Radius, Shadows } from '../constants/tokens';

// Grief mode: softer UI, longer prompts, gentler AI reflection
const GRIEF_PROMPTS = [
  "Tell me about them. What do you miss most?",
  "What's something they would have said today?",
  "What are you carrying that you haven't been able to put down?",
  "What do you wish you had told them?",
  "What are you most grateful they gave you?",
  "If they could see you right now, what would they want you to know?",
];

export default function GriefModeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Pressable style={styles.closeBtn} onPress={() => router.back()}>
        <Text style={styles.closeIcon}>✕</Text>
      </Pressable>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 60 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Soft hero */}
        <View style={styles.heroSection}>
          <View style={styles.candleContainer}>
            <Text style={styles.candle}>🕯️</Text>
          </View>
          <Text style={styles.heroTag}>GRIEF SANCTUARY</Text>
          <Text style={styles.heroTitle}>
            {`You don't have to\nexplain yourself here.`}
          </Text>
          <Text style={styles.heroText}>
            This space is different. Slower. Softer. The AI here will be gentler — more present, less analytical. Take all the time you need.
          </Text>
        </View>

        {/* Prompts */}
        <View style={styles.promptsSection}>
          <Text style={styles.promptsLabel}>When you're ready, something to begin</Text>
          {GRIEF_PROMPTS.map((p, i) => (
            <Pressable key={i} style={styles.promptCard} onPress={() => router.push({ pathname: '/record', params: { isGrief: 'true' } })}>
              <Text style={styles.promptText}>{p}</Text>
              <Text style={styles.promptArrow}>›</Text>
            </Pressable>
          ))}
        </View>

        {/* Comfort note */}
        <View style={styles.comfortCard}>
          <Text style={styles.comfortText}>
            "Grief, I've learned, is really just love. It's all the love you want to give but cannot give."
          </Text>
          <Text style={styles.comfortAuthor}>— Jamie Anderson</Text>
        </View>

        {/* Crisis resources */}
        <View style={styles.resourceCard}>
          <Text style={styles.resourceTitle}>💛 If you need support</Text>
          <Text style={styles.resourceText}>
            iCall (India): 9152987821{'\n'}
            Vandrevala Foundation: 1860-2662-345{'\n'}
            Available 24/7, free & confidential.
          </Text>
        </View>

        {/* Start recording button */}
        <Pressable style={styles.startBtn} onPress={() => router.push({ pathname: '/record', params: { isGrief: 'true' } })}>
          <LinearGradient
            colors={[Colors.secondary + 'AA', Colors.secondaryContainer]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.startBtnGradient}
          >
            <Text style={styles.startBtnText}>Begin when you're ready</Text>
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surfaceContainerLowest },
  closeBtn: {
    position: 'absolute', top: 60, right: 24, zIndex: 10,
    width: 40, height: 40, borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center', justifyContent: 'center',
  },
  closeIcon: { fontSize: 16, color: Colors.onSurfaceVariant },
  content: { paddingHorizontal: 24, paddingTop: 80, gap: 32 },
  heroSection: { alignItems: 'center', gap: 16 },
  candleContainer: {
    width: 80, height: 80, borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center', justifyContent: 'center',
    ...Shadows.amberAura,
  },
  candle: { fontSize: 36 },
  heroTag: {
    fontFamily: FontFamily.bodySemiBold, fontSize: 9,
    color: Colors.secondary, letterSpacing: 3, textTransform: 'uppercase',
  },
  heroTitle: {
    fontFamily: FontFamily.headlineXBold, fontSize: 34,
    color: Colors.onSurface, letterSpacing: -1, textAlign: 'center', lineHeight: 42,
  },
  heroText: {
    fontFamily: FontFamily.bodyRegular, fontSize: 15,
    color: Colors.onSurfaceVariant, lineHeight: 24, textAlign: 'center',
  },
  promptsSection: { gap: 10 },
  promptsLabel: {
    fontFamily: FontFamily.bodyRegular, fontSize: 11,
    color: Colors.tertiary, textTransform: 'uppercase',
    letterSpacing: 1, opacity: 0.7,
  },
  promptCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.xl, padding: 20,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  promptText: {
    fontFamily: FontFamily.bodyRegular, fontSize: 15,
    color: Colors.onSurface, lineHeight: 22, flex: 1,
  },
  promptArrow: {
    fontFamily: FontFamily.headline, fontSize: 20,
    color: Colors.secondary, opacity: 0.5,
  },
  comfortCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.xl, padding: 24, gap: 8,
  },
  comfortText: {
    fontFamily: FontFamily.bodyRegular, fontSize: 15,
    color: Colors.onSurfaceVariant, lineHeight: 24, fontStyle: 'italic',
  },
  comfortAuthor: {
    fontFamily: FontFamily.bodySemiBold, fontSize: 12,
    color: Colors.tertiary, opacity: 0.7,
  },
  resourceCard: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radius.xl, padding: 20, gap: 8,
  },
  resourceTitle: { fontFamily: FontFamily.headline, fontSize: 15, color: Colors.onSurface },
  resourceText: {
    fontFamily: FontFamily.bodyRegular, fontSize: 13,
    color: Colors.onSurfaceVariant, lineHeight: 22,
  },
  startBtn: { borderRadius: Radius.full, overflow: 'hidden' },
  startBtnGradient: { padding: 20, alignItems: 'center' },
  startBtnText: {
    fontFamily: FontFamily.headline, fontSize: 16,
    color: Colors.onSurface, letterSpacing: 0.3,
  },
});
