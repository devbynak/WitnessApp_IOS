import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { getSupabase } from '../services/supabase';
import { useWitnessStore } from '../store/useWitnessStore';
import { Colors, FontFamily, Radius } from '../constants/tokens';

type AuthMode = 'signin' | 'signup';

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { setUserId, setAuthenticated } = useWitnessStore();

  const [mode, setMode] = useState<AuthMode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) {
      setError('Enter your email and a password.');
      return;
    }
    if (mode === 'signup' && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const client = getSupabase();
      if (!client) {
        setError('Backend not configured yet. Your entries are saved locally.');
        setLoading(false);
        return;
      }

      if (mode === 'signup') {
        const { data, error: signUpError } = await client.auth.signUp({
          email: email.trim(),
          password,
        });
        if (signUpError) {
          setError(signUpError.message);
        } else if (data.user) {
          setUserId(data.user.id);
          setAuthenticated(true);
          setSuccess(true);
          setTimeout(() => router.back(), 1000);
        }
      } else {
        const { data, error: signInError } = await client.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) {
          setError(signInError.message);
        } else if (data.user) {
          setUserId(data.user.id);
          setAuthenticated(true);
          router.back();
        }
      }
    } catch (e) {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleSkip() {
    router.back();
  }

  if (success) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.successText}>You're in. Your entries are safe.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 48 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Dismiss handle */}
        <View style={styles.handle} />

        <Text style={styles.title}>
          {mode === 'signup' ? 'Create account' : 'Welcome back'}
        </Text>
        <Text style={styles.subtitle}>
          Your entries are encrypted and only visible to you.
        </Text>

        {/* Mode toggle */}
        <View style={styles.modeToggle}>
          <Pressable
            style={[styles.modeBtn, mode === 'signup' && styles.modeBtnActive]}
            onPress={() => { setMode('signup'); setError(null); }}
          >
            <Text style={[styles.modeBtnText, mode === 'signup' && styles.modeBtnTextActive]}>
              Sign up
            </Text>
          </Pressable>
          <Pressable
            style={[styles.modeBtn, mode === 'signin' && styles.modeBtnActive]}
            onPress={() => { setMode('signin'); setError(null); }}
          >
            <Text style={[styles.modeBtnText, mode === 'signin' && styles.modeBtnTextActive]}>
              Sign in
            </Text>
          </Pressable>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              placeholderTextColor={Colors.onSurfaceVariant + '40'}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="At least 8 characters"
              placeholderTextColor={Colors.onSurfaceVariant + '40'}
              secureTextEntry
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>

        {/* Submit */}
        <Pressable
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={loading}
        >
          <LinearGradient
            colors={loading ? [Colors.surfaceContainerHigh, Colors.surfaceContainerHigh] : [Colors.primary, '#a07800']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.submitBtnGradient}
          >
            {loading ? (
              <ActivityIndicator color={Colors.onSurface} size="small" />
            ) : (
              <Text style={styles.submitBtnText}>
                {mode === 'signup' ? 'Create account' : 'Sign in'}
              </Text>
            )}
          </LinearGradient>
        </Pressable>

        {/* Apple Sign In placeholder */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <Pressable style={styles.appleBtn} disabled>
          <Text style={styles.appleBtnText}>🍎  Sign in with Apple</Text>
          <Text style={styles.appleBtnSub}>Coming soon</Text>
        </Pressable>

        {/* Skip */}
        <Pressable style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipText}>Not now — save locally only</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLow,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  successText: {
    fontFamily: FontFamily.headline,
    fontSize: 20,
    color: Colors.onSurface,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  content: {
    paddingHorizontal: 28,
    gap: 24,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.outlineVariant,
    alignSelf: 'center',
    marginBottom: 8,
  },
  title: {
    fontFamily: FontFamily.headlineXBold,
    fontSize: 28,
    color: Colors.onSurface,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    lineHeight: 22,
    opacity: 0.7,
    marginTop: -8,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radius.lg,
    padding: 4,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: Radius.md,
  },
  modeBtnActive: {
    backgroundColor: Colors.surfaceContainerHighest,
  },
  modeBtnText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    opacity: 0.6,
  },
  modeBtnTextActive: {
    color: Colors.onSurface,
    opacity: 1,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    opacity: 0.7,
  },
  input: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    color: Colors.onSurface,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + '33',
  },
  errorBox: {
    backgroundColor: Colors.errorContainer + '33',
    borderRadius: Radius.md,
    padding: 12,
  },
  errorText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.error,
    lineHeight: 20,
  },
  submitBtn: {
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  submitBtnGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontFamily: FontFamily.headline,
    fontSize: 15,
    color: Colors.onPrimary,
    letterSpacing: 0.3,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.outlineVariant + '33',
  },
  dividerText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    opacity: 0.5,
  },
  appleBtn: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radius.full,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    opacity: 0.5,
  },
  appleBtnText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 15,
    color: Colors.onSurface,
  },
  appleBtnSub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    opacity: 0.5,
    letterSpacing: 1,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    opacity: 0.5,
    letterSpacing: 0.3,
  },
});
