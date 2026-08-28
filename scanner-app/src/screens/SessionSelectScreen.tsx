import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

type NavProp = StackNavigationProp<RootStackParamList, 'SessionSelect'>;

const C = {
  bg: '#0a0a0a',
  card: '#141414',
  accent: '#d97706',
  active: '#059669',
  text: '#fff',
  muted: '#666',
  border: '#222',
};

interface Session {
  id: string;
  name: string;
  speaker: string;
  day: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata',
  });
}

export default function SessionSelectScreen() {
  const navigation = useNavigation<NavProp>();
  const { logout } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchSessions = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/api/sessions');
      setSessions(data.sessions);
    } catch (err: any) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        logout();
      } else {
        setError(err?.response?.data?.error || 'Failed to load sessions');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [logout]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const handleSelect = (session: Session) => {
    navigation.navigate('Scanner', {
      sessionId: session.id,
      sessionName: session.name,
      speaker: session.speaker,
    });
  };

  const handleViewCount = (session: Session) => {
    navigation.navigate('LiveCount', {
      sessionId: session.id,
      sessionName: `${session.name} – Day ${session.day}`,
    });
  };

  // Group by day
  const day1 = sessions.filter((s) => s.day === 1);
  const day2 = sessions.filter((s) => s.day === 2);

  const renderSession = ({ item }: { item: Session }) => (
    <View style={[styles.card, item.is_active && styles.cardActive]}>
      {item.is_active && (
        <View style={styles.liveBadge}>
          <Text style={styles.liveText}>● LIVE</Text>
        </View>
      )}
      <Text style={styles.sessionName}>{item.name}</Text>
      <Text style={styles.speaker}>{item.speaker}</Text>
      <Text style={styles.time}>
        {formatTime(item.start_time)} – {formatTime(item.end_time)}
      </Text>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.scanBtn, item.is_active && styles.scanBtnActive]}
          onPress={() => handleSelect(item)}
          activeOpacity={0.8}
        >
          <Text style={styles.scanBtnText}>
            {item.is_active ? '📷 Scan' : 'Scan (inactive)'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.countBtn}
          onPress={() => handleViewCount(item)}
          activeOpacity={0.8}
        >
          <Text style={styles.countBtnText}>Count</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDay = (day: number, list: Session[]) => (
    <View style={styles.daySection} key={`day-${day}`}>
      <Text style={styles.dayHeader}>
        📅  Day {day} — {day === 1 ? '29 Aug' : '30 Aug'} 2026
      </Text>
      {list.map((item) => renderSession({ item }))}
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
        <TouchableOpacity style={styles.retryBtn} onPress={() => fetchSessions()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <FlatList
        data={[1]}
        keyExtractor={() => 'root'}
        renderItem={() => (
          <>
            {renderDay(1, day1)}
            {renderDay(2, day2)}
          </>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchSessions(true)}
            tintColor={C.accent}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Sessions</Text>
            <TouchableOpacity onPress={logout}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={styles.listContent}
        style={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.bg },
  list: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  headerTitle: { color: C.text, fontSize: 22, fontWeight: '800' },
  logoutText: { color: '#ef4444', fontSize: 13, fontWeight: '600' },
  daySection: { marginBottom: 24 },
  dayHeader: {
    color: C.accent, fontSize: 13, fontWeight: '700',
    letterSpacing: 0.5, marginBottom: 12,
  },
  card: {
    backgroundColor: C.card, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: C.border, marginBottom: 10,
  },
  cardActive: { borderColor: C.active + '80', backgroundColor: '#0d1f18' },
  liveBadge: {
    alignSelf: 'flex-start', backgroundColor: C.active + '20',
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 8,
  },
  liveText: { color: C.active, fontSize: 11, fontWeight: '800' },
  sessionName: { color: C.text, fontSize: 16, fontWeight: '700' },
  speaker: { color: C.accent, fontSize: 13, marginTop: 3 },
  time: { color: C.muted, fontSize: 12, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  scanBtn: {
    flex: 1, backgroundColor: '#222', borderRadius: 10,
    paddingVertical: 10, alignItems: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  scanBtnActive: { backgroundColor: C.active, borderColor: C.active },
  scanBtnText: { color: C.text, fontWeight: '700', fontSize: 14 },
  countBtn: {
    paddingHorizontal: 16, backgroundColor: '#1e1e1e',
    borderRadius: 10, paddingVertical: 10,
    borderWidth: 1, borderColor: C.border, alignItems: 'center',
  },
  countBtnText: { color: C.muted, fontWeight: '600', fontSize: 14 },
  errorText: { color: '#ef4444', fontSize: 15, marginBottom: 16, textAlign: 'center' },
  retryBtn: {
    backgroundColor: C.accent, borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 24,
  },
  retryText: { color: '#fff', fontWeight: '700' },
});
