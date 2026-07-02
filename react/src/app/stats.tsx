import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api, ActualRoutine, Routine } from '@/services/api';

const getNow = () => Date.now();

export default function StatsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const safeBottom = insets.bottom + BottomTabInset;

  // Stats States
  const [totalWorkouts, setTotalWorkouts] = useState<number>(0);
  const [weeklyFrequency, setWeeklyFrequency] = useState<number>(0);
  const [monthlyRoutines, setMonthlyRoutines] = useState<ActualRoutine[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const [workoutsCount, frequencyCount, monthlyData, routinesData] = await Promise.all([
        api.getStatsTotalWorkouts(),
        api.getStatsWeeklyFrequency(),
        api.getStatsMonthlyRoutines(),
        api.getRoutines(),
      ]);

      setTotalWorkouts(workoutsCount ?? 0);
      setWeeklyFrequency(frequencyCount ?? 0);
      setMonthlyRoutines(monthlyData || []);
      setRoutines(routinesData || []);
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.message || 'Failed to sync stats with server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchData(true);
    });
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Resolve monthly routines completed with their name and date
  const resolvedMonthlyLogs = useMemo(() => {
    return monthlyRoutines
      .map((item) => {
        const routine = routines.find((r) => r.ID === item.RoutineID);
        const name = routine ? routine.Name : `Routine #${item.RoutineID}`;
        const dateStr = new Date(item.FinishTimestamp * 1000).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        return {
          id: item.ID,
          name,
          dateStr,
          timestamp: item.FinishTimestamp,
        };
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [monthlyRoutines, routines]);

  // Current month name
  const currentMonthName = useMemo(() => {
    return new Date(getNow()).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <ThemedText type="subtitle" style={styles.headerTitle}>
          Stats
        </ThemedText>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0A84FF" />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollBody}
          contentContainerStyle={{ paddingBottom: safeBottom + Spacing.four }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0A84FF" />}>
          
          {/* Key Metrics Grid */}
          <View style={styles.grid}>
            <ThemedView type="backgroundElement" style={styles.gridCard}>
              <SymbolView tintColor="#0A84FF" name="flame.fill" size={18} style={styles.cardIcon} />
              <ThemedText type="small" themeColor="textSecondary">Total Workouts</ThemedText>
              <ThemedText type="subtitle" style={{ fontWeight: 'bold', marginTop: Spacing.half }}>
                {totalWorkouts}
              </ThemedText>
            </ThemedView>
            <ThemedView type="backgroundElement" style={styles.gridCard}>
              <SymbolView tintColor="#30D158" name="calendar" size={18} style={styles.cardIcon} />
              <ThemedText type="small" themeColor="textSecondary">This Week</ThemedText>
              <ThemedText type="subtitle" style={{ fontWeight: 'bold', marginTop: Spacing.half }}>
                {weeklyFrequency}
              </ThemedText>
            </ThemedView>
          </View>



          {/* Monthly Activity List */}
          <View style={styles.sectionHeader}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              COMPLETED IN {currentMonthName.toUpperCase()}
            </ThemedText>
          </View>

          {resolvedMonthlyLogs.length === 0 ? (
            <ThemedView type="backgroundElement" style={styles.emptyCard}>
              <SymbolView
                tintColor={theme.textSecondary}
                name="info.circle"
                size={24}
                style={{ marginBottom: Spacing.one, opacity: 0.6 }}
              />
              <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
                No workouts completed yet this month. Click the Workouts tab to start!
              </ThemedText>
            </ThemedView>
          ) : (
            resolvedMonthlyLogs.map((log) => (
              <ThemedView key={log.id} type="backgroundElement" style={styles.logCard}>
                <View style={styles.logCardInner}>
                  <View style={styles.logTextContainer}>
                    <ThemedText type="smallBold">{log.name}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.half }}>
                      {log.dateStr}
                    </ThemedText>
                  </View>
                  <SymbolView tintColor="#30D158" name="checkmark.seal.fill" size={20} />
                </View>
              </ThemedView>
            ))
          )}

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
  },
  headerTitle: {
    fontWeight: 'bold',
    fontSize: 34,
  },
  scrollBody: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.five,
  },
  grid: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  gridCard: {
    flex: 1,
    padding: Spacing.three,
    borderRadius: 12,
  },
  cardIcon: {
    marginBottom: Spacing.one,
  },

  sectionHeader: {
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.one,
  },
  emptyCard: {
    marginHorizontal: Spacing.three,
    padding: Spacing.four,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logCard: {
    marginHorizontal: Spacing.three,
    padding: Spacing.three,
    borderRadius: 12,
    marginBottom: Spacing.two,
  },
  logCardInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logTextContainer: {
    flex: 1,
    marginRight: Spacing.two,
  },
});
