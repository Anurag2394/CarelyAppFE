/**
 * @format
 */

import { AppRegistry, Platform } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import messaging from '@react-native-firebase/messaging';
import notifee, { EventType } from '@notifee/react-native';

// Must be registered outside React - handles notification actions when app is in background
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.ACTION_PRESS && detail?.pressAction?.id === 'checkin') {
    try {
      if (detail.notification?.id) {
        await notifee.cancelNotification(detail.notification.id);
      }
    } catch (error) {
      console.error('Error handling background action:', error);
    }
  }
});

// Register background handler
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Background message received:', remoteMessage);
  try {
    // Ensure channel exists for Android - uses system default sound, visible on lock screen
    if (Platform.OS === 'android') {
      await notifee.createChannel({
        id: 'default',
        name: 'Carely Notifications',
        importance: 4,
        sound: 'default',
        visibility: 1,
      });
    }

    const messageId = remoteMessage.messageId || remoteMessage.data?.messageId || 'unknown';
    await notifee.displayNotification({
      id: remoteMessage.messageId || `fcm-${Date.now()}`,
      title: remoteMessage.notification?.title || 'Carely Notification',
      body: remoteMessage.notification?.body || 'Check-in required',
      data: { messageId, screen: 'checkin' },
      android: {
        channelId: 'default',
        importance: 4,
        visibility: 1,
        pressAction: {
          id: 'open_checkin',
        },
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
