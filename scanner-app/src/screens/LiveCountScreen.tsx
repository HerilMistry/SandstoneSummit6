import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/AppNavigator';
import api from '../api/client';

type RoutePropType = RouteProp<RootStackParamList, 'LiveCount'>;

const C = {
  bg: '#0a0a0a',
  card: '#141414',
  accent: '#d97706',
  text: '#fff',
  muted: '#666',
  border: '#222',
  success: '#059669',
};

interface Attendee {
  roll_number: string;
  name: string;
  marked_at: string;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: true, timeZone: 'Asia/Kolkata',
  });
}

export default function LiveCountScreen() {
  const route = useRoute<RoutePropType>();
  const { sessionId, sessionName } = route.params;

  const [count, setCount] = useState(0);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const { data } = await api.get(`/api/attendance/session/${sessionId}`);
      setCount(data.count);
      setAttendees(data.attendees);
      setLastUpdated(new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }));
    } catch (err) {
      // Silently ignore polling errors
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sessionId]);

  // Initial load + 10s polling
  useEffect(() => {
    fetchData();
    pollRef.current = setInterval(() => fetchData(), 10000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchData]);

  const renderAttendee = ({ item, index }: { item: Attendee; index: number }) => (
    <View style={styles.row}>
      <Text style={styles.rowIndex}>{index + 1}</Text>
      <View style={styles.rowInfo}>
        <Text style={styles.rowName}>{item.name}</Text>
        <Text style={styles.rowRoll}>{item.roll_number}</Text>
      </View>
      <Text style={styles.rowTime}>{formatTime(item.marked_at)}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={C.accent} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <FlatList
        style={styles.list}
        data={attendees}
        keyExtractor={(item) => item.roll_number}
        renderItem={renderAttendee}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchData(true)}
            tintColor={C.accent}
          />
        }
        ListHeaderComponent={
          <>
            {/* Big count */}
            <View style={styles.countCard}>
              <Text style={styles.countNumber}>{count}</Text>
              <Text style={styles.countLabel}>Attended</Text>
              <Text style={styles.updatedText}>Updates every 10s · Last: {lastUpdated}</Text>
            </View>

            {count > 0 && (
              <Text style={styles.listHeader}>Attendee List</Text>
            )}
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No one scanned yet</Text>
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
  listContent: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },

  countCard: {
    backgroundColor: C.card, borderRadius: 20,
    borderWidth: 1, borderColor: C.border,
    alignItems: 'center', padding: 32, marginBottom: 24,
  },
  countNumber: { color: C.accent, fontSize: 80, fontWeight: '900', lineHeight: 88 },
  countLabel: { color: C.text, fontSize: 18, fontWeight: '700', marginTop: 4 },
  updatedText: { color: C.muted, fontSize: 11, marginTop: 12 },

  listHeader: {
    color: C.muted, fontSize: 11, fontWeight: '700',
    letterSpacing: 1.5, marginBottom: 10,
  },
  row: {
    backgroundColor: C.card, borderRadius: 12, padding: 14,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: C.border, marginBottom: 8,
  },
  rowIndex: { color: C.muted, fontSize: 13, width: 28, fontWeight: '700' },
  rowInfo: { flex: 1 },
  rowName: { color: C.text, fontSize: 14, fontWeight: '700' },
  rowRoll: { color: C.accent, fontSize: 12, marginTop: 2 },
  rowTime: { color: C.muted, fontSize: 11 },

  empty: { alignItems: 'center', paddingTop: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { color: C.muted, fontSize: 15 },
});
