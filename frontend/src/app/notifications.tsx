import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState, type ComponentProps } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, EmptyState } from '@/components/ui';
import { answerListingReminder, openNotificationTarget } from '@/features/notifications/notificationActions';
import { notificationService, type AppNotification } from '@/services/notificationService';
import { session } from '@/services/session';
import { colors, radius, SCREEN_PADDING, spacing } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

/** Icon for each kind of notification (data.screen from the backend). */
function iconFor(screen?: string): IconName {
  if (screen === 'visits') return 'calendar';
  if (screen === 'listing-reminder') return 'time';
  if (screen === 'my-listings') return 'eye-off';
  return 'notifications';
}

/** "just now", "5m ago", "3h ago", "2d ago", then "12 Nov". */
function timeAgo(iso: string) {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function NotificationsScreen() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!(await session.getToken())) {
      setLoggedIn(false);
      return;
    }
    setLoggedIn(true);
    const result = await notificationService.list();
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setItems(result.data.items);
    setNextCursor(result.data.nextCursor);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load().finally(() => setLoading(false));
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    const result = await notificationService.list(nextCursor);
    if (result.ok) {
      setItems((list) => [...list, ...result.data.items]);
      setNextCursor(result.data.nextCursor);
    }
    setLoadingMore(false);
  };

  const markReadLocally = (id: string) =>
    setItems((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));

  const open = (item: AppNotification) => {
    if (!item.read) {
      markReadLocally(item.id);
      void notificationService.markRead(item.id);
    }
    openNotificationTarget(item.data);
  };

  /** "Still available" / "Rented" right in the list (buttons go away once answered). */
  const answer = async (item: AppNotification, choice: 'available' | 'rented') => {
    if (!item.data.propertyId) return;
    const ok = await answerListingReminder(item.data.propertyId, choice);
    if (ok) {
      markReadLocally(item.id);
      void notificationService.markRead(item.id);
    }
  };

  const markAllRead = () => {
    setItems((list) => list.map((n) => ({ ...n, read: true })));
    void notificationService.markAllRead();
  };

  const hasUnread = items.some((n) => !n.read);
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/home'));

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={goBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </Pressable>
        <AppText style={styles.title} accessibilityRole="header">
          Notifications
        </AppText>
        {hasUnread ? (
          <Pressable onPress={markAllRead} hitSlop={8} accessibilityRole="button">
            <AppText variant="caption" style={styles.markAll}>
              Mark all read
            </AppText>
          </Pressable>
        ) : null}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : !loggedIn ? (
        <View style={styles.padded}>
          <EmptyState
            icon="notifications-outline"
            title="Log in to see notifications"
            message="Visit requests and listing reminders will show up here."
            actionLabel="Log in"
            onAction={() => router.push('/login')}
          />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(n) => n.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.primary} /> : null}
          ListEmptyComponent={
            error ? (
              <EmptyState icon="cloud-offline-outline" title="Could not load" message={error} actionLabel="Try again" onAction={onRefresh} />
            ) : (
              <EmptyState
                icon="notifications-outline"
                title="No notifications yet"
                message="Visit requests and listing reminders will show up here."
              />
            )
          }
          renderItem={({ item }) => (
            <NotificationRow
              item={item}
              onPress={() => open(item)}
              onAnswer={(choice) => answer(item, choice)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function NotificationRow({
  item,
  onPress,
  onAnswer,
}: {
  item: AppNotification;
  onPress: () => void;
  onAnswer: (choice: 'available' | 'rented') => void;
}) {
  const showReminderButtons = item.data.screen === 'listing-reminder' && !!item.data.propertyId && !item.read;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, !item.read && styles.rowUnread, pressed && styles.pressed]}
      accessibilityRole="button"
    >
      <View style={[styles.icon, !item.read && styles.iconUnread]}>
        <Ionicons name={iconFor(item.data.screen)} size={20} color={colors.primaryDeep} />
      </View>

      <View style={styles.flex}>
        <View style={styles.titleRow}>
          <AppText variant="bodyBold" numberOfLines={1} style={[styles.flex, item.read && styles.readTitle]}>
            {item.title}
          </AppText>
          {!item.read ? <View style={styles.dot} /> : null}
        </View>
        <AppText variant="caption" color="textSecondary" numberOfLines={3}>
          {item.body}
        </AppText>
        <AppText variant="small" color="textSecondary" style={styles.time}>
          {timeAgo(item.createdAt)}
        </AppText>

        {showReminderButtons ? (
          <View style={styles.actions}>
            <Pressable onPress={() => onAnswer('available')} style={[styles.action, styles.actionPrimary]} accessibilityRole="button">
              <AppText variant="caption" style={styles.actionPrimaryText}>
                Still available
              </AppText>
            </Pressable>
            <Pressable onPress={() => onAnswer('rented')} style={[styles.action, styles.actionGray]} accessibilityRole="button">
              <AppText variant="caption" style={styles.actionGrayText}>
                Rented
              </AppText>
            </Pressable>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundMint },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: SCREEN_PADDING,
    paddingVertical: spacing.md,
  },
  title: { flex: 1, fontSize: 26, lineHeight: 32, fontWeight: '800', color: colors.text },
  markAll: { fontWeight: '700', color: colors.primary },
  loader: { marginTop: spacing.xxl },
  padded: { paddingHorizontal: SCREEN_PADDING },
  list: { paddingHorizontal: SCREEN_PADDING, paddingBottom: spacing.xxl, gap: spacing.sm, flexGrow: 1 },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  rowUnread: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  pressed: { opacity: 0.85 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  iconUnread: { backgroundColor: colors.white },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  readTitle: { fontWeight: '500' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  time: { marginTop: 2, fontWeight: '400' },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  action: { flex: 1, minHeight: 34, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  actionPrimary: { backgroundColor: colors.primaryDeep },
  actionPrimaryText: { color: colors.white, fontWeight: '700' },
  actionGray: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  actionGrayText: { color: colors.text, fontWeight: '700' },
});