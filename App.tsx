/**
 * CarelyApp - Daily Safety Check-In
 * Peace of mind for people living alone. One simple tap each day keeps your loved ones informed.
 * @format
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import messaging from '@react-native-firebase/messaging';
import notifee, { EventType, AndroidVisibility } from '@notifee/react-native';

type Screen = 'home' | 'checkin' | 'settings';

interface CheckInParams {
  messageId: string;
  title?: string;
  body?: string;
}

interface EmergencyContact {
  name: string;
  email: string;
}

const formatLastCheckIn = (date: Date | null): string => {
  if (!date) return 'Not yet today';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffHours < 24 && date.getDate() === now.getDate()) {
    return `Today at ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }
  if (diffDays === 1) {
    return `Yesterday at ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

const getCountdown = (lastCheckIn: Date | null): string => {
  const now = new Date();
  if (!lastCheckIn) {
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    const s = now.getSeconds().toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }
  const nextWindow = new Date(lastCheckIn);
  nextWindow.setDate(nextWindow.getDate() + 1);
  const diffMs = nextWindow.getTime() - now.getTime();
  if (diffMs <= 0) return '00:00:00';
  const hours = Math.floor(diffMs / 3600000);
  const mins = Math.floor((diffMs % 3600000) / 60000);
  const secs = Math.floor((diffMs % 60000) / 1000);
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

function App() {
  const [fcmToken, setFcmToken] = useState<string>('');
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [checkInParams, setCheckInParams] = useState<CheckInParams | null>(null);
  const [lastCheckIn, setLastCheckIn] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(() => {
  const now = new Date();
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  const s = now.getSeconds().toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
});
  const [emergencyContact, setEmergencyContact] = useState<EmergencyContact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [checkInSuccess, setCheckInSuccess] = useState(false);
  const [backendUrl] = useState<string>('https://your-backend-api.com/register-token');

  const navigateToCheckIn = useCallback((params: CheckInParams) => {
    setCheckInParams(params);
    setCurrentScreen('checkin');
  }, []);

  const navigateToHome = useCallback(() => {
    setCurrentScreen('home');
    setCheckInParams(null);
  }, []);

  const performCheckIn = useCallback(async (messageId?: string) => {
    setLastCheckIn(new Date());
    setCheckInSuccess(true);
    if (messageId) {
      try {
        await fetch(`${backendUrl}/acknowledge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messageId,
            fcmToken,
            acknowledgedAt: new Date().toISOString(),
          }),
        });
      } catch (error) {
        console.error('Error sending acknowledgment:', error);
      }
    }
    setTimeout(() => {
      setCheckInSuccess(false);
      navigateToHome();
    }, 1200);
  }, [fcmToken, backendUrl, navigateToHome]);

  const sendAcknowledgment = async (messageId: string) => {
    try {
      const response = await fetch(`${backendUrl}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          fcmToken,
          acknowledgedAt: new Date().toISOString(),
        }),
      });
      if (response.ok) console.log('Acknowledgment sent successfully');
    } catch (error) {
      console.error('Error sending acknowledgment:', error);
    }
  };

  useEffect(() => {
    const setup = async () => {
      try {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        if (!enabled) console.log('Notification permission not granted');

        const token = await messaging().getToken();
        setFcmToken(token);

        await notifee.requestPermission();
        if (Platform.OS === 'android') {
          await notifee.createChannel({
            id: 'default',
            name: 'Carely Notifications',
            importance: 4,
            sound: 'default',
            visibility: AndroidVisibility.PUBLIC,
          });
        }

        const initialNotification = await notifee.getInitialNotification();
        if (initialNotification?.notification?.data) {
          const data = initialNotification.notification.data as Record<string, string>;
          const messageId = data.messageId || data.message_id || 'unknown';
          const screen = data.screen || 'checkin';
          if (screen === 'checkin') {
            navigateToCheckIn({
              messageId,
              title: initialNotification.notification.title,
              body: initialNotification.notification.body,
            });
          }
        }
      } catch (error) {
        console.error('Error in setup:', error);
      } finally {
        setIsLoading(false);
      }
    };
    setup();
  }, [navigateToCheckIn]);

  useEffect(() => {
    const unsubscribe = notifee.onForegroundEvent(async ({ type, detail }) => {
      if (type === EventType.PRESS) {
        const data = detail.notification?.data as Record<string, string> | undefined;
        const messageId = data?.messageId || data?.message_id || 'unknown';
        const screen = data?.screen || 'checkin';
        if (screen === 'checkin') {
          navigateToCheckIn({
            messageId,
            title: detail.notification?.title,
            body: detail.notification?.body,
          });
        }
      } else if (type === EventType.ACTION_PRESS && detail?.pressAction?.id === 'checkin') {
        const data = detail.notification?.data as Record<string, string> | undefined;
        const messageId = data?.messageId || data?.message_id || 'unknown';
        navigateToCheckIn({ messageId });
        try {
          if (detail.notification?.id) await notifee.cancelNotification(detail.notification.id);
          await sendAcknowledgment(messageId);
        } catch (error) {
          console.error('Error handling action:', error);
        }
      }
    });
    return unsubscribe;
  }, [navigateToCheckIn, fcmToken]);

  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      try {
        const messageId = remoteMessage.messageId || remoteMessage.data?.messageId || 'unknown';
        await notifee.displayNotification({
          title: remoteMessage.notification?.title || 'Carely - Check-in Reminder',
          body: remoteMessage.notification?.body || 'Tap to confirm you\'re OK',
          data: { messageId, screen: 'checkin' },
          android: {
            channelId: 'default',
            importance: 4,
            visibility: AndroidVisibility.PUBLIC,
            pressAction: { id: 'open_checkin' },
            actions: [{ title: 'I\'m OK', pressAction: { id: 'checkin' } }],
          },
          ios: { categoryId: 'checkin' },
        });
      } catch (error) {
        console.error('Error displaying notification:', error);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getCountdown(lastCheckIn));
    }, 1000);
    return () => clearInterval(interval);
  }, [lastCheckIn]);

  const handleCheckInFromNotification = async () => {
    if (checkInParams?.messageId) {
      await sendAcknowledgment(checkInParams.messageId);
      performCheckIn(checkInParams.messageId);
    }
  };

  const handleManualCheckIn = () => {
    performCheckIn();
  };

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0D9488" />
          <Text style={styles.loadingText}>Loading Carely...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  if (currentScreen === 'settings') {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#fafafa" />
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.settingsScreen}>
            <TouchableOpacity onPress={() => setCurrentScreen('home')} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.settingsTitle}>Emergency Contact</Text>
            <Text style={styles.settingsSubtitle}>
              If you miss check-ins, we'll alert this contact. No account needed.
            </Text>
            <View style={styles.settingsCard}>
              <Text style={styles.settingsLabel}>Contact Name</Text>
              <Text style={styles.settingsValue}>
                {emergencyContact?.name || 'Not set'}
              </Text>
              <Text style={styles.settingsLabel}>Email</Text>
              <Text style={styles.settingsValue}>
                {emergencyContact?.email || 'Not set'}
              </Text>
              <Text style={styles.settingsHint}>
                Configure your backend to send alerts to this contact when check-ins are missed.
              </Text>
            </View>
            <View style={styles.footer}>
              <Text style={styles.footerText}>Carely • Daily Safety Check-In</Text>
            </View>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (currentScreen === 'checkin') {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#fafafa" />
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.checkInScreen}>
            <TouchableOpacity onPress={navigateToHome} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <View style={styles.checkInContent}>
              <View style={styles.checkInIcon}>
                <Text style={styles.checkInIconText}>✓</Text>
              </View>
              <Text style={styles.checkInTitle}>Check-in Required</Text>
              <Text style={styles.checkInSubtitle}>
                {checkInParams?.title || 'Time to check in'}
              </Text>
              {checkInParams?.body && (
                <Text style={styles.checkInBody}>{checkInParams.body}</Text>
              )}
            </View>
            <View style={styles.checkInActions}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleCheckInFromNotification}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>I'm OK - Check in now</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={navigateToHome}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#fafafa" />
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.logoText}>Carely</Text>
            <Text style={styles.tagline}>Daily Safety Check-In</Text>
          </View>

          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <View style={[styles.statusDot, lastCheckIn && styles.statusDotActive]} />
              <Text style={styles.statusTitle}>
                {lastCheckIn ? "I'm OK Today" : "Your Safety Status"}
              </Text>
            </View>
            <Text style={styles.lastCheckIn}>
              ● Last check-in: {formatLastCheckIn(lastCheckIn)}
            </Text>
            <View style={styles.timerContainer}>
              <Text style={styles.timerLabel}>
                {lastCheckIn ? 'Next check-in window' : 'Current time'}
              </Text>
              <Text style={styles.timerValue}>{countdown}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.checkInButton, checkInSuccess && styles.checkInButtonSuccess]}
            onPress={handleManualCheckIn}
            activeOpacity={0.85}
            disabled={checkInSuccess}
          >
            <Text style={styles.checkInButtonText}>
              {checkInSuccess ? '✓ Checked in!' : "I'm OK - Check in now"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.reassurance}>
            All good. We will only alert your emergency contacts if you miss a check-in window.
          </Text>

          <TouchableOpacity
            style={styles.settingsLink}
            onPress={() => setCurrentScreen('settings')}
          >
            <Text style={styles.settingsLinkText}>Emergency contact settings</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Peace of mind for people living alone
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    padding: 24,
    paddingTop: 16,
    paddingBottom: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    paddingTop: 8,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 17,
    color: '#64748b',
    fontWeight: '500',
  },
  statusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#cbd5e1',
    marginRight: 10,
  },
  statusDotActive: {
    backgroundColor: '#10b981',
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  lastCheckIn: {
    fontSize: 15,
    color: '#64748b',
    marginBottom: 20,
    lineHeight: 22,
  },
  timerContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  timerLabel: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 8,
  },
  timerValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    fontVariant: ['tabular-nums'],
  },
  checkInButton: {
    backgroundColor: '#0D9488',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  checkInButtonSuccess: {
    backgroundColor: '#10b981',
  },
  checkInButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  reassurance: {
    fontSize: 15,
    color: '#64748b',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  settingsLink: {
    alignItems: 'center',
    marginBottom: 24,
  },
  settingsLinkText: {
    fontSize: 15,
    color: '#0D9488',
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  backButton: {
    paddingVertical: 12,
    paddingRight: 16,
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#0D9488',
    fontWeight: '600',
  },
  checkInScreen: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  checkInContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  checkInIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ccfbf1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkInIconText: {
    fontSize: 40,
    color: '#0D9488',
    fontWeight: '700',
  },
  checkInTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  checkInSubtitle: {
    fontSize: 17,
    color: '#475569',
    marginBottom: 12,
    textAlign: 'center',
  },
  checkInBody: {
    fontSize: 15,
    color: '#64748b',
    lineHeight: 24,
    textAlign: 'center',
  },
  checkInActions: {
    gap: 12,
    paddingBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#0D9488',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#64748b',
    fontSize: 17,
    fontWeight: '600',
  },
  settingsScreen: {
    flex: 1,
    padding: 24,
  },
  settingsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  settingsSubtitle: {
    fontSize: 15,
    color: '#64748b',
    lineHeight: 22,
    marginBottom: 24,
  },
  settingsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  settingsLabel: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 4,
  },
  settingsValue: {
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 16,
  },
  settingsHint: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 20,
    marginTop: 8,
  },
});

export default App;
