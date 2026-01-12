import React, { useState, useRef } from 'react';
import darkMapStyle from '@/data/mapstyle.json';
import Entypo from '@expo/vector-icons/Entypo';
import Feather from '@expo/vector-icons/Feather';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AntDesign from '@expo/vector-icons/AntDesign';
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Vibration,
  StatusBar,
  Modal,
  TextInput,
  Platform,
  Linking,
} from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as TaskManager from 'expo-task-manager';
import { showToast } from '@/utils/toast';
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router';
import { useGPSStore } from '@/store/useGPSStore';

interface Coordinates {
  lat: number;
  lng: number;
  accuracy?: number;
}

interface Place {
  name: string;
  lat: number;
  lng: number;
  emoji: string;
}

type MapMode = 'destination' | 'save-place';

// Constantes para AsyncStorage
const LOCATION_TASK_NAME = 'background-location-task';
const DESTINATION_KEY = '@destination';
const ALERT_RADIUS_KEY = '@alert_radius';
const ALERT_SHOWN_KEY = '@alert_shown';
const IS_MONITORING_KEY = '@is_monitoring';

// Función de cálculo de distancia
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Tarea de background (debe estar FUERA del componente)
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
  if (error) {
    console.error(error);
    return;
  }
  if (data) {
    const { locations } = data;
    const location = locations[0];

    const destinationStr = await AsyncStorage.getItem(DESTINATION_KEY);
    const alertRadiusStr = await AsyncStorage.getItem(ALERT_RADIUS_KEY);
    const alertShownStr = await AsyncStorage.getItem(ALERT_SHOWN_KEY);

    if (destinationStr && alertRadiusStr) {
      const destination: Place = JSON.parse(destinationStr);
      const alertRadius = parseFloat(alertRadiusStr);
      const alertShown = alertShownStr === 'true';

      const distance = calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        destination.lat,
        destination.lng
      );

      console.log(
        `[Background] Distancia: ${distance}m, Radio: ${alertRadius}m, Mostrado: ${alertShown}`
      );

      if (distance <= alertRadius && !alertShown) {
        // Marcar como mostrado ANTES de enviar notificación
        await AsyncStorage.setItem(ALERT_SHOWN_KEY, 'true');

        // Descartar notificaciones anteriores
        await Notifications.dismissAllNotificationsAsync();

        // UNA SOLA notificación
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🔔 ¡LLEGASTE A TU DESTINO!',
            body: `Estás a ${Math.round(distance)}m de ${destination.name}`,
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority.MAX,
            categoryIdentifier: 'ALERT_CATEGORY',
            sticky: true,
            data: { action: 'stop_monitoring' },
          },
          trigger: null,
        });

        // Vibración continua
        Vibration.vibrate([1000, 500], true);
      }
    }
  }
});

