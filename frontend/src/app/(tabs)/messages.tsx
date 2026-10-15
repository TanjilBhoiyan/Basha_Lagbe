import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, EmptyState, SearchField } from '@/components/ui';
import { APP_CONFIG } from '@/config/app';
import { ChatListItem } from '@/features/chat/ChatListItem';
import { chatService } from '@/services/chatService';
import { colors, radius, SCREEN_PADDING, spacing } from '@/theme';
import type { ChatSummary } from '@/types/chat';

/** Messages tab: every chat I'm in (as tenant or owner), newest first. */
export default function MessagesScreen() {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setChats(await chatService.list());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load().finally(() => setLoading(false));
    }, [load]),
  );

  // New message / read receipt anywhere -> refresh the list.
  useEffect(() => chatService.onInboxChange(load), [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const unread = chats.filter((c) => c.unreadCount > 0).length;
  const q = query.trim().toLowerCase();
  const shown = useMemo(
    () =>
      q
        ? chats.filter((c) => c.other.name.toLowerCase().includes(q) || c.property.title.toLowerCase().includes(q))
        : chats,
    [chats, q],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.top}>
        <View style={styles.brand}>
          <Image source={require('../../../assets/images/logo.png')} style={styles.logo} />
          <AppText style={styles.brandName}>{APP_CONFIG.name}</AppText>
        </View>
        <View style={styles.titleRow}>
          <AppText style={styles.title} accessibilityRole="header">
            Messages
          </AppText>
          {unread > 0 ? (
            <View style={styles.newPill}>
              <AppText style={styles.newText}>{unread} new</AppText>
            </View>
          ) : null}
        </View>
        {chats.length ? (
          <SearchField
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name or property"
            accessibilityLabel="Search chats"
          />
        ) : null}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(c) => c.id}
          contentContainerStyle={[styles.list, !shown.length && styles.listEmpty]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          ListEmptyComponent={
            q ? (
              <EmptyState icon="search-outline" title="No chats found" message={`Nothing matches "${query.trim()}".`} />
            ) : (
              <EmptyState
                icon="chatbubbles-outline"
                title="No messages yet"
                message="Found a home you like? Open it and tap Message to talk to the owner directly."
                actionLabel="Browse Properties"
                onAction={() => router.navigate('/home')}
              />
            )
          }
          renderItem={({ item }) => (
            <ChatListItem chat={item} onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.id } })} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundMint },
  top: { paddingHorizontal: SCREEN_PADDING, paddingTop: spacing.md, gap: spacing.md },
  brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logo: { width: 50, height: 32, resizeMode: 'contain' },
  brandName: { fontSize: 22, lineHeight: 28, fontWeight: '800', color: colors.primaryDeep },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '800', color: colors.text },
  newPill: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  newText: { fontSize: 13, fontWeight: '700', color: colors.white },
  loader: { marginTop: spacing.xxl },
  list: { paddingHorizontal: SCREEN_PADDING, paddingBottom: spacing.xl },
  listEmpty: { flexGrow: 1, justifyContent: 'center' },
});