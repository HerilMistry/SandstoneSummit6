import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Vibration, Alert, Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/AppNavigator';
import api from '../api/client';

type NavProp = StackNavigationProp<RootStackParamList, 'Scanner'>;
type RoutePropType = RouteProp<RootStackParamList, 'Scanner'>;

const { width: W } = Dimensions.get('window');

const C = {
  accent: '#d97706',
  success: '#059669',
  error: '#ef4444',
  warn: '#f59e0b',
  overlay: 'rgba(0,0,0,0.72)',
};

type ScanStatus = 'idle' | 'processing' | 'success' | 'duplicate' | 'error';

interface ScanResult {
  name: string;
  roll: string;
  message: string;
}

export default function ScannerScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { sessionId, sessionName, speaker } = route.params;

  const [permission, requestPermission] = useCameraPermissions();
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [flashOn, setFlashOn] = useState(false);
  const [scannedData, setScannedData] = useState('');
  const processingRef = useRef(false);

  // Reset on screen focus
  useFocusEffect(
    useCallback(() => {
      setStatus('idle');
      setResult(null);
      setScannedData('');
      processingRef.current = false;
    }, [])
  );

  // Auto-reset to idle after success/error
  useEffect(() => {
    if (status === 'success' || status === 'duplicate' || status === 'error') {
      const t = setTimeout(() => {
        setStatus('idle');
        setResult(null);
        setScannedData('');
        processingRef.current = false;
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [status]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    // Guard: block re-scans while processing or cooldown
    if (processingRef.current || data === scannedData) return;

    processingRef.current = true;
    setScannedData(data);
    setStatus('processing');

    try {
      // Parse QR payload
      let payload: { roll?: string; token?: string };
      try {
        payload = JSON.parse(data);
      } catch {
        throw new Error('Invalid QR code format');
      }

      if (!payload.token || !payload.roll) {
        throw new Error('Not a Sandstone QR code');
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const { data: res } = await api.post('/api/attendance/scan', {
        qr_token: payload.token,
        session_id: sessionId,
      });

      // Success
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Vibration.vibrate([0, 100, 80, 100]);
      setStatus('success');
      setResult({
        name: res.student.name,
        roll: res.student.roll_number,
        message: `Session ${res.total_sessions_attended} attended overall`,
      });

    } catch (err: any) {
      const errCode = err?.response?.data?.error;
      const errMsg = err?.response?.data?.message || err?.message || 'Scan failed';

      if (errCode === 'already_marked') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Vibration.vibrate([0, 300, 100, 300]);
        const d = err.response.data;
        setStatus('duplicate');
        setResult({
          name: d.student?.name ?? 'Unknown',
          roll: d.student?.roll_number ?? '',
          message: 'Already marked for this session',
        });
      } else if (errCode === 'Session is not active right now') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setStatus('error');
        setResult({ name: '', roll: '', message: 'Session is not active right now' });
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Vibration.vibrate(800);
        setStatus('error');
        setResult({ name: '', roll: '', message: errMsg });
      }
    }
  };

  // Camera permission flow
  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permContainer}>
        <Text style={styles.permIcon}>📷</Text>
        <Text style={styles.permText}>Camera permission is required to scan QR codes</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusColor =
    status === 'success' ? C.success :
    status === 'duplicate' ? C.warn :
    status === 'error' ? C.error :
    status === 'processing' ? '#888' :
    C.accent;

  return (
    <View style={styles.container}>
      {/* Camera */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={flashOn}
        onBarcodeScanned={status === 'idle' ? handleBarCodeScanned : undefined}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />

      {/* Top overlay — session info */}
      <View style={styles.topOverlay}>
        <View style={styles.sessionBadge}>
          <Text style={styles.sessionBadgeName}>{sessionName}</Text>
          <Text style={styles.sessionBadgeSpeaker}>{speaker}</Text>
        </View>
      </View>

      {/* Scan frame */}
      <View style={styles.frameArea}>
        <View style={[styles.frame, { borderColor: statusColor }]}>
          {/* Corners */}
          {['tl','tr','bl','br'].map((pos) => (
            <View
              key={pos}
              style={[
                styles.corner,
                pos === 'tl' && styles.cornerTL,
                pos === 'tr' && styles.cornerTR,
                pos === 'bl' && styles.cornerBL,
                pos === 'br' && styles.cornerBR,
                { borderColor: statusColor },
              ]}
            />
          ))}
        </View>
        <Text style={[styles.statusText, { color: statusColor }]}>
          {status === 'idle' && 'Point at participant QR code'}
          {status === 'processing' && 'Processing…'}
          {status === 'success' && '✅  Attendance Marked'}
          {status === 'duplicate' && '⚠️  Already Scanned'}
          {status === 'error' && '❌  Error'}
        </Text>
      </View>

      {/* Result card */}
      {result && status !== 'idle' && status !== 'processing' && (
        <View style={[styles.resultCard, { borderColor: statusColor }]}>
          {result.name ? (
            <>
              <Text style={[styles.resultName, { color: statusColor }]}>{result.name}</Text>
              <Text style={styles.resultRoll}>{result.roll}</Text>
            </>
          ) : null}
          <Text style={styles.resultMsg}>{result.message}</Text>
        </View>
      )}

      {/* Bottom controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlBtn, flashOn && styles.controlBtnActive]}
          onPress={() => setFlashOn(!flashOn)}
        >
          <Text style={styles.controlBtnText}>{flashOn ? '🔦 On' : '🔦 Off'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlBtn}
          onPress={() => navigation.navigate('LiveCount', { sessionId, sessionName })}
        >
          <Text style={styles.controlBtnText}>👥 Count</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.controlBtnText}>← Sessions</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const FRAME = W * 0.68;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  permContainer: {
    flex: 1, backgroundColor: '#0a0a0a',
    justifyContent: 'center', alignItems: 'center', padding: 32,
  },
  permIcon: { fontSize: 56, marginBottom: 16 },
  permText: { color: '#aaa', fontSize: 16, textAlign: 'center', marginBottom: 24, lineHeight: 24 },
  permBtn: {
    backgroundColor: C.accent, borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 28,
  },
  permBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  topOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0,
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sessionBadge: { alignItems: 'center' },
  sessionBadgeName: { color: '#fff', fontSize: 17, fontWeight: '700' },
  sessionBadgeSpeaker: { color: '#ffffff90', fontSize: 13, marginTop: 2 },

  frameArea: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    marginTop: 120,
  },
  frame: {
    width: FRAME, height: FRAME, borderRadius: 16,
    borderWidth: 2, borderColor: C.accent, position: 'relative',
  },
  corner: {
    position: 'absolute', width: 24, height: 24,
    borderColor: C.accent, borderWidth: 4,
  },
  cornerTL: { top: -2, left: -2, borderBottomWidth: 0, borderRightWidth: 0, borderTopLeftRadius: 4 },
  cornerTR: { top: -2, right: -2, borderBottomWidth: 0, borderLeftWidth: 0, borderTopRightRadius: 4 },
  cornerBL: { bottom: -2, left: -2, borderTopWidth: 0, borderRightWidth: 0, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: -2, right: -2, borderTopWidth: 0, borderLeftWidth: 0, borderBottomRightRadius: 4 },
  statusText: {
    color: '#fff', fontSize: 14, fontWeight: '600',
    marginTop: 20, textAlign: 'center',
    backgroundColor: C.overlay, paddingHorizontal: 16,
    paddingVertical: 8, borderRadius: 20,
  },

  resultCard: {
    position: 'absolute', bottom: 120, left: 24, right: 24,
    backgroundColor: 'rgba(10,10,10,0.92)', borderRadius: 16,
    padding: 20, alignItems: 'center', borderWidth: 1,
  },
  resultName: { fontSize: 20, fontWeight: '800', marginBottom: 2 },
  resultRoll: { color: '#aaa', fontSize: 14, marginBottom: 6 },
  resultMsg: { color: '#ccc', fontSize: 13 },

  controls: {
    position: 'absolute', bottom: 40, left: 16, right: 16,
    flexDirection: 'row', justifyContent: 'space-around',
  },
  controlBtn: {
    backgroundColor: C.overlay, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    borderWidth: 1, borderColor: '#ffffff20',
  },
  controlBtnActive: { backgroundColor: 'rgba(217,119,6,0.3)', borderColor: C.accent },
  controlBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
