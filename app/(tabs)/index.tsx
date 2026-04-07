import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Animated,
  ImageBackground,
} from 'react-native';
import { router, Redirect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useWitnessStore } from '../../store/useWitnessStore';
import { Colors, FontFamily, Radius, Shadows, MoodColors, Mood } from '../../constants/tokens';
import { Entry } from '../../types';
import { EasyAccessHalo } from '../../components/EasyAccessHalo';

const QUICK_ACTIONS = [
  { icon: '📅', label: 'Archive', route: '/(tabs)/archive' },
  { icon: '📊', label: 'Patterns', route: '/(tabs)/patterns' },
  { icon: '🕊️', label: 'Grief Mode', route: '/grief-mode' },
  { icon: '✉️', label: 'Unsent Letter', route: '/unsent-letter' },
  { icon: '🧵', label: 'Memory Threads', route: '/memory-threads' },
  { icon: '🔍', label: 'Search', route: '/search' },
] as const;

const PROMPTS = [
  "What are you not saying?",
  "What happened today that you haven't told anyone?",
  "If someone could see exactly how you feel right now — what would they see?",
  "What do you wish someone had said to you today?",
  "Finish this: I keep thinking about...",
  "What's the thing you've been carrying longest?",
];

function getGreeting(isTonightMode: boolean, lastEntry: Entry | null): string {
  const hour = new Date().getHours();
  if (isTonightMode) return "it's late.";
  if (hour < 12) return "Good morning.";
  if (hour < 17) return "Good afternoon.";
  return "Good evening.";
}

