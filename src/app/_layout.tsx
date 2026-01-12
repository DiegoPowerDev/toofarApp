import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import { toastConfig } from '@/components/CustomAlert';
import { Stack } from 'expo-router';
import '../../global.css';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGPSStore } from '@/store/useGPSStore';
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Vibration } from 'react-native';

// Configuración de notificaciones (solo una vez aquí)
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

export default function Layout() {
  const { initialize, initialized, getCurrentLocation } = useGPSStore();
  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);

  // Inicializar solo UNA VEZ
  useEffect(() => {
    initialize();
    setupNotificationListeners();

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
      Vibration.cancel();
    };
  }, []);

  // Actualización periódica de ubicación
  useEffect(() => {
    if (!initialized) return;

    const interval = setInterval(() => {
      getCurrentLocation();
    }, 10000); // 10 segundos

    return () => clearInterval(interval);
  }, [initialized, getCurrentLocation]);

  const setupNotificationListeners = () => {
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('🔔 Notificación recibida:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        console.log('👆 Usuario interactuó con notificación:', response.actionIdentifier);
        if (response.actionIdentifier === 'STOP_MONITORING') {
          // Llamar a la función de detener del store o componente
          console.log('Detener desde notificación');
        }
      }
    );
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
