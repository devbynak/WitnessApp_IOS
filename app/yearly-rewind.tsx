import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useWitnessStore } from '../store/useWitnessStore';
import { Colors, FontFamily, Radius, Shadows } from '../constants/tokens';

export default function YearlyRewindScreen() {
  const insets = useSafeAreaInsets();
  const { entries } = useWitnessStore();
  const year = new Date().getFullYear();
  const yearEntries = entries.filter((e) => new Date(e.createdAt).getFullYear() === year);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Pressable style={[styles.backBtn, { top: insets.top + 16 }]} onPress={() => router.back()}>
        <Text style={styles.backIcon}>‹</Text>
      </Pressable>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 60 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <LinearGradient
          colors={[Colors.primaryContainer, Colors.surface]}
          style={styles.hero}
        >
          <Text style={styles.heroYear}>{year}</Text>
          <Text style={styles.heroTitle}>Your Year in Feeling</Text>
          <Text style={styles.heroSub}>
            {yearEntries.length} honest moments. Not a highlight reel — an honest reel.
          </Text>
        </LinearGradient>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>{yearEntries.length}</Text>
            <Text style={styles.statLabel}>Entries</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>{formatHours(yearEntries.reduce((s, e) => s + e.duration, 0))}</Text>
            <Text style={styles.statLabel}>Hours spoken</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>{getMostMood(yearEntries)}</Text>
            <Text style={styles.statLabel}>Most felt</Text>
          </View>
        </View>

        {/* Generate button (Pro placeholder) */}
        <View style={styles.proCard}>
          <Text style={styles.proIcon}>🎞</Text>
          <Text style={styles.proTitle}>Generate Your Rewind</Text>
          <Text style={styles.proText}>
            AI auto-compiles your peak emotional moments into a private video reel. Just for you.
          </Text>
          <Pressable style={styles.proBtn}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryContainer]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.proBtnGradient}
            >
              <Text style={styles.proBtnText}>Upgrade to Pro — ₹299/mo</Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Timeline preview */}
        {yearEntries.length > 0 && (
          <View style={styles.timeline}>
            <Text style={styles.timelineTitle}>Your {year} so far</Text>
            {yearEntries.slice(0, 5).map((e, i) => (
              <View key={i} style={styles.timelineItem}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineText}>
                  <Text style={styles.timelineDate}>
                    {new Date(e.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                  </Text>
                  {e.aiReflection && (
                    <Text style={styles.timelineReflection} numberOfLines={2}>{e.aiReflection}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function formatHours(seconds: number) {
  const h = (seconds / 3600).toFixed(1);
  return `${h}h`;
}

function getMostMood(entries: any[]) {
  const counts: Record<string, number> = {};
  entries.forEach((e) => { if (e.mood) counts[e.mood] = (counts[e.mood] || 0) + 1; });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : '—';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  backBtn: {
    position: 'absolute', left: 24, zIndex: 10,
    width: 40, height: 40, borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { fontFamily: FontFamily.headline, fontSize: 24, color: Colors.onSurface },
  content: { gap: 24 },
  hero: {
    padding: 40, paddingTop: 80,
    alignItems: 'center', gap: 12,
  },
  heroYear: {
    fontFamily: FontFamily.headlineXBold, fontSize: 80,
    color: Colors.primary, opacity: 0.3, lineHeight: 80,
  },
  heroTitle: {
    fontFamily: FontFamily.headlineXBold, fontSize: 36,
    color: Colors.onSurface, letterSpacing: -1, textAlign: 'center',
  },
  heroSub: {
    fontFamily: FontFamily.bodyRegular, fontSize: 14,
    color: Colors.onSurfaceVariant, textAlign: 'center', lineHeight: 22,
  },
  statsGrid: { flexDirection: 'row', gap: 12, paddingHorizontal: 24 },
  statCard: {
    flex: 1, backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.lg, padding: 16, gap: 4,
  },
  statVal: { fontFamily: FontFamily.headline, fontSize: 24, color: Colors.onSurface },
  statLabel: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.onSurfaceVariant },
  proCard: {
    marginHorizontal: 24,
    backgroundColor: Colors.primaryContainer + '33',
    borderRadius: Radius.xl, padding: 24, gap: 12, alignItems: 'center',
  },
  proIcon: { fontSize: 40 },
  proTitle: { fontFamily: FontFamily.headline, fontSize: 22, color: Colors.onSurface },
  proText: {
    fontFamily: FontFamily.bodyRegular, fontSize: 14,
    color: Colors.onSurfaceVariant, textAlign: 'center', lineHeight: 22,
  },
  proBtn: { width: '100%', borderRadius: Radius.full, overflow: 'hidden', ...Shadows.amberAura },
  proBtnGradient: { padding: 18, alignItems: 'center' },
  proBtnText: { fontFamily: FontFamily.headline, fontSize: 14, color: Colors.onPrimary, letterSpacing: 0.5 },
  timeline: { paddingHorizontal: 24, gap: 16 },
  timelineTitle: { fontFamily: FontFamily.headline, fontSize: 18, color: Colors.onSurface },
  timelineItem: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  timelineDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: Colors.primary, marginTop: 4, flexShrink: 0,
  },
  timelineText: { flex: 1, gap: 4 },
  timelineDate: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.onSurface },
  timelineReflection: {
    fontFamily: FontFamily.bodyRegular, fontSize: 13,
    color: Colors.onSurfaceVariant, lineHeight: 20, fontStyle: 'italic',
  },
});
