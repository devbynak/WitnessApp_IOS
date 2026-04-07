import { Mood } from '../constants/tokens';

export interface Entry {
  id: string;
  date: string; // ISO string
  duration: number; // seconds
  mood: Mood | null;
  aiReflection: string | null;
  transcript: string | null;
  videoUri: string | null;
  isVoiceOnly: boolean;
  isUnsentLetter: boolean;
  recipientName?: string; // for unsent letters
  isGriefMode: boolean;
  createdAt: number; // timestamp
  isSynced?: boolean; // whether uploaded to Supabase
  remoteVideoKey?: string; // Supabase Storage path
  note?: string; // user-added annotation after saving
}

export interface AppSettings {
  biometricEnabled: boolean;
  lockOnBackground: boolean;
  aiEnabled: boolean;
  tonightModeEnabled: boolean;
  tonightModeStart: number; // hour (0-23)
  tonightModeEnd: number;
  notificationsEnabled: boolean;
  notificationHour: number; // hour for check-in notification (default 22)
  notificationMinute: number; // minute (default 30)
}
