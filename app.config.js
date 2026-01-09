import 'dotenv/config';

export default {
  expo: {
    name: 'GPS Amigo',
    slug: 'gps-amigo',
    version: '1.0.0',
    icon: './assets/icon.png',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#f59e0b',
    },
    android: {
      package: 'com.tuempresa.gpsamigo',
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#f59e0b',
      },
      config: {
        googleMaps: {
          apiKey: 'AIzaSyBEV7QxhfOJmV27MoQYzZ097xJ1e7ZrZPg',
        },
      },
      metadata: {
        'com.google.android.gms.maps.API_OPTIONS': 'MAPS_RENDERER_LATEST',
      },
      permissions: [
        'ACCESS_COARSE_LOCATION',
        'ACCESS_FINE_LOCATION',
        'ACCESS_BACKGROUND_LOCATION',
        'FOREGROUND_SERVICE',
        'FOREGROUND_SERVICE_LOCATION',
        'VIBRATE',
        'WAKE_LOCK',
        'POST_NOTIFICATIONS',
      ],
      intentFilters: [
        {
          action: 'VIEW',
          data: [
            {
              scheme: 'gpsamigo',
            },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },
    extra: {
      eas: {
        projectId: '2802077e-e84e-4e61-8189-732fdb88271e',
      },
    },
  },
};
