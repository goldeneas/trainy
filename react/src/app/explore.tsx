import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Keyboard,
  Modal,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  InteractionManager,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api, Exercise, MuscleGroup, RepUnit, ExerciseProgression, ExerciseProgressionEntry } from '@/services/api';


function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

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

export default function ExercisesScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const safeBottom = insets.bottom + BottomTabInset;

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTransitionReady, setIsTransitionReady] = useState(false);

  const [progressions, setProgressions] = useState<ExerciseProgression[]>([]);
  const [progressionEntries, setProgressionEntries] = useState<ExerciseProgressionEntry[]>([]);
  const [activeSegment, setActiveSegment] = useState<'library' | 'progressions'>('library');
  const [expandedProgIds, setExpandedProgIds] = useState<number[]>([]);

  // Add progression states
  const [newProgName, setNewProgName] = useState('');
  const [newProgNotes, setNewProgNotes] = useState('');
  const [isAddProgModalVisible, setIsAddProgModalVisible] = useState(false);

  // Edit progression states
  const [isEditProgModalVisible, setIsEditProgModalVisible] = useState(false);
  const [editingProgName, setEditingProgName] = useState('');
  const [editingProgNotes, setEditingProgNotes] = useState('');
  const [selectedProgression, setSelectedProgression] = useState<ExerciseProgression | null>(null);
  const [progSearchQuery, setProgSearchQuery] = useState('');
  const [isProgSearchFocused, setIsProgSearchFocused] = useState(false);
  const [localExerciseIds, setLocalExerciseIds] = useState<number[]>([]);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setIsTransitionReady(true);
    });
    return () => task.cancel();
  }, []);

  // Modals state
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  // Form state
  const [newName, setNewName] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newInstructions, setNewInstructions] = useState('');
  const [selectedMuscleGroupIds, setSelectedMuscleGroupIds] = useState<number[]>([]);
  const [newRepUnitId, setNewRepUnitId] = useState<number>(1);
  const [repUnits, setRepUnits] = useState<RepUnit[]>([]);
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  
  // CSV Import state
  const [csvInput, setCsvInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingExerciseId, setEditingExerciseId] = useState<number | null>(null);

  // Bottom Sheet gesture controllers
  const detailSwipe = useBottomSheet(isDetailModalVisible, () => setIsDetailModalVisible(false));
  const addExerciseSwipe = useBottomSheet(isAddModalVisible, () => {
    setNewName('');
    setNewNotes('');
    setNewInstructions('');
    setSelectedMuscleGroupIds([]);
    setNewRepUnitId(1);
    setEditingExerciseId(null);
    setIsAddModalVisible(false);
  });
  const importCSVSwipe = useBottomSheet(isImportModalVisible, () => {
    setCsvInput('');
    setIsImportModalVisible(false);
  });
  const addProgSwipe = useBottomSheet(isAddProgModalVisible, () => {
    setIsAddProgModalVisible(false);
    setNewProgName('');
    setNewProgNotes('');
  });
  const editProgSwipe = useBottomSheet(isEditProgModalVisible, () => {
    setIsEditProgModalVisible(false);
    setSelectedProgression(null);
    setEditingProgName('');
    setEditingProgNotes('');
    setProgSearchQuery('');
    setIsProgSearchFocused(false);
    setLocalExerciseIds([]);
  });

  // Fetch exercises
  const fetchExercises = useCallback(async (showLoadingIndicator = false) => {
    if (showLoadingIndicator) setLoading(true);
    try {
      await api.initializeApi();
      const [exsData, unitsData, musclesData, progressionsData, entriesData] = await Promise.all([
        api.getExercises(),
        api.getRepUnits().catch(() => [] as RepUnit[]),
        api.getMuscleGroups().catch(() => [] as MuscleGroup[]),
        api.getExerciseProgressions().catch(() => [] as ExerciseProgression[]),
        api.getExerciseProgressionEntries().catch(() => [] as ExerciseProgressionEntry[]),
      ]);
      setExercises(exsData || []);
      if (unitsData && unitsData.length > 0) setRepUnits(unitsData);
      if (musclesData && musclesData.length > 0) setMuscleGroups(musclesData);
      setProgressions(progressionsData || []);
      setProgressionEntries(entriesData || []);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load exercises');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const getProgressionExercises = useCallback((prog: ExerciseProgression) => {
    return (prog.entry_ids || []).map((entryId) => {
      const entry = progressionEntries.find((e) => e.ID === entryId);
      if (!entry) return null;
      return exercises.find((e) => e.id === entry.ExerciseID);
    }).filter((e): e is Exercise => !!e);
  }, [progressionEntries, exercises]);

  const filteredProgressions = useMemo(() => {
    if (!searchQuery.trim()) return progressions;
    const query = searchQuery.toLowerCase();
    return progressions.filter((prog) => {
      if (prog.name.toLowerCase().includes(query)) return true;
      const progExs = getProgressionExercises(prog);
      return progExs.some((ex) => ex.name.toLowerCase().includes(query));
    });
  }, [progressions, searchQuery, getProgressionExercises]);


  const exercisesNotInProg = useMemo(() => {
    return exercises.filter((ex) => !localExerciseIds.includes(ex.id));
  }, [localExerciseIds, exercises]);

  const localExercises = useMemo(() => {
    return localExerciseIds.map((id) => exercises.find((ex) => ex.id === id)).filter((ex): ex is Exercise => !!ex);
  }, [localExerciseIds, exercises]);

  const searchedExercisesNotInProg = useMemo(() => {
    if (!progSearchQuery.trim()) return [];
    const query = progSearchQuery.toLowerCase();
    return exercisesNotInProg.filter((ex) =>
      ex.name.toLowerCase().includes(query)
    );
  }, [exercisesNotInProg, progSearchQuery]);

  const toggleExpand = useCallback((id: number) => {
    setExpandedProgIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const handleStartEditProgression = useCallback((prog: ExerciseProgression) => {
    setSelectedProgression(prog);
    setEditingProgName(prog.name);
    setEditingProgNotes(prog.notes || '');
    
    // Map initial entry IDs to exercise IDs in sequence order
    const initialExIds = (prog.entry_ids || []).map((entryId) => {
      const entry = progressionEntries.find((e) => e.ID === entryId);
      return entry ? entry.ExerciseID : null;
    }).filter((id): id is number => id !== null);

    setLocalExerciseIds(initialExIds);
    setIsEditProgModalVisible(true);
  }, [progressionEntries]);

  const handleCreateProgression = useCallback(async () => {
    if (!newProgName.trim()) {
      Alert.alert('Error', 'Please enter a name.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.createExerciseProgression({ name: newProgName.trim(), notes: newProgNotes.trim() });
      await fetchExercises();
      addProgSwipe.close();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create progression');
    } finally {
      setIsSubmitting(false);
    }
  }, [newProgName, newProgNotes, fetchExercises, addProgSwipe]);

  const handleSaveProgressionEdits = useCallback(async () => {
    if (!selectedProgression) return;
    if (!editingProgName.trim()) {
      Alert.alert('Error', 'Please enter a name.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Update progression name and notes
      await api.updateExerciseProgression(selectedProgression.id, {
        name: editingProgName.trim(),
        notes: editingProgNotes.trim(),
      });

      // 2. Synchronize progression entries:
      const currentEntries = progressionEntries.filter(
        (e) => e.ExerciseProgressionID === selectedProgression.id
      );

      // Find entries that are in currentEntries but NOT in localExerciseIds (to delete)
      const entriesToDelete = currentEntries.filter(
        (entry) => !localExerciseIds.includes(entry.ExerciseID)
      );

      // Find exercise IDs in localExerciseIds that are NOT in currentEntries (to create)
      const idsToCreate = localExerciseIds.filter(
        (id) => !currentEntries.some((entry) => entry.ExerciseID === id)
      );

      // Perform deletions and creations in parallel
      await Promise.all([
        ...entriesToDelete.map((entry) => api.deleteExerciseProgressionEntry(entry.ID)),
        ...idsToCreate.map((id) =>
          api.createExerciseProgressionEntry({
            exercise_id: id,
            exercise_progression_id: selectedProgression.id,
          })
        ),
      ]);

      await fetchExercises();
      editProgSwipe.close();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save changes');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedProgression, editingProgName, editingProgNotes, localExerciseIds, progressionEntries, fetchExercises, editProgSwipe]);

  const handleDeleteProgressionConfirm = useCallback((prog: ExerciseProgression) => {
    Alert.alert(
      'Delete Progression',
      `Are you sure you want to delete "${prog.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteExerciseProgression(prog.id);
              await fetchExercises();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete progression');
            }
          }
        }
      ]
    );
  }, [fetchExercises]);

  const handleAddLocalExercise = useCallback((exerciseId: number) => {
    setLocalExerciseIds((prev) => [...prev, exerciseId]);
    setProgSearchQuery('');
  }, []);

  const handleRemoveLocalExercise = useCallback((exerciseId: number) => {
    setLocalExerciseIds((prev) => prev.filter((id) => id !== exerciseId));
  }, []);

  const renderLocalExerciseSwipeActions = useCallback((exId: number) => (
    <View style={styles.swipeActionContainer}>
      <Pressable
        onPress={() => handleRemoveLocalExercise(exId)}
        style={({ pressed }) => [
          styles.deleteSwipeBtn,
          pressed && styles.pressed,
        ]}>
        <SymbolView tintColor="#FFFFFF" name="trash.fill" size={16} />
      </Pressable>
    </View>
  ), [handleRemoveLocalExercise]);

  useFocusEffect(
    useCallback(() => {
      fetchExercises();
    }, [fetchExercises])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchExercises();
  }, [fetchExercises]);

  // Filtered exercises
  const filteredExercises = useMemo(() => {
    return exercises.filter(
      (ex) =>
        ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ex.notes && ex.notes.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [exercises, searchQuery]);

  // Handle create
  const handleCreateExercise = async () => {
    if (!newName.trim()) {
      Alert.alert('Error', 'Exercise name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createExercise({
        name: newName.trim(),
        notes: newNotes.trim(),
        instructions: newInstructions.trim(),
        rep_unit_id: newRepUnitId,
        muscle_group_ids: selectedMuscleGroupIds,
      });
      
      // Reset form
      setNewName('');
      setNewNotes('');
      setNewInstructions('');
      setSelectedMuscleGroupIds([]);
      setNewRepUnitId(1);
      addExerciseSwipe.close();
      
      // Refresh
      fetchExercises();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create exercise');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle update
  const handleUpdateExercise = async () => {
    if (editingExerciseId === null) return;
    if (!newName.trim()) {
      Alert.alert('Error', 'Exercise name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.updateExercise(editingExerciseId, {
        name: newName.trim(),
        notes: newNotes.trim(),
        instructions: newInstructions.trim(),
        rep_unit_id: newRepUnitId,
        muscle_group_ids: selectedMuscleGroupIds,
      });
      
      // Reset form
      setNewName('');
      setNewNotes('');
      setNewInstructions('');
      setSelectedMuscleGroupIds([]);
      setNewRepUnitId(1);
      setEditingExerciseId(null);
      addExerciseSwipe.close();
      
      // Refresh
      fetchExercises();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update exercise');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Start edit mode
  const handleStartEditExercise = (ex: Exercise) => {
    setEditingExerciseId(ex.id);
    setNewName(ex.name);
    setNewNotes(ex.notes || '');
    setNewInstructions(ex.instructions || '');
    setNewRepUnitId(ex.rep_unit_id);
    setSelectedMuscleGroupIds(ex.muscle_group_ids || []);
    setIsDetailModalVisible(false); // Close detail modal
    setIsAddModalVisible(true); // Open form modal
  };

  // Handle CSV Import
  const handleImportCSV = async () => {
    if (!csvInput.trim()) {
      Alert.alert('Error', 'Please enter some CSV text');
      return;
    }

    setIsImporting(true);
    try {
      const lines = csvInput.split('\n');
      let successCount = 0;
      let startIdx = 0;

      if (lines.length > 0) {
        const firstRow = parseCSVLine(lines[0]);
        if (firstRow[0]?.toLowerCase() === 'name') {
          startIdx = 1;
        }
      }

      for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const row = parseCSVLine(line);
        if (row.length === 0 || !row[0]) continue;

        const name = row[0];
        const notes = row[1] || '';
        const instructions = row[2] || '';
        const muscleGroupField = row[3] || '';
        const muscleGroupIds: number[] = muscleGroupField
          .split(/[;|,\s]+/)
          .map(val => parseInt(val.trim(), 10))
          .filter(id => !isNaN(id));
        const imageIdVal = row[4] ? parseInt(row[4].trim(), 10) : null;
        const imageId = (imageIdVal && !isNaN(imageIdVal)) ? imageIdVal : null;

        await api.createExercise({
          name,
          notes,
          instructions,
          rep_unit_id: 1,
          muscle_group_ids: muscleGroupIds,
          image_id: imageId,
        });
        successCount++;
      }

      setCsvInput('');
      importCSVSwipe.close();
      fetchExercises();
      Alert.alert('Success', `Successfully imported ${successCount} exercises!`);
    } catch (error: any) {
      Alert.alert('Import Error', error.message || 'An error occurred during import.');
    } finally {
      setIsImporting(false);
    }
  };

  // Handle delete
  const handleDeleteExercise = (id: number, name: string) => {
    Alert.alert(
      'Delete Exercise',
      `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteExercise(id);
              detailSwipe.close();
              setSelectedExercise(null);
              fetchExercises();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete exercise');
            }
          },
        },
      ]
    );
  };

  const renderSwipeActions = (exercise: Exercise) => (
    <View style={styles.swipeActionContainer}>
      <Pressable
        onPress={() => handleDeleteExercise(exercise.id, exercise.name)}
        style={({ pressed }) => [
          styles.deleteSwipeBtn,
          pressed && styles.pressed,
        ]}>
        <SymbolView tintColor="#FFFFFF" name="trash.fill" size={16} />
      </Pressable>
    </View>
  );

  const renderExerciseItem = ({ item }: { item: Exercise }) => {
    const cardBg = theme.backgroundElement;

    return (
      <Swipeable
        renderLeftActions={() => renderSwipeActions(item)}
        containerStyle={styles.swipeContainer}>
        <View
          style={[
            styles.card,
            { backgroundColor: cardBg, marginBottom: 0 },
          ]}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1, marginRight: Spacing.two }}>
              <ThemedText type="smallBold" style={styles.cardTitle}>
                {item.name}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={2} style={styles.cardSubtitle}>
                {item.notes || "No description provided"}
              </ThemedText>
            </View>
            <View style={styles.cardActions}>
              <Pressable
                onPress={() => {
                  handleStartEditExercise(item);
                }}
                style={({ pressed }) => [
                  styles.cardActionBtn,
                  pressed && styles.pressed,
                ]}>
                <SymbolView 
                  tintColor="#8E8E93" 
                  name="slider.horizontal.3" 
                  size={22} 
                />
              </Pressable>
              <Pressable
                onPress={() => {
                  setSelectedExercise(item);
                  setIsDetailModalVisible(true);
                }}
                style={({ pressed }) => [
                  styles.cardActionCircleBtn,
                  pressed && styles.pressed,
                ]}>
                <SymbolView tintColor="#0A84FF" name="chevron.right.circle.fill" size={28} />
              </Pressable>
            </View>
          </View>

          {(() => {
            const mgIds = item.muscle_group_ids;
            if (mgIds && mgIds.length > 0) {
              const names = mgIds.map((id: number) => muscleGroups.find(g => g.ID === id)?.Name).filter(Boolean).join(', ');
              if (names) {
                return (
                  <View style={styles.cardFooter}>
                    <SymbolView
                      tintColor="#0A84FF"
                      name="dumbbell.fill"
                      size={14}
                      style={{ marginRight: Spacing.one }}
                    />
                    <ThemedText type="small" themeColor="textSecondary" style={{ flex: 1 }}>
                      {names}
                    </ThemedText>
                  </View>
                );
              }
            }
            return null;
          })()}
        </View>
      </Swipeable>
    );
  };

  const renderProgressionSwipeActions = (prog: ExerciseProgression) => (
    <View style={styles.swipeActionContainer}>
      <Pressable
        onPress={() => handleDeleteProgressionConfirm(prog)}
        style={({ pressed }) => [
          styles.deleteSwipeBtn,
          pressed && styles.pressed,
        ]}>
        <SymbolView tintColor="#FFFFFF" name="trash.fill" size={16} />
      </Pressable>
    </View>
  );

  const renderProgressionItem = ({ item }: { item: ExerciseProgression }) => {
    const cardBg = theme.backgroundElement;
    const progExercises = getProgressionExercises(item);
    const isExpanded = expandedProgIds.includes(item.id);

    return (
      <Swipeable
        renderLeftActions={() => renderProgressionSwipeActions(item)}
        containerStyle={styles.swipeContainer}>
        <View style={[styles.card, { backgroundColor: cardBg, marginBottom: 0 }]}>
          <View style={styles.cardHeader}>
            <Pressable
              onPress={() => toggleExpand(item.id)}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1, marginRight: Spacing.two }}>
                <ThemedText type="smallBold" style={styles.cardTitle}>
                  {item.name}
                </ThemedText>
                {item.notes ? (
                  <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 2, marginBottom: 4 }} numberOfLines={2}>
                    {item.notes}
                  </ThemedText>
                ) : null}
                <ThemedText type="small" themeColor="textSecondary" style={styles.cardSubtitle}>
                  {progExercises.length} {progExercises.length === 1 ? 'Level' : 'Levels'} Progression
                </ThemedText>
              </View>
            </Pressable>
            <View style={styles.cardActions}>
              <Pressable
                onPress={() => handleStartEditProgression(item)}
                style={({ pressed }) => [
                  styles.cardActionBtn,
                  pressed && styles.pressed,
                ]}>
                <SymbolView 
                  tintColor="#8E8E93" 
                  name="slider.horizontal.3" 
                  size={22} 
                />
              </Pressable>
              <Pressable
                onPress={() => toggleExpand(item.id)}
                style={({ pressed }) => [
                  styles.cardActionCircleBtn,
                  pressed && styles.pressed,
                ]}>
                <SymbolView
                  tintColor="#0A84FF"
                  name={isExpanded ? "chevron.up.circle.fill" : "chevron.down.circle.fill"}
                  size={28}
                />
              </Pressable>
            </View>
          </View>

          {/* List of progression steps */}
          {isExpanded && progExercises.length > 0 && (
            <View style={styles.progressionStepsContainer}>
              {progExercises.map((ex, index) => {
                const isLast = index === progExercises.length - 1;
                const muscleNames = ex.muscle_group_ids
                  ? ex.muscle_group_ids.map(id => muscleGroups.find(g => g.ID === id)?.Name).filter(Boolean).join(', ')
                  : '';

                return (
                  <Pressable
                    key={ex.id}
                    onPress={() => {
                      setSelectedExercise(ex);
                      setIsDetailModalVisible(true);
                    }}
                    style={({ pressed }) => [
                      styles.progressionStepRow,
                      pressed && styles.pressed
                    ]}>
                    
                    {/* Step indicator (circle with number and vertical connecting line) */}
                    <View style={{ alignItems: 'center', marginRight: Spacing.three, alignSelf: 'stretch' }}>
                      <View style={[styles.stepCircle, { backgroundColor: theme.backgroundSelected }]}>
                        <ThemedText type="smallBold" style={styles.stepCircleText}>
                          {index + 1}
                        </ThemedText>
                      </View>
                      {!isLast && <View style={[styles.stepLine, { backgroundColor: theme.textSecondary, opacity: 0.2 }]} />}
                    </View>

                    {/* Step content */}
                    <View style={styles.stepContentCol}>
                      <ThemedText type="default" style={styles.stepExerciseName}>
                        {ex.name}
                      </ThemedText>
                      {muscleNames ? (
                        <ThemedText type="small" themeColor="textSecondary" style={styles.stepMuscleText}>
                          {muscleNames}
                        </ThemedText>
                      ) : null}
                    </View>

                    {/* Chevron icon indicator */}
                    <SymbolView tintColor={theme.textSecondary} name="chevron.right" size={14} style={{ opacity: 0.6 }} />
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </Swipeable>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      {/* Header Bar */}
      <View style={styles.header}>
        <ThemedText type="subtitle" style={styles.headerTitle}>
          Exercises
        </ThemedText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
          {activeSegment === 'library' ? (
            <>
              <Pressable
                onPress={() => {
                  setIsImportModalVisible(true);
                }}
                style={({ pressed }) => [styles.importButton, styles.addButton, pressed && styles.pressed]}>
                <SymbolView
                  tintColor={theme.textSecondary}
                  name="square.and.arrow.up.fill"
                  size={28}
                />
              </Pressable>
              <Pressable
                onPress={() => {
                  setIsAddModalVisible(true);
                }}
                style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
                <SymbolView
                  tintColor="#0A84FF" // Apple active blue
                  name="plus.circle.fill"
                  size={28}
                />
              </Pressable>
            </>
          ) : (
            <Pressable
              onPress={() => {
                setIsAddProgModalVisible(true);
              }}
              style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
              <SymbolView
                tintColor="#0A84FF" // Apple active blue
                name="plus.circle.fill"
                size={28}
              />
            </Pressable>
          )}
        </View>
      </View>

      {/* Custom iOS-style Segmented Control */}
      <View style={{ paddingHorizontal: Spacing.three, marginBottom: Spacing.two }}>
        <View style={[styles.segmentedControl, { backgroundColor: theme.backgroundSelected }]}>
          <Pressable
            onPress={() => setActiveSegment('library')}
            style={[
              styles.segment,
              activeSegment === 'library' && [
                styles.segmentActive,
                { backgroundColor: theme.backgroundElement },
              ],
            ]}>
            <ThemedText
              type={activeSegment === 'library' ? 'smallBold' : 'small'}
              themeColor={activeSegment === 'library' ? 'text' : 'textSecondary'}>
              Library
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setActiveSegment('progressions')}
            style={[
              styles.segment,
              activeSegment === 'progressions' && [
                styles.segmentActive,
                { backgroundColor: theme.backgroundElement },
              ],
            ]}>
            <ThemedText
              type={activeSegment === 'progressions' ? 'smallBold' : 'small'}
              themeColor={activeSegment === 'progressions' ? 'text' : 'textSecondary'}>
              Progressions
            </ThemedText>
          </Pressable>
        </View>
      </View>

      {/* Search Input */}
      <View style={[styles.searchContainer, { backgroundColor: theme.backgroundElement }]}>
        <SymbolView
          tintColor={theme.textSecondary}
          name="magnifyingglass"
          size={16}
          style={styles.searchIcon}
        />
        <TextInput
          placeholder={activeSegment === 'library' ? "Search exercises..." : "Search progressions..."}
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[styles.searchInput, { color: theme.text }]}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery ? (
          <Pressable onPress={() => setSearchQuery('')} style={styles.clearSearch}>
            <SymbolView
              tintColor={theme.textSecondary}
              name="xmark.circle.fill"
              size={16}
            />
          </Pressable>
        ) : null}
      </View>

      {/* Main Content */}
      {!isTransitionReady || (loading && exercises.length === 0) ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0A84FF" />
        </View>
      ) : activeSegment === 'library' ? (
        filteredExercises.length === 0 ? (
          <View style={styles.centerContainer}>
            <SymbolView
              tintColor={theme.textSecondary}
              name="dumbbell.fill"
              size={48}
              style={styles.emptyIcon}
            />
            <ThemedText type="default" themeColor="textSecondary" style={styles.emptyText}>
              {searchQuery ? 'No exercises match your search' : 'No exercises in your library'}
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={filteredExercises}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderExerciseItem}
            contentContainerStyle={[
              styles.listContainer,
              { paddingBottom: safeBottom + Spacing.four },
            ]}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#0A84FF"
              />
            }
          />
        )
      ) : (
        // Progressions Segment
        filteredProgressions.length === 0 ? (
          <View style={styles.centerContainer}>
            <SymbolView
              tintColor={theme.textSecondary}
              name="map.fill"
              size={48}
              style={styles.emptyIcon}
            />
            <ThemedText type="default" themeColor="textSecondary" style={styles.emptyText}>
              {searchQuery ? 'No progressions match your search' : 'No progressions available'}
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={filteredProgressions}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderProgressionItem}
            contentContainerStyle={[
              styles.listContainer,
              { paddingBottom: safeBottom + Spacing.four },
            ]}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#0A84FF"
              />
            }
          />
        )
      )}

      {/* Add Progression Modal */}
      <Modal
        animationType="none"
        transparent={true}
        visible={isAddProgModalVisible}
        onRequestClose={addProgSwipe.close}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}>
          <View style={[styles.modalOverlay, { backgroundColor: 'transparent' }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={addProgSwipe.close} />
            <Animated.View 
              style={[
                styles.modalContent,
                {
                  height: '40%',
                  backgroundColor: theme.background,
                  transform: [{ translateY: addProgSwipe.translateY }]
                }
              ]}>
              <View {...addProgSwipe.panHandlers}>
                <View style={styles.dragHandleContainer}>
                  <View style={styles.dragHandle} />
                </View>
                <View style={styles.modalHeader}>
                  <Pressable
                    onPress={addProgSwipe.close}
                    style={({ pressed }) => [styles.modalHeaderButton, pressed && styles.pressed]}>
                    <ThemedText type="link" themeColor="textSecondary">Cancel</ThemedText>
                  </Pressable>
                  <ThemedText type="smallBold" style={styles.modalTitle}>
                    New Progression
                  </ThemedText>
                  <Pressable
                    onPress={handleCreateProgression}
                    disabled={isSubmitting}
                    style={({ pressed }) => [styles.modalHeaderButton, pressed && styles.pressed]}>
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#0A84FF" />
                    ) : (
                      <ThemedText type="linkPrimary" style={{ color: '#0A84FF', fontWeight: 'bold' }}>Save</ThemedText>
                    )}
                  </Pressable>
                </View>
              </View>
              <Pressable onPress={Keyboard.dismiss} style={{ width: '100%', flex: 1 }}>
                <ScrollView style={styles.modalFormBody}>
                  <View style={styles.formGroup}>
                    <ThemedText type="smallBold" themeColor="textSecondary" style={styles.formLabel}>
                      NAME *
                    </ThemedText>
                    <TextInput
                      placeholder="e.g. Pull-up Progression"
                      placeholderTextColor={theme.textSecondary}
                      value={newProgName}
                      onChangeText={setNewProgName}
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
                      NOTES
                    </ThemedText>
                    <TextInput
                      placeholder="Short description..."
                      placeholderTextColor={theme.textSecondary}
                      value={newProgNotes}
                      onChangeText={setNewProgNotes}
                      style={[
                        styles.inputField,
                        styles.textAreaField,
                        {
                          backgroundColor: theme.backgroundElement,
                          color: theme.text,
                          borderColor: theme.backgroundSelected,
                          fontSize: 14,
                        },
                      ]}
                      multiline
                      numberOfLines={2}
                    />
                  </View>
                </ScrollView>
              </Pressable>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Progression Modal */}
      <Modal
        animationType="none"
        transparent={true}
        visible={isEditProgModalVisible}
        onRequestClose={editProgSwipe.close}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}>
          <View style={[styles.modalOverlay, { backgroundColor: 'transparent' }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={editProgSwipe.close} />
            <Animated.View 
              style={[
                styles.modalContent,
                {
                  height: '80%',
                  backgroundColor: theme.background,
                  transform: [{ translateY: editProgSwipe.translateY }]
                }
              ]}>
              <View {...editProgSwipe.panHandlers}>
                <View style={styles.dragHandleContainer}>
                  <View style={styles.dragHandle} />
                </View>
                <View style={styles.modalHeader}>
                  <Pressable
                    onPress={editProgSwipe.close}
                    style={({ pressed }) => [styles.modalHeaderButton, pressed && styles.pressed]}>
                    <ThemedText type="link" themeColor="textSecondary">Cancel</ThemedText>
                  </Pressable>
                  <ThemedText type="smallBold" style={styles.modalTitle}>
                    Edit Progression
                  </ThemedText>
                  <Pressable
                    onPress={handleSaveProgressionEdits}
                    disabled={isSubmitting}
                    style={({ pressed }) => [styles.modalHeaderButton, pressed && styles.pressed]}>
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#0A84FF" />
                    ) : (
                      <ThemedText type="linkPrimary" style={{ color: '#0A84FF', fontWeight: 'bold' }}>Save</ThemedText>
                    )}
                  </Pressable>
                </View>
              </View>

              <ScrollView 
                style={styles.modalFormBody}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                onScrollBeginDrag={() => setIsProgSearchFocused(false)}
                contentContainerStyle={{ paddingBottom: 60 }}
              >
                <Pressable onPress={() => { Keyboard.dismiss(); setIsProgSearchFocused(false); }}>
                  <View>
                    <View style={styles.formGroup}>
                      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.formLabel}>
                        NAME *
                      </ThemedText>
                      <TextInput
                        placeholder="Progression Name"
                        placeholderTextColor={theme.textSecondary}
                        value={editingProgName}
                        onChangeText={setEditingProgName}
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
                        NOTES
                      </ThemedText>
                      <TextInput
                        placeholder="Short description..."
                        placeholderTextColor={theme.textSecondary}
                        value={editingProgNotes}
                        onChangeText={setEditingProgNotes}
                        style={[
                          styles.inputField,
                          styles.textAreaField,
                          {
                            backgroundColor: theme.backgroundElement,
                            color: theme.text,
                            borderColor: theme.backgroundSelected,
                            fontSize: 14,
                          },
                        ]}
                        multiline
                        numberOfLines={2}
                      />
                    </View>

                    {/* Search and Add Exercise Bar */}
                    <View style={[styles.formGroup, { zIndex: 10 }]}>
                      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.formLabel}>
                        SEARCH AND ADD EXERCISE
                      </ThemedText>
                      <View style={styles.dropdownContainer}>
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
                            placeholder="Search exercises to add..."
                            placeholderTextColor={theme.textSecondary}
                            value={progSearchQuery}
                            onChangeText={setProgSearchQuery}
                            onFocus={() => setIsProgSearchFocused(true)}
                            style={[styles.dropdownSearchInput, { color: theme.text }]}
                            autoCapitalize="none"
                            autoCorrect={false}
                          />
                          {progSearchQuery ? (
                            <Pressable 
                              onPress={() => setProgSearchQuery('')} 
                              style={styles.dropdownClearSearch}>
                              <SymbolView
                                name="xmark.circle.fill"
                                tintColor={theme.textSecondary}
                                size={14}
                              />
                            </Pressable>
                          ) : null}
                        </View>

                        {/* The scrollable list of exercises directly below it, shown conditionally */}
                        {isProgSearchFocused && progSearchQuery.trim() !== '' && (
                          <View style={[
                            styles.dropdownMenu,
                            {
                              backgroundColor: theme.backgroundElement,
                              borderColor: theme.backgroundSelected,
                              borderWidth: 1,
                            }
                          ]}>
                            <ScrollView 
                              nestedScrollEnabled={true}
                              style={styles.dropdownList}
                              contentContainerStyle={{ paddingVertical: Spacing.one }}>
                              {searchedExercisesNotInProg.length === 0 ? (
                                <View style={{ padding: Spacing.three, alignItems: 'center' }}>
                                  <ThemedText type="small" themeColor="textSecondary">
                                    No exercises match your search
                                  </ThemedText>
                                </View>
                              ) : (
                                searchedExercisesNotInProg.map(ex => (
                                  <Pressable
                                    key={ex.id}
                                    onPress={() => handleAddLocalExercise(ex.id)}
                                    style={({ pressed }) => [
                                      styles.dropdownItem,
                                      pressed && styles.pressed,
                                    ]}>
                                    <View style={{ flex: 1 }}>
                                      <ThemedText type="smallBold">
                                        {ex.name}
                                      </ThemedText>
                                      {(() => {
                                        const mgIds = ex.muscle_group_ids;
                                        if (mgIds && mgIds.length > 0) {
                                          const names = mgIds.map((id: number) => muscleGroups.find(g => g.ID === id)?.Name).filter(Boolean).join(', ');
                                          return names ? (
                                            <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 2 }}>
                                              {names}
                                            </ThemedText>
                                          ) : null;
                                        }
                                        return null;
                                      })()}
                                    </View>
                                    <SymbolView
                                      name="plus.circle.fill"
                                      tintColor="#0A84FF"
                                      size={20}
                                    />
                                  </Pressable>
                                ))
                              )}
                            </ScrollView>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Exercises currently in progression */}
                    {localExercises.length > 0 && (
                      <View style={styles.formGroup}>
                        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.formLabel}>
                          EXERCISES IN PROGRESSION
                        </ThemedText>
                        <ThemedView type="backgroundElement" style={styles.appleListGroup}>
                          {localExercises.map((ex, idx) => {
                            const isLast = idx === localExercises.length - 1;
                            return (
                              <Swipeable
                                key={ex.id}
                                renderLeftActions={() => renderLocalExerciseSwipeActions(ex.id)}
                                containerStyle={{ overflow: 'hidden' }}>
                                <View style={[
                                  styles.appleListRow,
                                  { backgroundColor: theme.backgroundElement },
                                  !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.backgroundSelected }
                                ]}>
                                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                                    <ThemedText type="smallBold" style={{ color: '#0A84FF', marginRight: Spacing.two, width: 20 }}>
                                      {idx + 1}
                                    </ThemedText>
                                    <View style={{ flex: 1 }}>
                                      <ThemedText type="small" style={{ fontWeight: '500' }}>
                                        {ex.name}
                                      </ThemedText>
                                      {(() => {
                                        const mgIds = ex.muscle_group_ids;
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
                                  </View>
                                </View>
                              </Swipeable>
                            );
                          })}
                        </ThemedView>
                      </View>
                    )}
                  </View>
                </Pressable>
              </ScrollView>
              </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Detail Modal */}
      <Modal
        animationType="none"
        transparent={true}
        visible={isDetailModalVisible}
        onRequestClose={detailSwipe.close}>
        <View style={[styles.modalOverlay, { backgroundColor: 'transparent' }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={detailSwipe.close} />
          <Animated.View 
            style={[
              styles.modalContent,
              {
                height: '80%',
                backgroundColor: theme.background,
                transform: [{ translateY: detailSwipe.translateY }]
              }
            ]}>
            <View {...detailSwipe.panHandlers}>
              <View style={styles.dragHandleContainer}>
                <View style={styles.dragHandle} />
              </View>
              <View style={styles.modalHeader}>
                <ThemedText type="smallBold" style={styles.modalTitle} numberOfLines={1}>
                  Exercise Details
                </ThemedText>
              </View>
            </View>

            {selectedExercise && (
              <Pressable onPress={Keyboard.dismiss} style={{ width: '100%', flex: 1 }}>
                <ScrollView style={styles.modalScrollBody} contentContainerStyle={styles.modalScrollContent}>
                <ThemedText type="subtitle" style={styles.detailTitle}>
                  {selectedExercise.name}
                </ThemedText>

                {selectedExercise.notes ? (
                  <View style={styles.detailSection}>
                    <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
                      NOTES
                    </ThemedText>
                    <ThemedView type="backgroundElement" style={styles.detailTextBox}>
                      <ThemedText type="default">
                        {selectedExercise.notes}
                      </ThemedText>
                    </ThemedView>
                  </View>
                ) : null}

                {selectedExercise.instructions ? (
                  <View style={styles.detailSection}>
                    <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
                      INSTRUCTIONS
                    </ThemedText>
                    <ThemedView type="backgroundElement" style={styles.detailTextBox}>
                      <ThemedText type="default" style={styles.instructionsText}>
                        {selectedExercise.instructions}
                      </ThemedText>
                    </ThemedView>
                  </View>
                ) : null}

                {(() => {
                  const mgIds = selectedExercise.muscle_group_ids;
                  if (mgIds && mgIds.length > 0) {
                    const names = mgIds.map((id: number) => muscleGroups.find(g => g.ID === id)?.Name).filter((name): name is string => name !== undefined);
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

      {/* Add Modal */}
      <Modal
        animationType="none"
        transparent={true}
        visible={isAddModalVisible}
        onRequestClose={addExerciseSwipe.close}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}>
          <View style={[styles.modalOverlay, { backgroundColor: 'transparent' }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={addExerciseSwipe.close} />
            <Animated.View 
              style={[
                styles.modalContent,
                {
                  height: '80%',
                  backgroundColor: theme.background,
                  transform: [{ translateY: addExerciseSwipe.translateY }]
                }
              ]}>
              <View {...addExerciseSwipe.panHandlers}>
                <View style={styles.dragHandleContainer}>
                  <View style={styles.dragHandle} />
                </View>
                <View style={styles.modalHeader}>
                  <Pressable
                    onPress={addExerciseSwipe.close}
                    style={({ pressed }) => [styles.modalHeaderButton, pressed && styles.pressed]}>
                    <ThemedText type="link" themeColor="textSecondary">Cancel</ThemedText>
                  </Pressable>
                  <ThemedText type="smallBold" style={styles.modalTitle}>
                    {editingExerciseId !== null ? 'Edit Exercise' : 'New Exercise'}
                  </ThemedText>
                  <Pressable
                    onPress={editingExerciseId !== null ? handleUpdateExercise : handleCreateExercise}
                    disabled={isSubmitting}
                    style={({ pressed }) => [styles.modalHeaderButton, pressed && styles.pressed]}>
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#0A84FF" />
                    ) : (
                      <ThemedText type="linkPrimary" style={{ color: '#0A84FF', fontWeight: 'bold' }}>Save</ThemedText>
                    )}
                  </Pressable>
                </View>
              </View>
              <Pressable onPress={Keyboard.dismiss} style={{ width: '100%', flex: 1 }}>
                <ScrollView style={styles.modalFormBody}>
                <View style={styles.formGroup}>
                  <ThemedText type="smallBold" themeColor="textSecondary" style={styles.formLabel}>
                    NAME *
                  </ThemedText>
                  <TextInput
                    placeholder="e.g. Bench Press"
                    placeholderTextColor={theme.textSecondary}
                    value={newName}
                    onChangeText={setNewName}
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
                    UNIT TYPE *
                  </ThemedText>
                  <View style={styles.chipsContainer}>
                    {repUnits.map((unit) => (
                      <Pressable
                        key={unit.ID}
                        onPress={() => setNewRepUnitId(unit.ID)}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: newRepUnitId === unit.ID ? '#0A84FF' : theme.backgroundElement,
                            borderColor: theme.backgroundSelected,
                          },
                        ]}>
                        <ThemedText
                          type="smallBold"
                          style={{
                            color: newRepUnitId === unit.ID ? '#FFFFFF' : theme.text,
                            fontSize: 12,
                          }}>
                          {unit.NamePlural}
                        </ThemedText>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <ThemedText type="smallBold" themeColor="textSecondary" style={styles.formLabel}>
                    MUSCLE GROUP
                  </ThemedText>
                  <View style={styles.chipsContainer}>
                    {muscleGroups.map((group) => {
                      const isSelected = selectedMuscleGroupIds.includes(group.ID);
                      return (
                        <Pressable
                          key={group.ID}
                          onPress={() => {
                            if (isSelected) {
                              setSelectedMuscleGroupIds(selectedMuscleGroupIds.filter(id => id !== group.ID));
                            } else {
                              setSelectedMuscleGroupIds([...selectedMuscleGroupIds, group.ID]);
                            }
                          }}
                          style={[
                            styles.chip,
                            {
                              backgroundColor: isSelected ? '#0A84FF' : theme.backgroundElement,
                              borderColor: theme.backgroundSelected,
                            },
                          ]}>
                          <ThemedText
                            type="smallBold"
                            style={{
                              color: isSelected ? '#FFFFFF' : theme.text,
                              fontSize: 12,
                            }}>
                            {group.Name}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <ThemedText type="smallBold" themeColor="textSecondary" style={styles.formLabel}>
                    NOTES
                  </ThemedText>
                  <TextInput
                    placeholder="Short description..."
                    placeholderTextColor={theme.textSecondary}
                    value={newNotes}
                    onChangeText={setNewNotes}
                    style={[
                      styles.inputField,
                      styles.textAreaField,
                      {
                        backgroundColor: theme.backgroundElement,
                        color: theme.text,
                        borderColor: theme.backgroundSelected,
                        fontSize: 14,
                      },
                    ]}
                    multiline
                    numberOfLines={2}
                  />
                </View>

                <View style={styles.formGroup}>
                  <ThemedText type="smallBold" themeColor="textSecondary" style={styles.formLabel}>
                    INSTRUCTIONS
                  </ThemedText>
                  <TextInput
                    placeholder="Step-by-step instructions on form..."
                    placeholderTextColor={theme.textSecondary}
                    value={newInstructions}
                    onChangeText={setNewInstructions}
                    style={[
                      styles.inputField,
                      styles.largeTextAreaField,
                      {
                        backgroundColor: theme.backgroundElement,
                        color: theme.text,
                        borderColor: theme.backgroundSelected,
                        fontSize: 14,
                      },
                    ]}
                    multiline
                    numberOfLines={4}
                  />
                </View>
              </ScrollView>
              </Pressable>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* CSV Import Modal */}
      <Modal
        animationType="none"
        transparent={true}
        visible={isImportModalVisible}
        onRequestClose={importCSVSwipe.close}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}>
          <View style={[styles.modalOverlay, { backgroundColor: 'transparent' }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={importCSVSwipe.close} />
            <Animated.View 
              style={[
                styles.modalContent,
                {
                  height: '80%',
                  backgroundColor: theme.background,
                  transform: [{ translateY: importCSVSwipe.translateY }]
                }
              ]}>
              <View {...importCSVSwipe.panHandlers}>
                <View style={styles.dragHandleContainer}>
                  <View style={styles.dragHandle} />
                </View>
                <View style={styles.modalHeader}>
                  <Pressable
                    onPress={importCSVSwipe.close}
                    style={({ pressed }) => [styles.modalHeaderButton, pressed && styles.pressed]}>
                    <ThemedText type="link" themeColor="textSecondary">Cancel</ThemedText>
                  </Pressable>
                  <ThemedText type="smallBold" style={styles.modalTitle}>
                    Import CSV
                  </ThemedText>
                  <Pressable
                    onPress={handleImportCSV}
                    disabled={isImporting}
                    style={({ pressed }) => [styles.modalHeaderButton, pressed && styles.pressed]}>
                    {isImporting ? (
                      <ActivityIndicator size="small" color="#0A84FF" />
                    ) : (
                      <ThemedText type="linkPrimary" style={{ color: '#0A84FF', fontWeight: 'bold' }}>Import</ThemedText>
                    )}
                  </Pressable>
                </View>
              </View>
              <Pressable onPress={Keyboard.dismiss} style={{ width: '100%', flex: 1 }}>
                <ScrollView style={styles.modalFormBody}>
                  <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: Spacing.two }}>
                    CSV format: name,notes,instructions,muscle_group_ids,image_id
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: Spacing.four }}>
                    Example:{"\n"}
                    Bench Press,Chest builder,Keep bar straight,1;5,null
                  </ThemedText>

                  <TextInput
                    placeholder="Paste CSV text here..."
                    placeholderTextColor={theme.textSecondary}
                    value={csvInput}
                    onChangeText={setCsvInput}
                    multiline
                    style={[
                      styles.inputField,
                      styles.importCsvInput,
                      {
                        backgroundColor: theme.backgroundElement,
                        color: theme.text,
                        borderColor: theme.backgroundSelected,
                      },
                    ]}
                  />
                </ScrollView>
              </Pressable>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
  },
  headerTitle: {
    fontWeight: 'bold',
    fontSize: 34, // Large iOS heading style
  },
  addButton: {
    padding: Spacing.one,
  },
  importButton: {
      paddingBottom: Spacing.two,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.three,
    marginVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    height: 38,
    borderRadius: 10, // iOS rounded corner
  },
  searchIcon: {
    marginRight: Spacing.two,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  clearSearch: {
    padding: Spacing.one,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.five,
  },
  emptyIcon: {
    marginBottom: Spacing.two,
    opacity: 0.6,
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
  cardActionCircleBtn: {
    padding: Spacing.one,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  swipeContainer: {
    marginBottom: Spacing.two,
    borderRadius: 12,
    overflow: 'hidden',
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end', // iOS Action Sheet style (slide from bottom)
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
    paddingBottom: Spacing.five,
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
    borderBottomColor: '#C6C6C8', // iOS light gray border color
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
  },
  modalScrollContent: {
    paddingBottom: Spacing.six,
  },
  detailTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: Spacing.four,
  },
  detailSection: {
    marginBottom: Spacing.four,
  },
  sectionLabel: {
    fontSize: 12,
    letterSpacing: 0.5,
    marginBottom: Spacing.one,
  },
  detailTextBox: {
    padding: Spacing.three,
    borderRadius: 10,
  },
  instructionsText: {
    lineHeight: 22,
  },
  detailMuscleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.one,
  },
  // Form Styles
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
  largeTextAreaField: {
    height: 140,
    textAlignVertical: 'top',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: 16,
    borderWidth: 1,
  },
  importCsvInput: {
    height: 300,
    textAlignVertical: 'top',
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }),
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
      default: {
        boxShadow: '0px 1px 2px rgba(0,0,0,0.1)',
      },
    }),
  },
  progressionBadge: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressionStepsContainer: {
    marginTop: Spacing.three,
  },
  progressionStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleText: {
    fontSize: 12,
    color: '#0A84FF',
  },
  stepLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  stepContentCol: {
    flex: 1,
    justifyContent: 'center',
  },
  stepExerciseName: {
    fontSize: 16,
    fontWeight: '600',
  },
  stepMuscleText: {
    fontSize: 12,
    marginTop: 2,
  },
  addExerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  addExercisePlusBtn: {
    padding: Spacing.one,
  },
  editProgItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  deleteProgBtn: {
    marginTop: Spacing.four,
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteProgBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  dropdownContainer: {
    width: '100%',
    zIndex: 10,
    position: 'relative',
    marginTop: Spacing.one,
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
});
