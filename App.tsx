import ScreenContent from 'components/ScreenContent';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import './global.css';
import { toastConfig } from 'components/CustomAlert';

export default function App() {
  return (
    <>
      <ScreenContent></ScreenContent>
      <StatusBar style="auto" />
      <Toast config={toastConfig} position="top" />
    </>
  );
}
