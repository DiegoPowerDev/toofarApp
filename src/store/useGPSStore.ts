import { create } from 'zustand';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showToast } from '@/utils/toast';

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

interface AppState {
  // Estado
  currentLocation: Coordinates | null;
  savedPlaces: Place[];
  destination: Place | null;
  isMonitoring: boolean;
  alertRadius: number;
  distance: number | null;
  hasAlerted: boolean;
  placeDistances: { [key: number]: number };
  initialized: boolean;
  isInitializing: boolean;
  permissionError: boolean; // ← NUEVO

  // Setters
  setCurrentLocation: (location: Coordinates | null) => void;
  setSavedPlaces: (places: Place[]) => void;
  setDestination: (place: Place | null) => void;
  setIsMonitoring: (monitoring: boolean) => void;
  setAlertRadius: (radius: number) => void;
  setDistance: (distance: number | null) => void;
  setHasAlerted: (alerted: boolean) => void;
  setPlaceDistances: (distances: { [key: number]: number }) => void;

  // Funciones
  initialize: () => Promise<void>;
  requestPermissions: () => Promise<boolean>;
  loadSavedPlaces: () => Promise<void>;
  savePlaces: (places: Place[]) => Promise<void>;
  getCurrentLocation: () => Promise<void>;
  calculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number) => number;
  calculatePlaceDistances: () => void;
  selectSavedPlace: (place: Place) => Promise<void>;
}

