import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useStudent } from '../context/StudentContext';
import api from '../api/client';

const C = {
  bg: '#1a0a00',
  card: '#2a1200',
  accent: '#d97706',
  text: '#fff',
  muted: '#a87040',
  border: '#3d1f00',
  success: '#10b981',
};

interface SessionRecord {
  id: string;
  name: string;
  speaker: string;
  day: number;
  start_time: string;
  end_time: string;
  marked_at: string;
}

interface AttendanceData {
  sessions_attended: number;
  sessions: SessionRecord[];
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata',
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata',
  });
}

export default function MyAttendanceScreen() {
  const { student } = useStudent();
  const [data, setData] = useState<AttendanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchAttendance = useCallback(async (isRefresh = false) => {
    if (!student) return;
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const { data: res } = await api.get(`/api/attendance/student/${student.roll_number}`);
      setData(res);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load attendance');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [student]);

  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

  const renderSession = ({ item }: { item: SessionRecord }) => (
    <View style={styles.sessionCard}>
      <View style={styles.sessionLeft}>
        <View style={styles.tick}><Text style={styles.tickText}>✓</Text></View>
      </View>
      <View style={styles.sessionRight}>
        <Text style={styles.sessionName}>
          Day {item.day} · {item.name}
        </Text>
        <Text style={styles.sessionSpeaker}>{item.speaker}</Text>
        <Text style={styles.sessionTime}>
          {formatDate(item.start_time)}  ·  {formatTime(item.start_time)} – {formatTime(item.end_time)}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={C.accent} size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => fetchAttendance()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <StatusBar style="light" />
      <FlatList
        style={styles.list}
        data={data?.sessions ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderSession}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchAttendance(true)} tintColor={C.accent} />
        }
        ListHeaderComponent={
          <View style={styles.headerBox}>
            <Text style={styles.headerName}>{student?.name}</Text>
            <Text style={styles.headerRoll}>{student?.roll_number}</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countNumber}>{data?.sessions_attended ?? 0}</Text>
              <Text style={styles.countLabel}>Sessions Attended</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No attendance recorded yet</Text>
            <Text style={styles.emptySubtext}>Show your QR at any session to mark attendance</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.bg },
  list: { flex: 1 },
  listContent: { padding: 16 },
  center: { flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
  headerBox: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 20,
  },
  headerName: { color: C.text, fontSize: 22, fontWeight: '800' },
  headerRoll: { color: C.accent, fontSize: 14, fontWeight: '700', marginTop: 4 },
  countBadge: {
    backgroundColor: '#3d1f00',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: C.accent + '60',
  },
  countNumber: { color: C.accent, fontSize: 48, fontWeight: '900' },
  countLabel: { color: C.muted, fontSize: 12, fontWeight: '600', marginTop: 4, letterSpacing: 0.5 },
  sessionCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 12,
  },
  sessionLeft: { marginRight: 14, paddingTop: 2 },
  tick: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.success + '20',
    borderWidth: 1, borderColor: C.success,
    justifyContent: 'center', alignItems: 'center',
  },
  tickText: { color: C.success, fontSize: 14, fontWeight: '700' },
  sessionRight: { flex: 1 },
  sessionName: { color: C.text, fontSize: 15, fontWeight: '700' },
  sessionSpeaker: { color: C.accent, fontSize: 13, marginTop: 3 },
  sessionTime: { color: C.muted, fontSize: 11, marginTop: 4 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: C.text, fontSize: 16, fontWeight: '600' },
  emptySubtext: { color: C.muted, fontSize: 13, marginTop: 8, textAlign: 'center' },
  errorText: { color: '#ef4444', fontSize: 15, textAlign: 'center', marginBottom: 16 },
  retryBtn: {
    backgroundColor: C.accent, borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 24,
  },
  retryText: { color: '#fff', fontWeight: '700' },
});
