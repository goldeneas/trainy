import React, { useState, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api, Exercise } from '@/services/api';

const MUSCLE_GROUPS = [
  { id: 1, name: 'Chest' },
  { id: 2, name: 'Back' },
  { id: 3, name: 'Legs' },
  { id: 4, name: 'Shoulders' },
  { id: 5, name: 'Arms' },
  { id: 6, name: 'Core' },
  { id: 7, name: 'Other' },
];

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

export default function ExercisesScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const safeBottom = insets.bottom + BottomTabInset;

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
  
  // CSV Import state
  const [csvInput, setCsvInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch exercises
  const fetchExercises = useCallback(async (showLoadingIndicator = false) => {
    if (showLoadingIndicator) setLoading(true);
    try {
      const data = await api.getExercises();
      setExercises(data || []);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load exercises');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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
        ex.Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ex.Notes && ex.Notes.toLowerCase().includes(searchQuery.toLowerCase()))
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
        muscle_group_ids: selectedMuscleGroupIds,
      });
      
      // Reset form
      setNewName('');
      setNewNotes('');
      setNewInstructions('');
      setSelectedMuscleGroupIds([]);
      setIsAddModalVisible(false);
      
      // Refresh
      fetchExercises();
      Alert.alert('Success', 'Exercise created successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create exercise');
    } finally {
      setIsSubmitting(false);
    }
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
        const muscleGroupIdVal = row[3] ? parseInt(row[3].trim(), 10) : null;
        const muscleGroupId = (muscleGroupIdVal && !isNaN(muscleGroupIdVal)) ? muscleGroupIdVal : null;
        const imageIdVal = row[4] ? parseInt(row[4].trim(), 10) : null;
        const imageId = (imageIdVal && !isNaN(imageIdVal)) ? imageIdVal : null;

        await api.createExercise({
          name,
          notes,
          instructions,
          muscle_group_ids: muscleGroupId ? [muscleGroupId] : [],
          image_id: imageId,
        });
        successCount++;
      }

      setCsvInput('');
      setIsImportModalVisible(false);
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
              setIsDetailModalVisible(false);
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

  const renderExerciseItem = ({ item }: { item: Exercise }) => {
    const cardBg = theme.backgroundElement;

    return (
      <Pressable
        onPress={() => {
          setSelectedExercise(item);
          setIsDetailModalVisible(true);
        }}
        style={({ pressed }) => [
          styles.exerciseCard,
          { backgroundColor: cardBg },
          pressed && styles.cardPressed,
        ]}>
        <View style={styles.exerciseCardHeader}>
          <View style={{ flex: 1 }}>
            <ThemedText type="smallBold" style={styles.exerciseName}>
              {item.Name}
            </ThemedText>
            {(() => {
              const mgIds = item.MuscleGroupIDs ?? (item as any).muscle_group_ids;
              if (mgIds && mgIds.length > 0) {
                const names = mgIds.map((id: number) => MUSCLE_GROUPS.find(g => g.id === id)?.name).filter(Boolean).join(', ');
                return names ? (
                  <ThemedText type="small" style={{ color: '#0A84FF', marginTop: Spacing.half }}>
                    {names}
                  </ThemedText>
                ) : null;
              }
              return null;
            })()}
          </View>
          <SymbolView
            tintColor={theme.textSecondary}
            name="chevron.right"
            size={14}
          />
        </View>
        {item.Notes ? (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={2} style={styles.exerciseNotes}>
            {item.Notes}
          </ThemedText>
        ) : null}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header Bar */}
      <View style={styles.header}>
        <ThemedText type="subtitle" style={styles.headerTitle}>
          Exercises
        </ThemedText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
          <Pressable
            onPress={() => setIsImportModalVisible(true)}
            style={({ pressed }) => [styles.importButton, styles.addButton, pressed && styles.pressed]}>
            <SymbolView
              tintColor={theme.textSecondary}
              name="square.and.arrow.up.fill"
              size={28}
            />
          </Pressable>
          <Pressable
            onPress={() => setIsAddModalVisible(true)}
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
            <SymbolView
              tintColor="#0A84FF" // Apple active blue
              name="plus.circle.fill"
              size={28}
            />
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
          placeholder="Search exercises..."
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
      {loading && exercises.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0A84FF" />
        </View>
      ) : filteredExercises.length === 0 ? (
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
          keyExtractor={(item) => item.ID.toString()}
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
              colors={['#0A84FF']}
            />
          }
        />
      )}

      {/* Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isDetailModalVisible}
        onRequestClose={() => setIsDetailModalVisible(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: 'transparent' }]}>
          <ThemedView type="background" style={[styles.modalContent, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <Pressable
                onPress={() => setIsDetailModalVisible(false)}
                style={({ pressed }) => [styles.modalHeaderButton, pressed && styles.pressed]}>
                <ThemedText type="linkPrimary" style={{ color: '#0A84FF' }}>Close</ThemedText>
              </Pressable>
              <ThemedText type="smallBold" style={styles.modalTitle} numberOfLines={1}>
                Exercise Details
              </ThemedText>
              <Pressable
                onPress={() => {
                  if (selectedExercise) {
                    handleDeleteExercise(selectedExercise.ID, selectedExercise.Name);
                  }
                }}
                style={({ pressed }) => [styles.modalHeaderButton, pressed && styles.pressed]}>
                <ThemedText type="link" style={{ color: '#FF3B30' }}>Delete</ThemedText>
              </Pressable>
            </View>

            {selectedExercise && (
              <ScrollView style={styles.modalScrollBody} contentContainerStyle={styles.modalScrollContent}>
                <ThemedText type="subtitle" style={styles.detailTitle}>
                  {selectedExercise.Name}
                </ThemedText>

                {(() => {
                  const mgIds = selectedExercise.MuscleGroupIDs ?? (selectedExercise as any).muscle_group_ids;
                  if (mgIds && mgIds.length > 0) {
                    const names = mgIds.map((id: number) => MUSCLE_GROUPS.find(g => g.id === id)?.name).filter(Boolean);
                    if (names.length > 0) {
                      return (
                        <View style={styles.detailSection}>
                          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
                            MUSCLE GROUPS
                          </ThemedText>
                          <View style={styles.chipsContainer}>
                            {names.map((name: string, index: number) => (
                              <ThemedView
                                key={index}
                                type="backgroundSelected"
                                style={[
                                  styles.chip,
                                  {
                                    borderColor: theme.backgroundSelected,
                                    alignSelf: 'flex-start',
                                  },
                                ]}
                              >
                                <ThemedText type="smallBold" style={{ color: '#0A84FF', fontSize: 12 }}>
                                  {name}
                                </ThemedText>
                              </ThemedView>
                            ))}
                          </View>
                        </View>
                      );
                    }
                  }
                  return null;
                })()}

                {selectedExercise.Notes ? (
                  <View style={styles.detailSection}>
                    <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
                      NOTES
                    </ThemedText>
                    <ThemedView type="backgroundElement" style={styles.detailTextBox}>
                      <ThemedText type="default">
                        {selectedExercise.Notes}
                      </ThemedText>
                    </ThemedView>
                  </View>
                ) : null}

                {selectedExercise.Instructions ? (
                  <View style={styles.detailSection}>
                    <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
                      INSTRUCTIONS
                    </ThemedText>
                    <ThemedView type="backgroundElement" style={styles.detailTextBox}>
                      <ThemedText type="default" style={styles.instructionsText}>
                        {selectedExercise.Instructions}
                      </ThemedText>
                    </ThemedView>
                  </View>
                ) : null}
              </ScrollView>
            )}
          </ThemedView>
        </View>
      </Modal>

      {/* Add Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isAddModalVisible}
        onRequestClose={() => setIsAddModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}>
          <View style={[styles.modalOverlay, { backgroundColor: 'transparent' }]}>
            <ThemedView type="background" style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Pressable
                  onPress={() => {
                    setNewName('');
                    setNewNotes('');
                    setNewInstructions('');
                    setSelectedMuscleGroupIds([]);
                    setIsAddModalVisible(false);
                  }}
                  style={({ pressed }) => [styles.modalHeaderButton, pressed && styles.pressed]}>
                  <ThemedText type="link" themeColor="textSecondary">Cancel</ThemedText>
                </Pressable>
                <ThemedText type="smallBold" style={styles.modalTitle}>
                  New Exercise
                </ThemedText>
                <Pressable
                  onPress={handleCreateExercise}
                  disabled={isSubmitting}
                  style={({ pressed }) => [styles.modalHeaderButton, pressed && styles.pressed]}>
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#0A84FF" />
                  ) : (
                    <ThemedText type="linkPrimary" style={{ color: '#0A84FF', fontWeight: 'bold' }}>Save</ThemedText>
                  )}
                </Pressable>
              </View>

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
                    MUSCLE GROUP
                  </ThemedText>
                  <View style={styles.chipsContainer}>
                    {MUSCLE_GROUPS.map((group) => {
                      const isSelected = selectedMuscleGroupIds.includes(group.id);
                      return (
                        <Pressable
                          key={group.id}
                          onPress={() => {
                            if (isSelected) {
                              setSelectedMuscleGroupIds(selectedMuscleGroupIds.filter(id => id !== group.id));
                            } else {
                              setSelectedMuscleGroupIds([...selectedMuscleGroupIds, group.id]);
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
                            {group.name}
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
                      },
                    ]}
                    multiline
                    numberOfLines={4}
                  />
                </View>
              </ScrollView>
            </ThemedView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* CSV Import Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isImportModalVisible}
        onRequestClose={() => setIsImportModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}>
          <View style={[styles.modalOverlay, { backgroundColor: 'transparent' }]}>
            <ThemedView type="background" style={[styles.modalContent, { height: '80%' }]}>
              <View style={styles.modalHeader}>
                <Pressable
                  onPress={() => {
                    setCsvInput('');
                    setIsImportModalVisible(false);
                  }}
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

              <ScrollView style={styles.modalFormBody}>
                <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: Spacing.two }}>
                  CSV format: name,notes,instructions,muscle_group_id,image_id
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: Spacing.four }}>
                  Example:{"\n"}
                  Bench Press,Chest builder,Keep bar straight,1,null
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
            </ThemedView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
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
  exerciseCard: {
    padding: Spacing.three,
    borderRadius: 12, // Rounded iOS card style
    marginBottom: Spacing.two,
    borderWidth: Platform.OS === 'web' ? 1 : 0,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  exerciseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseName: {
    fontSize: 18,
  },
  exerciseNotes: {
    marginTop: Spacing.one,
    fontSize: 14,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end', // iOS Action Sheet style (slide from bottom)
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
    marginTop: Spacing.one,
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
});