export const useGPSStore = create<AppState>((set, get) => ({
  // Estado inicial
  currentLocation: null,
  savedPlaces: [],
  destination: null,
  isMonitoring: false,
  alertRadius: 300,
  distance: null,
  hasAlerted: false,
  placeDistances: {},
  initialized: false,
  isInitializing: false,
  permissionError: false, // ← NUEVO

  // Setters
  setCurrentLocation: (location) => {
    set({ currentLocation: location });

    // Calcular distancia al destino automáticamente
    const state = get();
    if (location && state.destination) {
      const dist = state.calculateDistance(
        location.lat,
        location.lng,
        state.destination.lat,
        state.destination.lng
      );
      set({ distance: dist });
    }

    // Calcular distancias a lugares guardados
    get().calculatePlaceDistances();
  },

  setSavedPlaces: (places) => set({ savedPlaces: places }),
  setDestination: (place) => set({ destination: place }),
  setIsMonitoring: (monitoring) => set({ isMonitoring: monitoring }),
  setAlertRadius: (radius) => set({ alertRadius: radius }),
  setDistance: (distance) => set({ distance }),
  setHasAlerted: (alerted) => set({ hasAlerted: alerted }),
  setPlaceDistances: (distances) => set({ placeDistances: distances }),

  // Inicializar (llamar solo UNA VEZ)
  initialize: async () => {
    const state = get();

    // ✅ Protección contra inicialización múltiple
    if (state.initialized || state.isInitializing) {
      console.log('⏭️ Ya inicializado o inicializando...');
      return;
    }

    console.log('🚀 Inicializando store...');
    set({ isInitializing: true, permissionError: false });

    try {
      // 1. Solicitar permisos primero (crítico)
      await state.requestPermissions();

      // 2. Cargar lugares guardados (en paralelo con ubicación)
      await Promise.all([state.loadSavedPlaces(), state.getCurrentLocation()]);

      set({ initialized: true, permissionError: false });
      console.log('✅ Store inicializado');
    } catch (error) {
      console.error('❌ Error inicializando:', error);
      set({ initialized: false, permissionError: true });
      showToast('error', '❌ Error de permisos', 'No se pudieron obtener los permisos necesarios');
    } finally {
      set({ isInitializing: false });
    }
  },

  // Solicitar permisos (MEJORADO - secuencial)
  requestPermissions: async () => {
    try {
      console.log('🔐 Verificando permisos...');

      // 1. Verificar permisos de ubicación en primer plano
      let foregroundPerms = await Location.getForegroundPermissionsAsync();

      if (foregroundPerms.status !== 'granted') {
        console.log('🔐 Solicitando permiso de ubicación...');
        foregroundPerms = await Location.requestForegroundPermissionsAsync();

        if (foregroundPerms.status !== 'granted') {
          throw new Error('Permiso de ubicación denegado');
        }
        console.log('✅ Permiso de ubicación concedido');
      } else {
        console.log('✅ Permiso de ubicación ya concedido');
      }

      // 2. Verificar permisos de ubicación en segundo plano
      let backgroundPerms = await Location.getBackgroundPermissionsAsync();

      if (backgroundPerms.status !== 'granted') {
        console.log('🔐 Solicitando permiso de ubicación en segundo plano...');
        // Pequeña pausa para que el usuario procese el primer permiso
        await new Promise((resolve) => setTimeout(resolve, 500));

        backgroundPerms = await Location.requestBackgroundPermissionsAsync();

        if (backgroundPerms.status !== 'granted') {
          showToast('warning', '⚠️ Permiso limitado', 'Activa "Permitir siempre" en configuración');
        } else {
          console.log('✅ Permiso de segundo plano concedido');
        }
      } else {
        console.log('✅ Permiso de segundo plano ya concedido');
      }

      // 3. Verificar permisos de notificaciones
      let notificationPerms = await Notifications.getPermissionsAsync();

      if (!notificationPerms.granted) {
        console.log('🔐 Solicitando permiso de notificaciones...');
        // Pequeña pausa
        await new Promise((resolve) => setTimeout(resolve, 500));

        notificationPerms = await Notifications.requestPermissionsAsync();

        if (!notificationPerms.granted) {
          showToast(
            'warning',
            '⚠️ Sin notificaciones',
            'Activa las notificaciones en configuración'
          );
        } else {
          console.log('✅ Permiso de notificaciones concedido');
        }
      } else {
        console.log('✅ Permiso de notificaciones ya concedido');
      }

      console.log('✅ Proceso de permisos completado');
      return true;
    } catch (error) {
      console.error('❌ Error solicitando permisos:', error);
      throw error;
    }
  },

  // Cargar lugares guardados
  loadSavedPlaces: async () => {
    try {
      const saved = await AsyncStorage.getItem('@saved_places');
      if (saved) {
        const places = JSON.parse(saved);
        set({ savedPlaces: places });
        console.log(`💾 ${places.length} lugares cargados`);
      }
    } catch (error) {
      console.error('❌ Error cargando lugares:', error);
    }
  },

  // Guardar lugares
  savePlaces: async (places) => {
    try {
      await AsyncStorage.setItem('@saved_places', JSON.stringify(places));
      set({ savedPlaces: places });
      console.log(`💾 ${places.length} lugares guardados`);
    } catch (error) {
      console.error('❌ Error guardando lugares:', error);
    }
  },

  // Obtener ubicación actual
  getCurrentLocation: async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const newLocation: Coordinates = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        accuracy: location.coords.accuracy ?? undefined,
      };

      // Esto triggereará automáticamente el cálculo de distancias
      get().setCurrentLocation(newLocation);

      console.log(`📍 Ubicación: ${newLocation.lat.toFixed(6)}, ${newLocation.lng.toFixed(6)}`);
    } catch (error) {
      console.log('⚠️ Error obteniendo ubicación:', error);
    }
  },

  // Calcular distancia
  calculateDistance: (lat1, lon1, lat2, lon2) => {
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
  },

  // Calcular distancias a lugares guardados
  calculatePlaceDistances: () => {
    const state = get();
    if (!state.currentLocation) return;

    const distances: { [key: number]: number } = {};
    state.savedPlaces.forEach((place, index) => {
      const dist = state.calculateDistance(
        state.currentLocation!.lat,
        state.currentLocation!.lng,
        place.lat,
        place.lng
      );
      distances[index] = dist;
    });
    set({ placeDistances: distances });
  },

  // Seleccionar lugar guardado
  selectSavedPlace: async (place) => {
    set({ destination: place, hasAlerted: false });
    await AsyncStorage.removeItem('@alert_shown');
    console.log(`🚩 Destino: ${place.name}`);
    showToast('success', '🚩 Destino seleccionado', place.name);
  },
}));
