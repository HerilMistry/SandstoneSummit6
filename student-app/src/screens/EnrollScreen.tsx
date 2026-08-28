import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useStudent } from '../context/StudentContext';
import api from '../api/client';

const C = {
  bg: '#1a0a00',
  card: '#2a1200',
  accent: '#d97706',
  accentDark: '#b45309',
  text: '#fff',
  muted: '#a87040',
  border: '#3d1f00',
  error: '#ef4444',
};

export default function EnrollScreen() {
  const { setStudent } = useStudent();
  const [roll, setRoll] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEnroll = async () => {
    const trimmedRoll = roll.trim().toUpperCase();
    const trimmedName = name.trim();

    if (!trimmedRoll || !trimmedName) {
      setError('Both fields are required');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/api/enroll', {
        roll_number: trimmedRoll,
        name: trimmedName,
      });
      setStudent(data.student);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Enrollment failed. Check your connection.';
      setError(msg);
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
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.badge}>🏔️</Text>
          <Text style={styles.title}>Sandstone Summit</Text>
          <Text style={styles.subtitle}>6.0</Text>
          <Text style={styles.tagline}>Register to get your QR pass</Text>
        </View>

        {/* Form */}
        <View style={styles.card}>
          <Text style={styles.label}>Roll Number</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. B22CS001"
            placeholderTextColor={C.muted}
            value={roll}
            onChangeText={(t) => { setRoll(t); setError(''); }}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="next"
          />

          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Your full name"
            placeholderTextColor={C.muted}
            value={name}
            onChangeText={(t) => { setName(t); setError(''); }}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={handleEnroll}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleEnroll}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Get My QR Pass →</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.note}>
          Already enrolled? Just enter your roll number and name again — your QR will be restored.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.bg },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  header: { alignItems: 'center', marginBottom: 40 },
  badge: { fontSize: 56, marginBottom: 8 },
  title: { fontSize: 32, fontWeight: '800', color: C.accent, letterSpacing: 1 },
  subtitle: { fontSize: 48, fontWeight: '900', color: C.text, lineHeight: 52, marginTop: -4 },
  tagline: { fontSize: 14, color: C.muted, marginTop: 8, textAlign: 'center' },
  card: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: C.border,
  },
  label: { color: C.muted, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: '#3d1f00',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: C.text,
  },
  error: { color: C.error, fontSize: 13, marginTop: 12, textAlign: 'center' },
  button: {
    backgroundColor: C.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  note: { color: C.muted, fontSize: 12, textAlign: 'center', marginTop: 24, lineHeight: 18 },
});
