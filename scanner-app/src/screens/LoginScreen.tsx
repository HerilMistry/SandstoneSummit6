import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

// Required for expo-auth-session to complete the browser flow
WebBrowser.maybeCompleteAuthSession();

const C = {
  bg:      '#0a0a0a',
  card:    '#141414',
  accent:  '#d97706',
  google:  '#fff',
  text:    '#fff',
  muted:   '#666',
  border:  '#222',
  error:   '#ef4444',
};

export default function LoginScreen() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // ── Google OAuth via Expo Auth Session ──
  // Replace GOOGLE_CLIENT_ID with your actual Web client ID from Google Console
  const [_request, response, promptAsync] = Google.useAuthRequest({
    // Use the EXPO client ID for Expo Go,
    // and the Android/iOS client IDs for standalone builds
    expoClientId:   process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID   || 'YOUR_EXPO_CLIENT_ID',
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || undefined,
    iosClientId:    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID     || undefined,
    webClientId:    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID     || 'YOUR_WEB_CLIENT_ID',
    scopes: ['openid', 'profile', 'email'],
  });

  // Handle the response from Google
  React.useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleSuccess(response.authentication?.accessToken);
    } else if (response?.type === 'error') {
      setError('Google sign-in was cancelled or failed.');
    }
  }, [response]);

  const handleGoogleSuccess = async (accessToken?: string | null) => {
    if (!accessToken) { setError('No access token received'); return; }
    setLoading(true);
    setError('');
    try {
      // Fetch Google user info using the access token
      const userInfoRes = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const userInfo = await userInfoRes.json();

      // Exchange user info for our app JWT by verifying on backend
      // We send the access token and let backend verify via Google userinfo
      const { data } = await api.post('/api/auth/google-access', {
        accessToken,
        email: userInfo.email,
        name:  userInfo.name,
      });
      await login(data.token, { email: userInfo.email, name: userInfo.name });
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Login failed. You may not be an authorized organizer.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    setError('');
    await promptAsync();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.icon}>📡</Text>
        <Text style={styles.title}>SS6 Scanner</Text>
        <Text style={styles.subtitle}>Organizer Access</Text>
      </View>

      {/* Google Sign-In card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sign in with Google</Text>
        <Text style={styles.cardDesc}>
          Only authorized IIT Jodhpur Sandstone organizers can access the scanner.
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.googleBtn, loading && styles.btnDisabled]}
          onPress={handleSignIn}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#333" />
          ) : (
            <>
              {/* Google G logo */}
              <Text style={styles.googleG}>G</Text>
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.note}>
        A browser window will open for Google sign-in.{'\n'}
        Your email must be whitelisted by the admin.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg, justifyContent: 'center', paddingHorizontal: 28 },
  header:    { alignItems: 'center', marginBottom: 40 },
  icon:      { fontSize: 56, marginBottom: 10 },
  title:     { color: C.accent, fontSize: 30, fontWeight: '900', letterSpacing: 0.5 },
  subtitle:  { color: C.muted, fontSize: 14, marginTop: 4 },
  card: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardTitle: { color: C.text, fontSize: 18, fontWeight: '800', marginBottom: 8 },
  cardDesc:  { color: C.muted, fontSize: 13, lineHeight: 20, marginBottom: 20 },
  error: { color: C.error, fontSize: 13, marginBottom: 14, textAlign: 'center' },
  googleBtn: {
    backgroundColor: C.google,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  btnDisabled: { opacity: 0.6 },
  googleG: {
    fontSize: 18,
    fontWeight: '900',
    color: '#4285F4',
    fontFamily: 'serif',
  },
  googleBtnText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '700',
  },
  note: {
    color: C.muted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
  },
});
