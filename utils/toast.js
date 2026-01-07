import Toast from 'react-native-toast-message';

export const showToast = (type, title, message, duration = 3000) => {
  Toast.show({
    type,
    text1: title,
    text2: message,
    visibilityTime: duration,
    topOffset: 60,
  });
};
