import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const C = {
  bg: '#0a0a0a',
  card: '#141414',
  accent: '#d97706',
  text: '#fff',
  muted: '#666',
  border: '#222',
  error: '#ef4444',
};

export default function LoginScreen() {
  const { login } = useAuth();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!password.trim()) {
      setError('Enter the organizer password');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/login', { password: password.trim() });
      await login(data.token);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Login failed. Check password or connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />
      <View style={styles.container}>
        <Text style={styles.icon}>📡</Text>
        <Text style={styles.title}>SS6 Scanner</Text>
        <Text style={styles.subtitle}>Organizer Access</Text>

        <View style={styles.card}>
          <Text style={styles.label}>PASSWORD</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter organizer password"
            placeholderTextColor={C.muted}
            value={password}
            onChangeText={(t) => { setPassword(t); setError(''); }}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Login →</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.bg },
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  icon: { fontSize: 52, textAlign: 'center', marginBottom: 12 },
  title: { color: C.accent, fontSize: 28, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: C.muted, fontSize: 14, textAlign: 'center', marginBottom: 36 },
  card: {
    backgroundColor: C.card, borderRadius: 18, padding: 24,
    borderWidth: 1, borderColor: C.border,
  },
  label: { color: C.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  input: {
    backgroundColor: '#1e1e1e', borderWidth: 1, borderColor: C.border,
    borderRadius: 12, padding: 14, fontSize: 16, color: C.text,
  },
  error: { color: C.error, fontSize: 13, marginTop: 10, textAlign: 'center' },
  btn: {
    backgroundColor: C.accent, borderRadius: 12,
    paddingVertical: 15, alignItems: 'center', marginTop: 20,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
