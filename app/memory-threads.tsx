import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWitnessStore } from '../store/useWitnessStore';
import { Colors, FontFamily, Radius, MoodColors, Mood } from '../constants/tokens';
import { Entry } from '../types';

const MOOD_EMOJIS: Record<string, string> = {
  heavy: '🌑', hopeful: '🌱', angry: '🔥', calm: '🌊',
  confused: '🌀', numb: '❄️', grateful: '✨',
};

export default function MemoryThreadsScreen() {
  const insets = useSafeAreaInsets();
  const { entries } = useWitnessStore();

  // Group similar moods into threads
  const threads = groupIntoThreads(entries);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Memory Threads</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          AI clusters of your emotional evolution, connected across time.
        </Text>

        {threads.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🧵</Text>
            <Text style={styles.emptyTitle}>Your threads are forming.</Text>
            <Text style={styles.emptyText}>
              After a few entries, the AI will begin connecting your emotional patterns across time. Come back soon.
            </Text>
          </View>
        ) : (
          threads.map((thread, i) => (
            <View key={i} style={styles.threadCard}>
              <View style={styles.threadHeader}>
                <View style={[styles.threadMoodDot, { backgroundColor: MoodColors[thread.mood as Mood] || Colors.outline }]} />
                <Text style={styles.threadMood}>
                  {MOOD_EMOJIS[thread.mood] || ''} {thread.mood}
                </Text>
                <Text style={styles.threadCount}>{thread.entries.length} entries</Text>
              </View>
              <Text style={styles.threadInsight}>{thread.insight}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.entryScroll}>
                {thread.entries.map((entry, j) => (
                  <Pressable key={j} style={styles.entryPill} onPress={() => router.push(`/playback?entryId=${entry.id}`)}>
                    <Text style={styles.entryPillDate}>
                      {new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                    {entry.aiReflection && (
                      <Text style={styles.entryPillReflection} numberOfLines={2}>
                        {entry.aiReflection}
                      </Text>
                    )}
                  </Pressable>
                ))}
              </ScrollView>
              <Pressable onPress={() => {
                // Pick a random entry from this thread and open playback
                const pool = thread.entries;
                const picked = pool[Math.floor(Math.random() * pool.length)];
                if (picked) {
                  router.push(`/playback?entryId=${picked.id}`);
                }
              }}>
                <Text style={styles.talkToPast}>💬 Talk to past me</Text>
              </Pressable>
            </View>
          ))
        )}

        {/* Past self prompt */}
        {entries.length > 0 && (
          <View style={styles.pastSelfCard}>
            <Text style={styles.pastSelfTitle}>You've been here before.</Text>
            <Text style={styles.pastSelfText}>
              When you record a heavy entry, I'll surface an old moment that matches your feeling from months ago. You can watch your past self — and realize you survived it.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function groupIntoThreads(entries: Entry[]) {
  const moodGroups: Record<string, any[]> = {};
  entries.forEach((e) => {
    if (e.mood) {
      if (!moodGroups[e.mood]) moodGroups[e.mood] = [];
      moodGroups[e.mood].push(e);
    }
  });

  const insights: Record<string, string> = {
    heavy: "You've carried this weight before. Each time, you found a way through.",
    hopeful: "Hope keeps returning to you. Notice how often it comes after the dark.",
    angry: "Your anger has been honest. It's pointed at real things.",
    calm: "Stillness isn't emptiness. You've found your footing more than you know.",
    confused: "You sit with uncertainty better than you think.",
    numb: "Sometimes silence is the only honest answer.",
    grateful: "You notice the small things. That's not small.",
  };

  return Object.entries(moodGroups)
    .filter(([_, es]) => es.length >= 2)
    .map(([mood, es]) => ({
      mood,
      entries: es,
      insight: insights[mood] || "A pattern is emerging here.",
    }));
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 16,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { fontFamily: FontFamily.headline, fontSize: 24, color: Colors.onSurface },
  title: { fontFamily: FontFamily.headline, fontSize: 18, color: Colors.primary },
  content: { paddingHorizontal: 24, paddingTop: 8, gap: 20 },
  subtitle: {
    fontFamily: FontFamily.bodyRegular, fontSize: 15,
    color: Colors.onSurfaceVariant, lineHeight: 24,
  },
  emptyState: { alignItems: 'center', gap: 16, paddingVertical: 60 },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontFamily: FontFamily.headline, fontSize: 20, color: Colors.onSurface },
  emptyText: {
    fontFamily: FontFamily.bodyRegular, fontSize: 14,
    color: Colors.onSurfaceVariant, textAlign: 'center', lineHeight: 22,
  },
  threadCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.xl, padding: 20, gap: 12,
  },
  threadHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  threadMoodDot: { width: 12, height: 12, borderRadius: 6 },
  threadMood: {
    fontFamily: FontFamily.headline, fontSize: 16, color: Colors.onSurface,
    textTransform: 'capitalize', flex: 1,
  },
  threadCount: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.tertiary },
  threadInsight: {
    fontFamily: FontFamily.bodyRegular, fontSize: 14,
    color: Colors.onSurfaceVariant, lineHeight: 22, fontStyle: 'italic',
  },
  entryScroll: { marginHorizontal: -4 },
  entryPill: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Radius.lg, padding: 12,
    marginHorizontal: 4, width: 160, gap: 4,
  },
  entryPillDate: {
    fontFamily: FontFamily.bodyMedium, fontSize: 10,
    color: Colors.primary, textTransform: 'uppercase', letterSpacing: 1,
  },
  entryPillReflection: {
    fontFamily: FontFamily.bodyRegular, fontSize: 12,
    color: Colors.onSurfaceVariant, lineHeight: 18,
  },
  talkToPast: {
    fontFamily: FontFamily.bodyMedium, fontSize: 13,
    color: Colors.secondary, letterSpacing: 0.5,
  },
  pastSelfCard: {
    backgroundColor: Colors.primaryContainer + '33',
    borderRadius: Radius.xl, padding: 24, gap: 10,
  },
  pastSelfTitle: { fontFamily: FontFamily.headline, fontSize: 18, color: Colors.primary },
  pastSelfText: {
    fontFamily: FontFamily.bodyRegular, fontSize: 14,
    color: Colors.onSurfaceVariant, lineHeight: 22,
  },
});
