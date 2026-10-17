import { Alert } from 'react-native';

/** One "not ready yet" popup for every unfinished feature, e.g. comingSoon('Notifications'). */
export function comingSoon(feature: string) {
  Alert.alert('Coming soon', `${feature} is coming in a future update.`);
}