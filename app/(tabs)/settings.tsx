import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, Switch, Alert,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWitnessStore } from '../../store/useWitnessStore';
import { Colors, FontFamily, Radius } from '../../constants/tokens';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { settings, updateSettings, deleteAllEntries, entries } = useWitnessStore();
  const [deleteStep, setDeleteStep] = useState(0); // 0=idle, 1=confirm1, 2=confirm2

  const handleBiometricToggle = async (val: boolean) => {
    if (val) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to enable biometric lock',
      });
      if (!result.success) return;
    }
    updateSettings({ biometricEnabled: val });
  };

  const handleDeleteAll = () => {
    if (deleteStep === 0) {
      setDeleteStep(1);
      return;
    }
    if (deleteStep === 1) {
      Alert.alert(
        'This cannot be undone',
        `You will permanently lose all ${entries.length} entries. This is irreversible.`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setDeleteStep(0) },
          {
            text: 'Erase everything',
            style: 'destructive',
            onPress: () => {
              deleteAllEntries();
              setDeleteStep(0);
              Alert.alert('Done', 'Your personal narrative has been erased. It was yours, and only yours.');
            },
          },
        ]
      );
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar} />
        <Text style={styles.brandName}>Privacy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 140 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Privacy Vault</Text>
          <Text style={styles.subtitle}>
            Control your digital sanctuary. These settings ensure your private narrative remains yours alone.
          </Text>
        </View>

        {/* Security Access */}
        <SettingsSection label="Security Access">
          <SettingsRow
            icon="🫆"
            title="Biometric Lock"
            subtitle="Require Face ID or Fingerprint to open"
            right={
              <Switch
                value={settings.biometricEnabled}
                onValueChange={handleBiometricToggle}
                trackColor={{ false: Colors.surfaceVariant, true: Colors.primary }}
                thumbColor={Colors.onPrimary}
              />
            }
          />
          <SettingsRow
            icon="🧠"
            title="AI Opt-out"
            subtitle="Prevent AI from analyzing your emotional patterns"
            right={
              <Switch
                value={!settings.aiEnabled}
                onValueChange={(val) => updateSettings({ aiEnabled: !val })}
                trackColor={{ false: Colors.surfaceVariant, true: Colors.secondary }}
                thumbColor={Colors.onPrimary}
              />
            }
          />
        </SettingsSection>

        {/* Data Management */}
        <SettingsSection label="Data Management">
          <SettingsRow
            icon="📦"
            title="Export Archive"
            subtitle="Generate PDF transcript + Video compilation"
            right={<Text style={styles.chevron}>›</Text>}
            onPress={() => Alert.alert('Export', 'Export feature coming in v1.5 (Pro)')}
          />
          <View style={styles.deleteContainer}>
            <View style={styles.deleteHeader}>
              <View style={styles.deleteIconWrap}>
                <Text style={styles.deleteIcon}>🗑️</Text>
              </View>
              <View>
                <Text style={styles.deleteTitle}>Delete Everything</Text>
                <Text style={styles.deleteSubtitle}>Permanently erase all data and media</Text>
              </View>
            </View>
            <Pressable
              style={[styles.deleteBtn, deleteStep === 1 && styles.deleteBtnConfirm]}
              onPress={handleDeleteAll}
            >
              <Text style={styles.deleteBtnText}>
                {deleteStep === 0 ? 'Erase Personal Narrative' : '⚠️ Confirm — This cannot be undone'}
              </Text>
            </Pressable>
            {deleteStep === 1 && (
              <Pressable onPress={() => setDeleteStep(0)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            )}
          </View>
        </SettingsSection>

        {/* Visual Atmosphere */}
        <SettingsSection label="Visual Atmosphere">
          <View style={styles.card}>
            <SettingsRow
              icon="🌙"
              title="Tonight Mode"
              subtitle="Automated nocturnal sanctuary after 10pm"
              right={
                <Switch
                  value={settings.tonightModeEnabled}
                  onValueChange={(val) => updateSettings({ tonightModeEnabled: val })}
                  trackColor={{ false: Colors.surfaceVariant, true: Colors.primary }}
                  thumbColor={Colors.onPrimary}
                />
              }
            />
            {settings.tonightModeEnabled && (
              <View style={styles.timeRow}>
                <View style={styles.timeBlock}>
                  <Text style={styles.timeBlockLabel}>Start Time</Text>
                  <Text style={styles.timeBlockValue}>{settings.tonightModeStart}:00</Text>
                </View>
                <View style={styles.timeDivider} />
                <View style={styles.timeBlock}>
                  <Text style={styles.timeBlockLabel}>End Time</Text>
                  <Text style={styles.timeBlockValue}>{String(settings.tonightModeEnd).padStart(2, '0')}:00</Text>
                </View>
              </View>
            )}
          </View>
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection label="Notifications">
          <SettingsRow
            icon="🔔"
            title="Mood-aware Notifications"
            subtitle="A gentle message after 4+ days of silence — never daily pressure"
            right={
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={(val) => updateSettings({ notificationsEnabled: val })}
                trackColor={{ false: Colors.surfaceVariant, true: Colors.secondary }}
                thumbColor={Colors.onPrimary}
              />
            }
          />
        </SettingsSection>

        {/* Footer */}
        <Text style={styles.footer}>v1.0.0 — END-TO-END ENCRYPTED</Text>
      </ScrollView>
    </View>
  );
}

function SettingsSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

function SettingsRow({
  icon, title, subtitle, right, onPress,
}: {
  icon: string; title: string; subtitle: string;
  right?: React.ReactNode; onPress?: () => void;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.rowIcon}>
        <Text style={styles.rowIconText}>{icon}</Text>
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      {right}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 16,
  },
  avatar: { width: 32, height: 32, borderRadius: Radius.full, backgroundColor: Colors.surfaceContainerHigh },
  brandName: { fontFamily: FontFamily.headline, fontSize: 18, color: Colors.primary },
  content: { paddingHorizontal: 24, gap: 24 },
  titleSection: { gap: 8 },
  title: { fontFamily: FontFamily.headlineXBold, fontSize: 32, color: Colors.onSurface, letterSpacing: -1 },
  subtitle: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.onSurfaceVariant, lineHeight: 22 },
  section: { gap: 10 },
  sectionLabel: {
    fontFamily: FontFamily.bodySemiBold, fontSize: 9,
    color: Colors.primary, letterSpacing: 2.5, textTransform: 'uppercase', opacity: 0.8,
  },
  sectionContent: { gap: 8 },
  card: { backgroundColor: Colors.surfaceContainer, borderRadius: Radius.xl, overflow: 'hidden' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radius.xl, padding: 20,
  },
  rowIcon: {
    width: 44, height: 44, borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center', justifyContent: 'center',
  },
  rowIconText: { fontSize: 20 },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontFamily: FontFamily.headline, fontSize: 15, color: Colors.onSurface },
  rowSubtitle: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.onSurfaceVariant, lineHeight: 18 },
  chevron: { fontFamily: FontFamily.headline, fontSize: 20, color: Colors.onSurfaceVariant, opacity: 0.5 },
  deleteContainer: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl, padding: 20, gap: 16,
    borderWidth: 1, borderColor: Colors.error + '1A',
  },
  deleteHeader: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  deleteIconWrap: {
    width: 44, height: 44, borderRadius: Radius.lg,
    backgroundColor: Colors.errorContainer + '33',
    alignItems: 'center', justifyContent: 'center',
  },
  deleteIcon: { fontSize: 20 },
  deleteTitle: { fontFamily: FontFamily.headline, fontSize: 15, color: Colors.error },
  deleteSubtitle: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.onSurfaceVariant },
  deleteBtn: {
    backgroundColor: Colors.error, borderRadius: Radius.xl,
    padding: 16, alignItems: 'center',
  },
  deleteBtnConfirm: { backgroundColor: Colors.errorContainer },
  deleteBtnText: { fontFamily: FontFamily.headline, fontSize: 15, color: Colors.onError },
  cancelText: {
    fontFamily: FontFamily.bodyRegular, fontSize: 13,
    color: Colors.onSurfaceVariant, textAlign: 'center',
  },
  timeRow: {
    flexDirection: 'row', padding: 16,
    marginHorizontal: 16, marginBottom: 16,
    backgroundColor: Colors.surfaceContainerLow, borderRadius: Radius.lg,
  },
  timeBlock: { flex: 1, gap: 4 },
  timeBlockLabel: {
    fontFamily: FontFamily.bodyRegular, fontSize: 9,
    color: Colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1,
  },
  timeBlockValue: { fontFamily: FontFamily.headline, fontSize: 22, color: Colors.onSurface },
  timeDivider: { width: 1, backgroundColor: Colors.outlineVariant + '33', marginHorizontal: 16 },
  footer: {
    fontFamily: FontFamily.bodyRegular, fontSize: 10,
    color: Colors.onSurfaceVariant, opacity: 0.3,
    textAlign: 'center', letterSpacing: 1, textTransform: 'uppercase',
  },
});