export default function Index() {
  // Zustand store
  const {
    currentLocation,
    savedPlaces,
    destination,
    isMonitoring,
    alertRadius,
    distance,
    hasAlerted,
    placeDistances,
    initialized,
    permissionError, // ← NUEVO
    setIsMonitoring,
    setAlertRadius,
    setHasAlerted,
    setDistance,
    savePlaces,
    selectSavedPlace,
    initialize, // ← NUEVO
  } = useGPSStore();

  // Estados locales (UI)
  const [showMapModal, setShowMapModal] = useState<boolean>(false);
  const [mapMode, setMapMode] = useState<MapMode>('destination');
  const [selectedMapLocation, setSelectedMapLocation] = useState<Coordinates | null>(null);
  const [newPlaceName, setNewPlaceName] = useState<string>('');
  const [showNameModal, setShowNameModal] = useState<boolean>(false);

  // Referencias
  const mapRef = useRef<MapView>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const alarmIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const openMapForDestination = (): void => {
    console.log('🗺️ Abriendo mapa para destino');
    setMapMode('destination');
    setSelectedMapLocation(destination || currentLocation);
    setShowMapModal(true);
  };

  const openMapForSavePlace = (): void => {
    console.log('🗺️ Abriendo mapa para guardar lugar');
    setMapMode('save-place');
    setSelectedMapLocation(currentLocation);
    setShowMapModal(true);
  };

  const confirmMapLocation = async (): Promise<void> => {
    if (!selectedMapLocation) return;

    if (mapMode === 'destination') {
      const newDestination: Place = {
        name: 'Destino Seleccionado',
        lat: selectedMapLocation.lat,
        lng: selectedMapLocation.lng,
        emoji: '🎯',
      };

      await selectSavedPlace(newDestination);

      if (currentLocation) {
        const dist = calculateDistance(
          currentLocation.lat,
          currentLocation.lng,
          newDestination.lat,
          newDestination.lng
        );
        useGPSStore.getState().setDistance(dist);
        console.log(`📏 Distancia inicial calculada: ${dist.toFixed(2)}m`);
      }

      setShowMapModal(false);
      console.log(
        `🎯 Destino establecido: ${selectedMapLocation.lat.toFixed(6)}, ${selectedMapLocation.lng.toFixed(6)}`
      );
    } else if (mapMode === 'save-place') {
      setShowMapModal(false);
      setShowNameModal(true);
    }
  };

  const savePlaceWithName = (): void => {
    if (!newPlaceName.trim() || !selectedMapLocation) {
      showToast(
        'error',
        'Ingresa un nombre para el lugar',
        'Por favor ingresa un nombre para el lugar'
      );
      return;
    }

    const newPlace: Place = {
      name: newPlaceName.trim(),
      lat: selectedMapLocation.lat,
      lng: selectedMapLocation.lng,
      emoji: '📍',
    };

    const updated = [...savedPlaces, newPlace];
    savePlaces(updated);
    setShowNameModal(false);
    setNewPlaceName('');
    console.log(`💾 Lugar guardado: ${newPlace.name}`);
    showToast('success', '💾 Guardado', `${newPlace.name} guardado exitosamente`);
  };

  const deleteSavedPlace = (index: number): void => {
    Toast.show({
      type: 'confirmDelete',
      text1: `¿Eliminar ${savedPlaces[index].name}?`,
      position: 'top',
      autoHide: false,
      props: {
        onCancel: () => Toast.hide(),
        onConfirm: () => {
          const placeName = savedPlaces[index].name;
          const updated = savedPlaces.filter((_, i) => i !== index);
          savePlaces(updated);
          Toast.hide();
          console.log(`🗑️ Lugar eliminado: ${placeName}`);

          Toast.show({
            type: 'error',
            text1: 'Eliminado',
            position: 'top',
          });
        },
      },
    });
  };

  const centerMapOnLocation = (location: Coordinates | null): void => {
    if (mapRef.current && location) {
      mapRef.current.animateToRegion({
        latitude: location.lat,
        longitude: location.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      console.log('🎯 Mapa centrado en ubicación');
    }
  };

  const playAlarm = async (): Promise<void> => {
    try {
      console.log('🔊 Reproduciendo alarma...');

      await Notifications.dismissAllNotificationsAsync();

      const vibratePattern = [1000, 500];
      Vibration.vibrate(vibratePattern, true);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 ¡LLEGASTE A TU DESTINO!',
          body: 'Presiona "Detener Alerta" para silenciar',
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
          categoryIdentifier: 'ALERT_CATEGORY',
          sticky: true,
        },
        trigger: null,
      });

      console.log('✅ Alarma activada con vibración continua');
    } catch (error) {
      console.log('❌ Error reproduciendo alarma:', error);
      Vibration.vibrate([1000, 500], true);
    }
  };

  const stopAlarm = async (): Promise<void> => {
    console.log('🔇 Deteniendo alarma...');

    Vibration.cancel();

    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }

    await Notifications.dismissAllNotificationsAsync();

    console.log('✅ Alarma detenida completamente');
  };

  const toggleMonitoring = async (): Promise<void> => {
    if (!destination) {
      showToast('error', 'Sin destino', 'Primero establece un destino');
      return;
    }

    if (isMonitoring) {
      console.log('⏸️ Deteniendo monitoreo...');

      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }

      const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
      if (hasStarted) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      }

      await AsyncStorage.removeItem(ALERT_SHOWN_KEY);
      await AsyncStorage.setItem(IS_MONITORING_KEY, 'false');
      setIsMonitoring(false);
      setHasAlerted(false);
      stopAlarm();
      showToast('error', '⏸️ Detenido', 'Monitoreo detenido');
      console.log('✅ Monitoreo detenido');
    } else {
      console.log('▶️ Iniciando monitoreo...');
      setHasAlerted(false);

      await AsyncStorage.removeItem(ALERT_SHOWN_KEY);
      await AsyncStorage.setItem(IS_MONITORING_KEY, 'true');
      await AsyncStorage.setItem(DESTINATION_KEY, JSON.stringify(destination));
      await AsyncStorage.setItem(ALERT_RADIUS_KEY, alertRadius.toString());

      console.log(`📊 Configuración: Destino=${destination.name}, Radio=${alertRadius}m`);

      try {
        locationSubscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (location) => {
            const coords: Coordinates = {
              lat: location.coords.latitude,
              lng: location.coords.longitude,
            };

            useGPSStore.getState().setCurrentLocation(coords);

            const dist = useGPSStore.getState().distance;

            console.log(`📍 Posición: ${dist?.toFixed(2)}m del destino`);

            if (dist && dist <= alertRadius && !hasAlerted) {
              console.log('🔔 ¡ALERTA ACTIVADA! Dentro del radio');
              setHasAlerted(true);
              playAlarm();
            }
          }
        );
      } catch (error) {
        console.log('Error en watchPosition, continuando con Background...');
      }

      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000,
        distanceInterval: 50,
        foregroundService: {
          notificationTitle: 'GPS Amigo activo',
          notificationBody: 'Monitoreando tu llegada...',
          notificationColor: '#d97706',
        },
      });

      setIsMonitoring(true);
      showToast('success', '✅ Monitoreo iniciado', 'Te avisaremos cuando llegues');
      console.log('✅ Monitoreo iniciado exitosamente');
    }
  };

  const dismissAlert = async (): Promise<void> => {
    console.log('👆 Descartando alerta...');
    setHasAlerted(false);
    await stopAlarm();

    if (isMonitoring) {
      await toggleMonitoring();
    }
  };

  const handleRadiusChange = async (newRadius: number) => {
    console.log(`📏 Cambiando radio de ${alertRadius}m a ${newRadius}m`);
    setAlertRadius(newRadius);

    if (isMonitoring) {
      await AsyncStorage.removeItem(ALERT_SHOWN_KEY);
      await AsyncStorage.setItem(ALERT_RADIUS_KEY, newRadius.toString());
      setHasAlerted(false);
      await stopAlarm();
      showToast('info', '📏 Radio actualizado', `Nueva distancia: ${formatDistance(newRadius)}`);
    }
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(2)}km`;
  };
  const openAppSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };
  return (
    <View className="flex-1 bg-black/80">
      <StatusBar barStyle="light-content" />

      {/* Modal de Mapa */}
      <Modal visible={showMapModal} animationType="slide">
        <View className="flex-1 bg-white">
          <View className="flex-row items-center justify-between bg-amber-600 px-4 pb-4 pt-12">
            <TouchableOpacity onPress={() => setShowMapModal(false)}>
              <View className="rounded-full bg-red-500 p-2">
                <AntDesign name="close" size={24} color="white" />
              </View>
            </TouchableOpacity>
            <Text className="text-lg font-bold text-white">
              {mapMode === 'destination' ? 'Selecciona tu destino' : 'Selecciona ubicación'}
            </Text>
            <TouchableOpacity onPress={confirmMapLocation}>
              <View className="rounded-full bg-green-500 p-2">
                <AntDesign name="check" size={24} color="white" />
              </View>
            </TouchableOpacity>
          </View>

          {currentLocation?.lat && currentLocation?.lng ? (
            <View className="flex-1">
              <MapView
                provider={PROVIDER_GOOGLE}
                customMapStyle={Platform.OS === 'android' ? darkMapStyle : undefined}
                ref={mapRef}
                style={{ flex: 1 }}
                initialRegion={{
                  latitude: selectedMapLocation?.lat || currentLocation.lat,
                  longitude: selectedMapLocation?.lng || currentLocation.lng,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                onPress={(e) => {
                  setSelectedMapLocation({
                    lat: e.nativeEvent.coordinate.latitude,
                    lng: e.nativeEvent.coordinate.longitude,
                  });
                }}>
                {currentLocation && (
                  <Marker
                    coordinate={{
                      latitude: currentLocation.lat,
                      longitude: currentLocation.lng,
                    }}
                    title="Tu ubicación"
                    pinColor="blue"
                  />
                )}

                {selectedMapLocation && (
                  <>
                    <Marker
                      coordinate={{
                        latitude: selectedMapLocation.lat,
                        longitude: selectedMapLocation.lng,
                      }}
                      title={mapMode === 'destination' ? 'Destino' : 'Nuevo lugar'}
                      pinColor="red"
                    />
                    {mapMode === 'destination' && (
                      <Circle
                        center={{
                          latitude: selectedMapLocation.lat,
                          longitude: selectedMapLocation.lng,
                        }}
                        radius={alertRadius}
                        fillColor="#C1502430"
                        strokeColor="#C1502450"
                        strokeWidth={2}
                      />
                    )}
                  </>
                )}

                {savedPlaces.map((place, index) => (
                  <Marker
                    key={index}
                    coordinate={{
                      latitude: place.lat,
                      longitude: place.lng,
                    }}
                    title={place.name}
                    pinColor="green"
                  />
                ))}
              </MapView>
            </View>
          ) : (
            <View className="h-48 w-full items-center justify-center bg-gray-200">
              <Text>Cargando mapa...</Text>
            </View>
          )}

          <View className="absolute bottom-5 left-5 right-5 flex-row items-center justify-between">
            <TouchableOpacity
              className="rounded-full bg-white px-5 py-3 shadow-lg"
              onPress={() => centerMapOnLocation(currentLocation)}>
              <Text className="text-base font-semibold text-gray-800">📍 Mi ubicación</Text>
            </TouchableOpacity>
            {mapMode === 'destination' && (
              <View className="rounded-2xl bg-white px-4 py-2.5 shadow-lg">
                <Text className="text-sm font-semibold text-indigo-500">
                  Alerta: {formatDistance(alertRadius)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal de Nombre */}
      <Modal visible={showNameModal} animationType="fade" transparent={true}>
        <View className="flex-1 items-center justify-center bg-black/50">
          <View className="w-4/5 max-w-md rounded-3xl bg-white p-6">
            <Text className="mb-5 text-center text-xl font-bold text-gray-800">
              Nombre del lugar
            </Text>
            <TextInput
              className="mb-5 rounded-xl border border-gray-300 p-4 text-base"
              placeholder="Ej: Casa, Trabajo, Gimnasio"
              value={newPlaceName}
              onChangeText={setNewPlaceName}
              autoFocus
            />
            <View className="flex-row gap-2.5">
              <TouchableOpacity
                className="flex-1 items-center rounded-xl bg-gray-100 p-4"
                onPress={() => {
                  setShowNameModal(false);
                  setNewPlaceName('');
                }}>
                <Text className="text-base font-semibold text-gray-600">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 items-center rounded-xl bg-amber-600 p-4"
                onPress={savePlaceWithName}>
                <Text className="text-base font-bold text-white">Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Pantalla de carga */}
      {!initialized ? (
        <View className="flex-1 items-center justify-center bg-amber-600 px-6">
          <View className="items-center">
            <Entypo name="location" size={80} color="white" className="mb-5" />
            <Text className="mb-2 text-4xl font-bold text-white">GPS Amigo</Text>

            {permissionError ? (
              // Pantalla de error de permisos
              <>
                <Text className="mb-4 text-center text-lg text-white/90">
                  ⚠️ No se pudieron obtener los permisos necesarios
                </Text>
                <Text className="mb-8 text-center text-sm text-white/70">
                  GPS Amigo necesita acceso a tu ubicación y notificaciones para funcionar
                  correctamente
                </Text>

                <View className="gap-3">
                  <TouchableOpacity
                    onPress={() => {
                      console.log('🔄 Reintentando inicialización...');
                      initialize();
                    }}
                    className="rounded-xl bg-white px-8 py-4 shadow-lg active:scale-95">
                    <View className="flex-row items-center justify-center gap-2">
                      <MaterialIcons name="refresh" size={24} color="#d97706" />
                      <Text className="text-lg font-bold text-amber-600">Reintentar</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={openAppSettings}
                    className="rounded-xl border-2 border-white/30 bg-white/10 px-8 py-4 active:scale-95">
                    <View className="flex-row items-center justify-center gap-2">
                      <MaterialIcons name="settings" size={22} color="white" />
                      <Text className="text-base font-semibold text-white">
                        Abrir Configuración
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <Text className="mt-2 text-center text-xs text-white/60">
                    Si rechazaste los permisos, ábrelos manualmente en Configuración
                  </Text>
                </View>
              </>
            ) : (
              // Pantalla de carga normal
              <>
                <Text className="mb-8 text-center text-lg text-white/80">
                  Cargando datos guardados, GPS y permisos...
                </Text>

                <View className="flex-row gap-2">
                  <View className="h-3 w-3 animate-pulse rounded-full bg-white" />
                  <View className="h-3 w-3 animate-pulse rounded-full bg-white" />
                  <View className="h-3 w-3 animate-pulse rounded-full bg-white" />
                </View>
              </>
            )}
          </View>
        </View>
      ) : (
        <ScrollView className="flex-1">
          {/* Header */}
          <View className="h-32 flex-col justify-center bg-amber-600 py-2">
            <View className="mb-1 flex flex-row items-center justify-between gap-2">
              <Entypo className="pl-6" name="location" size={30} color="white" />
              <Text className="text-3xl font-bold text-white">GPS Amigo</Text>
              <TouchableOpacity
                className="flex flex-row items-center justify-end rounded-l-3xl bg-white p-2 shadow-sm"
                onPress={() => router.push('/about')}>
                <AntDesign name="info-circle" size={30} color="black" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Alerta de llegada */}
          {hasAlerted && (
            <View className="m-5 items-center rounded-3xl bg-red-500 p-8">
              <Text className="mb-2.5 text-6xl">🔔</Text>
              <Text className="mb-2.5 text-3xl font-bold text-white">¡YA LLEGASTE!</Text>
              <Text className="mb-1 text-lg text-white/90">Estás cerca de:</Text>
              <Text className="mb-2.5 text-2xl font-bold text-white">{destination?.name}</Text>
              <Text className="mb-5 text-xl text-white">
                {distance && formatDistance(distance)}
              </Text>
              <TouchableOpacity className="rounded-2xl bg-white px-8 py-4" onPress={dismissAlert}>
                <Text className="text-lg font-bold text-red-500">OK, Entendido</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Mapa pequeño */}
          <View className="m-4 rounded-3xl bg-white p-5 shadow-sm">
            <View className="mb-4 flex flex-row items-center gap-2">
              <Entypo name="map" size={24} color="black" />
              <Text className="text-xl font-bold text-gray-800">Mapa</Text>
            </View>
            {currentLocation && (
              <View className="mb-4 overflow-hidden rounded-2xl">
                <MapView
                  provider={PROVIDER_GOOGLE}
                  customMapStyle={Platform.OS === 'android' ? darkMapStyle : undefined}
                  className="h-48 w-full"
                  region={{
                    latitude: currentLocation?.lat ?? -12.0464,
                    longitude: currentLocation?.lng ?? -77.0428,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}>
                  {currentLocation && (
                    <Marker
                      coordinate={{
                        latitude: currentLocation.lat,
                        longitude: currentLocation.lng,
                      }}
                      pinColor="blue"
                    />
                  )}

                  {destination && (
                    <>
                      <Marker
                        coordinate={{
                          latitude: destination.lat,
                          longitude: destination.lng,
                        }}
                        pinColor="red"
                      />
                      <Circle
                        center={{
                          latitude: destination.lat,
                          longitude: destination.lng,
                        }}
                        radius={alertRadius}
                        fillColor="rgba(99, 102, 241, 0.2)"
                        strokeColor="rgba(99, 102, 241, 0.5)"
                        strokeWidth={2}
                      />
                    </>
                  )}

                  {savedPlaces.map((place, index) => (
                    <Marker
                      key={index}
                      coordinate={{
                        latitude: place.lat,
                        longitude: place.lng,
                      }}
                      pinColor="green"
                    />
                  ))}
                </MapView>

                <TouchableOpacity
                  className="items-center bg-amber-600 p-3"
                  onPress={openMapForDestination}>
                  <Text className="text-base font-semibold text-white">📍 Abrir mapa completo</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Mi Destino */}
          <View className="m-4 rounded-3xl bg-white p-5 shadow-sm">
            <View className="flex flex-row gap-2">
              <Feather name="target" size={24} color="black" />
              <Text className="mb-4 text-xl font-bold text-gray-800">Mi Destino</Text>
            </View>
            {destination ? (
              <View className="mb-4 rounded-2xl bg-amber-200 p-5">
                <Text className="mb-1 text-xl font-bold text-indigo-950">{destination.name}</Text>
                <Text className="mb-2.5 text-xs text-indigo-700">
                  {destination.lat.toFixed(6)}, {destination.lng.toFixed(6)}
                </Text>
                {distance !== null && (
                  <View className="mt-3 rounded-xl bg-white/60 p-3">
                    <Text className="text-center text-sm font-semibold text-indigo-700">
                      📏 Distancia actual
                    </Text>
                    <Text className="text-center text-2xl font-bold text-indigo-950">
                      {formatDistance(distance)}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <Text className="mb-4 text-sm text-gray-400">No hay destino establecido</Text>
            )}
            <TouchableOpacity
              className="items-center rounded-xl bg-amber-600 p-4"
              onPress={openMapForDestination}>
              <Text className="text-base font-bold text-white">📍 Seleccionar en Mapa</Text>
            </TouchableOpacity>
          </View>

          {/* Mis lugares */}
          <View className="m-4 rounded-3xl bg-white p-5 shadow-sm">
            <View className="mb-4 flex-row items-center justify-between">
              <View className="flex flex-row gap-2">
                <Entypo name="star-outlined" size={24} color="black" />
                <Text className="text-xl font-bold text-gray-800">Mis lugares</Text>
              </View>
              <TouchableOpacity onPress={openMapForSavePlace}>
                <Text className="text-base font-bold text-indigo-500">+ Agregar</Text>
              </TouchableOpacity>
            </View>
            {savedPlaces.length === 0 ? (
              <Text className="my-5 text-center text-gray-400">No hay lugares guardados</Text>
            ) : (
              savedPlaces.map((place, index) => (
                <TouchableOpacity
                  key={index}
                  className="mb-2.5 flex-row items-center justify-between rounded-xl bg-gray-50 p-4"
                  onPress={() => selectSavedPlace(place)}
                  onLongPress={() => deleteSavedPlace(index)}>
                  <View className="flex-row items-center gap-3">
                    <Text className="text-3xl">{place.emoji}</Text>
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-gray-800">{place.name}</Text>
                      <Text className="text-xs text-gray-500">
                        {place.lat.toFixed(4)}, {place.lng.toFixed(4)}
                      </Text>
                      {placeDistances[index] !== undefined && (
                        <View className="mt-1 rounded-lg bg-blue-50 px-2 py-1">
                          <Text className="text-xs font-semibold text-blue-700">
                            📍 {formatDistance(placeDistances[index])}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Text className="text-2xl text-gray-400">›</Text>
                </TouchableOpacity>
              ))
            )}
            <Text className="mt-2.5 text-center text-xs text-gray-400">
              Mantén presionado para eliminar
            </Text>
          </View>
          <View className="m-4 rounded-3xl bg-white p-5 shadow-sm">
            <View className="mb-2 flex w-full flex-row items-center gap-2">
              <MaterialIcons name="radar" size={24} color="black" />
              <Text className="text-xl font-bold text-gray-800">Distancia de Alerta</Text>
            </View>
            <View className="gap-2.5">
              {[100, 200, 300, 500, 1000].map((radius) => (
                <TouchableOpacity
                  key={radius}
                  className={`items-center rounded-xl p-4 ${
                    alertRadius === radius ? 'bg-amber-600' : 'bg-gray-100'
                  }`}
                  onPress={() => handleRadiusChange(radius)}>
                  <Text
                    className={`text-base font-semibold ${
                      alertRadius === radius ? 'text-white' : 'text-gray-700'
                    }`}>
                    {formatDistance(radius)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            className={`m-5 items-center rounded-2xl p-5 ${
              !destination ? 'bg-gray-300' : isMonitoring ? 'bg-red-500' : 'bg-green-500'
            }`}
            onPress={toggleMonitoring}
            disabled={!destination}>
            {isMonitoring ? (
              <View className="flex w-full flex-row items-center justify-center gap-2">
                <Text className="text-lg font-bold text-white">Detener</Text>
                <FontAwesome name="hand-stop-o" size={24} color="white" />
              </View>
            ) : (
              <View className="flex w-full flex-row items-center justify-center gap-2">
                <FontAwesome5 name="running" size={24} color="white" />
                <Text className="text-lg font-bold text-white">Comencemos</Text>
              </View>
            )}
          </TouchableOpacity>

          {isMonitoring && (
            <View className="mb-5 flex-row items-center justify-center gap-2.5">
              <View className="h-2.5 w-2.5 rounded-full bg-green-500" />
              <Text className="text-base font-semibold text-green-600">Alerta activada</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
