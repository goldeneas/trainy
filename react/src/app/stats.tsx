import React, { useState, useCallback, useMemo } from 'react';
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
import { useFocusEffect } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api, ActualRoutine, Routine, MuscleGroupDistribution } from '@/services/api';

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
  const [muscleDistribution, setMuscleDistribution] = useState<MuscleGroupDistribution[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const [workoutsCount, frequencyCount, monthlyData, routinesData, distributionData] = await Promise.all([
        api.getStatsTotalWorkouts(),
        api.getStatsWeeklyFrequency(),
        api.getStatsMonthlyRoutines(),
        api.getRoutines(),
        api.getStatsMuscleDistribution(),
      ]);

      setTotalWorkouts(workoutsCount ?? 0);
      setWeeklyFrequency(frequencyCount ?? 0);
      setMonthlyRoutines(monthlyData || []);
      setRoutines(routinesData || []);
      setMuscleDistribution(distributionData || []);
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.message || 'Failed to sync stats with server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData(true);
    }, [fetchData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Resolve monthly routines completed with their name and date (limited to 5 most recent)
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
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5);
  }, [monthlyRoutines, routines]);

  // Set of calendar days this month that had a completed workout
  const completedDays = useMemo(() => {
    const days = new Set<number>();
    monthlyRoutines.forEach((item) => {
      const date = new Date(item.FinishTimestamp * 1000);
      days.add(date.getDate());
    });
    return days;
  }, [monthlyRoutines]);

  // Days list for the current month
  const heatmapDays = useMemo(() => {
    const now = new Date(getNow());
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysCount = new Date(year, month + 1, 0).getDate();

    const daysList = [];
    for (let d = 1; d <= daysCount; d++) {
      daysList.push({
        dayNum: d,
        hasWorkout: completedDays.has(d),
      });
    }
    return daysList;
  }, [completedDays]);

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
              <SymbolView tintColor="#FF3B30" name="flame.fill" size={18} style={styles.cardIcon} />
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

          {/* Activity Heatmap Header */}

          {/*
          <View style={styles.sectionHeader}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              ACTIVITY HEATMAP
            </ThemedText>
          </View>
            */}

          {/* Activity Heatmap Card */}
          <ThemedView type="backgroundElement" style={styles.heatmapCard}>
            <View style={styles.heatmapGrid}>
              {heatmapDays.map((item) => (
                <View
                  key={item.dayNum}
                  style={[
                    styles.heatmapSquare,
                    {
                      backgroundColor: item.hasWorkout
                        ? '#0A84FF'
                        : theme.backgroundSelected,
                    },
                  ]}>
                  <ThemedText
                    type="smallBold"
                    style={[
                      styles.heatmapSquareText,
                      { color: item.hasWorkout ? '#FFFFFF' : theme.textSecondary },
                    ]}>
                    {item.dayNum}
                  </ThemedText>
                </View>
              ))}
            </View>
          </ThemedView>

          {/* Muscle Group Focus Header */}
          <View style={styles.sectionHeader}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              MUSCLE GROUP FOCUS
            </ThemedText>
          </View>

          {/* Muscle Group Focus Card */}
          <ThemedView type="backgroundElement" style={styles.distributionCard}>
            {muscleDistribution.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: Spacing.two }}>

                <SymbolView
                  tintColor={theme.textSecondary}
                  name="info.circle"
                  size={24}
                  style={{ marginBottom: Spacing.one, opacity: 0.6 }}
                />
                <ThemedText type="small" themeColor="textSecondary">
                  No muscle focus data yet this month.
                </ThemedText>
              </View>
            ) : (
              muscleDistribution.map((item, idx) => (
                <View
                  key={item.name}
                  style={[
                    styles.distributionRow,
                    idx < muscleDistribution.length - 1 && { marginBottom: Spacing.three },
                  ]}>
                  <View style={styles.distributionLabelRow}>
                    <ThemedText type="smallBold">{item.name}</ThemedText>
                    <ThemedText type="smallBold" themeColor="textSecondary">
                      {item.distribution.toFixed(1)}%
                    </ThemedText>
                  </View>
                  <View style={[styles.progressBarBg, { backgroundColor: theme.backgroundSelected }]}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${Math.min(100, Math.max(0, item.distribution))}%`,
                          backgroundColor: '#0A84FF',
                        },
                      ]}
                    />
                  </View>
                </View>
              ))
            )}
          </ThemedView>

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
                No workouts completed yet this month.
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
  heatmapCard: {
    marginHorizontal: Spacing.three,
    padding: Spacing.three,
    borderRadius: 12,
    marginBottom: Spacing.three,
  },

  heatmapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  heatmapSquare: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heatmapSquareText: {
    fontSize: 10,
  },
  distributionCard: {
    marginHorizontal: Spacing.three,
    padding: Spacing.three,
    borderRadius: 12,
    marginBottom: Spacing.three,
  },
  distributionRow: {
    width: '100%',
  },
  distributionLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.one,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
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
