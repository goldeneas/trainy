import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  InteractionManager,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  Clipboard,
  Pressable,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { BarChart } from 'react-native-gifted-charts';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api, ActualRoutine, MuscleGroupDistribution, WeeklyWorkoutHourDistribution, Exercise, MuscleGroup, RepUnit } from '@/services/api';

const getNow = () => Date.now();

export default function StatsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const safeBottom = insets.bottom + BottomTabInset;

  // Stats States
  const [totalWorkouts, setTotalWorkouts] = useState<number>(0);
  const [weeklyFrequency, setWeeklyFrequency] = useState<number>(0);
  const [monthlyRoutines, setMonthlyRoutines] = useState<ActualRoutine[]>([]);
  const [muscleDistribution, setMuscleDistribution] = useState<MuscleGroupDistribution[]>([]);
  const [weeklyHours, setWeeklyHours] = useState<WeeklyWorkoutHourDistribution[]>([]);
  const [selectedBarIndex, setSelectedBarIndex] = useState<number | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isTransitionReady, setIsTransitionReady] = useState(false);

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [repUnits, setRepUnits] = useState<RepUnit[]>([]);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setIsTransitionReady(true);
    });
    return () => task.cancel();
  }, []);

  const fetchData = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const [
        workoutsCount, 
        frequencyCount, 
        monthlyData, 
        distributionData, 
        weeklyHoursData,
        exercisesData,
        musclesData,
        unitsData
      ] = await Promise.all([
        api.getStatsTotalWorkouts(),
        api.getStatsWeeklyFrequency(),
        api.getStatsMonthlyRoutines(),
        api.getStatsMuscleDistribution(),
        api.getStatsWeeklyHours(),
        api.getExercises().catch(() => [] as Exercise[]),
        api.getMuscleGroups().catch(() => [] as MuscleGroup[]),
        api.getRepUnits().catch(() => [] as RepUnit[]),
      ]);

      setTotalWorkouts(workoutsCount ?? 0);
      setWeeklyFrequency(frequencyCount ?? 0);
      setMonthlyRoutines(monthlyData || []);
      setMuscleDistribution(distributionData || []);
      setWeeklyHours(weeklyHoursData || []);
      setExercises(exercisesData || []);
      setMuscleGroups(musclesData || []);
      setRepUnits(unitsData || []);
      setSelectedBarIndex(null);
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.message || 'Failed to sync stats with server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleExportToClipboard = async () => {
    try {
      let exportText = "=== TRAINY EXERCISES DIRECTORY FOR LLM ===\n\n";

      exportText += "--- 1. REPETITION TYPES (REP UNITS) ---\n";
      exportText += "Use these IDs for the rep_unit_id field of exercises:\n";
      repUnits.forEach((ru) => {
        exportText += `ID: ${ru.ID} | Name: ${ru.NameSingular} (${ru.NamePlural || ''})\n`;
      });
      exportText += "\n";

      exportText += "--- 2. MUSCLE GROUPS ---\n";
      exportText += "Use these IDs for the muscle_group_ids field of exercises:\n";
      muscleGroups.forEach((mg) => {
        exportText += `ID: ${mg.ID} | Name: ${mg.Name}\n`;
      });
      exportText += "\n";

      exportText += "--- 3. EXISTING EXERCISES ---\n";
      exportText += "Use these IDs for the exercise_ids in progressions (do not create duplicates):\n";
      exercises.forEach((ex) => {
        const muscles = ex.muscle_group_ids 
          ? ex.muscle_group_ids.map(id => muscleGroups.find(g => g.ID === id)?.Name).filter(Boolean).join(', ')
          : 'None';
        exportText += `ID: ${ex.id} | Name: ${ex.name} | Muscle Groups: ${muscles} | Rep Unit ID: ${ex.rep_unit_id}\n`;
        if (ex.notes) exportText += `   Notes: ${ex.notes}\n`;
        if (ex.instructions) exportText += `   Instructions: ${ex.instructions}\n`;
      });

      Clipboard.setString(exportText);
      Alert.alert('Success', 'Exercises, muscle groups, and rep units directory copied to clipboard!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to copy to clipboard');
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData(true);
    }, [fetchData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

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

  // Sort muscle group focus by most active (descending)
  const sortedMuscleDistribution = useMemo(() => {
    return [...muscleDistribution].sort((a, b) => b.distribution - a.distribution);
  }, [muscleDistribution]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <ThemedText type="subtitle" style={styles.headerTitle}>
            Stats
          </ThemedText>
          <Pressable
            onPress={handleExportToClipboard}
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
            <SymbolView
              tintColor="#0A84FF"
              name="arrow.up.circle.fill"
              size={28}
            />
          </Pressable>
        </View>
      </View>

      {!isTransitionReady || loading ? (
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

          <View style={styles.sectionHeader}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              ACTIVITY HEATMAP
            </ThemedText>
          </View>

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

          {/* Weekly Workout Hours Header */}
          <View style={styles.sectionHeader}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              WEEKLY WORKOUT HOURS
            </ThemedText>
          </View>

          {/* Weekly Workout Hours Bar Chart Card */}
          <ThemedView type="backgroundElement" style={styles.chartCard}>
            {weeklyHours.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: Spacing.two }}>
                <SymbolView
                  tintColor={theme.textSecondary}
                  name="info.circle"
                  size={24}
                  style={{ marginBottom: Spacing.one, opacity: 0.6 }}
                />
                <ThemedText type="small" themeColor="textSecondary">
                  No weekly workout hours data this month.
                </ThemedText>
              </View>
            ) : (
              (() => {
                const maxHours = Math.max(4.0, ...weeklyHours.map(w => w.hours));
                // We use stackData to simulate background tracks:
                // Stack element 1: the actual completed hours (blue)
                // Stack element 2: the remaining hours up to maxHours (gray background track)
                const stackData = weeklyHours.map((item, index) => {
                  const isSelected = selectedBarIndex === index;
                  const activeVal = item.hours;
                  const trackVal = Math.max(0, (maxHours * 1.15) - activeVal);
                  
                  // Lighter blue accent color when selected (#54A6FF instead of #0A84FF)
                  const activeColor = isSelected ? '#54A6FF' : '#0A84FF';

                  return {
                    stacks: [
                      { value: activeVal, color: activeColor },
                      { value: trackVal, color: theme.backgroundSelected } // background track
                    ],
                    label: `W${item.week_iso}`,
                    topLabelComponent: isSelected ? () => (
                      <ThemedText style={{ fontSize: 9, color: theme.textSecondary, marginBottom: 4, fontWeight: 'bold' }}>
                        {item.hours.toFixed(1)}
                      </ThemedText>
                    ) : undefined,
                  };
                });

                const screenWidth = Dimensions.get('window').width;
                // available width inside chartCard (screenWidth minus margins & padding: 16 * 2 margins + 16 * 2 padding = 64px)
                const containerWidth = screenWidth - 64; 
                
                const sideMargin = 10;
                // Since Y-axis text is hidden, the chart grid width takes the entire inner card width
                const chartGridWidth = containerWidth;
                
                const barWidth = 20;
                
                const spacing = 20; // Fixed spacing to align bars sequentially from the left

                return (
                  <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                    <BarChart
                      stackData={stackData}
                      barWidth={barWidth}
                      spacing={spacing}
                      barBorderRadius={3}
                      height={140}
                      width={chartGridWidth}
                      noOfSections={3}
                      maxValue={maxHours * 1.15}
                      yAxisExtraHeight={15}
                      yAxisThickness={0}
                      xAxisThickness={0}
                      xAxisColor={theme.backgroundSelected}
                      yAxisColor={theme.backgroundSelected}
                      rulesColor={theme.backgroundSelected}
                      rulesType="solid"
                      yAxisTextStyle={{ color: theme.textSecondary, fontSize: 9 }}
                      yAxisLabelSuffix="h"
                      yAxisLabelWidth={0}
                      xAxisLabelTextStyle={{ marginTop: 8, color: theme.textSecondary, fontSize: 10, fontWeight: 'bold' }}
                      hideRules={true}
                      hideYAxisText={true}
                      onPress={(_item: any, index: number) => {
                        setSelectedBarIndex((prev) => (prev === index ? null : index));
                      }}
                      showReferenceLine1={false}
                      initialSpacing={sideMargin}
                      endSpacing={sideMargin}
                      isAnimated
                    />
                  </View>
                );
              })()
            )}
          </ThemedView>

          {/* Muscle Group Focus Header */}
          <View style={styles.sectionHeader}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              MUSCLE GROUP FOCUS
            </ThemedText>
          </View>

          {/* Muscle Group Focus Card */}
          <ThemedView type="backgroundElement" style={styles.distributionCard}>
            {sortedMuscleDistribution.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: Spacing.two }}>

                <SymbolView
                  tintColor={theme.textSecondary}
                  name="info.circle"
                  size={24}
                  style={{ marginBottom: Spacing.one, opacity: 0.6 }}
                />
                <ThemedText type="small" themeColor="textSecondary">
                  No muscle focus data this month.
                </ThemedText>
              </View>
            ) : (
              sortedMuscleDistribution.map((item, idx) => (
                <View
                  key={item.name}
                  style={[
                    styles.distributionRow,
                    idx < sortedMuscleDistribution.length - 1 && { marginBottom: Spacing.three },
                  ]}>
                  <View style={styles.distributionLabelRow}>
                    <ThemedText type="smallBold">{item.name}</ThemedText>
                    <ThemedText type="smallBold" themeColor="textSecondary">
                      {(item.distribution * 100).toFixed(1)}%
                    </ThemedText>
                  </View>
                  <View style={[styles.progressBarBg, { backgroundColor: theme.backgroundSelected }]}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${Math.min(100, Math.max(0, item.distribution * 100))}%`,
                          backgroundColor: '#0A84FF',
                        },
                      ]}
                    />
                  </View>
                </View>
              ))
            )}
          </ThemedView>
        </ScrollView>
      )}
    </View>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  headerTitle: {
    fontWeight: 'bold',
    fontSize: 34,
  },
  pressed: {
    opacity: 0.7,
  },
  addButton: {
    padding: Spacing.one,
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
    marginBottom: Spacing.one,
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
  chartCard: {
    marginHorizontal: Spacing.three,
    padding: Spacing.three,
    borderRadius: 12,
    marginBottom: Spacing.three,
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
