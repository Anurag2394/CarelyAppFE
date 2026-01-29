/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  View,
  Alert,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import messaging from '@react-native-firebase/messaging';
import notifee, { EventType } from '@notifee/react-native';

function App() {
  const [fcmToken, setFcmToken] = useState<string>('');
  const [messages, setMessages] = useState<string[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [backendUrl, setBackendUrl] = useState<string>('https://your-backend-api.com/register-token');
  const [isTokenSent, setIsTokenSent] = useState<boolean>(false);

  // Function to send FCM token to backend
  // const sendTokenToBackend = async (token: string) => {
  //   try {
  //     const response = await fetch(backendUrl, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         fcmToken: token,
  //         deviceType: Platform.OS,
  //         timestamp: new Date().toISOString(),
  //       }),
  //     });

  //     if (response.ok) {
  //       console.log('Token sent to backend successfully');
  //       setIsTokenSent(true);
  //     } else {
  //       console.error('Failed to send token to backend, status:', response.status);
  //     }
  //   } catch (error) {
  //     console.error('Error sending token to backend:', error);
  //   }
  // };

  //Function to send acknowledgment to backend
  const sendAcknowledgment = async (messageId: string) => {
    try {
      const response = await fetch(`${backendUrl}/acknowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId: messageId,
          fcmToken: fcmToken,
          acknowledgedAt: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        console.log('Acknowledgment sent successfully');
      } else {
        console.error('Failed to send acknowledgment, status:', response.status);
      }
    } catch (error) {
      console.error('Error sending acknowledgment:', error);
    }
  };

  useEffect(() => {
    console.log('Setting up notifications...');
    const setup = async () => {
      try {
        // Request permission
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          console.log('Authorization status:', authStatus);
        } else {
          console.log('Notification permission not granted');
        }

        // Get FCM token
        const token = await messaging().getToken();
        setFcmToken(token);
        console.log('FCM Token:', token);

        // Request notification permissions
        const notifeePermission = await notifee.requestPermission();
        console.log('Notifee permission:', notifeePermission);

        // Create notification channel for Android
        if (Platform.OS === 'android') {
          await notifee.createChannel({
            id: 'default',
            name: 'Default Channel',
            importance: 4,
            sound: 'hollow',
          });
          console.log('Notification channel created default');
        }

        console.log('Notifee event handler set up');
      } catch (error) {
        console.error('Error in setup:', error);
      }
    };

    // Set up event handler for notification actions
    notifee.onForegroundEvent(async ({ type, detail }) => {
      console.log('Foreground event:', type, detail);
      if (type === EventType.ACTION_PRESS && detail?.pressAction?.id === 'checkin') {
        console.log('Check-in action pressed');
        try {
          if (detail.notification?.id) {
            await notifee.cancelNotification(detail.notification.id);
            console.log('Notification canceled');
          }
          if (detail.notification?.data?.messageId) {
            await sendAcknowledgment(String(detail.notification.data.messageId));
            console.log('Acknowledgment sent');
          }
        } catch (error) {
          console.error('Error handling action:', error);
        }
      }
    });

    // Set up background event handler
    notifee.onBackgroundEvent(async ({ type, detail }) => {
      console.log('Background event:', type, detail);
      if (type === EventType.ACTION_PRESS && detail?.pressAction?.id === 'checkin') {
        console.log('Check-in action pressed in background');
        try {
          if (detail.notification?.id) {
            await notifee.cancelNotification(detail.notification.id);
            console.log('Notification canceled from background');
          }
          // Note: Acknowledgment sending may not work in background
        } catch (error) {
          console.error('Error handling background action:', error);
        }
      }
    });

    // Foreground message handler
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      // Process the message here
      console.log('A new FCM message arrived in the foreground!', remoteMessage);
      //Alert.alert( remoteMessage.notification?.title || 'Carely Notification', remoteMessage.notification?.body || 'Check-in required');
      try{
        await notifee.displayNotification({
          title: remoteMessage.notification?.title || 'Carely Notification',
          body: remoteMessage.notification?.body || 'Check-in required',
          data: { messageId: remoteMessage.messageId || remoteMessage.data?.messageId || 'unknown' },
          android: {
            channelId: 'default',
            importance: 4,
            sound: 'hollow',
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
      } catch (error) {
        console.error('Error displaying notification:', error);
      }
     
      //console.log('3')
      
      // You can use the message data to update UI or show a local notification
      //Alert.alert( remoteMessage.notification?.title || 'Carely Notification', remoteMessage.notification?.body || 'Check-in required');
    });

    setup();

    return unsubscribe;
  }, []);


  const handleClearMessages = () => {
    setMessages([]);
  };

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Carely App</Text>
            <Text style={styles.subtitle}>
              Firebase Push Notifications Demo
            </Text>
            <Text style={styles.platform}>
              Running on {Platform.OS === 'android' ? 'Android' : 'iOS'}
            </Text>
          </View>


          {/* Firebase Token Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>FCM Token</Text>
            <Text style={styles.token} selectable>
              {fcmToken || 'Loading token...'}
            </Text>
          </View>

          {/* Messages Section */}
          <View style={styles.section}>
            <View style={styles.messagesHeader}>
              <Text style={styles.sectionTitle}>Received Messages</Text>
              {messages.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={handleClearMessages}
                >
                  <Text style={styles.clearButtonText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
            {messages.length === 0 ? (
              <Text style={styles.noMessages}>No messages received yet</Text>
            ) : (
              messages.map((msg, index) => (
                <View key={index} style={styles.messageContainer}>
                  <Text style={styles.message}>{msg}</Text>
                </View>
              ))
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Send test notifications from Firebase Console
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  platform: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: '#fafafa',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  token: {
    fontSize: 12,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderRadius: 5,
    lineHeight: 16,
  },
  messagesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  clearButton: {
    backgroundColor: '#ff3b30',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  noMessages: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  messageContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  message: {
    fontSize: 12,
    color: '#333',
    lineHeight: 16,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default App;
