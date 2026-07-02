import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  Vibration,
  View,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  api,
  FullRoutine,
  FullActualRoutine,
  Exercise,
} from '@/services/api';

const getNow = () => Date.now();

export default function WorkoutsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const safeBottom = insets.bottom + BottomTabInset;

  // Segmented control
  const [activeSegment, setActiveSegment] = useState<'routines' | 'history'>('routines');

  // Data states
  const [routines, setRoutines] = useState<FullRoutine[]>([]);
  const [history, setHistory] = useState<FullActualRoutine[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals visibility
  const [isAddRoutineVisible, setIsAddRoutineVisible] = useState(false);
  const [isRoutineDetailVisible, setIsRoutineDetailVisible] = useState(false);
  const [isAddExerciseToRoutineVisible, setIsAddExerciseToRoutineVisible] = useState(false);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [isHistoryDetailVisible, setIsHistoryDetailVisible] = useState(false);

  // Selected entities
  const [selectedRoutineId, setSelectedRoutineId] = useState<number | null>(null);
  const [selectedHistory, setSelectedHistory] = useState<FullActualRoutine | null>(null);

  // Derive selectedRoutine dynamically from routines
  const selectedRoutine = useMemo(() => {
    return routines.find(r => r.ID === selectedRoutineId) || null;
  }, [routines, selectedRoutineId]);

  // Add Routine Form
  const [newRoutineName, setNewRoutineName] = useState('');
  const [newRoutineDesc, setNewRoutineDesc] = useState('');

  // Add Planned Exercise Form
  const [selectedExerciseId, setSelectedExerciseId] = useState<number | null>(null);
  const [newRestTime, setNewRestTime] = useState('90');
  const [plannedSets, setPlannedSets] = useState<{ reps: string; notes: string }[]>([
    { reps: '10', notes: 'Working Set' },
  ]);

  // Active Workout Log State
  const [workoutStartTime, setWorkoutStartTime] = useState<number>(0);
  const [workoutDuration, setWorkoutDuration] = useState(0);
  const [workoutLogs, setWorkoutLogs] = useState<{
    [setInfoId: number]: { weight: string; reps: string; completed: boolean };
  }>({});
  const [restTimerSeconds, setRestTimerSeconds] = useState(0);
  const [restTimerActive, setRestTimerActive] = useState(false);


  // Fetch all data
  const fetchData = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const [routinesData, historyData, exercisesData] = await Promise.all([
        api.getFullRoutines(),
        api.getFullActualRoutines(),
        api.getExercises(),
      ]);
      setRoutines(routinesData || []);
      setHistory(historyData || []);
      setExercises(exercisesData || []);
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.message || 'Failed to sync with server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchData();
    });
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Workout duration ticking
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isWorkoutActive) {
      interval = setInterval(() => {
        setWorkoutDuration(Math.floor((Date.now() - workoutStartTime) / 1000));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isWorkoutActive, workoutStartTime]);

  // Rest Timer ticking
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (restTimerActive && restTimerSeconds > 0) {
      interval = setInterval(() => {
        setRestTimerSeconds((prev) => {
          if (prev <= 1) {
            setRestTimerActive(false);
            try {
              Vibration.vibrate([0, 500, 100, 500]);
            } catch {
              // Ignore vibration failures on platforms without vibrator (e.g. web)
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restTimerActive]);



  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Create routine handler
  const handleCreateRoutine = async () => {
    if (!newRoutineName.trim()) {
      Alert.alert('Error', 'Routine name is required');
      return;
    }
    try {
      await api.createRoutine({
        name: newRoutineName.trim(),
        description: newRoutineDesc.trim(),
      });
      setNewRoutineName('');
      setNewRoutineDesc('');
      setIsAddRoutineVisible(false);
      fetchData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create routine');
    }
  };

  // Delete routine handler
  const handleDeleteRoutine = (routine: FullRoutine) => {
    Alert.alert(
      'Delete Routine',
      `Are you sure you want to delete "${routine.Name}"? This will also remove its plan structure.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteRoutine(routine.ID);
              setIsRoutineDetailVisible(false);
              setSelectedRoutineId(null);
              fetchData();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete routine');
            }
          },
        },
      ]
    );
  };

  // Add planned exercise handler
  const handleAddExerciseToRoutine = async () => {
    if (!selectedRoutine || !selectedExerciseId) {
      Alert.alert('Error', 'Please select an exercise');
      return;
    }

    const restTimeNum = parseInt(newRestTime, 10);
    const apiPayload = {
      routine_id: selectedRoutine.ID,
      exercise_id: selectedExerciseId,
      rest_time: isNaN(restTimeNum) ? 90 : restTimeNum,
      planned_set_infos: plannedSets.map((s, idx) => ({
        ord: idx + 1,
        reps: parseInt(s.reps, 10) || 10,
        notes: s.notes,
      })),
    };

    try {
      await api.registerPlannedExercise(apiPayload);
      setIsAddExerciseToRoutineVisible(false);
      // Reset form
      setSelectedExerciseId(null);
      setNewRestTime('90');
      setPlannedSets([{ reps: '10', notes: 'Working Set' }]);
      fetchData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add exercise');
    }
  };

  // Remove planned exercise handler
  const handleRemovePlannedExercise = async (peId: number) => {
    Alert.alert(
      'Remove Exercise',
      'Remove this exercise template from the routine?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deletePlannedExercise(peId);
              fetchData();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to remove exercise');
            }
          },
        },
      ]
    );
  };

  // Start workout flow
  const handleStartWorkout = (routine: FullRoutine) => {
    if (routine.plannedExercises.length === 0) {
      Alert.alert('Empty Routine', 'Add some exercises to this routine first before starting a workout!');
      return;
    }

    setSelectedRoutineId(routine.ID);

    // Populate initial empty logging structure
    const initialLogs: typeof workoutLogs = {};
    routine.plannedExercises.forEach((pe) => {
      pe.sets.forEach((set) => {
        initialLogs[set.ID] = {
          weight: '0',
          reps: set.Reps.toString(),
          completed: false,
        };
      });
    });

    setWorkoutLogs(initialLogs);
    setWorkoutStartTime(getNow());
    setWorkoutDuration(0);
    
    setIsRoutineDetailVisible(false);
    setIsWorkoutActive(true);
  };

  // Toggle check set and prompt rest timer
  const handleToggleSetComplete = (setID: number, restTime: number | null) => {
    let shouldStartTimer = false;
    
    setWorkoutLogs((prev) => {
      const current = prev[setID] || { weight: '0', reps: '10', completed: false };
      const isNowCompleted = !current.completed;
      if (isNowCompleted && restTime && restTime > 0) {
        shouldStartTimer = true;
      }
      return {
        ...prev,
        [setID]: {
          ...current,
          completed: isNowCompleted,
        },
      };
    });

    // Run this in microtask after state update queue starts
    Promise.resolve().then(() => {
      if (shouldStartTimer && restTime) {
        setRestTimerSeconds(restTime);
        setRestTimerActive(true);
      }
    });
  };

  // Finish and save workout log
  const handleFinishWorkout = async () => {
    if (!selectedRoutine) return;

    // Filter out sets that were completed
    const actualSetInfos: any[] = [];
    let completedSetsCount = 0;

    selectedRoutine.plannedExercises.forEach((pe) => {
      pe.sets.forEach((set) => {
        const log = workoutLogs[set.ID];
        if (log && log.completed) {
          completedSetsCount++;
          actualSetInfos.push({
            planned_set_info_id: set.ID,
            weight: parseFloat(log.weight) || 0,
            actual_reps: parseInt(log.reps, 10) || set.Reps,
          });
        }
      });
    });

    if (completedSetsCount === 0) {
      Alert.alert('No Sets Logged', 'You must complete and check off at least one set to save this workout.');
      return;
    }

    try {
      await api.registerActualRoutine({
        routine_id: selectedRoutine.ID,
        actual_set_infos: actualSetInfos,
      });

      setIsWorkoutActive(false);
      setSelectedRoutineId(null);
      
      // Refresh database
      fetchData();
      Alert.alert('Workout Logged!', 'Congratulations on finishing your workout!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save workout log');
    }
  };

  // Cancel workout handler
  const handleCancelWorkout = () => {
    Alert.alert(
      'Discard Workout',
      'Are you sure you want to discard this active workout? Your log data will be lost.',
      [
        { text: 'Keep Workout', style: 'default' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
             setIsWorkoutActive(false);
          },
        },
      ]
    );
  };

  // Delete workout log
  const handleDeleteHistory = (logId: number) => {
    Alert.alert(
      'Delete Workout Log',
      'Are you sure you want to delete this completed workout from your history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteActualRoutine(logId);
              setIsHistoryDetailVisible(false);
              setSelectedHistory(null);
              fetchData();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete history log');
            }
          },
        },
      ]
    );
  };

  // Render routine template cards
  const renderRoutineItem = ({ item }: { item: FullRoutine }) => {
    const renderSwipeActions = () => (
      <View style={styles.swipeActionContainer}>
        <Pressable
          onPress={() => handleDeleteRoutine(item)}
          style={({ pressed }) => [
            styles.deleteSwipeBtn,
            pressed && styles.pressed,
          ]}>
          <SymbolView tintColor="#FFFFFF" name="trash.fill" size={16} />
        </Pressable>
      </View>
    );

    return (
      <Swipeable
        renderLeftActions={renderSwipeActions}
        containerStyle={styles.swipeContainer}>
        <View
          style={[
            styles.card,
            { backgroundColor: theme.backgroundElement, marginBottom: 0 },
          ]}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1, marginRight: Spacing.two }}>
              <ThemedText type="smallBold" style={styles.cardTitle}>
                {item.Name}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.cardSubtitle}>
                {item.Description || 'No description provided'}
              </ThemedText>
            </View>
            <View style={styles.cardActions}>
              <Pressable
                onPress={() => {
                  setSelectedRoutineId(item.ID);
                  setIsRoutineDetailVisible(true);
                }}
                style={({ pressed }) => [
                  styles.cardActionBtn,
                  pressed && styles.pressed,
                ]}>
                <SymbolView tintColor="#8E8E93" name="slider.horizontal.3" size={22} />
              </Pressable>
              <Pressable
                onPress={() => {
                  handleStartWorkout(item);
                }}
                style={({ pressed }) => [
                  styles.cardStartIconBtn,
                  pressed && styles.pressed,
                ]}>
                <SymbolView tintColor="#0A84FF" name="play.circle.fill" size={28} />
              </Pressable>
            </View>
          </View>
          <View style={styles.cardFooter}>
            <SymbolView
              tintColor="#FF3B30"
              name="flame.fill"
              size={14}
              style={{ marginRight: Spacing.one }}
            />
            <ThemedText type="small" themeColor="textSecondary">
              {item.plannedExercises.length} Exercises planned
            </ThemedText>
          </View>
        </View>
      </Swipeable>
    );
  };

  // Render completed workout history items
  const renderHistoryItem = ({ item }: { item: FullActualRoutine }) => {
    const formattedDate = new Date(item.FinishTimestamp * 1000).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <Pressable
        onPress={() => {
          setSelectedHistory(item);
          setIsHistoryDetailVisible(true);
        }}
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: theme.backgroundElement },
          pressed && styles.cardPressed,
        ]}>
        <View style={styles.cardHeader}>
          <View>
            <ThemedText type="smallBold" style={styles.cardTitle}>
              {item.routineName}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {formattedDate}
            </ThemedText>
          </View>
          <SymbolView
            tintColor={theme.textSecondary}
            name="chevron.right"
            size={14}
          />
        </View>
        <View style={styles.cardFooter}>
          <SymbolView
            tintColor="#30D158"
            name="checkmark.circle.fill"
            size={14}
            style={{ marginRight: Spacing.one }}
          />
          <ThemedText type="small" themeColor="textSecondary">
            Completed {item.actualSets.length} sets
          </ThemedText>
        </View>
      </Pressable>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header with Segmented Control */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <ThemedText type="subtitle" style={styles.headerTitle}>
            Workouts
          </ThemedText>
          {activeSegment === 'routines' && (
            <Pressable
              onPress={() => setIsAddRoutineVisible(true)}
              style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
              <SymbolView
                tintColor="#0A84FF"
                name="plus.circle.fill"
                size={28}
              />
            </Pressable>
          )}
        </View>

        {/* Custom iOS-style Segmented Control */}
        <View style={[styles.segmentedControl, { backgroundColor: theme.backgroundSelected }]}>
          <Pressable
            onPress={() => setActiveSegment('routines')}
            style={[
              styles.segment,
              activeSegment === 'routines' && [
                styles.segmentActive,
                { backgroundColor: theme.backgroundElement },
              ],
            ]}>
            <ThemedText
              type={activeSegment === 'routines' ? 'smallBold' : 'small'}
              themeColor={activeSegment === 'routines' ? 'text' : 'textSecondary'}>
              Routines
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setActiveSegment('history')}
            style={[
              styles.segment,
              activeSegment === 'history' && [
                styles.segmentActive,
                { backgroundColor: theme.backgroundElement },
              ],
            ]}>
            <ThemedText
              type={activeSegment === 'history' ? 'smallBold' : 'small'}
              themeColor={activeSegment === 'history' ? 'text' : 'textSecondary'}>
              History
            </ThemedText>
          </Pressable>
        </View>
      </View>

      {/* Main Lists */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0A84FF" />
        </View>
      ) : activeSegment === 'routines' ? (
        // Routines List
        routines.length === 0 ? (
          <View style={styles.centerContainer}>
            <SymbolView
              tintColor={theme.textSecondary}
              name="clipboard.fill"
              size={48}
              style={{ marginBottom: Spacing.two, opacity: 0.6 }}
            />
            <ThemedText type="default" themeColor="textSecondary" style={styles.emptyText}>
              Create a routine to start planning your workouts
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={routines}
            keyExtractor={(item) => item.ID.toString()}
            renderItem={renderRoutineItem}
            contentContainerStyle={[
              styles.listContainer,
              { paddingBottom: safeBottom + Spacing.four },
            ]}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0A84FF" />
            }
          />
        )
      ) : (
        // History List
        history.length === 0 ? (
          <View style={styles.centerContainer}>
            <SymbolView
              tintColor={theme.textSecondary}
              name="calendar.badge.clock"
              size={48}
              style={{ marginBottom: Spacing.two, opacity: 0.6 }}
            />
            <ThemedText type="default" themeColor="textSecondary" style={styles.emptyText}>
              Your logged workouts will appear here
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item) => item.ID.toString()}
            renderItem={renderHistoryItem}
            contentContainerStyle={[
              styles.listContainer,
              { paddingBottom: safeBottom + Spacing.four },
            ]}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0A84FF" />
            }
          />
        ))}

      {/* MODAL: Create Routine */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isAddRoutineVisible}
        onRequestClose={() => setIsAddRoutineVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsAddRoutineVisible(false)} />
          <ThemedView type="background" style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Pressable
                onPress={() => {
                  setNewRoutineName('');
                  setNewRoutineDesc('');
                  setIsAddRoutineVisible(false);
                }}
                style={styles.modalHeaderButton}>
                <ThemedText type="link" themeColor="textSecondary">Cancel</ThemedText>
              </Pressable>
              <ThemedText type="smallBold" style={styles.modalTitle}>
                New Routine
              </ThemedText>
              <Pressable onPress={handleCreateRoutine} style={styles.modalHeaderButton}>
                <ThemedText type="linkPrimary" style={{ color: '#0A84FF', fontWeight: 'bold' }}>Save</ThemedText>
              </Pressable>
            </View>
            <View style={styles.modalFormBody}>
              <View style={styles.formGroup}>
                <ThemedText type="smallBold" themeColor="textSecondary" style={styles.formLabel}>
                  ROUTINE NAME
                </ThemedText>
                <TextInput
                  placeholder="e.g. Leg Day, Upper Body Push"
                  placeholderTextColor={theme.textSecondary}
                  value={newRoutineName}
                  onChangeText={setNewRoutineName}
                  style={[
                    styles.inputField,
                    {
                      backgroundColor: theme.backgroundElement,
                      color: theme.text,
                      borderColor: theme.backgroundSelected,
                    },
                  ]}
                />
              </View>
              <View style={styles.formGroup}>
                <ThemedText type="smallBold" themeColor="textSecondary" style={styles.formLabel}>
                  DESCRIPTION
                </ThemedText>
                <TextInput
                  placeholder="e.g. Focus on quads, glutes and core"
                  placeholderTextColor={theme.textSecondary}
                  value={newRoutineDesc}
                  onChangeText={setNewRoutineDesc}
                  style={[
                    styles.inputField,
                    styles.textAreaField,
                    {
                      backgroundColor: theme.backgroundElement,
                      color: theme.text,
                      borderColor: theme.backgroundSelected,
                    },
                  ]}
                  multiline
                  numberOfLines={2}
                />
              </View>
            </View>
          </ThemedView>
        </View>
      </Modal>

      {/* MODAL: Routine Detail */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isRoutineDetailVisible}
        onRequestClose={() => setIsRoutineDetailVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsRoutineDetailVisible(false)} />
          <ThemedView type="background" style={[styles.modalContent, { height: '80%' }]}>
            <View style={styles.modalHeader}>
              <Pressable
                onPress={() => {
                  if (isAddExerciseToRoutineVisible) {
                    setIsAddExerciseToRoutineVisible(false);
                  } else {
                    setIsRoutineDetailVisible(false);
                  }
                }}
                style={styles.modalHeaderButton}>
                <ThemedText type="linkPrimary" style={{ color: '#0A84FF' }}>
                  {isAddExerciseToRoutineVisible ? 'Back' : 'Close'}
                </ThemedText>
              </Pressable>
              <ThemedText type="smallBold" style={styles.modalTitle} numberOfLines={1}>
                {isAddExerciseToRoutineVisible ? 'Add Exercise' : 'Workout Plan'}
              </ThemedText>
              {isAddExerciseToRoutineVisible ? (
                <Pressable onPress={handleAddExerciseToRoutine} style={styles.modalHeaderButton}>
                  <ThemedText type="linkPrimary" style={{ color: '#0A84FF', fontWeight: 'bold' }}>Save</ThemedText>
                </Pressable>
              ) : (
                <View style={{ minWidth: 60 }} />
              )}
            </View>

            {selectedRoutine && (
              <View style={{ flex: 1 }}>
                {!isAddExerciseToRoutineVisible ? (
                  <>
                    <ScrollView
                      style={styles.modalScrollBody}
                      contentContainerStyle={[styles.modalScrollContent, { paddingBottom: insets.bottom + Spacing.six }]}>
                      <ThemedText type="subtitle" style={styles.detailTitle}>
                        {selectedRoutine.Name}
                      </ThemedText>
                      <ThemedText type="default" themeColor="textSecondary" style={styles.detailDesc}>
                        {selectedRoutine.Description || 'No description provided.'}
                      </ThemedText>

                      {/* Planned Exercises Section */}
                      <View style={styles.detailSection}>
                        <View style={styles.sectionHeaderRow}>
                          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
                            EXERCISES
                          </ThemedText>
                          <Pressable
                            onPress={() => setIsAddExerciseToRoutineVisible(true)}
                            style={styles.inlineAddBtn}>
                            <SymbolView
                              tintColor="#0A84FF"
                              name="plus.circle"
                              size={16}
                              style={{ marginRight: Spacing.one }}
                            />
                            <ThemedText type="linkPrimary" style={{ color: '#0A84FF' }}>
                              Add Exercise
                            </ThemedText>
                          </Pressable>
                        </View>

                        {selectedRoutine.plannedExercises.length === 0 ? (
                          <ThemedView type="backgroundElement" style={styles.detailTextBox}>
                            <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
                              {"No exercises added to this routine yet. Tap 'Add Exercise' to plan."}
                            </ThemedText>
                          </ThemedView>
                        ) : (
                          selectedRoutine.plannedExercises.map((pe) => (
                            <ThemedView
                              key={pe.ID}
                              type="backgroundElement"
                              style={styles.routineExerciseCard}>
                              <View style={styles.peCardTop}>
                                <View style={{ flex: 1 }}>
                                  <ThemedText type="smallBold">{pe.exercise?.Name || 'Exercise'}</ThemedText>
                                  <ThemedText type="small" themeColor="textSecondary">
                                    Rest: {pe.RestTime ? `${pe.RestTime}s` : 'None'}
                                  </ThemedText>
                                </View>
                                <Pressable
                                  onPress={() => handleRemovePlannedExercise(pe.ID)}
                                  style={styles.trashBtn}>
                                  <SymbolView
                                    tintColor="#FF3B30"
                                    name="trash"
                                    size={16}
                                  />
                                </Pressable>
                              </View>
                              {pe.sets.map((set) => (
                                <View key={set.ID} style={styles.setPlanRow}>
                                  <ThemedText type="small" themeColor="textSecondary">
                                    Set {set.Ord}:
                                  </ThemedText>
                                  <ThemedText type="smallBold" style={{ marginHorizontal: Spacing.one }}>
                                    {set.Reps} Reps
                                  </ThemedText>
                                  {set.Notes ? (
                                    <ThemedText type="small" themeColor="textSecondary" numberOfLines={1} style={{ flex: 1, fontStyle: 'italic' }}>
                                      ({set.Notes})
                                    </ThemedText>
                                  ) : null}
                                </View>
                              ))}
                            </ThemedView>
                          ))
                        )}
                      </View>
                    </ScrollView>

                    {/* Workout Start Panel */}
                    <View style={[styles.bottomActionPanel, { paddingBottom: insets.bottom + Spacing.three }]}>
                      <Pressable
                        onPress={() => handleStartWorkout(selectedRoutine)}
                        style={({ pressed }) => [
                          styles.primaryActionButton,
                          { backgroundColor: '#30D158' },
                          pressed && styles.pressed,
                        ]}>
                        <SymbolView
                          tintColor="#FFFFFF"
                          name="play.fill"
                          size={16}
                          style={{ marginRight: Spacing.two }}
                        />
                        <ThemedText style={styles.primaryActionButtonText}>Start Workout</ThemedText>
                      </Pressable>
                    </View>
                  </>
                ) : (
                  <ScrollView 
                    style={styles.modalFormBody}
                    contentContainerStyle={[styles.modalScrollContent, { paddingBottom: insets.bottom + Spacing.six }]}>
                    {/* Exercise Selector */}
                    <View style={styles.formGroup}>
                      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.formLabel}>
                        SELECT EXERCISE *
                      </ThemedText>
                      {exercises.length === 0 ? (
                        <ThemedText type="small" style={{ color: '#FF3B30', marginTop: Spacing.one }}>
                          {"Please add exercises in the 'Exercises' tab first!"}
                        </ThemedText>
                      ) : (
                        <View style={styles.exerciseSelectGrid}>
                          {exercises.map((ex) => (
                            <Pressable
                              key={ex.ID}
                              onPress={() => setSelectedExerciseId(ex.ID)}
                              style={[
                                styles.selectOption,
                                { backgroundColor: theme.backgroundElement },
                                selectedExerciseId === ex.ID && [
                                  styles.selectOptionActive,
                                  { borderColor: '#0A84FF' },
                                ],
                              ]}>
                              <ThemedText type="smallBold">{ex.Name}</ThemedText>
                            </Pressable>
                          ))}
                        </View>
                      )}
                    </View>

                    {/* Rest Time */}
                    <View style={styles.formGroup}>
                      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.formLabel}>
                        REST TIME (SECONDS)
                      </ThemedText>
                      <TextInput
                        placeholder="e.g. 90"
                        keyboardType="numeric"
                        placeholderTextColor={theme.textSecondary}
                        value={newRestTime}
                        onChangeText={setNewRestTime}
                        style={[
                          styles.inputField,
                          {
                            backgroundColor: theme.backgroundElement,
                            color: theme.text,
                            borderColor: theme.backgroundSelected,
                          },
                        ]}
                      />
                    </View>

                    {/* Sets Builder */}
                    <View style={styles.formGroup}>
                      <View style={styles.sectionHeaderRow}>
                        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.formLabel}>
                          PLANNED SETS
                        </ThemedText>
                        <Pressable
                          onPress={() =>
                            setPlannedSets((prev) => [...prev, { reps: '10', notes: 'Working Set' }])
                          }
                          style={styles.inlineAddBtn}>
                          <ThemedText type="linkPrimary" style={{ color: '#0A84FF' }}>+ Add Set</ThemedText>
                        </Pressable>
                      </View>

                      {plannedSets.map((s, idx) => (
                        <ThemedView
                          key={idx}
                          type="backgroundElement"
                          style={styles.setBuilderRow}>
                          <ThemedText type="smallBold" style={styles.setNumberLabel}>
                            {idx + 1}
                          </ThemedText>
                          <TextInput
                            placeholder="Reps"
                            keyboardType="numeric"
                            value={s.reps}
                            placeholderTextColor={theme.textSecondary}
                            onChangeText={(val) => {
                              const newSets = [...plannedSets];
                              newSets[idx].reps = val;
                              setPlannedSets(newSets);
                            }}
                            style={[
                              styles.inputField,
                              styles.setRepsInput,
                              {
                                backgroundColor: theme.background,
                                color: theme.text,
                                borderColor: theme.backgroundSelected,
                              },
                            ]}
                          />
                          <TextInput
                            placeholder="Notes (e.g. Heavy)"
                            value={s.notes}
                            placeholderTextColor={theme.textSecondary}
                            onChangeText={(val) => {
                              const newSets = [...plannedSets];
                              newSets[idx].notes = val;
                              setPlannedSets(newSets);
                            }}
                            style={[
                              styles.inputField,
                              styles.setNotesInput,
                              {
                                backgroundColor: theme.background,
                                color: theme.text,
                                borderColor: theme.backgroundSelected,
                              },
                            ]}
                          />
                          <Pressable
                            onPress={() => {
                              if (plannedSets.length === 1) return;
                              setPlannedSets((prev) => prev.filter((_, i) => i !== idx));
                            }}
                            style={styles.setDeleteBtn}>
                            <SymbolView
                              tintColor="#FF3B30"
                              name="minus.circle.fill"
                              size={18}
                            />
                          </Pressable>
                        </ThemedView>
                      ))}
                    </View>
                  </ScrollView>
                )}
              </View>
            )}
          </ThemedView>
        </View>
      </Modal>



      {/* MODAL: Active Workout Log Interface */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={isWorkoutActive}
        onRequestClose={handleCancelWorkout}>
        <ThemedView type="background" style={[styles.container, { paddingTop: insets.top }]}>
          {/* Workout Header */}
          <View style={styles.workoutHeader}>
            <View>
              <ThemedText type="subtitle" style={styles.workoutRoutineTitle}>
                {selectedRoutine?.Name}
              </ThemedText>
              <ThemedText type="smallBold" style={{ color: '#FF3B30' }}>
                Duration: {formatDuration(workoutDuration)}
              </ThemedText>
            </View>
            <Pressable
              onPress={handleCancelWorkout}
              style={[styles.modalHeaderButton, { minWidth: 70 }]}>
              <ThemedText type="link" style={{ color: '#FF3B30', fontWeight: 'bold' }}>Discard</ThemedText>
            </Pressable>
          </View>



          {/* Active Workout Scroll Area */}
          <ScrollView
            style={styles.workoutScrollView}
            contentContainerStyle={{ paddingBottom: safeBottom + Spacing.six }}>
            {selectedRoutine?.plannedExercises.map((pe) => (
              <ThemedView
                key={pe.ID}
                type="backgroundElement"
                style={styles.workoutExerciseBlock}>
                <ThemedText type="default" style={{ fontWeight: 'bold', marginBottom: Spacing.one }}>
                  {pe.exercise?.Name}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: Spacing.two }}>
                  Planned Rest: {pe.RestTime ? `${pe.RestTime}s` : 'None'}
                </ThemedText>

                {/* Table Headers */}
                <View style={styles.tableHeaderRow}>
                  <ThemedText type="smallBold" themeColor="textSecondary" style={styles.thSet}>SET</ThemedText>
                  <ThemedText type="smallBold" themeColor="textSecondary" style={styles.thPlanned}>PLANNED</ThemedText>
                  <ThemedText type="smallBold" themeColor="textSecondary" style={styles.thWeight}>WEIGHT</ThemedText>
                  <ThemedText type="smallBold" themeColor="textSecondary" style={styles.thReps}>REPS</ThemedText>
                  <ThemedText type="smallBold" themeColor="textSecondary" style={styles.thLog}>LOG</ThemedText>
                </View>

                {/* Set Log Rows */}
                {pe.sets.map((set) => {
                  const log = workoutLogs[set.ID] || { weight: '0', reps: '10', completed: false };
                  return (
                    <View
                      key={set.ID}
                      style={[
                        styles.tableBodyRow,
                        log.completed && { backgroundColor: 'rgba(48, 209, 88, 0.15)' },
                      ]}>
                      <ThemedText type="smallBold" style={styles.tdSet}>{set.Ord}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary" style={styles.tdPlanned}>
                        {set.Reps} r {set.Notes ? `(${set.Notes})` : ''}
                      </ThemedText>
                      <TextInput
                        placeholder="0"
                        keyboardType="numeric"
                        placeholderTextColor={theme.textSecondary}
                        value={log.weight}
                        onChangeText={(val) => {
                          setWorkoutLogs((prev) => {
                            const current = prev[set.ID] || { weight: '0', reps: set.Reps.toString(), completed: false };
                            return {
                              ...prev,
                              [set.ID]: { ...current, weight: val },
                            };
                          });
                        }}
                        style={[
                          styles.workoutCellInput,
                          {
                            color: theme.text,
                            backgroundColor: theme.background,
                            borderColor: theme.backgroundSelected,
                          },
                        ]}
                      />
                      <TextInput
                        placeholder="Reps"
                        keyboardType="numeric"
                        placeholderTextColor={theme.textSecondary}
                        value={log.reps}
                        onChangeText={(val) => {
                          setWorkoutLogs((prev) => {
                            const current = prev[set.ID] || { weight: '0', reps: set.Reps.toString(), completed: false };
                            return {
                              ...prev,
                              [set.ID]: { ...current, reps: val },
                            };
                          });
                        }}
                        style={[
                          styles.workoutCellInput,
                          {
                            color: theme.text,
                            backgroundColor: theme.background,
                            borderColor: theme.backgroundSelected,
                          },
                        ]}
                      />
                      <Pressable
                        onPress={() => handleToggleSetComplete(set.ID, pe.RestTime)}
                        style={styles.checkboxBtn}>
                        <SymbolView
                          tintColor={log.completed ? '#30D158' : theme.textSecondary}
                          name={log.completed ? "checkmark.circle.fill" : "circle"}
                          size={20}
                        />
                      </Pressable>
                    </View>
                  );
                })}
              </ThemedView>
            ))}
          </ScrollView>

          {/* Floating Rest Timer Pill */}
          {restTimerActive && (
            <ThemedView type="backgroundSelected" style={styles.floatingTimerPill}>
              <SymbolView
                tintColor="#30D158"
                name="timer"
                size={18}
                style={{ marginRight: Spacing.two }}
              />
              <ThemedText type="smallBold" style={styles.floatingTimerText}>
                Rest: {restTimerSeconds}s
              </ThemedText>
              <View style={styles.dividerLine} />
              <Pressable
                onPress={() => setRestTimerActive(false)}
                style={({ pressed }) => [
                  styles.floatingTimerSkip,
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="smallBold" style={{ color: '#FF3B30' }}>Skip</ThemedText>
              </Pressable>
            </ThemedView>
          )}

          {/* Workout Footer panel */}
          <View style={[styles.bottomActionPanel, { paddingBottom: insets.bottom + Spacing.three }]}>
            <Pressable
              onPress={handleFinishWorkout}
              style={({ pressed }) => [
                styles.primaryActionButton,
                { backgroundColor: '#0A84FF' },
                pressed && styles.pressed,
              ]}>
              <ThemedText style={styles.primaryActionButtonText}>Finish Workout</ThemedText>
            </Pressable>
          </View>
        </ThemedView>
      </Modal>

      {/* MODAL: Workout History Log Detail */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isHistoryDetailVisible}
        onRequestClose={() => setIsHistoryDetailVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsHistoryDetailVisible(false)} />
          <ThemedView type="background" style={[styles.modalContent, { height: '80%' }]}>
            <View style={styles.modalHeader}>
              <Pressable
                onPress={() => setIsHistoryDetailVisible(false)}
                style={styles.modalHeaderButton}>
                <ThemedText type="linkPrimary" style={{ color: '#0A84FF' }}>Close</ThemedText>
              </Pressable>
              <ThemedText type="smallBold" style={styles.modalTitle} numberOfLines={1}>
                Workout Log Summary
              </ThemedText>
              <Pressable
                onPress={() => selectedHistory && handleDeleteHistory(selectedHistory.ID)}
                style={styles.modalHeaderButton}>
                <ThemedText type="link" style={{ color: '#FF3B30' }}>Delete</ThemedText>
              </Pressable>
            </View>

            {selectedHistory && (
              <ScrollView
                style={styles.modalScrollBody}
                contentContainerStyle={[styles.modalScrollContent, { paddingBottom: insets.bottom + Spacing.six }]}>
                <ThemedText type="subtitle" style={styles.detailTitle}>
                  {selectedHistory.routineName}
                </ThemedText>
                
                <ThemedView type="backgroundElement" style={styles.detailTextBox}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.one }}>
                    <SymbolView
                      tintColor={theme.textSecondary}
                      name="calendar"
                      size={14}
                      style={{ marginRight: Spacing.one }}
                    />
                    <ThemedText type="smallBold" themeColor="textSecondary">DATE & TIME</ThemedText>
                  </View>
                  <ThemedText type="default">
                    {new Date(selectedHistory.FinishTimestamp * 1000).toLocaleString(undefined, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </ThemedText>
                </ThemedView>

                {/* Achieved Sets list */}
                <View style={[styles.detailSection, { marginTop: Spacing.four }]}>
                  <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
                    WORKOUT STATS
                  </ThemedText>

                  {selectedHistory.actualSets.length === 0 ? (
                    <ThemedText type="small" themeColor="textSecondary">
                      No sets were logged in this session.
                    </ThemedText>
                  ) : (
                    // Group sets by Exercise Name
                    Object.entries(
                      selectedHistory.actualSets.reduce((acc, set) => {
                        if (!acc[set.exerciseName]) acc[set.exerciseName] = [];
                        acc[set.exerciseName].push(set);
                        return acc;
                      }, {} as { [exName: string]: typeof selectedHistory.actualSets })
                    ).map(([exName, sets]) => (
                      <ThemedView
                        key={exName}
                        type="backgroundElement"
                        style={styles.routineExerciseCard}>
                        <ThemedText type="smallBold" style={{ marginBottom: Spacing.two }}>{exName}</ThemedText>
                        {sets.map((set, idx) => (
                          <View key={set.ID} style={styles.setPlanRow}>
                            <ThemedText type="small" themeColor="textSecondary" style={{ width: 45 }}>
                              Set {idx + 1}:
                            </ThemedText>
                            <ThemedText type="smallBold" style={{ width: 80 }}>
                              {set.Weight} kg/lbs
                            </ThemedText>
                            <ThemedText type="small" style={{ flex: 1 }}>
                              {set.ActualReps} Reps completed
                            </ThemedText>
                          </View>
                        ))}
                      </ThemedView>
                    ))
                  )}
                </View>
              </ScrollView>
            )}
          </ThemedView>
        </View>
      </Modal>
    </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pressed: {
    opacity: 0.7,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
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
  addButton: {
    padding: Spacing.one,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 9,
    padding: 2,
    height: 32,
  },
  segment: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 7,
  },
  segmentActive: {
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.12,
        shadowRadius: 1,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.five,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: Spacing.three,
  },
  emptyButton: {
    backgroundColor: '#0A84FF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  listContainer: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
  card: {
    padding: Spacing.three,
    borderRadius: 12,
    marginBottom: Spacing.two,
    borderWidth: Platform.OS === 'web' ? 1 : 0,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
  },
  cardSubtitle: {
    marginTop: Spacing.one,
    fontSize: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  cardStartIconBtn: {
    padding: Spacing.one,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  cardActionBtn: {
    padding: Spacing.one,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeContainer: {
    overflow: 'hidden',
    borderRadius: 12,
    marginBottom: Spacing.two,
  },
  swipeActionContainer: {
    width: 80,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteSwipeBtn: {
    backgroundColor: '#FF3B30',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modal basics
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Spacing.three,
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
    padding: Spacing.three,
  },
  modalHeaderButton: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    minWidth: 60,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  modalScrollBody: {
    padding: Spacing.four,
    flex: 1,
  },
  modalScrollContent: {
    paddingBottom: Spacing.five,
  },
  floatingTimerPill: {
    position: 'absolute',
    bottom: 160,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    zIndex: 999, // Ensure it floats above the ScrollView
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  floatingTimerText: {
    fontSize: 15,
    fontWeight: '600',
  },
  dividerLine: {
    width: StyleSheet.hairlineWidth,
    height: 18,
    backgroundColor: '#C6C6C8',
    marginHorizontal: Spacing.two,
  },
  floatingTimerSkip: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  detailTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: Spacing.one,
  },
  detailDesc: {
    fontSize: 16,
    marginBottom: Spacing.four,
  },
  detailSection: {
    marginBottom: Spacing.four,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  sectionLabel: {
    fontSize: 12,
    letterSpacing: 0.5,
  },
  detailTextBox: {
    padding: Spacing.three,
    borderRadius: 10,
  },
  inlineAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.one,
  },
  routineExerciseCard: {
    padding: Spacing.three,
    borderRadius: 12,
    marginBottom: Spacing.two,
  },
  peCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    paddingBottom: Spacing.one,
    marginBottom: Spacing.one,
  },
  trashBtn: {
    padding: Spacing.one,
  },
  setPlanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.half,
  },
  bottomActionPanel: {
    padding: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#C6C6C8',
  },
  primaryActionButton: {
    flexDirection: 'row',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryActionButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 17,
  },
  // Form structures
  modalFormBody: {
    padding: Spacing.three,
  },
  formGroup: {
    marginBottom: Spacing.three,
  },
  formLabel: {
    fontSize: 12,
    letterSpacing: 0.5,
    marginBottom: Spacing.one,
  },
  inputField: {
    borderRadius: 8,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  textAreaField: {
    height: 80,
    textAlignVertical: 'top',
  },
  exerciseSelectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  selectOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectOptionActive: {
    borderWidth: 1,
  },
  setBuilderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: 8,
    marginBottom: Spacing.two,
  },
  setNumberLabel: {
    width: 20,
  },
  setRepsInput: {
    width: 60,
    paddingVertical: 6,
    textAlign: 'center',
  },
  setNotesInput: {
    flex: 1,
    paddingVertical: 6,
  },
  setDeleteBtn: {
    padding: Spacing.one,
  },
  // Active Workout View Elements
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  workoutRoutineTitle: {
    fontWeight: 'bold',
    fontSize: 24,
  },
  timerBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  timerBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  timerBannerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  timerTimerText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#30D158',
  },
  timerSkipBtn: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 8,
  },
  workoutScrollView: {
    flex: 1,
    padding: Spacing.three,
  },
  workoutExerciseBlock: {
    padding: Spacing.three,
    borderRadius: 12,
    marginBottom: Spacing.three,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    paddingBottom: 4,
    marginBottom: Spacing.one,
  },
  thSet: {
    width: 30,
  },
  thPlanned: {
    flex: 2,
  },
  thWeight: {
    width: 60,
    textAlign: 'center',
  },
  thReps: {
    width: 60,
    textAlign: 'center',
  },
  thLog: {
    width: 40,
    textAlign: 'center',
  },
  tableBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.one,
    borderRadius: 6,
    paddingHorizontal: Spacing.half,
    marginVertical: 2,
  },
  tdSet: {
    width: 30,
  },
  tdPlanned: {
    flex: 2,
  },
  workoutCellInput: {
    width: 55,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 4,
    textAlign: 'center',
    fontSize: 14,
    marginHorizontal: 3,
  },
  checkboxBtn: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBtnCompleted: {
    // Styling when completed
  },
});
