import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  AppState,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  Vibration,
  View,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { useFocusEffect } from 'expo-router';
import { useAudioPlayer } from 'expo-audio';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import Svg, { Circle } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  api,
  FullRoutine,
  FullActualRoutine,
  Exercise,
  MuscleGroup,
  getApiBaseUrl,
  setApiBaseUrl,
} from '@/services/api';


Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const getNow = () => Date.now();

function useBottomSheet(visible: boolean, onClose: () => void) {
  const translateY = useMemo(() => new Animated.Value(800), []);

  const animateOpen = useCallback(() => {
    translateY.setValue(800);
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  }, [translateY]);

  const animateClose = useCallback(() => {
    Keyboard.dismiss();
    Animated.timing(translateY, {
      toValue: 800,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  }, [translateY, onClose]);

  useEffect(() => {
    if (visible) {
      animateOpen();
    }
  }, [visible, animateOpen]);

  const panHandlers = useMemo(() => {
    const pr = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return gestureState.dy > 5;
      },
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy > 120 || gestureState.vy > 0.8) {
          Keyboard.dismiss();
          Animated.timing(translateY, {
            toValue: 800,
            duration: 220,
            useNativeDriver: true,
          }).start(() => {
            onClose();
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 40,
            friction: 6,
          }).start();
        }
      },
    });
    return pr.panHandlers;
  }, [translateY, onClose]);

  return { translateY, panHandlers, close: animateClose };
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface TableProps {
  style?: any;
  children: React.ReactNode;
}

interface RowProps {
  style?: any;
  widthArr: (number | 'flex')[];
  data: React.ReactNode[];
}

function Table({ style, children }: TableProps) {
  return <View style={style}>{children}</View>;
}

