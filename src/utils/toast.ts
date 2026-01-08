import Toast from 'react-native-toast-message';

interface ToastOptions {
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  duration?: number;
}

export const showToast = (options: ToastOptions): void => {
  Toast.show({
    type: options.type,
    text1: options.title,
    text2: options.message,
    visibilityTime: options.duration,
    topOffset: 60,
  });
};
