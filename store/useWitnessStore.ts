import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Entry, AppSettings } from '../types';
import { supabase } from '../services/supabase';
import { uploadEntry, deleteRemoteEntry, syncAllEntries } from '../services/entrySync';

interface WitnessStore {
  entries: Entry[];
  settings: AppSettings;
  isUnlocked: boolean;
  isTonightMode: boolean;
  hasCompletedOnboarding: boolean;
  userId: string | null;
  isAuthenticated: boolean;

  // Actions
  addEntry: (entry: Entry) => void;
  deleteEntry: (id: string) => void;
  deleteAllEntries: () => Promise<void>;
  updateEntry: (id: string, updates: Partial<Entry>) => void;
  updateSettings: (updates: Partial<AppSettings>) => void;
  setUnlocked: (value: boolean) => void;
  setOnboardingComplete: () => void;
  setUserId: (id: string | null) => void;
  setAuthenticated: (value: boolean) => void;
  checkTonightMode: () => void;
  loadFromStorage: () => Promise<void>;
  saveToStorage: () => Promise<void>;
  syncEntries: () => Promise<void>;
}

const DEFAULT_SETTINGS: AppSettings = {
  biometricEnabled: true,
  lockOnBackground: true,
  aiEnabled: true,
  tonightModeEnabled: true,
  tonightModeStart: 22, // 10pm
  tonightModeEnd: 6,    // 6am
  notificationsEnabled: true,
  notificationHour: 22,
  notificationMinute: 30,
};

export const useWitnessStore = create<WitnessStore>((set, get) => ({
  entries: [],
  settings: DEFAULT_SETTINGS,
  isUnlocked: false,
  isTonightMode: false,
  hasCompletedOnboarding: false,
  userId: null,
  isAuthenticated: false,

  addEntry: (entry) => {
    set((state) => ({ entries: [entry, ...state.entries] }));
    get().saveToStorage();
    
    // Sync if authenticated
    const { userId } = get();
    if (userId) {
      uploadEntry(entry, userId).then((remoteKey) => {
        if (remoteKey) {
          get().updateEntry(entry.id, { isSynced: true, remoteVideoKey: remoteKey });
        }
      });
    }
  },

  deleteEntry: (id) => {
    const entry = get().entries.find((e) => e.id === id);
    set((state) => ({ entries: state.entries.filter((e) => e.id !== id) }));
    get().saveToStorage();
    
    // Remote delete if synced
    if (entry?.isSynced && entry.remoteVideoKey) {
      deleteRemoteEntry(id, entry.remoteVideoKey);
    }
  },

  deleteAllEntries: async () => {
    set({ entries: [] });
    await AsyncStorage.removeItem('witness_entries');
  },

  updateEntry: (id, updates) => {
    set((state) => ({
      entries: state.entries.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }));
    get().saveToStorage();
  },

  updateSettings: (updates) => {
    const newSettings = { ...get().settings, ...updates };
    set({ settings: newSettings });
    AsyncStorage.setItem('witness_settings', JSON.stringify(newSettings));
    
    // Also save biometric preference to SecureStore for pre-unlock access
    if (updates.biometricEnabled !== undefined) {
      SecureStore.setItemAsync('witness_biometric_enabled', updates.biometricEnabled ? 'true' : 'false');
    }
  },

  setUnlocked: (value) => {
    set({ isUnlocked: value });
    // Note: We don't persist 'true' to SecureStore for security, 
    // but we can persist the fact that a lock exists.
  },

  setOnboardingComplete: () => {
    set({ hasCompletedOnboarding: true });
    SecureStore.setItemAsync('witness_onboarding_complete', 'true');
  },

  setUserId: (id) => set({ userId: id }),

  setAuthenticated: (value) => set({ isAuthenticated: value }),

  checkTonightMode: () => {
    const { settings } = get();
    if (!settings.tonightModeEnabled) {
      set({ isTonightMode: false });
      return;
    }
    const hour = new Date().getHours();
    const start = settings.tonightModeStart;
    const end = settings.tonightModeEnd;
    const isTonightMode = start > end
      ? hour >= start || hour < end
      : hour >= start && hour < end;
    set({ isTonightMode });
  },

  loadFromStorage: async () => {
    try {
      // Use helper to safely get SecureStore values without hanging
      const safeSecureGet = async (key: string) => {
        try {
          return await SecureStore.getItemAsync(key);
        } catch (e) {
          console.warn(`SecureStore failed for key ${key}:`, e);
          return null;
        }
      };

      const [entriesJson, settingsJson, onboardingComplete] = await Promise.all([
        AsyncStorage.getItem('witness_entries').catch(() => null),
        AsyncStorage.getItem('witness_settings').catch(() => null),
        safeSecureGet('witness_onboarding_complete'),
      ]);

      if (entriesJson) set({ entries: JSON.parse(entriesJson) });
      if (settingsJson) set({ settings: { ...DEFAULT_SETTINGS, ...JSON.parse(settingsJson) } });
      if (onboardingComplete === 'true') set({ hasCompletedOnboarding: true });

      // Initialize Supabase Auth listener
      if (supabase.auth) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          set({ 
            userId: session?.user?.id ?? null,
            isAuthenticated: !!session
          });

          supabase.auth.onAuthStateChange((_event, session) => {
            set({ 
              userId: session?.user?.id ?? null,
              isAuthenticated: !!session
            });
            if (session?.user?.id) {
              get().syncEntries();
            }
          });
        } catch (supabaseError) {
          console.error('Supabase init failed:', supabaseError);
        }
      }

    } catch (e) {
      console.error('Critical failure in loadFromStorage:', e);
    }
  },

  syncEntries: async () => {
    const { userId, entries, isAuthenticated } = get();
    if (!isAuthenticated || !userId) return;
    await syncAllEntries(entries, userId);
  },

  saveToStorage: async () => {
    try {
      await AsyncStorage.setItem('witness_entries', JSON.stringify(get().entries));
    } catch (e) {
      console.error('Failed to save to storage:', e);
    }
  },
}));
