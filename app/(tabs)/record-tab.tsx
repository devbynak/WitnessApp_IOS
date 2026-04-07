import { useEffect } from 'react';
import { router } from 'expo-router';

// Placeholder screen — the tab bar button navigates to /record directly,
// so this screen should never actually render.
export default function RecordTabPlaceholder() {
  useEffect(() => {
    router.replace('/record');
  }, []);
  return null;
}
