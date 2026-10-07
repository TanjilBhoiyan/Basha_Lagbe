import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Button, EmptyState } from '@/components/ui';
import { hasDraftContent, type PropertyDraft } from '@/features/post/draft';
import { LISTING_STATUS_STYLE } from '@/features/owner/listingStatus';
import { OwnerListingCard } from '@/features/owner/OwnerListingCard';
import { StatTile } from '@/features/owner/StatTile';
import { ownerListingService } from '@/services/ownerListingService';
import { postDraftService } from '@/services/postDraftService';
import { propertyService } from '@/services/propertyService';
import { colors, radius, SCREEN_PADDING, spacing } from '@/theme';
import type { ListingStatus, OwnerListing } from '@/types/listing';
import type { Property } from '@/types/property';

type Filter = 'all' | ListingStatus;

const FILTER_LABEL: Record<Filter, string> = {
  all: 'All',
  published: 'Published',
  pending: 'Pending',
  rented: 'Rented',
};

export default function OwnerDashboardScreen() {
  const [listings, setListings] = useState<OwnerListing[]>([]);
  const [properties, setProperties] = useState<Record<string, Property>>({});
  const [draft, setDraft] = useState<PropertyDraft | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [list, saved] = await Promise.all([ownerListingService.getMyListings(), postDraftService.load()]);
    const found = await Promise.all(list.map((l) => propertyService.getById(l.propertyId)));
    const map: Record<string, Property> = {};
    found.forEach((p) => {
      if (p) map[p.id] = p;
    });
    setListings(list.filter((l) => map[l.propertyId]));
    setProperties(map);
    setDraft(hasDraftContent(saved.draft) ? saved.draft : null);
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

  const count = (s: Filter) => (s === 'all' ? listings.length : listings.filter((l) => l.status === s).length);
  const data = filter === 'all' ? listings : listings.filter((l) => l.status === filter);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/profile'));
  const addProperty = () => router.navigate('/post');
  const view = (id: string) => router.push({ pathname: '/property/[id]', params: { id } });

  const changeStatus = async (listing: OwnerListing, status: ListingStatus) => {
    await ownerListingService.setStatus(listing.propertyId, status);
    setListings((list) => list.map((l) => (l.propertyId === listing.propertyId ? { ...l, status } : l)));
  };

  const confirmDelete = (listing: OwnerListing, title: string) =>
    Alert.alert('Delete listing?', `"${title}" will be removed. This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await ownerListingService.remove(listing.propertyId);
          setListings((list) => list.filter((l) => l.propertyId !== listing.propertyId));
        },
      },
    ]);

  const openEditMenu = (listing: OwnerListing, property: Property) => {
    const options: { text: string; style?: 'cancel' | 'destructive'; onPress?: () => void }[] = [
      {
        text: 'Edit details',
        onPress: () => Alert.alert('Coming soon', 'Editing will open the Add Property form once all its steps are built.'),
      },
    ];
    if (listing.status === 'published') {
      options.push({ text: 'Mark as rented', onPress: () => changeStatus(listing, 'rented') });
    } else if (listing.status === 'rented') {
      options.push({ text: 'Mark as available again', onPress: () => changeStatus(listing, 'published') });
    }
    options.push({ text: 'Delete listing', style: 'destructive', onPress: () => confirmDelete(listing, property.title) });
    options.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert(property.title, listing.status === 'pending' ? 'Waiting for review by our team.' : undefined, options);
  };

  const tiles: { key: Filter; label: string; icon: 'home' | 'file-document' | 'clock-outline' | 'key-variant'; color: string; background: string }[] = [
    { key: 'all', label: 'Total', icon: 'home', color: colors.primaryDeep, background: colors.primaryLight },
    { key: 'published', label: 'Published', icon: 'file-document', color: colors.primaryDeep, background: colors.surface },
    { key: 'pending', label: 'Pending', icon: 'clock-outline', color: colors.warning, background: colors.warningLight },
    { key: 'rented', label: 'Rented', icon: 'key-variant', color: colors.info, background: colors.infoLight },
  ];

  const header = (
    <View style={styles.headerBlock}>
      <View style={styles.tiles}>
        {tiles.map((t) => (
          <StatTile
            key={t.key}
            icon={t.icon}
            value={count(t.key)}
            label={t.label}
            color={t.color}
            background={t.background}
            selected={filter === t.key}
            onPress={() => setFilter(t.key)}
          />
        ))}
      </View>

      <Button
        title="Add New Property"
        onPress={addProperty}
        style={styles.addBtn}
        leftIcon={<Ionicons name="add" size={24} color={colors.white} />}
      />

      {draft ? (
        <Pressable onPress={addProperty} style={styles.draft} accessibilityRole="button">
          <Ionicons name="document-text-outline" size={20} color={colors.primaryDeep} />
          <View style={styles.flex}>
            <AppText variant="caption" style={styles.bold}>
              Unfinished listing
            </AppText>
            <AppText variant="small" color="textSecondary" numberOfLines={1} style={styles.normal}>
              {draft.title || 'Untitled property'} · Continue where you left off
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.primaryDeep} />
        </Pressable>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {(Object.keys(FILTER_LABEL) as Filter[]).map((f) => {
          const active = f === filter;
          return (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.tab, active && styles.tabActive]}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <AppText variant="caption" style={[styles.tabText, active && styles.tabTextActive]}>
                {FILTER_LABEL[f]} ({count(f)})
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={goBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </Pressable>
        <AppText style={styles.title} accessibilityRole="header">
          Owner Dashboard
        </AppText>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(l) => l.propertyId}
          ListHeaderComponent={header}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="home-outline"
              title={filter === 'all' ? 'No listings yet' : `No ${LISTING_STATUS_STYLE[filter].label.toLowerCase()} listings`}
              message={filter === 'all' ? 'Post your first property and start getting tenants.' : 'Listings with this status will appear here.'}
              actionLabel={filter === 'all' ? 'Add property' : undefined}
              onAction={filter === 'all' ? addProperty : undefined}
            />
          }
          renderItem={({ item }) => {
            const property = properties[item.propertyId];
            return (
              <OwnerListingCard
                property={property}
                status={item.status}
                onView={() => view(property.id)}
                onEdit={() => openEditMenu(item, property)}
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
  flex: { flex: 1 },
  bold: { fontWeight: '700' },
  normal: { fontWeight: '400' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: SCREEN_PADDING,
    paddingVertical: spacing.md,
  },
  title: { flex: 1, fontSize: 26, lineHeight: 32, fontWeight: '800', color: colors.text },
  loader: { marginTop: spacing.xxl },
  list: { paddingHorizontal: SCREEN_PADDING, paddingBottom: spacing.xxl, gap: spacing.md },
  headerBlock: { gap: spacing.md },
  tiles: { flexDirection: 'row', gap: spacing.sm },
  addBtn: { minHeight: 54, borderRadius: radius.lg, backgroundColor: colors.primaryDeep, borderColor: colors.primaryDeep },
  draft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    backgroundColor: colors.white,
  },
  tabs: {
    gap: spacing.xs,
    padding: spacing.xs,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  tab: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, borderRadius: radius.md },
  tabActive: { backgroundColor: colors.primaryLight },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  tabTextActive: { color: colors.primaryDeep, fontWeight: '700' },
});