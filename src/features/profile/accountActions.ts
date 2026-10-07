import { router } from 'expo-router';
import { Alert, Linking } from 'react-native';

import { APP_CONFIG } from '@/config/app';
import { session } from '@/services/session';

/** Shared by Profile and Settings. */
export function comingSoon(feature: string) {
  Alert.alert('Coming soon', `${feature} will be available in a later step.`);
}

export function confirmLogout() {
  Alert.alert('Log out?', 'You will need to log in again to use your account.', [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Log out',
      style: 'destructive',
      onPress: async () => {
        await session.clear();
        router.replace('/login');
      },
    },
  ]);
}

export function openSupport() {
  const options: { text: string; style?: 'cancel'; onPress?: () => void }[] = [];
  if (APP_CONFIG.supportPhone) {
    options.push({ text: 'Call support', onPress: () => Linking.openURL(`tel:${APP_CONFIG.supportPhone}`) });
  }
  if (APP_CONFIG.supportEmail) {
    options.push({ text: 'Email support', onPress: () => Linking.openURL(`mailto:${APP_CONFIG.supportEmail}`) });
  }
  if (!options.length) {
    comingSoon('Help & Support');
    return;
  }
  options.push({ text: 'Cancel', style: 'cancel' });
  Alert.alert('Help & Support', 'How would you like to reach us?', options);
}