import { getSupabase } from './supabase';
import { Entry } from '../types';

/**
 * Uploads a video/audio file to Supabase Storage and inserts the entry row.
 * Returns the remote video key (Storage path) on success, or null on failure.
 */
export async function uploadEntry(entry: Entry, userId: string): Promise<string | null> {
  const client = getSupabase();
  if (!client) return null;

  try {
    let remoteVideoKey: string | null = null;

    // Upload video to Supabase Storage if file exists
    if (entry.videoUri) {
      const ext = entry.videoUri.split('.').pop() ?? 'mp4';
      const storagePath = `${userId}/${entry.id}.${ext}`;

      const response = await fetch(entry.videoUri);
      const blob = await response.blob();

      const { error: storageError } = await client.storage
        .from('videos')
        .upload(storagePath, blob, {
          contentType: entry.isVoiceOnly ? 'audio/m4a' : 'video/mp4',
          upsert: true,
        });

      if (storageError) {
        console.error('Storage upload error:', storageError.message);
      } else {
        remoteVideoKey = storagePath;
      }
    }

    // Insert entry row into database
    const { error: dbError } = await client.from('entries').upsert({
      id: entry.id,
      user_id: userId,
      created_at: new Date(entry.date).toISOString(),
      remote_video_key: remoteVideoKey,
      mood_tag: entry.mood ?? 'calm',
      duration_seconds: entry.duration,
      is_voice_only: entry.isVoiceOnly,
      ai_reflection: entry.aiReflection,
      is_unsent: entry.isUnsentLetter,
      is_deleted: false,
    });

    if (dbError) {
      console.error('DB insert error:', dbError.message);
      return null;
    }

    return remoteVideoKey;
  } catch (error) {
    console.error('uploadEntry failed:', error);
    return null;
  }
}

/**
 * Syncs all unsynced entries to Supabase.
 */
export async function syncAllEntries(entries: Entry[], userId: string): Promise<void> {
  const unsynced = entries.filter((e) => !e.isSynced);
  await Promise.allSettled(unsynced.map((e) => uploadEntry(e, userId)));
}

/**
 * Marks an entry as deleted in Supabase and removes its video from Storage.
 */
export async function deleteRemoteEntry(entryId: string, remoteVideoKey?: string): Promise<void> {
  const client = getSupabase();
  if (!client) return;

  try {
    await client.from('entries').update({ is_deleted: true }).eq('id', entryId);
    if (remoteVideoKey) {
      await client.storage.from('videos').remove([remoteVideoKey]);
    }
  } catch (error) {
    console.error('deleteRemoteEntry failed:', error);
  }
}

/**
 * Permanently deletes ALL data for a user.
 * Called from "Delete Everything" in settings.
 */
export async function deleteAllUserData(userId: string): Promise<void> {
  const client = getSupabase();
  if (!client) return;

  try {
    const { data: files } = await client.storage.from('videos').list(userId);
    if (files && files.length > 0) {
      const paths = files.map((f) => `${userId}/${f.name}`);
      await client.storage.from('videos').remove(paths);
    }
    await client.from('entries').delete().eq('user_id', userId);
    await client.from('memory_threads').delete().eq('user_id', userId);
    await client.rpc('delete_user');
  } catch (error) {
    console.error('deleteAllUserData failed:', error);
    throw error;
  }
}
