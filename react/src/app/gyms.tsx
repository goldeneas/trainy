import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Linking,
  Modal,
  KeyboardAvoidingView,
  PanResponder,
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
import * as Location from 'expo-location';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api, GymLocation, GymEquipment, GymLocationEquipment } from '@/services/api';

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

// Distance calculation helpers (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

export default function GymsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const safeBottom = insets.bottom + BottomTabInset;

  const [gymLocations, setGymLocations] = useState<GymLocation[]>([]);
  const [equipmentList, setEquipmentList] = useState<GymEquipment[]>([]);
  const [locationEquipments, setLocationEquipments] = useState<GymLocationEquipment[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals visibility
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [isDefineEquipModalVisible, setIsDefineEquipModalVisible] = useState(false);

  // Selected gym location
  const [selectedGym, setSelectedGym] = useState<GymLocation | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [altitude, setAltitude] = useState(''); // Latitude
  const [longitude, setLongitude] = useState('');
  const [rating, setRating] = useState<number>(0);
  const [locating, setLocating] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Edit Form states
  const [editName, setEditName] = useState('');
  const [editAltitude, setEditAltitude] = useState('');
  const [editLongitude, setEditLongitude] = useState('');

  const [searchQuery, setSearchQuery] = useState('');

  const filteredGymLocations = useMemo(() => {
    if (!searchQuery.trim()) return gymLocations;
    const q = searchQuery.toLowerCase().trim();
    return gymLocations.filter((item) => {
      const matchesName = item.Name.toLowerCase().includes(q);
      const linkedEquipNames = locationEquipments
        .filter((le) => le.GymLocationID === item.ID)
        .map((le) => equipmentList.find((eq) => eq.ID === le.GymEquipmentID)?.Name || '')
        .filter(Boolean);
      const matchesEquipment = linkedEquipNames.some((name) =>
        name.toLowerCase().includes(q)
      );
      return matchesName || matchesEquipment;
    });
  }, [gymLocations, searchQuery, locationEquipments, equipmentList]);

  const fetchData = async () => {
    try {
      const [locs, equips, links] = await Promise.all([
        api.getGymLocations(),
        api.getGymEquipment(),
        api.getGymLocationEquipments(),
      ]);
      setGymLocations(locs);
      setEquipmentList(equips);
      setLocationEquipments(links);

      // Fetch user location for distance calculations (runs once on open/refresh)
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUserLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      } else {
        setUserLocation(null);
      }
    } catch (err) {
      console.error('Failed to load gyms data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Bottom sheets hooks
  const addSwipe = useBottomSheet(isAddModalVisible, () => setIsAddModalVisible(false));
  const detailSwipe = useBottomSheet(isDetailModalVisible, () => {
    setIsDetailModalVisible(false);
    setSelectedGym(null);
  });
  const defineEquipSwipe = useBottomSheet(isDefineEquipModalVisible, () => {
    setIsDefineEquipModalVisible(false);
    setSelectedGym(null);
  });

  const handleAddGymLocation = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name.');
      return;
    }
    const altNum = parseFloat(altitude.replace(',', '.'));
    const lonNum = parseFloat(longitude.replace(',', '.'));
    if (isNaN(altNum) || isNaN(lonNum)) {
      Alert.alert('Error', 'Please enter valid coordinate numbers.');
      return;
    }

    try {
      const payload = {
        name: name.trim(),
        altitude: altNum,
        longitude: lonNum,
        rating: rating > 0 ? rating : null,
      };

      await api.createGymLocation(payload);

      // Reset & close
      setName('');
      setAltitude('');
      setLongitude('');
      setRating(0);
      setIsAddModalVisible(false);

      // Reload
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create gym location');
    }
  };

  const handleOpenAddModal = async () => {
    setName('');
    setAltitude('');
    setLongitude('');
    setRating(0);
    setIsAddModalVisible(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setAltitude(loc.coords.latitude.toString());
        setLongitude(loc.coords.longitude.toString());
      }
    } catch (err) {
      console.warn('Failed to autodetect position on add modal open:', err);
    }
  };

  const handleOpenMap = () => {
    if (!selectedGym) return;
    const { Altitude, Longitude } = selectedGym;
    const url = Platform.select({
      ios: `maps://?q=${Altitude},${Longitude}`,
      android: `geo:${Altitude},${Longitude}?q=${Altitude},${Longitude}`,
      default: `https://www.google.com/maps/search/?api=1&query=${Altitude},${Longitude}`,
    });
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Failed to open map app');
    });
  };

  const handleDeleteGym = (id: number, gymName: string) => {
    Alert.alert(
      'Delete Gym Location',
      `Are you sure you want to delete "${gymName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteGymLocation(id);
              fetchData();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete gym location');
            }
          },
        },
      ]
    );
  };

  const handleToggleEquipment = async (equipId: number) => {
    if (!selectedGym) return;

    const existingLink = locationEquipments.find(
      (le) => le.GymLocationID === selectedGym.ID && le.GymEquipmentID === equipId
    );

    try {
      if (existingLink) {
        await api.deleteGymLocationEquipment(existingLink.ID);
      } else {
        await api.createGymLocationEquipment({
          gym_location_id: selectedGym.ID,
          gym_equipment_id: equipId,
        });
      }
      // Refresh only links instantly
      const links = await api.getGymLocationEquipments();
      setLocationEquipments(links);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update equipment');
    }
  };

  const handleUpdateRating = async (newRating: number) => {
    if (!selectedGym) return;
    const nextRating = selectedGym.Rating === newRating ? null : (newRating > 0 ? newRating : null);
    try {
      const payload = {
        name: selectedGym.Name,
        altitude: selectedGym.Altitude,
        longitude: selectedGym.Longitude,
        rating: nextRating,
      };
      await api.updateGymLocation(selectedGym.ID, payload);
      // Update local state
      setSelectedGym({
        ...selectedGym,
        Rating: nextRating,
      });
      // Refresh list in background
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update rating');
    }
  };

  const handleOpenConfigureGym = (gym: GymLocation) => {
    setSelectedGym(gym);
    setEditName(gym.Name);
    setEditAltitude(gym.Altitude.toString());
    setEditLongitude(gym.Longitude.toString());
    setIsDefineEquipModalVisible(true);
  };

  const handleSaveConfigureGym = async () => {
    if (!selectedGym) return;
    if (!editName.trim()) {
      Alert.alert('Error', 'Please enter a name.');
      return;
    }
    const altNum = parseFloat(editAltitude.replace(',', '.'));
    const lonNum = parseFloat(editLongitude.replace(',', '.'));
    if (isNaN(altNum) || isNaN(lonNum)) {
      Alert.alert('Error', 'Please enter valid coordinate numbers.');
      return;
    }

    try {
      const payload = {
        name: editName.trim(),
        altitude: altNum,
        longitude: lonNum,
        rating: selectedGym.Rating,
      };
      await api.updateGymLocation(selectedGym.ID, payload);
      setIsDefineEquipModalVisible(false);
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update gym location');
    }
  };

  const handleAutodetectEditLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location was denied.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setEditAltitude(loc.coords.latitude.toString());
      setEditLongitude(loc.coords.longitude.toString());
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to detect location');
    } finally {
      setLocating(false);
    }
  };

  const renderSwipeActions = (item: GymLocation) => (
    <View style={styles.swipeActionContainer}>
      <Pressable
        onPress={() => handleDeleteGym(item.ID, item.Name)}
        style={({ pressed }) => [
          styles.deleteSwipeBtn,
          pressed && styles.pressed,
        ]}>
        <SymbolView tintColor="#FFFFFF" name="trash.fill" size={16} />
      </Pressable>
    </View>
  );

  const renderGymItem = ({ item }: { item: GymLocation }) => {
    const cardBg = theme.backgroundElement;

    return (
      <Swipeable
        renderLeftActions={() => renderSwipeActions(item)}
        containerStyle={styles.swipeContainer}>
        <View style={[styles.card, { backgroundColor: cardBg, marginBottom: 0 }]}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1, marginRight: Spacing.two }}>
              <ThemedText type="smallBold" style={styles.cardTitle}>
                {item.Name}
              </ThemedText>

              {/* Distance or Coordinates fallback */}
              <View style={styles.coordRow}>
                <SymbolView tintColor={theme.textSecondary} name={userLocation ? "figure.walk" : "location.fill"} size={12} />
                <ThemedText type="small" themeColor="textSecondary" style={{ marginLeft: 4 }}>
                  {userLocation ? (
                    formatDistance(
                      calculateDistance(
                        userLocation.latitude,
                        userLocation.longitude,
                        item.Altitude,
                        item.Longitude
                      )
                    )
                  ) : (
                    `${item.Altitude.toFixed(4)}, ${item.Longitude.toFixed(4)}`
                  )}
                </ThemedText>
              </View>

              {/* Rating stars */}
              <View style={styles.ratingRow}>
                {Array.from({ length: 5 }).map((_, idx) => {
                  const starActive = item.Rating !== null && idx < item.Rating;
                  return (
                    <SymbolView
                      key={idx}
                      tintColor={starActive ? '#FFD60A' : '#8E8E93'}
                      name={starActive ? 'star.fill' : 'star'}
                      size={14}
                      style={{ marginRight: 2 }}
                    />
                  );
                })}
              </View>
            </View>

            {/* Actions */}
            <View style={styles.cardActions}>
              <Pressable
                onPress={() => {
                  handleOpenConfigureGym(item);
                }}
                style={({ pressed }) => [
                  styles.cardActionBtn,
                  pressed && styles.pressed,
                ]}>
                <SymbolView tintColor="#8E8E93" name="slider.horizontal.3" size={22} />
              </Pressable>
              <Pressable
                onPress={() => {
                  setSelectedGym(item);
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
        </View>
      </Swipeable>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        
        {/* Header Bar */}
        <View style={styles.header}>
          <ThemedText type="subtitle" style={styles.headerTitle}>
            Gym Locations
          </ThemedText>
          <Pressable
            onPress={handleOpenAddModal}
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
            <SymbolView tintColor="#0A84FF" name="plus.circle.fill" size={28} />
          </Pressable>
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
            placeholder="Search gyms or equipment..."
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

        {loading && gymLocations.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0A84FF" />
          </View>
        ) : filteredGymLocations.length === 0 ? (
          <View style={styles.centerContainer}>
            <SymbolView
              tintColor={theme.textSecondary}
              name={searchQuery ? "magnifyingglass" : "map.fill"}
              size={48}
              style={{ marginBottom: Spacing.two, opacity: 0.6 }}
            />
            <ThemedText type="default" themeColor="textSecondary" style={styles.emptyText}>
              {searchQuery ? 'No gyms match your search' : 'No gym locations found in your area.'}
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={filteredGymLocations}
            keyExtractor={(item) => item.ID.toString()}
            renderItem={renderGymItem}
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

        {/* Add Gym Modal */}
        <Modal
          animationType="none"
          transparent={true}
          visible={isAddModalVisible}
          onRequestClose={addSwipe.close}>
          <View style={[styles.modalOverlay, { backgroundColor: 'transparent' }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={addSwipe.close} />
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1, justifyContent: 'flex-end', width: '100%' }}>
              <Animated.View
                style={[
                  styles.modalContent,
                  {
                    height: '70%',
                    backgroundColor: theme.background,
                    transform: [{ translateY: addSwipe.translateY }],
                  },
                ]}>
                <View {...addSwipe.panHandlers}>
                  <View style={styles.dragHandleContainer}>
                    <View style={styles.dragHandle} />
                  </View>
                  <View style={styles.modalHeader}>
                    <Pressable
                      onPress={addSwipe.close}
                      style={({ pressed }) => [styles.modalHeaderButton, pressed && styles.pressed]}>
                      <ThemedText type="link" themeColor="textSecondary">Cancel</ThemedText>
                    </Pressable>
                    <ThemedText type="smallBold" style={styles.modalTitle} numberOfLines={1}>
                      New Gym
                    </ThemedText>
                    <Pressable
                      onPress={handleAddGymLocation}
                      style={({ pressed }) => [styles.modalHeaderButton, pressed && styles.pressed]}>
                      <ThemedText type="linkPrimary" style={{ color: '#0A84FF', fontWeight: 'bold', textAlign: 'right' }}>
                        Save
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>

                <ScrollView style={styles.modalScrollBody} contentContainerStyle={styles.modalScrollContent}>
                  <View style={styles.inputGroup}>
                    <ThemedText type="smallBold" themeColor="textSecondary" style={styles.inputLabel}>
                      Gym Name
                    </ThemedText>
                    <TextInput
                      value={name}
                      onChangeText={setName}
                      placeholder="e.g. Central Calisthenics Park"
                      placeholderTextColor={theme.textSecondary}
                      style={[
                        styles.textInput,
                        {
                          backgroundColor: theme.backgroundElement,
                          color: theme.text,
                          borderColor: theme.backgroundSelected,
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.coordRowInputs}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: Spacing.two }]}>
                      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.inputLabel}>
                        Latitude
                      </ThemedText>
                      <TextInput
                        value={altitude}
                        onChangeText={setAltitude}
                        placeholder="e.g. 45.4642"
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="decimal-pad"
                        style={[
                          styles.textInput,
                          {
                            backgroundColor: theme.backgroundElement,
                            color: theme.text,
                            borderColor: theme.backgroundSelected,
                          },
                        ]}
                      />
                    </View>

                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.inputLabel}>
                        Longitude
                      </ThemedText>
                      <TextInput
                        value={longitude}
                        onChangeText={setLongitude}
                        placeholder="e.g. 9.1900"
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="decimal-pad"
                        style={[
                          styles.textInput,
                          {
                            backgroundColor: theme.backgroundElement,
                            color: theme.text,
                            borderColor: theme.backgroundSelected,
                          },
                        ]}
                      />
                    </View>
                  </View>

                 </ScrollView>
              </Animated.View>
            </KeyboardAvoidingView>
          </View>
        </Modal>

        {/* Define Equipment Modal */}
        <Modal
          animationType="none"
          transparent={true}
          visible={isDefineEquipModalVisible}
          onRequestClose={defineEquipSwipe.close}>
          <View style={[styles.modalOverlay, { backgroundColor: 'transparent' }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={defineEquipSwipe.close} />
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1, justifyContent: 'flex-end' }}>
              <Animated.View
                style={[
                  styles.modalContent,
                  {
                    height: '85%',
                    backgroundColor: theme.background,
                    transform: [{ translateY: defineEquipSwipe.translateY }],
                  },
                ]}>
                <View {...defineEquipSwipe.panHandlers}>
                  <View style={styles.dragHandleContainer}>
                    <View style={styles.dragHandle} />
                  </View>
                  <View style={styles.modalHeader}>
                    <Pressable
                      onPress={defineEquipSwipe.close}
                      style={({ pressed }) => [styles.modalHeaderButton, pressed && styles.pressed]}>
                      <ThemedText type="link" themeColor="textSecondary">Cancel</ThemedText>
                    </Pressable>
                    <ThemedText type="smallBold" style={styles.modalTitle} numberOfLines={1}>
                      Configure Gym
                    </ThemedText>
                    <Pressable
                      onPress={handleSaveConfigureGym}
                      style={({ pressed }) => [styles.modalHeaderButton, pressed && styles.pressed]}>
                      <ThemedText type="linkPrimary" style={{ color: '#0A84FF', fontWeight: 'bold', textAlign: 'right' }}>
                        Save
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>

                <FlatList
                  data={equipmentList}
                  keyExtractor={(eq) => eq.ID.toString()}
                  contentContainerStyle={{ padding: Spacing.four, paddingBottom: safeBottom }}
                  ListHeaderComponent={
                    <View style={{ marginBottom: Spacing.four }}>
                      {/* Gym Name */}
                      <View style={styles.inputGroup}>
                        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.inputLabel}>
                          Gym Name
                        </ThemedText>
                        <TextInput
                          value={editName}
                          onChangeText={setEditName}
                          placeholder="Name"
                          placeholderTextColor={theme.textSecondary}
                          style={[
                            styles.textInput,
                            {
                              backgroundColor: theme.backgroundElement,
                              color: theme.text,
                              borderColor: theme.backgroundSelected,
                            },
                          ]}
                        />
                      </View>

                      {/* Coordinates */}
                      <View style={styles.coordRowInputs}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: Spacing.two }]}>
                          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.inputLabel}>
                            Latitude / Altitude
                          </ThemedText>
                          <TextInput
                            value={editAltitude}
                            onChangeText={setEditAltitude}
                            placeholder="Latitude"
                            placeholderTextColor={theme.textSecondary}
                            keyboardType="decimal-pad"
                            style={[
                              styles.textInput,
                              {
                                backgroundColor: theme.backgroundElement,
                                color: theme.text,
                                borderColor: theme.backgroundSelected,
                              },
                            ]}
                          />
                        </View>

                        <View style={[styles.inputGroup, { flex: 1 }]}>
                          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.inputLabel}>
                            Longitude
                          </ThemedText>
                          <TextInput
                            value={editLongitude}
                            onChangeText={setEditLongitude}
                            placeholder="Longitude"
                            placeholderTextColor={theme.textSecondary}
                            keyboardType="decimal-pad"
                            style={[
                              styles.textInput,
                              {
                                backgroundColor: theme.backgroundElement,
                                color: theme.text,
                                borderColor: theme.backgroundSelected,
                              },
                            ]}
                          />
                        </View>
                      </View>

                      {/* Autodetect Button */}
                      <Pressable
                        onPress={handleAutodetectEditLocation}
                        disabled={locating}
                        style={({ pressed }) => [
                          styles.autodetectButton,
                          {
                            backgroundColor: theme.backgroundElement,
                            borderColor: theme.backgroundSelected,
                          },
                          pressed && styles.pressed,
                        ]}>
                        {locating ? (
                          <ActivityIndicator size="small" color="#0A84FF" />
                        ) : (
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                            <SymbolView tintColor="#0A84FF" name="location.fill" size={14} style={{ marginRight: 6 }} />
                            <ThemedText style={{ color: '#0A84FF', fontWeight: '600', fontSize: 14 }}>
                              Autodetect Current Location
                            </ThemedText>
                          </View>
                        )}
                      </Pressable>

                      {/* Section Divider / Label */}
                      <View style={{ marginTop: Spacing.two, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#C6C6C8', paddingTop: Spacing.three }}>
                        <ThemedText type="smallBold" themeColor="textSecondary" style={[styles.inputLabel, { marginBottom: 0 }]}>
                          Equipment List
                        </ThemedText>
                      </View>
                    </View>
                  }
                  renderItem={({ item: eq }) => {
                    const isChecked = selectedGym && locationEquipments.some(
                      (le) => le.GymLocationID === selectedGym.ID && le.GymEquipmentID === eq.ID
                    );

                    return (
                      <Pressable
                        onPress={() => handleToggleEquipment(eq.ID)}
                        style={({ pressed }) => [
                          styles.equipmentRow,
                          { backgroundColor: theme.backgroundElement },
                          pressed && styles.pressed,
                        ]}>
                        <ThemedText style={{ fontSize: 16 }}>{eq.Name}</ThemedText>
                        <SymbolView
                          tintColor={isChecked ? '#0A84FF' : '#8E8E93'}
                          name={isChecked ? 'checkmark.circle.fill' : 'circle'}
                          size={24}
                        />
                      </Pressable>
                    );
                  }}
                />
              </Animated.View>
            </KeyboardAvoidingView>
          </View>
        </Modal>

        {/* Gym Details Modal */}
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
                  height: '70%',
                  backgroundColor: theme.background,
                  transform: [{ translateY: detailSwipe.translateY }],
                },
              ]}>
              <View {...detailSwipe.panHandlers}>
                <View style={styles.dragHandleContainer}>
                  <View style={styles.dragHandle} />
                </View>
                <View style={styles.modalHeader}>
                  <View style={{ width: 60 }} />
                  <ThemedText type="smallBold" style={styles.modalTitle} numberOfLines={1}>
                    Gym Details
                  </ThemedText>
                  <View style={{ width: 60 }} />
                </View>
              </View>

              {selectedGym && (
                <ScrollView style={styles.modalScrollBody} contentContainerStyle={styles.modalScrollContent}>
                  <ThemedText
                    type="subtitle"
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.5}
                    style={styles.detailTitle}>
                    {selectedGym.Name}
                  </ThemedText>

                  {/* Rating display (Interactive) */}
                  <View style={[styles.detailSection, { flexDirection: 'row', alignItems: 'center', marginBottom: 20 }]}>
                    <ThemedText type="smallBold" themeColor="textSecondary" style={{ marginRight: 8 }}>
                      Rating:
                    </ThemedText>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {Array.from({ length: 5 }).map((_, idx) => {
                        const val = idx + 1;
                        const active = selectedGym.Rating !== null && idx < selectedGym.Rating;
                        return (
                          <Pressable
                            key={idx}
                            onPress={() => handleUpdateRating(val)}
                            style={({ pressed }) => [pressed && styles.pressed, { padding: 2 }]}>
                            <SymbolView
                              tintColor={active ? '#FFD60A' : '#8E8E93'}
                              name={active ? 'star.fill' : 'star'}
                              size={20}
                            />
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  {/* Location Info */}
                  <View style={styles.detailSection}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <ThemedText type="smallBold" themeColor="textSecondary" style={[styles.sectionLabel, { marginBottom: 0 }]}>
                        Location
                      </ThemedText>
                      <Pressable
                        onPress={handleOpenMap}
                        style={({ pressed }) => [pressed && styles.pressed, { padding: 4 }]}>
                        <SymbolView tintColor="#0A84FF" name="arrow.up.right.square" size={20} />
                      </Pressable>
                    </View>
                  </View>

                  {/* Equipments Present */}
                  <View style={styles.detailSection}>
                    <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
                      Available Equipment
                    </ThemedText>
                    {locationEquipments.filter((le) => le.GymLocationID === selectedGym.ID).length > 0 ? (
                      <View style={[styles.detailTextBox, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected, flexDirection: 'column', alignItems: 'stretch' }]}>
                        {locationEquipments
                          .filter((le) => le.GymLocationID === selectedGym.ID)
                          .map((le) => {
                            const name = equipmentList.find((eq) => eq.ID === le.GymEquipmentID)?.Name || 'Equipment';
                            return (
                              <View key={le.ID} style={styles.detailEquipRow}>
                                <SymbolView tintColor="#30D158" name="checkmark" size={14} style={{ marginRight: 8 }} />
                                <ThemedText style={{ fontSize: 15 }}>{name}</ThemedText>
                              </View>
                            );
                          })}
                      </View>
                    ) : (
                      <View style={[styles.detailTextBox, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
                        <ThemedText style={{ fontStyle: 'italic' }}>
                          No equipment currently registered at this location.
                        </ThemedText>
                      </View>
                    )}
                  </View>
                </ScrollView>
              )}
            </Animated.View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  addButton: {
    padding: Spacing.one,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.three,
    marginVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    height: 38,
    borderRadius: 10,
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
  listContainer: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
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
  pressed: {
    opacity: 0.7,
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
    marginBottom: 2,
  },
  coordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
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
    alignItems: 'flex-start',
    marginTop: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  chipText: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.six,
  },
  emptyIcon: {
    marginBottom: Spacing.three,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: Spacing.six,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
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
  },
  modalScrollContent: {
    paddingBottom: Spacing.six,
  },
  inputGroup: {
    marginBottom: Spacing.three,
  },
  inputLabel: {
    fontSize: 12,
    letterSpacing: 0.5,
    marginBottom: Spacing.one,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  autodetectButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  coordRowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  starsSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two,
  },
  configRatingSection: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  equipmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: 8,
    marginBottom: Spacing.two,
  },
  detailTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: Spacing.two,
  },
  detailSection: {
  },
  sectionLabel: {
    fontSize: 12,
    letterSpacing: 0.5,
    marginBottom: Spacing.one,
  },
  detailTextBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.three,
  },
  openMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    padding: Spacing.three,
    marginTop: Spacing.two,
  },
  detailEquipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.one,
  },
});
