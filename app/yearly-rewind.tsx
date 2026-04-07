import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Share } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useWitnessStore } from '../store/useWitnessStore';
import { Colors, FontFamily, Radius } from '../constants/tokens';

export default function YearlyRewindScreen() {
  const insets = useSafeAreaInsets();
  const { entries } = useWitnessStore();
  const year = new Date().getFullYear();
  const yearEntries = useMemo(
    () => entries.filter((e) => new Date(e.createdAt).getFullYear() === year),
    [entries, year]
  );

  const moodCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    yearEntries.forEach((e) => { if (e.mood) counts[e.mood] = (counts[e.mood] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [yearEntries]);

  const totalHours = formatHours(yearEntries.reduce((s, e) => s + e.duration, 0));
  const longestStreak = useMemo(() => calcStreak(yearEntries), [yearEntries]);
  const mostMood = getMostMood(yearEntries);
  const moodEmojis: Record<string, string> = {
    heavy: '🌑', hopeful: '🌱', angry: '🔥', calm: '🌊',
    confused: '🌀', numb: '❄️', grateful: '✨',
  };

  const handleShare = async () => {
    const lines = [
      `✦ My ${year} in Feeling — via Witness`,
      '',
      `${yearEntries.length} honest entries`,
      `${totalHours} of voice`,
      `${longestStreak}-day longest streak`,
      mostMood !== '—' ? `Most felt: ${moodEmojis[mostMood] || ''} ${mostMood}` : '',
      '',
      moodCounts.slice(0, 3).map(([m, c]) => `${moodEmojis[m] || m} ${m}: ${c}×`).join('  '),
      '',
      '#Witness #VideoJournal',
    ].filter(Boolean).join('\n');
    await Share.share({ message: lines, title: `My ${year} in Feeling` });
  };

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
            <Text style={styles.statVal}>{totalHours}</Text>
            <Text style={styles.statLabel}>Hours spoken</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>{longestStreak}d</Text>
            <Text style={styles.statLabel}>Best streak</Text>
          </View>
        </View>

        {/* Mood breakdown */}
        {moodCounts.length > 0 && (
          <View style={styles.moodBreakdown}>
            <Text style={styles.moodBreakdownTitle}>Your {year} in moods</Text>
            {moodCounts.map(([mood, count]) => (
              <View key={mood} style={styles.moodRow}>
                <Text style={styles.moodRowLabel}>{moodEmojis[mood] || ''} {mood}</Text>
                <View style={styles.moodRowTrack}>
                  <View style={[styles.moodRowFill, {
                    width: `${(count / (moodCounts[0]?.[1] || 1)) * 100}%`,
                    backgroundColor: Colors.primary,
                  }]} />
                </View>
                <Text style={styles.moodRowCount}>{count}×</Text>
              </View>
            ))}
          </View>
        )}

        {/* Share Rewind card */}
        <View style={styles.shareCard}>
          <Text style={styles.shareCardTitle}>Share Your Year</Text>
          <Text style={styles.shareCardText}>
            A private snapshot of your emotional year — share it or keep it for yourself.
          </Text>
          <Pressable style={styles.shareBtn} onPress={handleShare}>
            <LinearGradient
              colors={[Colors.primary, '#a07800']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.shareBtnGradient}
            >
              <Text style={styles.shareBtnText}>✦ Share My {year} in Feeling</Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Timeline preview */}
        {yearEntries.length > 0 && (
          <View style={styles.timeline}>
            <Text style={styles.timelineTitle}>Your {year} in moments</Text>
            {yearEntries.slice(0, 10).map((e, i) => (
              <Pressable key={i} style={styles.timelineItem} onPress={() => router.push(`/playback?entryId=${e.id}`)}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineText}>
                  <Text style={styles.timelineDate}>
                    {new Date(e.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                    {e.mood ? `  ${moodEmojis[e.mood] || ''}` : ''}
                  </Text>
                  {e.aiReflection && (
                    <Text style={styles.timelineReflection} numberOfLines={2}>{e.aiReflection}</Text>
                  )}
                </View>
              </Pressable>
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

function calcStreak(entries: any[]): number {
  if (entries.length === 0) return 0;
  const days = [...new Set(entries.map((e) => {
    const d = new Date(e.createdAt);
    // Zero-pad month and day so lexicographic sort == chronological sort
    const m = String(d.getMonth() + 1).padStart(2, '0'); // 1-12, not 0-11
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  }))].sort();
  let best = 1, cur = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]);
    const curr = new Date(days[i]);
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    if (diff === 1) { cur++; best = Math.max(best, cur); } else { cur = 1; }
  }
  return best;
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
  moodBreakdown: {
    marginHorizontal: 24,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.xl, padding: 20, gap: 12,
  },
  moodBreakdownTitle: {
    fontFamily: FontFamily.headline, fontSize: 16, color: Colors.onSurface,
  },
  moodRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  moodRowLabel: {
    fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.onSurface,
    width: 90, textTransform: 'capitalize',
  },
  moodRowTrack: {
    flex: 1, height: 6, backgroundColor: Colors.outlineVariant + '40',
    borderRadius: 3, overflow: 'hidden',
  },
  moodRowFill: { height: '100%', borderRadius: 3 },
  moodRowCount: {
    fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.outline,
    width: 24, textAlign: 'right',
  },
  shareCard: {
    marginHorizontal: 24,
    backgroundColor: Colors.primaryContainer + '22',
    borderRadius: Radius.xl, padding: 24, gap: 14, alignItems: 'center',
  },
  shareCardTitle: { fontFamily: FontFamily.headline, fontSize: 20, color: Colors.onSurface },
  shareCardText: {
    fontFamily: FontFamily.bodyRegular, fontSize: 14,
    color: Colors.onSurfaceVariant, textAlign: 'center', lineHeight: 22,
  },
  shareBtn: { width: '100%', borderRadius: Radius.full, overflow: 'hidden' },
  shareBtnGradient: { padding: 18, alignItems: 'center' },
  shareBtnText: { fontFamily: FontFamily.headline, fontSize: 14, color: '#000', letterSpacing: 0.5 },
});
