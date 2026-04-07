import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useWitnessStore } from '../../store/useWitnessStore';
import { Colors, FontFamily, Radius, MoodColors, Mood } from '../../constants/tokens';

const { width: SCREEN_W } = Dimensions.get('window');

const MOOD_EMOJIS: Record<string, string> = {
  heavy: '🌑', hopeful: '🌱', angry: '🔥', calm: '🌊',
  confused: '🌀', numb: '❄️', grateful: '✨',
};

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function PatternsScreen() {
  const insets = useSafeAreaInsets();
  const { entries } = useWitnessStore();

  const moodCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    entries.forEach((e) => {
      if (e.mood) counts[e.mood] = (counts[e.mood] || 0) + 1;
    });
    return counts;
  }, [entries]);

  const totalEntries = entries.length;
  const totalDuration = entries.reduce((sum, e) => sum + e.duration, 0);
  const avgDuration = totalEntries > 0 ? Math.round(totalDuration / totalEntries) : 0;

  const mostCommonMood = useMemo(() => {
    let max = 0, best = 'N/A';
    Object.entries(moodCounts).forEach(([m, c]) => { if (c > max) { max = c; best = m; } });
    return best;
  }, [moodCounts]);

  const heatmapDays = useMemo(() => buildHeatmap(entries), [entries]);

  const dayPatterns = useMemo(() => buildDayPatterns(entries), [entries]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Patterns</Text>
        <Pressable style={styles.rewindBtn} onPress={() => router.push('/yearly-rewind')}>
          <Text style={styles.rewindBtnText}>🎞 Yearly Rewind</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 140 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats cards */}
        <View style={styles.statsRow}>
          <StatCard label="Total entries" value={`${totalEntries}`} />
          <StatCard label="Avg duration" value={formatDuration(avgDuration)} />
          <StatCard label="Most felt" value={mostCommonMood !== 'N/A' ? `${MOOD_EMOJIS[mostCommonMood] || ''} ${mostCommonMood}` : '—'} />
        </View>

        {/* Mood distribution */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Mood Distribution</Text>
          {Object.entries(moodCounts).length === 0 ? (
            <Text style={styles.emptyHint}>No entries yet — your patterns will emerge here.</Text>
          ) : (
            Object.entries(moodCounts).sort((a, b) => b[1] - a[1]).map(([mood, count]) => (
              <View key={mood} style={styles.moodBar}>
                <Text style={styles.moodBarLabel}>
                  {MOOD_EMOJIS[mood] || ''} {mood}
                </Text>
                <View style={styles.moodBarTrack}>
                  <View
                    style={[
                      styles.moodBarFill,
                      {
                        width: `${(count / Math.max(...Object.values(moodCounts))) * 100}%`,
                        backgroundColor: MoodColors[mood as Mood] || Colors.outline,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.moodBarCount}>{count}</Text>
              </View>
            ))
          )}
        </View>

        {/* Activity heatmap */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Activity Heatmap</Text>
          <Text style={styles.cardHint}>Consistency without shame for the gaps.</Text>
          <View style={styles.heatmap}>
            {heatmapDays.map((day, i) => (
              <View
                key={i}
                style={[
                  styles.heatmapCell,
                  { backgroundColor: day.count > 0 ? Colors.primary + '99' : Colors.surfaceContainerHigh },
                  day.isToday && styles.heatmapToday,
                ]}
              />
            ))}
          </View>
          <View style={styles.heatmapLegend}>
            <Text style={styles.heatmapLegendText}>Less</Text>
            <View style={[styles.heatmapCell, { backgroundColor: Colors.surfaceContainerHigh }]} />
            <View style={[styles.heatmapCell, { backgroundColor: Colors.primary + '66' }]} />
            <View style={[styles.heatmapCell, { backgroundColor: Colors.primary }]} />
            <Text style={styles.heatmapLegendText}>More</Text>
          </View>
        </View>

        {/* Weekly pattern */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Weekly Rhythm</Text>
          <View style={styles.weekPattern}>
            {DAYS_OF_WEEK.map((day) => {
              const count = dayPatterns[day] || 0;
              const max = Math.max(...Object.values(dayPatterns), 1);
              return (
                <View key={day} style={styles.weekCol}>
                  <View style={styles.weekBarTrack}>
                    <View
                      style={[
                        styles.weekBarFill,
                        { height: `${(count / max) * 100}%`, backgroundColor: Colors.secondary },
                      ]}
                    />
                  </View>
                  <Text style={styles.weekDayLabel}>{day.slice(0, 1)}</Text>
                </View>
              );
            })}
          </View>
          {Object.keys(dayPatterns).length > 0 && (
            <Text style={styles.patternInsight}>
              You record most on {Object.entries(dayPatterns).sort((a,b) => b[1]-a[1])[0]?.[0] || 'N/A'}.
            </Text>
          )}
        </View>

        {/* Memory threads CTA */}
        <Pressable style={styles.threadsCta} onPress={() => router.push('/memory-threads')}>
          <Text style={styles.threadsCtaIcon}>🧵</Text>
          <View style={styles.threadsCtaText}>
            <Text style={styles.threadsCtaTitle}>Memory Threads</Text>
            <Text style={styles.threadsCtaSub}>AI clusters of your emotional patterns across time</Text>
          </View>
          <Text style={styles.threadsCtaArrow}>›</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function buildHeatmap(entries: any[]) {
  const days = [];
  const today = new Date();
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const count = entries.filter((e: any) => {
      const ed = new Date(e.createdAt);
      ed.setHours(0, 0, 0, 0);
      return ed.getTime() === d.getTime();
    }).length;
    days.push({ date: d, count, isToday: i === 0 });
  }
  return days;
}

function buildDayPatterns(entries: any[]) {
  const patterns: Record<string, number> = {};
  entries.forEach((e) => {
    const day = DAYS_OF_WEEK[new Date(e.createdAt).getDay()];
    patterns[day] = (patterns[day] || 0) + 1;
  });
  return patterns;
}

function formatDuration(s: number) {
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${(s % 60).toString().padStart(2, '0')}s`;
}

const CELL_SIZE = Math.floor((SCREEN_W - 48 - 60) / 13);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 20,
  },
  title: { fontFamily: FontFamily.headlineXBold, fontSize: 36, color: Colors.onSurface, letterSpacing: -1 },
  rewindBtn: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Radius.full, paddingHorizontal: 16, paddingVertical: 8,
  },
  rewindBtnText: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.primary },
  content: { paddingHorizontal: 24, gap: 16 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.lg, padding: 16, gap: 4,
  },
  statValue: { fontFamily: FontFamily.headline, fontSize: 22, color: Colors.onSurface },
  statLabel: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.onSurfaceVariant },
  card: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.xl, padding: 20, gap: 12,
  },
  cardLabel: {
    fontFamily: FontFamily.bodySemiBold, fontSize: 10,
    color: Colors.primary, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.8,
  },
  cardHint: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.tertiary, opacity: 0.6 },
  emptyHint: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.onSurfaceVariant, fontStyle: 'italic' },
  moodBar: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  moodBarLabel: {
    fontFamily: FontFamily.bodyMedium, fontSize: 12,
    color: Colors.onSurfaceVariant, width: 90, textTransform: 'capitalize',
  },
  moodBarTrack: { flex: 1, height: 6, backgroundColor: Colors.surfaceContainerHigh, borderRadius: 3, overflow: 'hidden' },
  moodBarFill: { height: '100%', borderRadius: 3 },
  moodBarCount: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.onSurfaceVariant, width: 24, textAlign: 'right' },
  heatmap: { flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  heatmapCell: {
    width: CELL_SIZE, height: CELL_SIZE, borderRadius: 2,
  },
  heatmapToday: { borderWidth: 1, borderColor: Colors.primary },
  heatmapLegend: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'flex-end' },
  heatmapLegendText: { fontFamily: FontFamily.bodyRegular, fontSize: 10, color: Colors.outline },
  weekPattern: { flexDirection: 'row', gap: 6, height: 80, alignItems: 'flex-end' },
  weekCol: { flex: 1, alignItems: 'center', gap: 4 },
  weekBarTrack: { flex: 1, width: '100%', backgroundColor: Colors.surfaceContainerHigh, borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end' },
  weekBarFill: { width: '100%', borderRadius: 4, minHeight: 4 },
  weekDayLabel: { fontFamily: FontFamily.bodyRegular, fontSize: 10, color: Colors.outline },
  patternInsight: {
    fontFamily: FontFamily.bodyRegular, fontSize: 13,
    color: Colors.onSurfaceVariant, fontStyle: 'italic', lineHeight: 20,
  },
  threadsCta: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.xl, padding: 20,
    flexDirection: 'row', alignItems: 'center', gap: 16,
  },
  threadsCtaIcon: { fontSize: 28 },
  threadsCtaText: { flex: 1, gap: 4 },
  threadsCtaTitle: { fontFamily: FontFamily.headline, fontSize: 16, color: Colors.onSurface },
  threadsCtaSub: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.onSurfaceVariant, lineHeight: 18 },
  threadsCtaArrow: { fontFamily: FontFamily.headline, fontSize: 24, color: Colors.onSurfaceVariant, opacity: 0.4 },
});
