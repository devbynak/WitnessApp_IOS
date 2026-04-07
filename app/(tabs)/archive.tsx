import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWitnessStore } from '../../store/useWitnessStore';
import { Colors, FontFamily, Radius, MoodColors, Mood } from '../../constants/tokens';
import { Entry } from '../../types';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MOODS: Mood[] = ['heavy', 'hopeful', 'angry', 'calm', 'confused', 'numb', 'grateful'];

const MOOD_EMOJIS: Record<Mood, string> = {
  heavy: '🌑', hopeful: '🌱', angry: '🔥', calm: '🌊',
  confused: '🌀', numb: '❄️', grateful: '✨',
};

export default function ArchiveScreen() {
  const insets = useSafeAreaInsets();
  const { entries } = useWitnessStore();
  const [search, setSearch] = useState('');
  const [moodFilter, setMoodFilter] = useState<Mood | 'all'>('all');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [filterMode, setFilterMode] = useState<'all' | 'unsent' | 'grief'>('all');

  const filteredEntries = useMemo(() => {
    return entries
      .filter((e) => {
        if (moodFilter !== 'all' && e.mood !== moodFilter) return false;
        if (filterMode === 'unsent' && !e.isUnsentLetter) return false;
        if (filterMode === 'grief' && !e.isGriefMode) return false;
        if (search && e.transcript && !e.transcript.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      });
  }, [entries, moodFilter, filterMode, search]);

  const calendarDays = useMemo(() => buildCalendarDays(currentMonth, entries), [currentMonth, entries]);

  function prevMonth() {
    setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }
  function nextMonth() {
    setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }
  function goToToday() {
    const now = new Date();
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
  }
  const isCurrentMonth = currentMonth.getFullYear() === new Date().getFullYear() && currentMonth.getMonth() === new Date().getMonth();

  const monthLabel = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar} />
        <Text style={styles.brandName}>The Private Narrative</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 140 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Editorial title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Archive</Text>
          <Text style={styles.subtitle}>Revisiting the whispers of {monthLabel}.</Text>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search transcripts"
            placeholderTextColor={Colors.outline}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Calendar */}
        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <Text style={styles.calendarMonth}>{monthLabel}</Text>
            <View style={styles.calendarNav}>
              {!isCurrentMonth && (
                <Pressable style={styles.todayBtn} onPress={goToToday}>
                  <Text style={styles.todayBtnText}>Today</Text>
                </Pressable>
              )}
              <Pressable style={styles.navBtn} onPress={prevMonth}>
                <Text style={styles.navBtnText}>‹</Text>
              </Pressable>
              <Pressable style={styles.navBtn} onPress={nextMonth}>
                <Text style={styles.navBtnText}>›</Text>
              </Pressable>
            </View>
          </View>

          {/* Day headers */}
          <View style={styles.calendarGrid}>
            {DAYS.map((d, i) => (
              <Text key={i} style={styles.calendarDayLabel}>{d}</Text>
            ))}
            {/* Days */}
            {calendarDays.map((day, i) => (
              <View key={i} style={[styles.calendarDay, day.isToday && styles.calendarDayToday]}>
                <Text style={[styles.calendarDayNum, day.isToday && styles.calendarDayNumToday, !day.inMonth && styles.dimmed]}>
                  {day.date}
                </Text>
                {day.mood ? (
                  <View style={[styles.calendarDot, { backgroundColor: MoodColors[day.mood as Mood] }]} />
                ) : (
                  <View style={styles.calendarDotEmpty} />
                )}
              </View>
            ))}
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            {(['heavy', 'hopeful', 'angry', 'calm'] as Mood[]).map((m) => (
              <View key={m} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: MoodColors[m] }]} />
                <Text style={styles.legendLabel}>{m}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Category filter pills */}
        <View style={styles.categoryRow}>
          {(['all', 'unsent', 'grief'] as const).map((f) => (
            <Pressable
              key={f}
              style={[styles.categoryChip, filterMode === f && styles.categoryChipActive]}
              onPress={() => setFilterMode(f)}
            >
              <Text style={[styles.categoryChipText, filterMode === f && styles.categoryChipTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Mood filter pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <Pressable
            style={[styles.filterChip, moodFilter === 'all' && styles.filterChipActive]}
            onPress={() => setMoodFilter('all')}
          >
            <Text style={[styles.filterChipText, moodFilter === 'all' && styles.filterChipTextActive]}>All</Text>
          </Pressable>
          {MOODS.map((m) => (
            <Pressable
              key={m}
              style={[styles.filterChip, moodFilter === m && { backgroundColor: MoodColors[m] + '33', borderColor: MoodColors[m] }]}
              onPress={() => setMoodFilter(m === moodFilter ? 'all' : m)}
            >
              <Text style={styles.filterChipText}>{MOOD_EMOJIS[m]} {m}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Entry list */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Reflections</Text>
          <View style={styles.sectionLine} />
        </View>

        {filteredEntries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🌙</Text>
            <Text style={styles.emptyText}>No entries yet. Your first word is waiting.</Text>
          </View>
        ) : (
          filteredEntries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function EntryCard({ entry }: { entry: Entry }) {
  const { deleteEntry } = useWitnessStore();
  const swipeRef = useRef<Swipeable>(null);
  const date = new Date(entry.createdAt);
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  function handleDelete() {
    swipeRef.current?.close();
    Alert.alert(
      'Delete this entry?',
      'This recording will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteEntry(entry.id) },
      ]
    );
  }

  const renderRightActions = () => (
    <Pressable style={styles.swipeDelete} onPress={handleDelete}>
      <Text style={styles.swipeDeleteIcon}>🗑</Text>
      <Text style={styles.swipeDeleteText}>Delete</Text>
    </Pressable>
  );

  return (
    <Swipeable ref={swipeRef} renderRightActions={renderRightActions} rightThreshold={60}>
      <Pressable
        style={styles.entryCard}
        onPress={() => router.push({ pathname: '/playback', params: { entryId: entry.id } })}
      >
        <View style={styles.entryThumb}>
          <Text style={styles.entryThumbIcon}>
            {entry.isUnsentLetter ? '✉️' : entry.isGriefMode ? '🕯️' : entry.isVoiceOnly ? '🎙️' : '🎬'}
          </Text>
        </View>
        <View style={styles.entryContent}>
          <View style={styles.entryMeta}>
            <Text style={styles.entryTime}>
              {entry.isUnsentLetter ? `To ${entry.recipientName || 'Unsent'}` : `${dateStr} · ${timeStr}`}
            </Text>
            {entry.mood && (
              <View style={[styles.entryMoodDot, { backgroundColor: MoodColors[entry.mood as Mood] }]} />
            )}
          </View>
          <Text style={styles.entryDuration}>
            {entry.isGriefMode && '🌙 Grief Sanctuary · '}{formatDuration(entry.duration)}
          </Text>
          {entry.aiReflection && (
            <Text style={styles.entryReflection} numberOfLines={2}>{entry.aiReflection}</Text>
          )}
        </View>
      </Pressable>
    </Swipeable>
  );
}

function buildCalendarDays(month: Date, entries: Entry[]) {
  const year = month.getFullYear();
  const m = month.getMonth();
  const firstDay = new Date(year, m, 1).getDay();
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const prevMonthDays = new Date(year, m, 0).getDate();
  const today = new Date();

  const days: Array<{date: number; inMonth: boolean; isToday: boolean; mood: string | null}> = [];

  // Previous month fill
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({ date: prevMonthDays - i, inMonth: false, isToday: false, mood: null });
  }

  // Create a map for faster lookup (O(N) instead of O(N*M))
  const entryMap = entries.reduce((acc, e) => {
    const ed = new Date(e.createdAt);
    const key = `${ed.getFullYear()}-${ed.getMonth()}-${ed.getDate()}`; // matches lookup key below
    if (!acc[key]) acc[key] = e;
    return acc;
  }, {} as Record<string, Entry>);

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = today.getFullYear() === year && today.getMonth() === m && today.getDate() === d;
    const key = `${year}-${m}-${d}`;
    const entry = entryMap[key];
    days.push({ date: d, inMonth: true, isToday, mood: entry?.mood ?? null });
  }

  // Next month fill (to complete grid)
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    days.push({ date: d, inMonth: false, isToday: false, mood: null });
  }

  return days;
}

function formatDuration(s: number) {
  return `${Math.floor(s / 60)}m ${(s % 60).toString().padStart(2, '0')}s`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 16,
  },
  avatar: { width: 40, height: 40, borderRadius: Radius.full, backgroundColor: Colors.surfaceContainerHigh },
  brandName: { fontFamily: FontFamily.headline, fontSize: 16, color: Colors.primary },
  content: { paddingHorizontal: 24, paddingTop: 8, gap: 20 },
  titleSection: { gap: 4 },
  title: { fontFamily: FontFamily.headlineXBold, fontSize: 52, color: Colors.onSurface, letterSpacing: -1.5, lineHeight: 56 },
  subtitle: { fontFamily: FontFamily.bodyRegular, fontSize: 16, color: Colors.tertiary, opacity: 0.8 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl, paddingHorizontal: 20, paddingVertical: 14,
  },
  searchIcon: { fontSize: 16, opacity: 0.5 },
  searchInput: {
    flex: 1, fontFamily: FontFamily.bodyRegular, fontSize: 15,
    color: Colors.onSurface,
  },
  calendarCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.xl, padding: 24, gap: 16,
  },
  calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  calendarMonth: { fontFamily: FontFamily.headline, fontSize: 18, color: Colors.onSurface },
  calendarNav: { flexDirection: 'row', gap: 4 },
  navBtn: {
    width: 36, height: 36, borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center', justifyContent: 'center',
  },
  navBtnText: { fontFamily: FontFamily.headline, fontSize: 20, color: Colors.onSurface },
  todayBtn: {
    height: 36, paddingHorizontal: 12, borderRadius: Radius.full,
    backgroundColor: Colors.primary + '22', borderWidth: 1, borderColor: Colors.primary + '55',
    alignItems: 'center', justifyContent: 'center',
  },
  todayBtnText: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.primary },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarDayLabel: {
    width: '14.28%', textAlign: 'center',
    fontFamily: FontFamily.bodyMedium, fontSize: 11,
    color: Colors.outline, textTransform: 'uppercase',
    paddingVertical: 8,
  },
  calendarDay: {
    width: '14.28%', alignItems: 'center', paddingVertical: 8, gap: 4,
  },
  calendarDayToday: {
    backgroundColor: Colors.surfaceContainerHigh, borderRadius: 8,
  },
  calendarDayNum: {
    fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.onSurface,
  },
  calendarDayNumToday: {
    fontFamily: FontFamily.headline, color: Colors.primary,
  },
  dimmed: { opacity: 0.2 },
  calendarDot: { width: 6, height: 6, borderRadius: 3 },
  calendarDotEmpty: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'transparent' },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: {
    fontFamily: FontFamily.bodyRegular, fontSize: 10,
    color: Colors.outline, textTransform: 'uppercase', letterSpacing: 1,
  },
  categoryRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  categoryChip: {
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: Colors.surfaceContainerHighest + '44',
    borderRadius: Radius.lg, borderWidth: 1, borderColor: 'transparent',
  },
  categoryChipActive: {
    backgroundColor: Colors.secondary + '22',
    borderColor: Colors.secondary,
  },
  categoryChipText: {
    fontFamily: FontFamily.bodyMedium, fontSize: 13,
    color: Colors.onSurfaceVariant,
  },
  categoryChipTextActive: {
    color: Colors.secondary, fontFamily: FontFamily.bodySemiBold,
  },
  filterScroll: { marginHorizontal: -24, paddingHorizontal: 24, marginBottom: 8 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 8, marginRight: 8,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Radius.full, borderWidth: 1, borderColor: 'transparent',
  },
  filterChipActive: { backgroundColor: Colors.primary + '22', borderColor: Colors.primary },
  filterChipText: {
    fontFamily: FontFamily.bodyMedium, fontSize: 12,
    color: Colors.onSurfaceVariant, textTransform: 'capitalize',
  },
  filterChipTextActive: { color: Colors.primary },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  sectionTitle: { fontFamily: FontFamily.headline, fontSize: 16, color: Colors.onSurface },
  sectionLine: { flex: 1, height: 1, backgroundColor: Colors.outline + '1A' },
  emptyState: { alignItems: 'center', gap: 16, paddingVertical: 48 },
  emptyIcon: { fontSize: 48 },
  emptyText: {
    fontFamily: FontFamily.bodyRegular, fontSize: 15,
    color: Colors.onSurfaceVariant, textAlign: 'center', lineHeight: 24,
  },
  swipeDelete: {
    backgroundColor: '#e53e3e',
    borderRadius: Radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginLeft: 8,
    gap: 4,
  },
  swipeDeleteIcon: { fontSize: 20 },
  swipeDeleteText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 11,
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  entryCard: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radius.xl, padding: 20,
    flexDirection: 'row', gap: 16,
  },
  entryThumb: {
    width: 80, height: 80, borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  entryThumbIcon: { fontSize: 28 },
  entryContent: { flex: 1, gap: 4 },
  entryMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  entryTime: {
    fontFamily: FontFamily.bodyRegular, fontSize: 10,
    color: Colors.outline, textTransform: 'uppercase', letterSpacing: 0.8,
  },
  entryMoodDot: { width: 8, height: 8, borderRadius: 4 },
  entryDuration: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.onSurfaceVariant },
  entryReflection: {
    fontFamily: FontFamily.bodyRegular, fontSize: 13,
    color: Colors.onSurfaceVariant, lineHeight: 20, opacity: 0.8,
  },
});
