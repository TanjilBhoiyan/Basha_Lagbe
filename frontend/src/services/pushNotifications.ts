import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { answerListingReminder, openNotificationTarget } from '@/features/notifications/notificationActions';

import { apiRequest } from './apiClient';
import { notificationService, type NotificationData } from './notificationService';
import { session } from './session';

/** The Expo push token we registered on the server, so logout can remove it again. */
const PUSH_TOKEN_KEY = 'basa-lagbe:push-token';

/** Must match categoryId sent by the backend (ListingExpiryService). */
const REMINDER_CATEGORY = 'listing-reminder';
const ACTION_STILL_AVAILABLE = 'still-available';
const ACTION_RENTED = 'rented';

// Show notifications as a banner even while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Android channel (pop-up with sound) and the "Still available / Rented" buttons.
 * Both buttons open the app, so the API call always runs with the login token.
 */
async function setupNotifications() {
  if (Platform.OS === 'web') return;
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'General',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }
    await Notifications.setNotificationCategoryAsync(REMINDER_CATEGORY, [
      { identifier: ACTION_STILL_AVAILABLE, buttonTitle: 'Still available', options: { opensAppToForeground: true } },
      { identifier: ACTION_RENTED, buttonTitle: 'Rented', options: { opensAppToForeground: true } },
    ]);
  } catch {
    // Not supported here (e.g. Expo Go): the app works without notifications.
  }
}

/**
 * Logged in: ask for permission once, then tell the server this phone's push token.
 * Called on app start and right after login. Fails silently (Expo Go, no Google Play, permission denied).
 */
export async function registerForPush(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    if (!(await session.getToken())) return;

    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
    if (status !== 'granted') return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    const saved = await apiRequest<null>('/notifications/token', { method: 'POST', body: { token }, auth: true });
    if (saved.ok) await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
  } catch {
    // No push on this device: everything else still works.
  }
}

/** Logout (call BEFORE session.clear(), while the login token still works): this phone stops getting notifications. */
export async function unregisterPush(): Promise<void> {
  try {
    const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
    if (!token) return;
    await apiRequest<null>('/notifications/token', { method: 'DELETE', body: { token }, auth: true });
    await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
  } catch {
    // ignore
  }
}

/** A push (or one of its buttons) was tapped. */
async function handleResponse(response: Notifications.NotificationResponse) {
  const data = (response.notification.request.content.data ?? {}) as NotificationData;
  const action = response.actionIdentifier;

  // Android keeps a notification after a button press: remove it ourselves.
  if (action !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
    void Notifications.dismissNotificationAsync(response.notification.request.identifier);
  }

  if (data.propertyId && (action === ACTION_STILL_AVAILABLE || action === ACTION_RENTED)) {
    router.push('/dashboard');
    await answerListingReminder(data.propertyId, action === ACTION_RENTED ? 'rented' : 'available');
    return;
  }
  openNotificationTarget(data);
}

/**
 * Root layout: sets up notifications, registers this phone (if logged in),
 * keeps the bell's red dot fresh, and handles taps, including the one that opened a closed app.
 */
export function usePushNotifications() {
  const handled = useRef(new Set<string>());

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const handleOnce = (response: Notifications.NotificationResponse) => {
      const key = `${response.notification.request.identifier}:${response.actionIdentifier}`;
      if (handled.current.has(key)) return;
      handled.current.add(key);
      void handleResponse(response);
    };

    void setupNotifications().then(registerForPush);

    // The app was closed and opened by a tap: wait until the start screen has routed, then handle it.
    let coldStartTimer: ReturnType<typeof setTimeout> | undefined;
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      coldStartTimer = setTimeout(() => handleOnce(response), 1000);
      void Notifications.clearLastNotificationResponseAsync();
    });

    const tapped = Notifications.addNotificationResponseReceivedListener(handleOnce);
    // A push arrived while the app is open: it is already in the list, so update the bell.
    const received = Notifications.addNotificationReceivedListener(() => notificationService.notifyChanged());
    return () => {
      tapped.remove();
      received.remove();
      if (coldStartTimer) clearTimeout(coldStartTimer);
    };
  }, []);
}