import { router } from 'expo-router';
import { Alert } from 'react-native';

import { chatService } from '@/services/chatService';

/** "Message" button on a listing: open the chat with its owner. */
export async function openChatForProperty(propertyId: string) {
  const result = await chatService.openForProperty(propertyId);
  if (!result.ok) {
    Alert.alert('Could not open chat', result.error);
    return;
  }
  router.push({ pathname: '/chat/[id]', params: { id: result.data.id } });
}