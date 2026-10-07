import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, EmptyState, SegmentedTabs } from '@/components/ui';
import { addVisitToCalendar } from '@/features/visit/addVisitToCalendar';
import { VisitCard, type VisitAction } from '@/features/visit/VisitCard';
import { displayStatus, type VisitTab } from '@/features/visit/visitStatus';
import { chatService } from '@/services/chatService';
import { propertyService } from '@/services/propertyService';
import { visitService } from '@/services/visitService';
import { colors, SCREEN_PADDING, spacing } from '@/theme';
import type { Property } from '@/types/property';
import type { VisitRequest } from '@/types/visit';

type Groups = Record<VisitTab, VisitRequest[]>;

const EMPTY: Record<VisitTab, { title: string; message: string }> = {
  pending: {
    title: 'No pending requests',
    message: 'When you request a visit, it waits here until the owner confirms.',
  },
  upcoming: {
    title: 'No upcoming visits',
    message: 'Visits confirmed by the owner will show up here.',
  },
  past: {
    title: 'No past visits',
    message: 'Completed, declined and cancelled requests will show up here.',
  },
};

export default function MyVisitsScreen() {
  const params = useLocalSearchParams<{ tab?: VisitTab }>();
  const [tab, setTab] = useState<VisitTab>(params.tab ?? 'pending');
  const [groups, setGroups] = useState<Groups>({ pending: [], upcoming: [], past: [] });
  const [properties, setProperties] = useState<Record<string, Property>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const g = await visitService.getGrouped();
    const ids = [...new Set([...g.pending, ...g.upcoming, ...g.past].map((v) => v.propertyId))];
    const list = await Promise.all(ids.map((id) => propertyService.getById(id)));
    const map: Record<string, Property> = {};
    list.forEach((p) => {
      if (p) map[p.id] = p;
    });
    setGroups(g);
    setProperties(map);
  }, []);

  // Reload whenever the screen is shown (e.g. after cancelling on Contact & Visit).
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

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/profile'));

  const openProperty = (id: string) => router.push({ pathname: '/property/[id]', params: { id } });
  const openContact = (id: string) => router.push({ pathname: '/contact/[id]', params: { id } });
  const openChat = (id: string) =>
    router.push({ pathname: '/chat/[id]', params: { id: chatService.conversationIdFor(id) } });

  const addToCalendar = async (visit: VisitRequest, property: Property) => {
    const ok = await addVisitToCalendar(visit, property);
    if (!ok) Alert.alert('Calendar not available', 'We could not open a calendar app on this device.');
  };

  const actionsFor = (visit: VisitRequest, property: Property): VisitAction[] => {
    const message: VisitAction = {
      key: 'message',
      label: 'Message Owner',
      icon: 'message-text-outline',
      variant: 'soft',
      onPress: () => openChat(property.id),
    };
    switch (displayStatus(visit)) {
      case 'pending':
        return [
          { key: 'change', label: 'Change Time', icon: 'calendar-edit', variant: 'outline', onPress: () => openContact(property.id) },
          message,
        ];
      case 'confirmed':
        return [
          { key: 'calendar', label: 'Add to Calendar', icon: 'calendar-plus', variant: 'filled', onPress: () => addToCalendar(visit, property) },
          message,
        ];
      case 'completed':
        return [message];
      default: // declined, cancelled, expired
        return [
          { key: 'again', label: 'Request Again', icon: 'calendar-refresh', variant: 'outline', onPress: () => openContact(property.id) },
          message,
        ];
    }
  };

  // Skip requests whose listing was removed.
  const data = groups[tab].filter((v) => properties[v.propertyId]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={goBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </Pressable>
        <AppText style={styles.title} accessibilityRole="header">
          My Visit Requests
        </AppText>
      </View>

      <View style={styles.tabs}>
        <SegmentedTabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'pending', label: `Pending (${groups.pending.length})` },
            { value: 'upcoming', label: `Upcoming (${groups.upcoming.length})` },
            { value: 'past', label: `Past (${groups.past.length})` },
          ]}
        />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(v) => v.id}
          contentContainerStyle={[styles.list, data.length === 0 && styles.listEmpty]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="calendar-outline"
              title={EMPTY[tab].title}
              message={EMPTY[tab].message}
              actionLabel="Browse homes"
              onAction={() => router.push('/search')}
            />
          }
          renderItem={({ item }) => {
            const property = properties[item.propertyId];
            return (
              <VisitCard
                visit={item}
                property={property}
                status={displayStatus(item)}
                actions={actionsFor(item, property)}
                onPress={() => openProperty(property.id)}
              />
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundMint },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: SCREEN_PADDING,
    paddingVertical: spacing.md,
  },
  title: { flex: 1, fontSize: 24, lineHeight: 30, fontWeight: '800', color: colors.text },
  tabs: { paddingHorizontal: SCREEN_PADDING, paddingBottom: spacing.md },
  loader: { marginTop: spacing.xxl },
  list: { paddingHorizontal: SCREEN_PADDING, paddingBottom: spacing.xxl, gap: spacing.md },
  listEmpty: { flexGrow: 1, justifyContent: 'center' },
});