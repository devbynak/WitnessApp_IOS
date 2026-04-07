import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, Radius, Shadows } from '../../constants/tokens';

function TabIcon({ focused, icon, label }: { focused: boolean; icon: string; label: string }) {
  return (
    <View style={[styles.tabItem, focused && styles.tabItemActive]}>
      <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>{icon}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

function RecordTabButton() {
  return (
    <Pressable
      style={styles.recordTabBtn}
      onPress={() => router.push('/record')}
      accessibilityLabel="Record"
    >
      <View style={styles.recordTabCircle}>
        <Text style={styles.recordTabIcon}>⏺</Text>
      </View>
      <Text style={styles.recordTabLabel}>Record</Text>
    </Pressable>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          ...styles.tabBar,
          paddingBottom: insets.bottom + 8,
          height: 72 + insets.bottom,
        },
        tabBarShowLabel: false,
        tabBarBackground: () => <View style={styles.tabBarBg} />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="🏠" label="Home" />
          ),
        }}
      />
      <Tabs.Screen
        name="archive"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="📅" label="Archive" />
          ),
        }}
      />
      <Tabs.Screen
        name="record-tab"
        options={{
          tabBarButton: () => <RecordTabButton />,
        }}
      />
      <Tabs.Screen
        name="patterns"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="📊" label="Patterns" />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="🔒" label="Privacy" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    borderTopWidth: 0,
    backgroundColor: 'transparent',
    elevation: 0,
  },
  tabBarBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.surface + 'CC',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    ...Shadows.amberFab,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    gap: 2,
  },
  tabItemActive: {
    backgroundColor: Colors.surfaceContainer,
    ...Shadows.amberAura,
  },
  tabIcon: {
    fontSize: 18,
    opacity: 0.4,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: Colors.onSurfaceVariant,
    opacity: 0.4,
  },
  tabLabelActive: {
    color: Colors.primary,
    opacity: 1,
  },
  // Center record button
  recordTabBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    marginTop: -18,
  },
  recordTabCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 8,
  },
  recordTabIcon: {
    fontSize: 22,
    color: '#000',
  },
  recordTabLabel: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: Colors.primary,
  },
});
