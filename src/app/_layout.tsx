import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import { toastConfig } from '@/components/CustomAlert';
import { Stack } from 'expo-router';
import '../../global.css';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGPSStore } from '@/store/useGPSStore';
import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Vibration } from 'react-native';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
Notifications.setNotificationHandler({
  handleNotification: async (): Promise<Notifications.NotificationBehavior> => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
Notifications.setNotificationCategoryAsync('ALERT_CATEGORY', [
  {
    identifier: 'STOP_MONITORING',
    buttonTitle: 'Detener Alerta',
    options: {
      opensAppToForeground: false,
    },
  },
]);
interface Place {
  name: string;
  lat: number;
  lng: number;
  emoji: string;
}
const LOCATION_TASK_NAME = 'background-location-task';
const DESTINATION_KEY = '@destination';
const ALERT_RADIUS_KEY = '@alert_radius';
const ALERT_SHOWN_KEY = '@alert_shown';
const IS_MONITORING_KEY = '@is_monitoring';

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
        await AsyncStorage.setItem(ALERT_SHOWN_KEY, 'true');

        // UNA SOLA notificación en background también
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
        Vibration.vibrate([500, 200, 500, 200, 500], true);
      }
    }
  }
});

export default function Layout() {
  const initialize = useGPSStore((state) => state.initialize);
  const getCurrentLocation = useGPSStore((state) => state.getCurrentLocation);
  const setIsMonitoring = useGPSStore((state) => state.setIsMonitoring);
  const setHasAlerted = useGPSStore((state) => state.setHasAlerted);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);

  const alarmIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const initialized = useGPSStore((state) => state.initialized);
  const stopAlarm = async (): Promise<void> => {
    console.log('🔇 Deteniendo alarma...');

    // Detener vibración
    Vibration.cancel();

    // Limpiar cualquier intervalo (por seguridad)
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }

    // Descartar todas las notificaciones
    await Notifications.dismissAllNotificationsAsync();

    console.log('✅ Alarma detenida completamente');
  };
  useEffect(() => {
    // Inicializar solo UNA VEZ cuando se monta el layout
    initialize();
  }, []);

  useEffect(() => {
    if (!initialized) return;

    const interval = setInterval(() => {
      getCurrentLocation();
    }, 10000); // ← Cambiado de 5000 a 10000ms (10 segundos)

    return () => clearInterval(interval);
  }, [initialized, getCurrentLocation]);

  useEffect(() => {
    setupNotificationListeners();

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
      if (alarmIntervalRef.current) {
        clearInterval(alarmIntervalRef.current);
      }
      Vibration.cancel();
    };
  }, []); // ← Array de dependencias VACÍO

  const setupNotificationListeners = () => {
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('🔔 Notificación recibida:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        console.log('👆 Usuario interactuó con notificación:', response.actionIdentifier);
        if (response.actionIdentifier === 'STOP_MONITORING') {
          await stopMonitoringFromNotification();
        }
      }
    );
  };

  const stopMonitoringFromNotification = async () => {
    try {
      console.log('⏸️ Deteniendo monitoreo desde notificación...');

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
      await stopAlarm();

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏸️ Monitoreo Detenido',
          body: 'La alerta ha sido desactivada',
          sound: false,
        },
        trigger: null,
      });

      console.log('✅ Monitoreo detenido exitosamente');
    } catch (error) {
      console.error('❌ Error deteniendo desde notificación:', error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ animation: 'slide_from_left' }} />
        <Stack.Screen name="about" options={{ animation: 'slide_from_right' }} />
      </Stack>
      <StatusBar style="auto" />
      <Toast config={toastConfig} position="top" />
    </SafeAreaView>
  );
}
