import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, TextInput, FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWitnessStore } from '../store/useWitnessStore';
import { Colors, FontFamily, Radius, MoodColors, Mood } from '../constants/tokens';

const MOOD_EMOJIS: Record<string, string> = {
  heavy: '🌑', hopeful: '🌱', angry: '🔥', calm: '🌊',
  confused: '🌀', numb: '❄️', grateful: '✨',
};

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const { entries } = useWitnessStore();
  const [query, setQuery] = useState('');

  const results = query.trim().length > 0
    ? entries.filter((e) =>
        (e.transcript && e.transcript.toLowerCase().includes(query.toLowerCase())) ||
        (e.aiReflection && e.aiReflection.toLowerCase().includes(query.toLowerCase()))
      )
    : [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Search</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search your entries..."
          placeholderTextColor={Colors.outline}
          value={query}
          onChangeText={setQuery}
          autoFocus
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')}>
            <Text style={styles.clearBtn}>✕</Text>
          </Pressable>
        )}
      </View>

      {query.trim() === '' ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔎</Text>
          <Text style={styles.emptyTitle}>Search your transcripts</Text>
          <Text style={styles.emptyText}>
            Find every moment you said a word — "alone", "scared", "grateful". Patterns you didn't know existed.
          </Text>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🌑</Text>
          <Text style={styles.emptyTitle}>No matches found</Text>
          <Text style={styles.emptyText}>Try a different word. The transcripts are only as complete as the AI.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.results, { paddingBottom: 40 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.resultsCount}>
            {results.length} {results.length === 1 ? 'entry' : 'entries'} found
          </Text>
          {results.map((entry) => {
            const date = new Date(entry.createdAt);
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

            // Find matching snippet in transcript
            let snippet = entry.aiReflection || entry.transcript || '';
            if (entry.transcript) {
              const idx = entry.transcript.toLowerCase().indexOf(query.toLowerCase());
              if (idx !== -1) {
                const start = Math.max(0, idx - 40);
                const end = Math.min(entry.transcript.length, idx + query.length + 60);
                snippet = (start > 0 ? '...' : '') + entry.transcript.slice(start, end) + (end < entry.transcript.length ? '...' : '');
              }
            }

            return (
              <Pressable key={entry.id} style={styles.resultCard} onPress={() => router.push(`/playback?entryId=${entry.id}`)}>
                <View style={styles.resultMeta}>
                  <Text style={styles.resultDate}>{dateStr}</Text>
                  {entry.mood && (
                    <View style={styles.moodTag}>
                      <View style={[styles.moodDot, { backgroundColor: MoodColors[entry.mood as Mood] }]} />
                      <Text style={styles.moodText}>{entry.mood}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.resultSnippet}>
                  {highlightQuery(snippet, query)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

function highlightQuery(text: string, query: string) {
  if (!query.trim()) return <Text>{text}</Text>;

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return (
    <Text>
      {parts.map((part, i) => (
        <Text
          key={i}
          style={
            part.toLowerCase() === query.toLowerCase()
              ? { color: Colors.primary, fontFamily: FontFamily.bodySemiBold }
              : {}
          }
        >
          {part}
        </Text>
      ))}
    </Text>
  );
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
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surfaceContainerLowest,
    marginHorizontal: 24, borderRadius: Radius.xl,
    paddingHorizontal: 20, paddingVertical: 14, marginBottom: 16,
  },
  searchIcon: { fontSize: 16, opacity: 0.5 },
  searchInput: {
    flex: 1, fontFamily: FontFamily.bodyRegular, fontSize: 16,
    color: Colors.onSurface,
  },
  clearBtn: { fontSize: 14, color: Colors.outline, padding: 4 },
  emptyState: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 16, paddingHorizontal: 40,
  },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontFamily: FontFamily.headline, fontSize: 20, color: Colors.onSurface, textAlign: 'center' },
  emptyText: {
    fontFamily: FontFamily.bodyRegular, fontSize: 14,
    color: Colors.onSurfaceVariant, textAlign: 'center', lineHeight: 22,
  },
  results: { paddingHorizontal: 24, gap: 12 },
  resultsCount: {
    fontFamily: FontFamily.bodyMedium, fontSize: 11,
    color: Colors.tertiary, textTransform: 'uppercase', letterSpacing: 1,
    marginBottom: 8,
  },
  resultCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.xl, padding: 20, gap: 10,
  },
  resultMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resultDate: {
    fontFamily: FontFamily.bodyRegular, fontSize: 11,
    color: Colors.outline, textTransform: 'uppercase', letterSpacing: 0.8,
  },
  moodTag: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  moodDot: { width: 8, height: 8, borderRadius: 4 },
  moodText: {
    fontFamily: FontFamily.bodyMedium, fontSize: 11,
    color: Colors.onSurfaceVariant, textTransform: 'capitalize',
  },
  resultSnippet: {
    fontFamily: FontFamily.bodyRegular, fontSize: 14,
    color: Colors.onSurfaceVariant, lineHeight: 22,
  },
});