function Row({ style, widthArr, data }: RowProps) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>
      {data.map((item, idx) => {
        const widthVal = widthArr[idx];
        const cellStyle: any = { justifyContent: 'center', alignSelf: 'center' };
        if (idx !== 1) {
          cellStyle.alignItems = 'center';
        }
        if (typeof widthVal === 'number') {
          cellStyle.width = widthVal;
        } else if (widthVal === 'flex') {
          cellStyle.flex = 2;
        }
        return (
          <View key={idx} style={cellStyle}>
            {item}
          </View>
        );
      })}
    </View>
  );
}

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
  const [repUnits, setRepUnits] = useState<{ [id: number]: { name_singular: string; name_plural: string } }>({});
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals visibility
  const [isAddRoutineVisible, setIsAddRoutineVisible] = useState(false);
  const [isRoutineDetailVisible, setIsRoutineDetailVisible] = useState(false);
  const [isAddExerciseToRoutineVisible, setIsAddExerciseToRoutineVisible] = useState(false);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [isHistoryDetailVisible, setIsHistoryDetailVisible] = useState(false);
  const [isExerciseDetailVisible, setIsExerciseDetailVisible] = useState(false);

  // Selected entities
  const [selectedRoutineId, setSelectedRoutineId] = useState<number | null>(null);
  const [selectedHistory, setSelectedHistory] = useState<FullActualRoutine | null>(null);
  const [selectedExerciseForDetail, setSelectedExerciseForDetail] = useState<Exercise | null>(null);

  // Derive selectedRoutine dynamically from routines
  const selectedRoutine = useMemo(() => {
    return routines.find(r => r.ID === selectedRoutineId) || null;
  }, [routines, selectedRoutineId]);

  // Add Routine Form
  const [newRoutineName, setNewRoutineName] = useState('');
  const [newRoutineDesc, setNewRoutineDesc] = useState('');

  // Edit Routine Form
  const [editRoutineName, setEditRoutineName] = useState('');
  const [editRoutineDesc, setEditRoutineDesc] = useState('');

  // Add Planned Exercise Form
  const [selectedExerciseId, setSelectedExerciseId] = useState<number | null>(null);
  const [newRestTime, setNewRestTime] = useState('90');
  const [newPlannedExerciseNotes, setNewPlannedExerciseNotes] = useState('');
  const [plannedSets, setPlannedSets] = useState<{ reps: string; notes: string }[]>([
    { reps: '10', notes: '' },
  ]);
  const [dropdownSearchQuery, setDropdownSearchQuery] = useState('');

  // Active Workout Log State
  const [workoutStartTime, setWorkoutStartTime] = useState<number>(0);
  const [workoutDuration, setWorkoutDuration] = useState(0);
  const [workoutLogs, setWorkoutLogs] = useState<{
    [setInfoId: number]: { weight: string; reps: string; completed: boolean };
  }>({});
  const [restTimerSeconds, setRestTimerSeconds] = useState(45);
  const [restTimerActive, setRestTimerActive] = useState(false);
  const [isCustomTimerModalVisible, setIsCustomTimerModalVisible] = useState(false);
  const [timerTab, setTimerTab] = useState<'timer' | 'stopwatch'>('timer');
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [stopwatchActive, setStopwatchActive] = useState(false);
  const [timerInitialDuration, setTimerInitialDuration] = useState(45);
  const [timerAnimatedValue] = useState(() => new Animated.Value(45));
  useEffect(() => {
    Animated.timing(timerAnimatedValue, {
      toValue: restTimerSeconds,
      duration: 350,
      useNativeDriver: false,
    }).start();
  }, [restTimerSeconds, timerAnimatedValue]);

  const appState = useRef(AppState.currentState);
  const timeWentToBackgroundRef = useRef<number | null>(null);

  // Settings Modal State
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [tempServerUrl, setTempServerUrl] = useState('');
  // Audio player and notifications setup
  const player = useAudioPlayer('https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav');

  // Bottom Sheet gesture controllers
  const createRoutineSwipe = useBottomSheet(isAddRoutineVisible, () => {
    setNewRoutineName('');
    setNewRoutineDesc('');
    setIsAddRoutineVisible(false);
  });

  const routineDetailSwipe = useBottomSheet(isRoutineDetailVisible, () => {
    setIsRoutineDetailVisible(false);
    setIsAddExerciseToRoutineVisible(false);
    setDropdownSearchQuery('');
    setSelectedExerciseId(null);
    setNewPlannedExerciseNotes('');
  });

  const historyDetailSwipe = useBottomSheet(isHistoryDetailVisible, () => {
    setIsHistoryDetailVisible(false);
  });

  const settingsSwipe = useBottomSheet(isSettingsVisible, () => {
    setTempServerUrl('');
    setIsSettingsVisible(false);
  });

  const customTimerSwipe = useBottomSheet(isCustomTimerModalVisible, () => {
    setIsCustomTimerModalVisible(false);
  });

  const exerciseDetailSwipe = useBottomSheet(isExerciseDetailVisible, () => {
    setIsExerciseDetailVisible(false);
    setSelectedExerciseForDetail(null);
  });

  useEffect(() => {
    async function requestPermissions() {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
          await Notifications.requestPermissionsAsync();
        }
      } catch (err) {
        console.warn('Notifications permission request failed:', err);
      }
    }
    requestPermissions();
  }, []);
  // Fetch all data
  const fetchData = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      await api.initializeApi();
      const [routinesData, historyData, exercisesData, u1, u2, musclesData] = await Promise.all([
        api.getFullRoutines(),
        api.getFullActualRoutines(),
        api.getExercises(),
        api.getRepUnit(1).catch(() => ({ ID: 1, NameSingular: 'Rep', NamePlural: 'Reps' })),
        api.getRepUnit(2).catch(() => ({ ID: 2, NameSingular: 'Second', NamePlural: 'Seconds' })),
        api.getMuscleGroups().catch(() => [] as MuscleGroup[]),
      ]);
      setRoutines(routinesData || []);
      setHistory(historyData || []);
      setExercises(exercisesData || []);
      setRepUnits({
        [u1.ID]: { name_singular: u1.NameSingular, name_plural: u1.NamePlural },
        [u2.ID]: { name_singular: u2.NameSingular, name_plural: u2.NamePlural },
      });
      if (musclesData && musclesData.length > 0) {
        setMuscleGroups(musclesData);
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.message || 'Failed to sync with server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

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

  const triggerRestTimerEndEffects = useCallback(() => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    try {
      Vibration.vibrate([0, 500, 100, 500]);
    } catch {}

    try {
      player.seekTo(0);
      player.play();
    } catch (err) {
      console.warn('Audio play failed:', err);
    }

    try {
      Notifications.scheduleNotificationAsync({
        content: {
          title: 'Rest Over!',
          body: 'Keep going, king!',
          sound: true,
        },
        trigger: null,
      });
    } catch (err) {
      console.warn('Notification failed:', err);
    }
  }, [player]);

  // Rest Timer ticking
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (restTimerActive) {
      interval = setInterval(() => {
        setRestTimerSeconds((prev) => {
          if (prev <= 1) {
            setRestTimerActive(false);
            triggerRestTimerEndEffects();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [restTimerActive, triggerRestTimerEndEffects]);

  // Cancel scheduled notifications if rest timer becomes inactive in foreground
  useEffect(() => {
    if (!restTimerActive) {
      try {
        Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
      } catch {}
    }
  }, [restTimerActive]);

  // Handle background / phone lock timer drift and schedule background notifications
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App returned to foreground: cancel lock screen notification
        try {
          Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
        } catch {}

        if (restTimerActive && timeWentToBackgroundRef.current !== null) {
          const elapsedSecs = Math.floor((Date.now() - timeWentToBackgroundRef.current) / 1000);
          if (elapsedSecs > 0) {
            setRestTimerSeconds((prev) => {
              const remaining = prev - elapsedSecs;
              if (remaining <= 0) {
                setRestTimerActive(false);
                setTimeout(() => {
                  triggerRestTimerEndEffects();
                }, 100);
                return 0;
              }
              return remaining;
            });
          }
        }
        timeWentToBackgroundRef.current = null;
      } else if (nextAppState.match(/inactive|background/)) {
        // App entering background / lock screen: capture time and schedule local notification
        if (restTimerActive && restTimerSeconds > 0) {
          timeWentToBackgroundRef.current = Date.now();
          try {
            Notifications.scheduleNotificationAsync({
              content: {
                title: 'Rest Over!',
                body: 'Keep going, king!',
                sound: true,
              },
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: restTimerSeconds,
                repeats: false,
              },
            }).catch(() => {});
          } catch {}
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [restTimerActive, restTimerSeconds, triggerRestTimerEndEffects]);

  // Stopwatch ticking
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (stopwatchActive) {
      const startTime = Date.now() - stopwatchTime;
      interval = setInterval(() => {
        setStopwatchTime(Date.now() - startTime);
      }, 10);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopwatchActive]);

  const formatStopwatch = (ms: number) => {
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    const cent = Math.floor((ms % 1000) / 10);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(min)}:${pad(sec)}.${pad(cent)}`;
  };

  const formatTimer = (totalSeconds: number) => {
    const min = Math.floor(totalSeconds / 60);
    const sec = totalSeconds % 60;
    return `${min}:${String(sec).padStart(2, '0')}`;
  };



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
      createRoutineSwipe.close();
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
      notes: newPlannedExerciseNotes.trim() || null,
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
      setNewPlannedExerciseNotes('');
      setPlannedSets([{ reps: '10', notes: '' }]);
      setDropdownSearchQuery('');
      fetchData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add exercise');
    }
  };

  // Open routine detail handler
  const handleOpenRoutineDetail = (routine: FullRoutine) => {
    setSelectedRoutineId(routine.ID);
    setEditRoutineName(routine.Name);
    setEditRoutineDesc(routine.Description || '');
    setIsAddExerciseToRoutineVisible(false);
    setDropdownSearchQuery('');
    setSelectedExerciseId(null);
    setIsRoutineDetailVisible(true);
  };

  // Update routine handler
  const handleUpdateRoutine = async () => {
    if (!selectedRoutine) return;
    if (!editRoutineName.trim()) {
      Alert.alert('Error', 'Routine name cannot be empty');
      return;
    }

    try {
      await api.updateRoutine(selectedRoutine.ID, {
        name: editRoutineName.trim(),
        description: editRoutineDesc.trim(),
        image_id: selectedRoutine.ImageID,
      });
      fetchData();
      Alert.alert('Success', 'Routine updated successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update routine');
    }
  };

  // Remove planned exercise handler
  // Remove planned exercise handler
  const handleRemovePlannedExercise = useCallback(async (peId: number) => {
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
  }, [fetchData]);

  const renderPlannedExerciseSwipeActions = useCallback((peId: number) => (
    <View style={styles.swipeActionContainer}>
      <Pressable
        onPress={() => handleRemovePlannedExercise(peId)}
        style={({ pressed }) => [
          styles.deleteSwipeBtn,
          pressed && styles.pressed,
        ]}>
        <SymbolView tintColor="#FFFFFF" name="trash.fill" size={16} />
      </Pressable>
    </View>
  ), [handleRemovePlannedExercise]);

  const renderPlannedSetSwipeActions = useCallback((idx: number) => (
    <View style={styles.swipeActionContainer}>
      <Pressable
        onPress={() => {
          if (plannedSets.length === 1) return;
          setPlannedSets((prev) => prev.filter((_, i) => i !== idx));
        }}
        style={({ pressed }) => [
          styles.deleteSwipeBtn,
          pressed && styles.pressed,
        ]}>
        <SymbolView tintColor="#FFFFFF" name="trash.fill" size={16} />
      </Pressable>
    </View>
  ), [plannedSets.length]);

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
        start_timestamp: Math.floor(workoutStartTime / 1000),
        finish_timestamp: Math.floor(Date.now() / 1000),
      });

      setIsWorkoutActive(false);
      setSelectedRoutineId(null);
      setRestTimerActive(false);
      setRestTimerSeconds(0);
      
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
            setRestTimerActive(false);
            setRestTimerSeconds(0);
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
              historyDetailSwipe.close();
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
                  handleOpenRoutineDetail(item);
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

    const renderSwipeActions = () => (
      <View style={styles.swipeActionContainer}>
        <Pressable
          onPress={() => handleDeleteHistory(item.ID)}
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
                {item.routineName}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.cardSubtitle}>
                {formattedDate}
              </ThemedText>
            </View>
            <Pressable
              onPress={() => {
                setSelectedHistory(item);
                setIsHistoryDetailVisible(true);
              }}
              style={({ pressed }) => [
                styles.cardStartIconBtn,
                pressed && styles.pressed,
              ]}>
              <SymbolView
                tintColor="#0A84FF"
                name="chevron.right.circle.fill"
                size={28}
              />
            </Pressable>
          </View>
          <View style={styles.cardFooter}>
            <SymbolView
              tintColor="#0A84FF"
              name="checkmark.circle.fill"
              size={14}
              style={{ marginRight: Spacing.one }}
            />
            <ThemedText type="small" themeColor="textSecondary">
              Completed {item.actualSets.length} sets
            </ThemedText>
          </View>
        </View>
      </Swipeable>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      {/* Header with Segmented Control */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <ThemedText type="subtitle" style={styles.headerTitle}>
            Workouts
          </ThemedText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
              <Pressable
                onPress={() => {
                  setTempServerUrl(getApiBaseUrl());
                  setIsSettingsVisible(true);
                }}
                style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
                <SymbolView
                  tintColor={theme.textSecondary}
                  name="gearshape.fill"
                  size={28}
                />
              </Pressable>
              <Pressable
                onPress={() => {
                  setIsAddRoutineVisible(true);
                }}
                style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
                <SymbolView
                  tintColor="#0A84FF"
                  name="plus.circle.fill"
                  size={28}
                />
              </Pressable>
          </View>
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
        animationType="none"
        transparent={true}
        visible={isAddRoutineVisible}
        onRequestClose={createRoutineSwipe.close}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={createRoutineSwipe.close} />
          <Animated.View 
            style={[
              styles.modalContent,
              {
                height: '80%',
                backgroundColor: theme.background,
                transform: [{ translateY: createRoutineSwipe.translateY }]
              }
            ]}>
            <View {...createRoutineSwipe.panHandlers}>
              <View style={styles.dragHandleContainer}>
                <View style={styles.dragHandle} />
              </View>
              <View style={styles.modalHeader}>
                <Pressable
                  onPress={createRoutineSwipe.close}
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
            </View>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1 }}>
              <Pressable onPress={Keyboard.dismiss} style={{ width: '100%', flex: 1 }}>
                <View style={styles.modalFormBody}>
                  <View style={styles.formGroup}>
                    <ThemedText type="smallBold" themeColor="textSecondary" style={styles.formLabel}>
                      ROUTINE NAME
                    </ThemedText>
                    <TextInput
                      placeholder="e.g. Hypertrophy A"
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
                      ROUTINE DESCRIPTION
                    </ThemedText>
                    <TextInput
                      placeholder="e.g. Focus on chest and arms"
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
              </Pressable>
            </KeyboardAvoidingView>
          </Animated.View>
        </View>
      </Modal>

      {/* MODAL: Routine Detail */}
      <Modal
        animationType="none"
        transparent={true}
        visible={isRoutineDetailVisible}
        onRequestClose={routineDetailSwipe.close}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={routineDetailSwipe.close} />
          <Animated.View 
            style={[
              styles.modalContent,
              {
                height: '80%',
                backgroundColor: theme.background,
                transform: [{ translateY: routineDetailSwipe.translateY }]
              }
            ]}>
            <View {...routineDetailSwipe.panHandlers}>
                <View style={styles.dragHandleContainer}>
                  <View style={styles.dragHandle} />
                </View>
                <View style={styles.modalHeader}>
                  {isAddExerciseToRoutineVisible ? (
                    <Pressable
                      onPress={() => {
                        setIsAddExerciseToRoutineVisible(false);
                        setDropdownSearchQuery('');
                        setSelectedExerciseId(null);
                        setNewPlannedExerciseNotes('');
                      }}
                      style={styles.modalHeaderButton}>
                      <ThemedText type="link" themeColor="textSecondary">
                        Back
                      </ThemedText>
                    </Pressable>
                  ) : (
                    <Pressable
                      onPress={routineDetailSwipe.close}
                      style={styles.modalHeaderButton}>
                      <ThemedText type="link" themeColor="textSecondary">
                        Cancel
                      </ThemedText>
                    </Pressable>
                  )}
                  <ThemedText type="smallBold" style={styles.modalTitle} numberOfLines={1}>
                    {isAddExerciseToRoutineVisible ? 'Add Exercise' : 'Workout Plan'}
                  </ThemedText>
                  {isAddExerciseToRoutineVisible ? (
                    <Pressable onPress={handleAddExerciseToRoutine} style={styles.modalHeaderButton}>
                      <ThemedText type="linkPrimary" style={{ color: '#0A84FF', fontWeight: 'bold' }}>Save</ThemedText>
                    </Pressable>
                  ) : (
                    <Pressable onPress={handleUpdateRoutine} style={styles.modalHeaderButton}>
                      <ThemedText type="linkPrimary" style={{ color: '#0A84FF', fontWeight: 'bold' }}>Save</ThemedText>
                    </Pressable>
                  )}
                </View>
            </View>

            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1 }}>
              {selectedRoutine && (
                <View style={{ flex: 1 }}>
                  {!isAddExerciseToRoutineVisible ? (
                    <ScrollView
                      style={styles.modalScrollBody}
                      contentContainerStyle={[styles.modalScrollContent, { paddingBottom: insets.bottom + Spacing.six }]}>
                      
                      {/* Editable Routine Name */}
                      <View style={styles.formGroup}>
                        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.formLabel}>
                          ROUTINE NAME
                        </ThemedText>
                        <TextInput
                          placeholder="Routine Name"
                          placeholderTextColor={theme.textSecondary}
                          value={editRoutineName}
                          onChangeText={setEditRoutineName}
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

                      {/* Editable Description */}
                      <View style={styles.formGroup}>
                        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.formLabel}>
                          DESCRIPTION
                        </ThemedText>
                        <TextInput
                          placeholder="Optional description"
                          placeholderTextColor={theme.textSecondary}
                          value={editRoutineDesc}
                          onChangeText={setEditRoutineDesc}
                          style={[
                            styles.inputField,
                            styles.textAreaField,
                            {
                              backgroundColor: theme.backgroundElement,
                              color: theme.text,
                              borderColor: theme.backgroundSelected,
                              height: 60,
                            },
                          ]}
                          multiline
                          numberOfLines={2}
                        />
                      </View>

                      {/* Planned Exercises Section */}
                      <View style={styles.detailSection}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.one }}>
                          <ThemedText type="smallBold" themeColor="textSecondary" style={[styles.formLabel, { marginBottom: 0 }]}>
                            EXERCISES
                          </ThemedText>
                          <Pressable
                            onPress={() => setIsAddExerciseToRoutineVisible(true)}
                            style={({ pressed }) => [pressed && styles.pressed, { padding: 4 }]}>
                            <SymbolView
                              tintColor="#0A84FF"
                              name="plus.circle"
                              size={22}
                            />
                          </Pressable>
                        </View>
                        {selectedRoutine.plannedExercises.length === 0 ? (
                          <ThemedView type="backgroundElement" style={styles.detailTextBox}>
                            <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
                              {"No exercises added to this routine yet."}
                            </ThemedText>
                          </ThemedView>
                          ) : (
                          selectedRoutine.plannedExercises.map((pe) => (
                            <Swipeable
                              key={pe.ID}
                              renderLeftActions={() => renderPlannedExerciseSwipeActions(pe.ID)}
                              containerStyle={[styles.swipeContainer, { borderRadius: 10, marginBottom: Spacing.two }]}>
                              <Pressable onPress={Keyboard.dismiss}>
                                <ThemedView
                                  type="backgroundElement"
                                  style={[styles.appleListGroup, { marginBottom: 0 }]}>
                                  {/* Header Row */}
                                  <View style={[
                                    styles.appleListRow,
                                    {
                                      borderBottomWidth: pe.sets.length > 0 ? StyleSheet.hairlineWidth : 0,
                                      borderBottomColor: theme.backgroundSelected
                                    }
                                  ]}>
                                    <View style={{ flex: 1 }}>
                                      <ThemedText type="small" style={{ fontWeight: 'bold', fontSize: 16 }}>
                                        {pe.exercise?.name || 'Exercise'}
                                      </ThemedText>
                                      {(() => {
                                        const mgIds = pe.exercise?.muscle_group_ids;
                                        if (mgIds && mgIds.length > 0) {
                                          const names = mgIds.map((id: number) => muscleGroups.find(g => g.ID === id)?.Name).filter(Boolean).join(', ');
                                          return names ? (
                                            <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12, marginTop: 1 }}>
                                              {names}
                                            </ThemedText>
                                          ) : null;
                                        }
                                        return null;
                                      })()}
                                      {pe.Notes ? (
                                        <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12, fontStyle: 'italic', marginTop: 1 }}>
                                          Notes: {pe.Notes}
                                        </ThemedText>
                                      ) : null}
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                      <SymbolView name="timer" tintColor={theme.textSecondary} size={13} style={{ marginRight: 4 }} />
                                      <ThemedText type="small" themeColor="textSecondary" style={{ fontWeight: '500' }}>
                                        {pe.RestTime ? `${pe.RestTime}s` : 'None'}
                                      </ThemedText>
                                    </View>
                                  </View>

                                  {/* Sets Rows */}
                                  {pe.sets.map((set, idx) => {
                                    const isLast = idx === pe.sets.length - 1;
                                    return (
                                      <View
                                        key={set.ID}
                                        style={[
                                          styles.appleListRow,
                                          { paddingVertical: 8, minHeight: 34 },
                                          !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.backgroundSelected }
                                        ]}>
                                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                                          <ThemedText type="small" themeColor="textSecondary" style={{ width: 45 }}>
                                            S{set.Ord}
                                          </ThemedText>
                                          {set.Notes ? (
                                            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1} style={{ flex: 1, fontSize: 12, fontStyle: 'italic' }}>
                                              ({set.Notes})
                                            </ThemedText>
                                          ) : null}
                                        </View>
                                        <ThemedText type="small" themeColor="textSecondary">
                                          {set.Reps} {repUnits[pe.exercise?.rep_unit_id ?? 1]?.name_plural || 'Reps'}
                                        </ThemedText>
                                      </View>
                                    );
                                  })}
                                </ThemedView>
                              </Pressable>
                            </Swipeable>
                          ))
                        )}
                      </View>
                    </ScrollView>
                  ) : (
                    <ScrollView 
                      style={styles.modalFormBody}
                      keyboardShouldPersistTaps="handled"
                      keyboardDismissMode="on-drag"
                      contentContainerStyle={[styles.modalScrollContent, { paddingBottom: insets.bottom + Spacing.six + 100 }]}>
                      <Pressable onPress={Keyboard.dismiss} style={{ width: '100%', flexGrow: 1 }}>
                        {/* Exercise Selector */}
                      <View style={styles.formGroup}>
                        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.formLabel}>
                          SELECT EXERCISE *
                        </ThemedText>

                          <View style={styles.dropdownContainer}>
                            {selectedExerciseId !== null ? (
                              <ThemedView type="backgroundElement" style={[styles.appleListRow, { borderRadius: 8, overflow: 'hidden' }]}>
                                <View style={{ flex: 1 }}>
                                  <ThemedText type="small" style={{ fontWeight: 'bold', fontSize: 16 }}>
                                    {exercises.find(e => e.id === selectedExerciseId)?.name}
                                  </ThemedText>
                                  {(() => {
                                    const ex = exercises.find(e => e.id === selectedExerciseId);
                                    const mgIds = ex?.muscle_group_ids;
                                    if (mgIds && mgIds.length > 0) {
                                      const names = mgIds.map((id: number) => muscleGroups.find(g => g.ID === id)?.Name).filter(Boolean).join(', ');
                                      return names ? (
                                        <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12, marginTop: 1 }}>
                                          {names}
                                        </ThemedText>
                                      ) : null;
                                    }
                                    return null;
                                  })()}
                                </View>
                                <Pressable
                                  onPress={() => {
                                    setSelectedExerciseId(null);
                                    setDropdownSearchQuery('');
                                  }}
                                  style={({ pressed }) => [
                                    pressed && styles.pressed,
                                    {
                                      padding: 6,
                                    }
                                  ]}>
                                  <SymbolView name="arrow.triangle.2.circlepath" tintColor="#0A84FF" size={18} />
                                </Pressable>
                              </ThemedView>
                            ) : (
                              <View>
                                <View style={[
                                  styles.dropdownSearchContainer,
                                  {
                                    backgroundColor: theme.backgroundElement,
                                    borderColor: theme.backgroundSelected,
                                    borderWidth: 1,
                                    borderRadius: 8,
                                  }
                                ]}>
                                  <SymbolView
                                    name="magnifyingglass"
                                    tintColor={theme.textSecondary}
                                    size={14}
                                    style={styles.dropdownSearchIcon}
                                  />
                                  <TextInput
                                    placeholder="Search exercises..."
                                    placeholderTextColor={theme.textSecondary}
                                    value={dropdownSearchQuery}
                                    onChangeText={setDropdownSearchQuery}
                                    style={[styles.dropdownSearchInput, { color: theme.text }]}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                  />
                                  {dropdownSearchQuery ? (
                                    <Pressable 
                                      onPress={() => setDropdownSearchQuery('')} 
                                      style={styles.dropdownClearSearch}>
                                      <SymbolView
                                        name="xmark.circle.fill"
                                        tintColor={theme.textSecondary}
                                        size={14}
                                      />
                                    </Pressable>
                                  ) : null}
                                </View>

                                {dropdownSearchQuery.trim() !== '' && (
                                  <View style={[
                                    styles.dropdownMenu,
                                    {
                                      backgroundColor: theme.backgroundElement,
                                      borderColor: theme.backgroundSelected,
                                      marginTop: Spacing.one,
                                    }
                                  ]}>
                                    <ScrollView 
                                      nestedScrollEnabled={true}
                                      keyboardShouldPersistTaps="handled"
                                      style={styles.dropdownList}
                                      contentContainerStyle={{ paddingVertical: Spacing.one }}>
                                      {(() => {
                                        const filtered = exercises.filter(e =>
                                          e.name.toLowerCase().includes(dropdownSearchQuery.toLowerCase())
                                        );
                                        if (filtered.length === 0) {
                                          return (
                                            <View style={{ padding: Spacing.three, alignItems: 'center' }}>
                                              <ThemedText type="small" themeColor="textSecondary">
                                                No exercises match your search
                                              </ThemedText>
                                            </View>
                                          );
                                        }
                                        return filtered.map(ex => {
                                          return (
                                            <Pressable
                                              key={ex.id}
                                              onPress={() => {
                                                setSelectedExerciseId(ex.id);
                                                setDropdownSearchQuery(ex.name);
                                                Keyboard.dismiss();
                                              }}
                                              style={styles.dropdownItem}>
                                              <View style={{ flex: 1 }}>
                                                <ThemedText type="smallBold">
                                                  {ex.name}
                                                </ThemedText>
                                              </View>
                                              <SymbolView
                                                name="checkmark.circle.fill"
                                                tintColor="#0A84FF"
                                                size={22}
                                              />
                                            </Pressable>
                                          );
                                        });
                                      })()}
                                    </ScrollView>
                                  </View>
                                )}
                              </View>
                            )}
                          </View>
                      </View>

                      {/* Rest Time (Clean Table-like Row) */}
                      <View style={styles.formGroup}>
                        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.formLabel}>
                          OPTIONS
                        </ThemedText>
                        <ThemedView type="backgroundElement" style={styles.appleListGroup}>
                          <View style={styles.appleListRow}>
                            <ThemedText type="small" style={{ fontWeight: '500' }}>Rest Time</ThemedText>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <TextInput
                                placeholder="90"
                                keyboardType="numeric"
                                placeholderTextColor={theme.textSecondary}
                                value={newRestTime}
                                onChangeText={setNewRestTime}
                                style={{
                                  color: theme.text,
                                  textAlign: 'center',
                                  fontSize: 14,
                                  paddingHorizontal: Spacing.one,
                                  backgroundColor: theme.background,
                                  borderColor: theme.backgroundSelected,
                                  borderWidth: 1,
                                  borderRadius: 6,
                                  minWidth: 50,
                                  height: 26,
                                  marginRight: 4,
                                  fontWeight: 'normal',
                                }}
                              />
                              <ThemedText type="small" themeColor="textSecondary">sec</ThemedText>
                            </View>
                          </View>
                        </ThemedView>
                      </View>

                      {/* Notes (Separate Section) */}
                      <View style={styles.formGroup}>
                        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.formLabel}>
                          NOTES
                        </ThemedText>
                        <TextInput
                          placeholder="Optional notes..."
                          placeholderTextColor={theme.textSecondary}
                          value={newPlannedExerciseNotes}
                          onChangeText={setNewPlannedExerciseNotes}
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

                      {/* Sets Builder */}
                      <View style={styles.formGroup}>
                        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.formLabel}>
                          PLANNED SETS
                        </ThemedText>

                        {(() => {
                          const selectedEx = exercises.find(ex => ex.id === selectedExerciseId);
                          const unitName = selectedEx ? (repUnits[selectedEx.rep_unit_id]?.name_plural || 'Reps') : 'Reps';

                          return (
                            <ThemedView type="backgroundElement" style={styles.appleListGroup}>
                              {plannedSets.map((s, idx) => {
                                const isLast = idx === plannedSets.length - 1;
                                return (
                                  <Swipeable
                                    key={idx}
                                    renderLeftActions={plannedSets.length > 1 ? () => renderPlannedSetSwipeActions(idx) : undefined}
                                    containerStyle={{ overflow: 'hidden' }}>
                                    <View style={[
                                      styles.appleListRow,
                                      { backgroundColor: theme.backgroundElement },
                                      !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.backgroundSelected }
                                    ]}>
                                      <ThemedText type="smallBold" style={{ width: 30, color: theme.textSecondary }}>
                                        S{idx + 1}
                                      </ThemedText>

                                      <TextInput
                                        placeholder={unitName}
                                        keyboardType="numeric"
                                        value={s.reps}
                                        placeholderTextColor={theme.textSecondary}
                                        onChangeText={(val) => {
                                          const newSets = [...plannedSets];
                                          newSets[idx].reps = val;
                                          setPlannedSets(newSets);
                                        }}
                                        style={{
                                          width: 50,
                                          color: theme.text,
                                          fontSize: 16,
                                          padding: 0,
                                          textAlign: 'center',
                                          backgroundColor: theme.background,
                                          borderColor: theme.backgroundSelected,
                                          borderWidth: 1,
                                          borderRadius: 8,
                                          height: 34,
                                          marginRight: Spacing.one,
                                          fontWeight: '600',
                                        }}
                                      />
                                      <ThemedText type="default" themeColor="textSecondary" style={{ marginRight: Spacing.four, fontSize: 14 }}>
                                        {unitName}
                                      </ThemedText>

                                      <TextInput
                                        placeholder="Notes"
                                        value={s.notes}
                                        placeholderTextColor={theme.textSecondary}
                                        onChangeText={(val) => {
                                          const newSets = [...plannedSets];
                                          newSets[idx].notes = val;
                                          setPlannedSets(newSets);
                                        }}
                                        style={{
                                          flex: 1,
                                          color: theme.text,
                                          fontSize: 14,
                                          paddingHorizontal: Spacing.two,
                                          backgroundColor: theme.background,
                                          borderColor: theme.backgroundSelected,
                                          borderWidth: 1,
                                          borderRadius: 8,
                                          height: 34,
                                        }}
                                      />
                                    </View>
                                  </Swipeable>
                                );
                              })}

                              {/* Add Set Row */}
                              <Pressable
                                onPress={() => setPlannedSets((prev) => [...prev, { reps: '10', notes: '' }])}
                                style={({ pressed }) => [
                                  styles.appleListRow,
                                  { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.backgroundSelected },
                                  pressed && styles.pressed,
                                ]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                  <SymbolView name="plus.circle" tintColor="#0A84FF" size={20} style={{ marginRight: 8 }} />
                                  <ThemedText type="default" style={{ color: '#0A84FF', fontWeight: '500', fontSize: 16 }}>Add Set</ThemedText>
                                </View>
                              </Pressable>
                            </ThemedView>
                          );
                        })()}
                      </View>
                    </Pressable>
                    </ScrollView>
                  )}
                </View>
              )}
            </KeyboardAvoidingView>
          </Animated.View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={false}
        visible={isWorkoutActive}
        onRequestClose={handleCancelWorkout}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}>
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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
                <Pressable
                  onPress={() => setIsCustomTimerModalVisible(true)}
                  style={({ pressed }) => [styles.modalHeaderButton, pressed && styles.pressed, { minWidth: 44, height: 44, alignItems: 'center', justifyContent: 'center' }]}>
                  <SymbolView
                    name="timer"
                    tintColor={theme.textSecondary}
                    size={28}
                  />
                </Pressable>
                <Pressable
                  onPress={handleCancelWorkout}
                  style={({ pressed }) => [styles.modalHeaderButton, pressed && styles.pressed, { minWidth: 44, height: 44, alignItems: 'center', justifyContent: 'center' }]}>
                  <SymbolView
                    name="trash.fill"
                    tintColor="#FF3B30"
                    size={28}
                  />
                </Pressable>
              </View>
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
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <ThemedText type="default" style={{ fontWeight: 'bold', color: theme.text, fontSize: 18, flex: 1, marginRight: Spacing.two }}>
                      {pe.exercise?.name}
                    </ThemedText>
                    <Pressable
                      onPress={() => {
                        const exerciseId = pe.exercise?.id || pe.ExerciseID;
                        const fullExercise = exercises.find(e => e.id === exerciseId);
                        if (fullExercise) {
                          setSelectedExerciseForDetail(fullExercise);
                          setIsExerciseDetailVisible(true);
                        } else if (pe.exercise) {
                          setSelectedExerciseForDetail(pe.exercise);
                          setIsExerciseDetailVisible(true);
                        }
                      }}
                      style={({ pressed }) => [pressed && styles.pressed, { padding: 4 }]}>
                      <SymbolView name="info.circle" tintColor="#0A84FF" size={20} />
                    </Pressable>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.three }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <SymbolView name="timer" tintColor={theme.textSecondary} size={13} style={{ marginRight: 4 }} />
                      <ThemedText type="small" themeColor="textSecondary" style={{ fontWeight: '500' }}>
                        {pe.RestTime ? `${pe.RestTime}s` : 'None'}
                      </ThemedText>
                    </View>
                    {pe.Notes ? (
                      <ThemedText type="small" themeColor="textSecondary" style={{ fontStyle: 'italic', fontSize: 13 }}>
                        {pe.Notes}
                      </ThemedText>
                    ) : null}
                  </View>

                  {/* Table Headers */}
                  {/* Table Headers */}
                  <Row
                    style={styles.tableHeaderRow}
                    widthArr={[30, 'flex', 60, 60, 40]}
                    data={[
                      <ThemedText key="h-set" type="smallBold" themeColor="textSecondary" style={styles.thSet}>SET</ThemedText>,
                      <ThemedText key="h-plan" type="smallBold" themeColor="textSecondary" style={styles.thPlanned}>PLANNED</ThemedText>,
                      <ThemedText key="h-weight" type="smallBold" themeColor="textSecondary" style={styles.thWeight}>WEIGHT</ThemedText>,
                      <ThemedText key="h-reps" type="smallBold" themeColor="textSecondary" style={styles.thReps}>
                        {(repUnits[pe.exercise?.rep_unit_id ?? 1]?.name_plural || 'Reps').toUpperCase()}
                      </ThemedText>,
                      <ThemedText key="h-log" type="smallBold" themeColor="textSecondary" style={styles.thLog}>LOG</ThemedText>
                    ]}
                  />

                  {/* Set Log Rows */}
                  <Table>
                    {pe.sets.map((set) => {
                      const log = workoutLogs[set.ID] || { weight: '0', reps: '10', completed: false };
                      return (
                        <Row
                          key={set.ID}
                          style={[
                            styles.tableBodyRow,
                            log.completed && { backgroundColor: 'rgba(48, 209, 88, 0.15)' },
                          ]}
                          widthArr={[30, 'flex', 60, 60, 40]}
                          data={[
                            <ThemedText key="b-set" type="smallBold" style={styles.tdSet}>{set.Ord}</ThemedText>,
                            <ThemedText key="b-plan" type="small" themeColor="textSecondary" style={styles.tdPlanned}>
                              {set.Reps} {repUnits[pe.exercise?.rep_unit_id ?? 1]?.name_plural || ''} {set.Notes ? `(${set.Notes})` : ''}
                            </ThemedText>,
                            <TextInput
                              key="b-weight"
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
                                  width: 54,
                                  marginHorizontal: 0,
                                  color: theme.text,
                                  backgroundColor: theme.background,
                                  borderColor: theme.backgroundSelected,
                                },
                              ]}
                            />,
                            <TextInput
                              key="b-reps"
                              placeholder={repUnits[pe.exercise?.rep_unit_id ?? 1]?.name_plural || 'Reps'}
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
                                  width: 54,
                                  marginHorizontal: 0,
                                  color: theme.text,
                                  backgroundColor: theme.background,
                                  borderColor: theme.backgroundSelected,
                                },
                              ]}
                            />,
                            <Pressable
                              key="b-log"
                              onPress={() => handleToggleSetComplete(set.ID, pe.RestTime)}
                              style={styles.checkboxBtn}>
                              <SymbolView
                                tintColor={log.completed ? '#30D158' : theme.textSecondary}
                                name={log.completed ? 'checkmark.circle.fill' : 'circle'}
                                size={22}
                              />
                            </Pressable>
                          ]}
                        />
                      );
                    })}
                  </Table>
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
          <View style={[styles.bottomActionPanel, { paddingBottom: insets.bottom }]}>
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

          {/* MODAL: Custom Rest Timer (Bottom Sheet) */}
          <Modal
            animationType="none"
            transparent={true}
            visible={isCustomTimerModalVisible}
            onRequestClose={customTimerSwipe.close}>
            <View style={styles.modalOverlay}>
              <Pressable style={StyleSheet.absoluteFill} onPress={customTimerSwipe.close} />
              <Animated.View 
                style={[
                  styles.modalContent,
                  {
                    height: '60%',
                    backgroundColor: theme.background,
                    transform: [{ translateY: customTimerSwipe.translateY }]
                  }
                ]}>
                  <View {...customTimerSwipe.panHandlers}>
                    <View style={styles.dragHandleContainer}>
                      <View style={styles.dragHandle} />
                    </View>
                    <View style={styles.modalHeader}>
                      <View style={styles.modalHeaderButton} />
                      <ThemedText type="smallBold" style={styles.modalTitle}>
                        Clock & Timer
                      </ThemedText>
                    </View>
                  </View>

                  <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}>

                  {/* Segmented Control */}
                  <View style={styles.segmentedContainer}>
                    <Pressable 
                      onPress={() => setTimerTab('timer')}
                      style={[
                        styles.segmentedTab, 
                        timerTab === 'timer' && { backgroundColor: theme.backgroundSelected }
                      ]}>
                      <ThemedText type="smallBold" style={{ color: timerTab === 'timer' ? '#0A84FF' : theme.textSecondary }}>
                        Timer
                      </ThemedText>
                    </Pressable>
                    <Pressable 
                      onPress={() => setTimerTab('stopwatch')}
                      style={[
                        styles.segmentedTab, 
                        timerTab === 'stopwatch' && { backgroundColor: theme.backgroundSelected }
                      ]}>
                      <ThemedText type="smallBold" style={{ color: timerTab === 'stopwatch' ? '#0A84FF' : theme.textSecondary }}>
                        Stopwatch
                      </ThemedText>
                    </Pressable>
                  </View>

                  <Pressable onPress={Keyboard.dismiss} style={{ width: '100%', flex: 1 }}>
                    <ScrollView 
                      style={styles.modalFormBody}
                      contentContainerStyle={{ paddingBottom: 40 }}>
                      {timerTab === 'timer' ? (
                        <View style={{ alignItems: 'center', width: '100%' }}>
                          {/* Timer Tab Circle display with base-aligned side controls */}
                          <View style={styles.timerCircleRow}>
                                <Pressable
                                  onPress={() => {
                                    setRestTimerSeconds((prev) => {
                                      const newVal = Math.max(0, prev - 15);
                                      if (restTimerActive) {
                                        setTimerInitialDuration((d) => Math.max(newVal, d - 15));
                                      } else {
                                        setTimerInitialDuration(newVal);
                                      }
                                      if (newVal === 0) setRestTimerActive(false);
                                      return newVal;
                                    });
                                  }}
                                  style={({ pressed }) => [styles.sideAdjustBtn, pressed && styles.pressed]}>
                                  <ThemedText type="smallBold" style={{ color: '#0A84FF', fontSize: 15 }}>-15s</ThemedText>
                                </Pressable>

                                 <View style={styles.circleContainer}>
                                  {(() => {
                                    const radius = 82;
                                    const circumference = 2 * Math.PI * radius;
                                    const maxDuration = Math.max(1, timerInitialDuration);
                                    const strokeDashoffset = timerAnimatedValue.interpolate({
                                      inputRange: [0, maxDuration],
                                      outputRange: [circumference, 0],
                                      extrapolate: 'clamp',
                                    });

                                    return (
                                      <>
                                        <Svg width={170} height={170} style={[StyleSheet.absoluteFill, { transform: [{ rotate: '90deg' }, { scaleX: -1 }] }]}>
                                          {/* Gray background outline */}
                                          <Circle
                                            cx={85}
                                            cy={85}
                                            r={radius}
                                            stroke="#8E8E93"
                                            strokeWidth={6}
                                            fill="transparent"
                                            opacity={0.2}
                                          />
                                          {/* Blue active progress outline */}
                                          <AnimatedCircle
                                            cx={85}
                                            cy={85}
                                            r={radius}
                                            stroke="#0A84FF"
                                            strokeWidth={6}
                                            fill="transparent"
                                            strokeDasharray={circumference}
                                            strokeDashoffset={strokeDashoffset}
                                            strokeLinecap="round"
                                          />
                                        </Svg>
                                        <View style={styles.circleContent}>
                                          <ThemedText style={{ 
                                            color: theme.text, 
                                            fontSize: 38, 
                                            fontWeight: '700', 
                                            lineHeight: 46, 
                                            textAlign: 'center',
                                            fontVariant: ['tabular-nums']
                                          }}>
                                            {formatTimer(restTimerSeconds)}
                                          </ThemedText>
                                        </View>
                                      </>
                                    );
                                  })()}
                                </View>

                                <Pressable
                                  onPress={() => {
                                    setRestTimerSeconds((prev) => {
                                      const newVal = prev + 15;
                                      if (restTimerActive) {
                                        setTimerInitialDuration((d) => d + 15);
                                      } else {
                                        setTimerInitialDuration(newVal);
                                      }
                                      return newVal;
                                    });
                                  }}
                                  style={({ pressed }) => [styles.sideAdjustBtn, pressed && styles.pressed]}>
                                  <ThemedText type="smallBold" style={{ color: '#0A84FF', fontSize: 15 }}>+15s</ThemedText>
                                </Pressable>
                              </View>

                          {/* Primary start/stop/pause button */}
                          <Pressable
                            onPress={() => {
                              if (restTimerActive) {
                                setRestTimerActive(false);
                              } else {
                                if (restTimerSeconds > 0) {
                                  setRestTimerActive(true);
                                }
                              }
                            }}
                            style={({ pressed }) => [
                              styles.primaryTimerBtn,
                              { 
                                backgroundColor: restTimerActive 
                                  ? theme.backgroundElement 
                                  : '#0A84FF' 
                              },
                              pressed && styles.pressed
                            ]}>
                            <ThemedText style={{ 
                              color: restTimerActive ? '#0A84FF' : '#FFFFFF', 
                              fontWeight: 'bold', 
                              fontSize: 16 
                            }}>
                              {restTimerActive ? 'Pause' : 'Start'}
                            </ThemedText>
                          </Pressable>
                        </View>
                      ) : (
                        <View style={{ alignItems: 'center', width: '100%' }}>
                          {/* Stopwatch Tab Circle display with spacers to center the circle */}
                          <View style={styles.timerCircleRow}>
                            <View style={styles.sideAdjustBtn} />
                            
                            <View style={styles.circleContainer}>
                              <View style={[styles.circleOutline, { borderColor: '#8E8E93' }]} />
                              <View style={styles.circleContent}>
                                <ThemedText style={{ 
                                  color: theme.text, 
                                  fontSize: 30, 
                                  fontWeight: '700', 
                                  lineHeight: 36, 
                                  textAlign: 'center',
                                  fontVariant: ['tabular-nums']
                                }}>
                                  {formatStopwatch(stopwatchTime)}
                                </ThemedText>
                              </View>
                            </View>

                            <View style={styles.sideAdjustBtn} />
                          </View>

                          {/* Row 2: Reset and Start/Pause Buttons */}
                          <View style={styles.btnRow}>
                            <Pressable
                              onPress={() => {
                                setStopwatchActive(false);
                                setStopwatchTime(0);
                              }}
                              style={({ pressed }) => [
                                styles.controlBtn,
                                { backgroundColor: theme.backgroundElement },
                                pressed && styles.pressed
                              ]}>
                              <ThemedText style={[styles.controlBtnText, { color: theme.text }]}>Reset</ThemedText>
                            </Pressable>

                            <Pressable
                              onPress={() => setStopwatchActive(!stopwatchActive)}
                              style={({ pressed }) => [
                                styles.controlBtn,
                                { 
                                  backgroundColor: stopwatchActive 
                                    ? theme.backgroundElement 
                                    : '#0A84FF' 
                                },
                                pressed && styles.pressed
                              ]}>
                              <ThemedText 
                                style={[
                                  styles.controlBtnText, 
                                  { color: stopwatchActive ? '#0A84FF' : '#FFFFFF' }
                                ]}>
                                {stopwatchActive ? 'Pause' : stopwatchTime > 0 ? 'Resume' : 'Start'}
                              </ThemedText>
                            </Pressable>
                          </View>
                        </View>
                      )}
                    </ScrollView>
                  </Pressable>
                </KeyboardAvoidingView>
              </Animated.View>
            </View>
          </Modal>
            {/* Exercise Detail Modal */}
            <Modal
              animationType="none"
              transparent={true}
              visible={isExerciseDetailVisible}
              onRequestClose={exerciseDetailSwipe.close}>
              <View style={styles.modalOverlay}>
                <Pressable style={StyleSheet.absoluteFill} onPress={exerciseDetailSwipe.close} />
                <Animated.View 
                  style={[
                    styles.modalContent,
                    {
                      height: '80%',
                      backgroundColor: theme.background,
                      transform: [{ translateY: exerciseDetailSwipe.translateY }]
                    }
                  ]}>
                  <View {...exerciseDetailSwipe.panHandlers}>
                    <View style={styles.dragHandleContainer}>
                      <View style={styles.dragHandle} />
                    </View>
                    <View style={styles.modalHeader}>
                      <ThemedText type="smallBold" style={styles.modalTitle} numberOfLines={1}>
                        Exercise Details
                      </ThemedText>
                    </View>
                  </View>

                  {selectedExerciseForDetail && (
                    <Pressable onPress={Keyboard.dismiss} style={{ width: '100%', flex: 1 }}>
                      <ScrollView 
                        style={styles.modalScrollBody} 
                        contentContainerStyle={[styles.modalScrollContent, { paddingBottom: insets.bottom + Spacing.six }]}>
                        <ThemedText type="subtitle" style={styles.detailTitle}>
                          {selectedExerciseForDetail.name}
                        </ThemedText>

                        {selectedExerciseForDetail.notes ? (
                          <View style={styles.detailSection}>
                            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
                              NOTES
                            </ThemedText>
                            <ThemedView type="backgroundElement" style={styles.detailTextBox}>
                              <ThemedText type="default">
                                {selectedExerciseForDetail.notes}
                              </ThemedText>
                            </ThemedView>
                          </View>
                        ) : null}

                        {selectedExerciseForDetail.instructions ? (
                          <View style={styles.detailSection}>
                            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
                              INSTRUCTIONS
                            </ThemedText>
                            <ThemedView type="backgroundElement" style={styles.detailTextBox}>
                              <ThemedText type="default" style={styles.instructionsText}>
                                {selectedExerciseForDetail.instructions}
                              </ThemedText>
                            </ThemedView>
                          </View>
                        ) : null}

                        {(() => {
                          const mgIds = selectedExerciseForDetail.muscle_group_ids;
                          if (mgIds && mgIds.length > 0) {
                            const names = mgIds.map((id: number) => muscleGroups.find(g => g.ID === id)?.Name).filter((name: string | undefined): name is string => name !== undefined);
                            if (names.length > 0) {
                              return (
                                <View style={styles.detailSection}>
                                  <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
                                    MUSCLE GROUPS
                                  </ThemedText>
                                  <View>
                                    {names.map((name: string, index: number) => (
                                      <View key={index} style={styles.detailMuscleRow}>
                                        <SymbolView tintColor="#8E8E93" name="circle.fill" size={6} style={{ marginRight: 14, marginLeft: 4 }} />
                                        <ThemedText style={{ fontSize: 16 }}>{name}</ThemedText>
                                      </View>
                                    ))}
                                  </View>
                                </View>
                              );
                            }
                          }
                          return null;
                        })()}
                      </ScrollView>
                    </Pressable>
                  )}
                </Animated.View>
              </View>
            </Modal>
          </ThemedView>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL: Workout History Log Detail */}
      <Modal
        animationType="none"
        transparent={true}
        visible={isHistoryDetailVisible}
        onRequestClose={historyDetailSwipe.close}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={historyDetailSwipe.close} />
          <Animated.View 
            style={[
              styles.modalContent,
              {
                height: '80%',
                backgroundColor: theme.background,
                transform: [{ translateY: historyDetailSwipe.translateY }]
              }
            ]}>
            <View {...historyDetailSwipe.panHandlers}>
              <View style={styles.dragHandleContainer}>
                <View style={styles.dragHandle} />
              </View>
              <View style={styles.modalHeader}>
                <View style={{ width: 30 }} />

                <ThemedText type="smallBold" style={styles.modalTitle} numberOfLines={1}>
                  Workout Log Summary
                </ThemedText>

                <View style={{ width: 30 }} />
              </View>
            </View>

            {selectedHistory && (
              <Pressable onPress={Keyboard.dismiss} style={{ width: '100%', flex: 1 }}>
              <ScrollView
                style={styles.modalScrollBody}
                contentContainerStyle={[styles.modalScrollContent, { paddingBottom: insets.bottom + Spacing.six }]}>
                <ThemedText type="subtitle" style={styles.detailTitle}>
                  {selectedHistory.routineName}
                </ThemedText>
                
                <View style={styles.detailSection}>
                  <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
                    DATE & TIME
                  </ThemedText>
                  <ThemedView type="backgroundElement" style={styles.detailTextBox}>
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
                </View>

                {/* Achieved Sets list */}
                <View style={styles.detailSection}>
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
                              {set.Weight} kg
                            </ThemedText>
                            <ThemedText type="small" style={{ flex: 1 }}>
                              {set.ActualReps} {repUnits[set.repUnitId]?.name_plural || 'Reps'}
                            </ThemedText>
                          </View>
                        ))}
                      </ThemedView>
                    ))
                  )}
                </View>
              </ScrollView>
              </Pressable>
            )}
          </Animated.View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal
        animationType="none"
        transparent={true}
        visible={isSettingsVisible}
        onRequestClose={settingsSwipe.close}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={settingsSwipe.close} />
          <Animated.View 
            style={[
              styles.modalContent,
              {
                height: '60%',
                backgroundColor: theme.background,
                transform: [{ translateY: settingsSwipe.translateY }]
              }
            ]}>
              <View {...settingsSwipe.panHandlers}>
                <View style={styles.dragHandleContainer}>
                  <View style={styles.dragHandle} />
                </View>
                <View style={styles.modalHeader}>
                  <Pressable
                    onPress={settingsSwipe.close}
                    style={({ pressed }) => [styles.modalHeaderButton, pressed && styles.pressed]}>
                    <ThemedText type="link" themeColor="textSecondary">Cancel</ThemedText>
                  </Pressable>
                  <ThemedText type="smallBold" style={styles.modalTitle}>
                    Settings
                  </ThemedText>
                  <Pressable
                    onPress={async () => {
                      if (!tempServerUrl.trim()) {
                        Alert.alert('Error', 'Server address is required');
                        return;
                      }

                      setApiBaseUrl(tempServerUrl.trim());
                      settingsSwipe.close();
                      fetchData(true);
                    }}
                    style={({ pressed }) => [styles.modalHeaderButton, pressed && styles.pressed]}>
                    <ThemedText type="linkPrimary" style={{ color: '#0A84FF', fontWeight: 'bold' }}>Save</ThemedText>
                  </Pressable>
                </View>
              </View>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}>
                <Pressable onPress={Keyboard.dismiss} style={{ width: '100%', flex: 1 }}>
                <ScrollView style={styles.modalFormBody}>
                  <View style={styles.formGroup}>
                    <ThemedText type="smallBold" themeColor="textSecondary" style={styles.formLabel}>
                      SERVER API BASE URL
                    </ThemedText>
                    <TextInput
                      placeholder="e.g. http://localhost:8080"
                      placeholderTextColor={theme.textSecondary}
                      value={tempServerUrl}
                      onChangeText={setTempServerUrl}
                      autoCapitalize="none"
                      autoCorrect={false}
                      style={[
                        styles.inputField,
                        {
                          backgroundColor: theme.backgroundElement,
                          color: theme.text,
                          borderColor: theme.backgroundSelected,
                        },
                      ]}
                    />
                    <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.two, lineHeight: 18 }}>
                      Change the connection address of the backend service.
                    </ThemedText>
                  </View>
                </ScrollView>
              </Pressable>
            </KeyboardAvoidingView>
          </Animated.View>
        </View>
      </Modal>
    </View>
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
  dragHandleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dragHandle: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(120, 120, 128, 0.4)',
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
    bottom: 170,
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
    marginBottom: Spacing.two,
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
  addSetBtn: {
      paddingRight: Spacing.one,
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
    marginBottom: Spacing.two,
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
    fontSize: 14,
    borderWidth: 1,
  },
  textAreaField: {
    height: 80,
    textAlignVertical: 'top',
  },
  dropdownContainer: {
    width: '100%',
    zIndex: 10,
    position: 'relative',
    marginTop: Spacing.one,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  dropdownMenu: {
    marginTop: Spacing.one,
    borderRadius: 8,
    borderWidth: 1,
    maxHeight: 250,
    overflow: 'hidden',
  },
  dropdownSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    height: 44,
  },
  dropdownSearchIcon: {
    marginRight: Spacing.two,
  },
  dropdownSearchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
    padding: 0,
  },
  dropdownClearSearch: {
    padding: 4,
  },
  dropdownList: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
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
  appleListGroup: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  appleListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    minHeight: 44,
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
    paddingHorizontal: Spacing.half,
  },
  thSet: {
    width: 30,
    textAlign: 'center',
  },
  thPlanned: {
    textAlign: 'center',
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
    textAlign: 'center',
  },
  tdPlanned: {
    textAlign: 'center',
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
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogCard: {
    width: '85%',
    maxWidth: 340,
    borderRadius: 16,
    padding: Spacing.four,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  dialogHeader: {
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  dialogTitle: {
    fontWeight: 'bold',
  },
  dialogSectionLabel: {
    marginTop: Spacing.two,
    marginBottom: Spacing.two,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  presetChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  timePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.four,
    marginBottom: Spacing.four,
  },
  pickerColumn: {
    flex: 1,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  columnLabel: {
    textAlign: 'center',
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    fontSize: 10,
    letterSpacing: 0.8,
  },
  pickerScroll: {
    flex: 1,
  },
  pickerItem: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopTimerBtn: {
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
    width: '100%',
  },
  timerIndicatorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    borderRadius: 8,
    marginBottom: Spacing.three,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(120, 120, 128, 0.12)',
    borderRadius: 8,
    padding: 2,
    marginHorizontal: Spacing.three,
    marginVertical: Spacing.two,
  },
  segmentedTab: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleContainer: {
    width: 170,
    height: 170,
    borderRadius: 85,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    position: 'relative',
    marginVertical: Spacing.three,
    overflow: 'hidden',
  },
  circleContent: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerCircleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    width: '100%',
    marginVertical: Spacing.three,
  },
  sideAdjustBtn: {
    width: 60,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  circleOutline: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 3,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.three,
    width: '100%',
    marginTop: Spacing.three,
  },
  controlBtn: {
    height: 48,
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlBtnText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  primaryTimerBtn: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.three,
  },
  instructionsText: {
    lineHeight: 22,
  },
  detailMuscleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.one,
  },
});
