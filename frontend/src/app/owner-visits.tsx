import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, EmptyState, SegmentedTabs } from '@/components/ui';
import { OwnerVisitCard } from '@/features/visit/OwnerVisitCard';
import { formatTimeSlot, formatVisitDate } from '@/features/visit/visitSlots';
import { displayStatus, type VisitTab } from '@/features/visit/visitStatus';
import { visitService } from '@/services/visitService';
import { colors, SCREEN_PADDING, spacing } from '@/theme';
import type { IncomingVisit } from '@/types/visit';

type Groups = Record<VisitTab, IncomingVisit[]>;

const EMPTY: Record<VisitTab, { title: string; message: string }> = {
  pending: { title: 'No new requests', message: 'When a tenant asks to see your property, it shows up here.' },
  upcoming: { title: 'No upcoming visits', message: 'Visits you confirm will show up here.' },
  past: { title: 'No past visits', message: 'Finished, declined and cancelled requests show up here.' },
};

/** Owner side: tenants' visit requests for my properties. */
export default function OwnerVisitsScreen() {
  const [tab, setTab] = useState<VisitTab>('pending');
  const [groups, setGroups] = useState<Groups>({ pending: [], upcoming: [], past: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setGroups(await visitService.getIncomingGrouped());
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

  const respond = async (visit: IncomingVisit, decision: 'confirm' | 'decline') => {
    setBusyId(visit.id);
    const result = await visitService.respond(visit.id, decision);
    setBusyId(null);
    if (!result.ok) {
      Alert.alert('Could not update', result.error);
      await load();
      return;
    }
    await load();
    if (decision === 'confirm') {
      Alert.alert(
        'Visit confirmed',
        `${visit.tenant.name} will visit on ${formatVisitDate(visit.date)} at ${formatTimeSlot(visit.time)}.`,
      );
    }
  };

  const decline = (visit: IncomingVisit) =>
    Alert.alert('Decline this request?', `${visit.tenant.name} will be told the time doesn't work.`, [
      { text: 'Keep', style: 'cancel' },
      { text: 'Decline', style: 'destructive', onPress: () => respond(visit, 'decline') },
    ]);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/dashboard'));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={goBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </Pressable>
        <AppText style={styles.title} accessibilityRole="header">
          Visit Requests
        </AppText>
      </View>

      <View style={styles.tabs}>
        <SegmentedTabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'pending', label: `New (${groups.pending.length})` },
            { value: 'upcoming', label: `Upcoming (${groups.upcoming.length})` },
            { value: 'past', label: `Past (${groups.past.length})` },
          ]}
        />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={groups[tab]}
          keyExtractor={(v) => v.id}
          contentContainerStyle={[styles.list, groups[tab].length === 0 && styles.listEmpty]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          ListEmptyComponent={<EmptyState icon="calendar-outline" title={EMPTY[tab].title} message={EMPTY[tab].message} />}
          renderItem={({ item }) => (
            <OwnerVisitCard
              visit={item}
              status={displayStatus(item)}
              busy={busyId === item.id}
              onConfirm={() => respond(item, 'confirm')}
              onDecline={() => decline(item)}
              onCall={() => Linking.openURL(`tel:+880${item.tenant.phone}`)}
            />
          )}
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