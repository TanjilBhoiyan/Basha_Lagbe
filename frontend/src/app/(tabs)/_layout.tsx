import { Tabs } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { TabBar } from '@/components/navigation/TabBar';
import { chatService } from '@/services/chatService';

export default function TabsLayout() {
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(() => {
    chatService.unreadCount().then(setUnread);
  }, []);

  useEffect(() => {
    refresh();
    // Live updates while the app is open, and a fresh count when it comes back to the front.
    const offInbox = chatService.onInboxChange(refresh);
    const appState = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    return () => {
      offInbox();
      appState.remove();
    };
  }, [refresh]);

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...props} badges={{ messages: unread }} />}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="search" />
      <Tabs.Screen name="post" />
      <Tabs.Screen name="messages" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}