import { router } from 'expo-router';
import { Alert } from 'react-native';

import { apiRequest } from '@/services/apiClient';
import type { NotificationData } from '@/services/notificationService';

/** "2026-11-28" -> "28 Nov" */
function shortDay(isoDate?: string) {
  if (!isoDate) return 'the next 30 days';
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

/** Where a tapped notification goes (same for a push and the in-app list). */
export function openNotificationTarget(data: NotificationData) {
  if (data.screen === 'visits') router.push('/owner-visits');
  else if (data.screen === 'listing-reminder' || data.screen === 'my-listings') router.push('/dashboard');
}

/**
 * Answer a "Still available?" reminder: keep it live for another 30 days, or mark it as rented.
 * Shows the result and returns true when it worked.
 */
export async function answerListingReminder(propertyId: string, answer: 'available' | 'rented'): Promise<boolean> {
  const path = `/properties/${encodeURIComponent(propertyId)}`;
  if (answer === 'available') {
    const result = await apiRequest<{ hidesOn?: string }>(`${path}/confirm`, { method: 'POST', auth: true });
    if (result.ok) Alert.alert('Thanks!', `Your listing stays visible until ${shortDay(result.data.hidesOn)}.`);
    else Alert.alert('Could not update', result.error);
    return result.ok;
  }
  const result = await apiRequest<unknown>(`${path}/status`, {
    method: 'PATCH',
    body: { status: 'rented' },
    auth: true,
  });
  if (result.ok) Alert.alert('Marked as rented', 'Tenants will no longer see this listing.');
  else Alert.alert('Could not update', result.error);
  return result.ok;
}