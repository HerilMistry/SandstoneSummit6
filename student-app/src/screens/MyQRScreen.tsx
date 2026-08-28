import React, { useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Alert,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { StatusBar } from 'expo-status-bar';
import { useStudent } from '../context/StudentContext';

const C = {
  bg: '#1a0a00',
  card: '#2a1200',
  accent: '#d97706',
  text: '#fff',
  muted: '#a87040',
  border: '#3d1f00',
};

export default function MyQRScreen() {
  const { student, clearStudent } = useStudent();
  const svgRef = useRef<any>(null);

  if (!student) return null;

  // QR payload: compact JSON with roll and unique token
  const qrPayload = JSON.stringify({
    roll: student.roll_number,
    token: student.qr_token,
  });

  const handleLogout = () => {
    Alert.alert(
      'Clear Data',
      'This will remove your QR from this device. You can re-enroll anytime with the same roll number.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearStudent },
      ]
    );
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <StatusBar style="light" />

      {/* Name card */}
      <View style={styles.nameCard}>
        <Text style={styles.greeting}>Welcome,</Text>
        <Text style={styles.name}>{student.name}</Text>
        <Text style={styles.roll}>{student.roll_number}</Text>
      </View>

      {/* QR Code */}
      <View style={styles.qrCard}>
        <Text style={styles.qrLabel}>YOUR ENTRY PASS</Text>
        <View style={styles.qrWrapper}>
          <QRCode
            value={qrPayload}
            size={240}
            color="#5c2e00"
            backgroundColor="#fff"
            getRef={(ref) => (svgRef.current = ref)}
          />
        </View>
        <Text style={styles.qrHint}>Show this to the organizer at each session</Text>
      </View>

      {/* Info */}
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          📅  Sandstone Summit 6.0  •  29–30 Aug 2026
        </Text>
        <Text style={styles.infoText}>
          🏫  IIT Jodhpur
        </Text>
      </View>

      {/* Clear button */}
      <TouchableOpacity style={styles.clearBtn} onPress={handleLogout} activeOpacity={0.8}>
        <Text style={styles.clearBtnText}>Clear device data</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.bg },
  container: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24 },
  nameCard: {
    width: '100%',
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 24,
  },
  greeting: { color: C.muted, fontSize: 13, fontWeight: '600' },
  name: { color: C.text, fontSize: 26, fontWeight: '800', marginTop: 4 },
  roll: { color: C.accent, fontSize: 16, fontWeight: '700', marginTop: 4 },
  qrCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    width: '100%',
    marginBottom: 24,
  },
  qrLabel: {
    color: C.accent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 20,
  },
  qrWrapper: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  qrHint: { color: C.muted, fontSize: 12, marginTop: 16, textAlign: 'center' },
  infoBox: {
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 16,
    width: '100%',
    gap: 6,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 24,
  },
  infoText: { color: C.muted, fontSize: 13 },
  clearBtn: {
    borderWidth: 1,
    borderColor: '#ef444460',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  clearBtnText: { color: '#ef4444', fontSize: 13, fontWeight: '600' },
});