function getSubGreeting(isTonightMode: boolean, lastEntry: Entry | null): string {
  if (isTonightMode) return "The world is quiet. You are safe here.";
  if (!lastEntry) return "Begin your private narrative.";
  const daysSince = Math.floor((Date.now() - lastEntry.createdAt) / (1000 * 60 * 60 * 24));
  if (daysSince === 0) return `You spoke today. It mattered.`;
  if (daysSince === 1) return `Last entry was yesterday — ${lastEntry.mood || 'recorded'}.`;
  return `Last entry was ${daysSince} days ago — ${lastEntry.mood || 'recorded'}.`;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { entries, isTonightMode, checkTonightMode, hasCompletedOnboarding } = useWitnessStore();

  if (!hasCompletedOnboarding) {
    return <Redirect href="/onboarding" />;
  }
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.15)).current;

  const lastEntry = entries.length > 0 ? entries[0] : null;
  const streakCount = calculateStreak(entries);
  const randomPrompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];

  useEffect(() => {
    checkTonightMode();
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 3000, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.25, duration: 3000, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, { toValue: 1, duration: 3000, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.15, duration: 3000, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>W</Text>
          </View>
          <Text style={styles.brandName}>The Private Narrative</Text>
        </View>
        <Pressable style={styles.tonightBtn}>
          <Text style={styles.tonightIcon}>{isTonightMode ? '🌙' : '☀️'}</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 140 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero greeting */}
        <View style={styles.heroSection}>
          <Text style={[styles.heroTitle, isTonightMode && styles.heroTitleDim]}>
            {getGreeting(isTonightMode, lastEntry)}
          </Text>
          <Text style={styles.heroSubtitle}>
            {getSubGreeting(isTonightMode, lastEntry)}
          </Text>
        </View>

        {/* Empty State / Zen Beginning */}
        {entries.length === 0 && (
          <View style={styles.zenBeginning}>
            <View style={styles.zenCircle}>
              <Animated.View style={[styles.zenGlow, { opacity: glowAnim, transform: [{ scale: pulseAnim }] }]} />
              <Text style={styles.zenIcon}>✦</Text>
            </View>
            <Text style={styles.zenTitle}>Your narrative is a blank space.</Text>
            <Text style={styles.zenText}>
              There is no pressure to be profound. Just speak what is true right now.
            </Text>
          </View>
        )}

        {/* Tonight mode prompt */}
        {isTonightMode && (
          <View style={styles.tonightPrompt}>
            <Text style={styles.tonightPromptText}>{randomPrompt}</Text>
          </View>
        )}

        {/* Quick Access grid */}
        <View style={styles.quickSection}>
          <Text style={styles.cardLabel}>Quick Access</Text>
          <View style={styles.quickGrid}>
            {QUICK_ACTIONS.map(({ icon, label, route }) => (
              <Pressable
                key={label}
                style={styles.quickTile}
                onPress={() => router.push(route as any)}
              >
                <Text style={styles.quickIcon}>{icon}</Text>
                <Text style={styles.quickLabel}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Streak */}
        {streakCount >= 3 && (
          <View style={styles.streakCard}>
            <Text style={styles.streakIcon}>🔥</Text>
            <View>
              <Text style={styles.streakCount}>{streakCount} days</Text>
              <Text style={styles.streakLabel}>You've been showing up.</Text>
            </View>
          </View>
        )}

        {/* Recent entry */}
        {lastEntry && (
          <View style={styles.recentCard}>
            <Text style={styles.cardLabel}>Last Entry</Text>
            <View style={styles.recentRow}>
              <View style={[styles.moodDotLg, { backgroundColor: lastEntry.mood ? MoodColors[lastEntry.mood as Mood] : Colors.outline }]} />
              <Text style={styles.recentMood}>{lastEntry.mood ?? 'recorded'}</Text>
              <Text style={styles.recentDuration}>{formatDuration(lastEntry.duration)}</Text>
            </View>
            {lastEntry.aiReflection && (
              <Text style={styles.recentReflection} numberOfLines={2}>
                {lastEntry.aiReflection}
              </Text>
            )}
            <View style={styles.recentFooter}>
              <View style={styles.privacyBadge}>
                <Text style={styles.privacyIcon}>🛡️</Text>
                <Text style={styles.privacyText}>Private</Text>
              </View>
            </View>
          </View>
        )}

        {/* Quiet quote (tonight mode only) */}
        {isTonightMode && (
          <View style={styles.quoteCard}>
            <Text style={styles.quoteText}>
              "The night is a room without walls, where the truth speaks loudest."
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Easy Access Halo */}
      <EasyAccessHalo />
    </View>
  );
}

function calculateStreak(entries: Entry[]): number {
  if (entries.length === 0) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  let checkDate = new Date(today);

  for (let i = 0; i <= 365; i++) {
    const hasEntry = entries.some((e) => {
      const d = new Date(e.createdAt);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === checkDate.getTime();
    });
    if (!hasEntry) break;
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }
  return streak;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: FontFamily.headline,
    fontSize: 14,
    color: Colors.primary,
  },
  brandName: {
    fontFamily: FontFamily.headline,
    fontSize: 16,
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  tonightBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tonightIcon: {
    fontSize: 18,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  heroSection: {
    marginBottom: 48,
  },
  heroTitle: {
    fontFamily: FontFamily.headlineXBold,
    fontSize: 52,
    color: Colors.onSurface,
    letterSpacing: -1.5,
    lineHeight: 56,
    opacity: 0.9,
  },
  heroTitleDim: {
    opacity: 0.7,
    color: Colors.onSurfaceVariant,
  },
  heroSubtitle: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 16,
    color: Colors.onSurfaceVariant,
    marginTop: 12,
    lineHeight: 24,
  },
  recordSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  recordGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    filter: undefined,
  },
  recordButton: {
    width: 180,
    height: 180,
    borderRadius: Radius.full,
    overflow: 'hidden',
    ...Shadows.amberAura,
  },
  recordGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  recordIcon: {
    fontSize: 44,
  },
  recordLabel: {
    fontFamily: FontFamily.headlineXBold,
    fontSize: 13,
    color: Colors.onPrimary,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  tonightPrompt: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.lg,
    padding: 20,
    marginBottom: 24,
  },
  tonightPromptText: {
    fontFamily: FontFamily.headline,
    fontSize: 18,
    color: Colors.onSurface,
    lineHeight: 26,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  quickSection: {
    marginBottom: 16,
    gap: 12,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickTile: {
    width: '47%',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.xl,
    padding: 20,
    gap: 8,
  },
  quickIcon: {
    fontSize: 28,
  },
  quickLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 13,
    color: Colors.onSurface,
  },
  cardLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 9,
    color: Colors.secondary,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  streakCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.lg,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  streakIcon: { fontSize: 28 },
  streakCount: {
    fontFamily: FontFamily.headline,
    fontSize: 20,
    color: Colors.primary,
  },
  streakLabel: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  recentCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.lg,
    padding: 20,
    marginBottom: 16,
    gap: 8,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moodDotLg: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  recentMood: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    color: Colors.onSurface,
    flex: 1,
    textTransform: 'capitalize',
  },
  recentDuration: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.tertiary,
  },
  recentReflection: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    lineHeight: 20,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  quoteCard: {
    backgroundColor: Colors.surfaceContainer + '4D',
    borderRadius: Radius.lg,
    padding: 24,
    marginTop: 8,
  },
  quoteText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.tertiary,
    fontStyle: 'italic',
    lineHeight: 22,
    textAlign: 'center',
  },
  zenBeginning: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 20,
  },
  zenCircle: {
    width: 120,
    height: 120,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.amberAura,
  },
  zenGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
  },
  zenIcon: {
    fontSize: 40,
    color: Colors.primary,
  },
  zenTitle: {
    fontFamily: FontFamily.headline,
    fontSize: 22,
    color: Colors.onSurface,
    textAlign: 'center',
  },
  zenText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 40,
    opacity: 0.7,
  },
  recentFooter: {
    marginTop: 10,
    flexDirection: 'row',
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainerHighest + '44',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  privacyIcon: {
    fontSize: 10,
    opacity: 0.8,
  },
  privacyText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 9,
    color: Colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
