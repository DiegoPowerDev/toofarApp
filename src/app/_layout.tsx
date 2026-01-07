import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import { toastConfig } from '@/components/CustomAlert';
import { Stack } from 'expo-router';
import '../../global.css';
import { SafeAreaView } from 'react-native-safe-area-context';
export default function Layout() {
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
