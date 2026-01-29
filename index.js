/**
 * @format
 */

import { AppRegistry, Platform } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';

// Register background handler
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Background message received:', remoteMessage);
  try {
    // Ensure channel exists for Android
    if (Platform.OS === 'android') {
      await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
      });
    }

    await notifee.displayNotification({
      id: remoteMessage.messageId || `fcm-${Date.now()}`,
      title: remoteMessage.notification?.title || 'Carely Notification',
      body: remoteMessage.notification?.body || 'Check-in required',
      data: { messageId: remoteMessage.messageId },
      android: {
        channelId: 'default',
        actions: [
          {
            title: 'Check-in',
            pressAction: {
              id: 'checkin',
            },
          },
        ],
      },
      ios: {
        categoryId: 'checkin',
      },
    });
    console.log('Background notification displayed');
  } catch (error) {
    console.error('Error displaying background notification:', error);
  }
});

AppRegistry.registerComponent(appName, () => App);
