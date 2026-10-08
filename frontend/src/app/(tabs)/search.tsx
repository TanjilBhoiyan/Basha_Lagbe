import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AppText,
  EmptyState,
  OptionSheet,
  SearchField,
  SegmentedTabs,
} from '@/components/ui';
import { APP_CONFIG } from '@/config/app';
import { activeFilterCount } from '@/features/filters/filters';
import { useFilters } from '@/features/filters/FiltersContext';
import type { MapRegion } from '@/features/search/mapTypes';
import { PropertyListCard } from '@/features/search/PropertyListCard';
import { PropertyMap } from '@/features/search/PropertyMap';
import { SORT_OPTIONS, sortLabel } from '@/features/search/sortOptions';
import { locationService } from '@/services/locationService';
import { propertyService, type PropertySort } from '@/services/propertyService';
import { colors, radius, SCREEN_PADDING, spacing } from '@/theme';
import { locationLabel, type Location } from '@/types/location';
import type { Property } from '@/types/property';
import { formatBdNumber } from '@/utils/format';

type ViewMode = 'map' | 'list';

/** Dhaka city centre, used until a location is chosen. */
const DEFAULT_REGION: MapRegion = {
  latitude: 23.7808,
  longitude: 90.4,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
};

export default function SearchScreen() {
  const { filters } = useFilters();
  const [mode, setMode] = useState<ViewMode>('map');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<PropertySort>('recommended');
  const [sortOpen, setSortOpen] = useState(false);
  const [location, setLocation] = useState<Location | null>(null);
  const [results, setResults] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      locationService.getSelected().then(setLocation);
      propertyService.getFavoriteIds().then(setFavorites);
    }, []),
  );

  // Search again when filters, text, sort or location change (debounced for typing).
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(async () => {
      const list = await propertyService.search({
        filters,
        query,
        sort,
        locationId: location?.id,
      });
      setResults(list);
      setSelectedId((current) =>
        current && list.some((p) => p.id === current) ? current : (list[0]?.id ?? null),
      );
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters, query, sort, location?.id]);

  const region = useMemo<MapRegion>(() => {
    if (!location) return DEFAULT_REGION;
    const isCity = location.name === location.city;
    const delta = isCity ? 0.15 : 0.07;
    return {
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: delta,
      longitudeDelta: delta,
    };
  }, [location]);

  const selected = results.find((p) => p.id === selectedId) ?? null;
  const filterCount = activeFilterCount(filters);

  const toggleFavorite = async (id: string) => {
    setFavorites(await propertyService.toggleFavorite(id));
  };

  const openDetails = (id: string) =>
    router.push({ pathname: '/property/[id]', params: { id } });

  const resultsHeader = (
    <View style={styles.resultsHeader}>
      <AppText variant="bodyBold" style={styles.flex} numberOfLines={1}>
        {loading
          ? 'Searching…'
          : `${formatBdNumber(results.length)} ${results.length === 1 ? 'property' : 'properties'} found`}
      </AppText>
      <Pressable
        onPress={() => setSortOpen(true)}
        style={styles.sortButton}
        accessibilityRole="button"
        accessibilityLabel={`Sort by ${sortLabel(sort)}`}
      >
        <AppText variant="caption">Sort by: {sortLabel(sort)}</AppText>
        <Ionicons name="chevron-down" size={16} color={colors.text} />
      </Pressable>
    </View>
  );

  const emptyState = (
    <EmptyState
      icon="search"
      title="No properties found"
      message="Try another area name or change your filters."
      actionLabel="Open filters"
      onAction={() => router.push('/filters')}
    />
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.top}>
        <View style={styles.headerRow}>
          <View style={styles.brand}>
            <Image source={require('../../../assets/images/logo.png')} style={styles.logo} />
            <AppText style={styles.name}>{APP_CONFIG.name}</AppText>
          </View>
          <Pressable
            onPress={() => router.push('/select-location')}
            style={styles.location}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="Change location"
          >
            <Ionicons name="location" size={18} color={colors.primary} />
            <AppText variant="bodyBold" numberOfLines={1} style={styles.locationText}>
              {location ? locationLabel(location) : 'Dhaka'}
            </AppText>
            <Ionicons name="chevron-down" size={16} color={colors.text} />
          </Pressable>
        </View>

        <View>
          <SearchField
            placeholder="Search area, landmark or property"
            value={query}
            onChangeText={setQuery}
            onFilterPress={() => router.push('/filters')}
          />
          {filterCount > 0 ? (
            <View style={styles.badge} pointerEvents="none">
              <AppText variant="small" style={styles.badgeText}>
                {filterCount}
              </AppText>
            </View>
          ) : null}
        </View>

        <SegmentedTabs
          variant="solid"
          value={mode}
          onChange={setMode}
          tabs={[
            { value: 'map', label: 'Map', icon: 'location' },
            { value: 'list', label: 'List', icon: 'list' },
          ]}
        />
      </View>

      {mode === 'map' ? (
        <View style={styles.flex}>
          <PropertyMap
            properties={results}
            selectedId={selectedId}
            onSelect={setSelectedId}
            region={region}
          />

          <View style={styles.sheet}>
            <Pressable
              onPress={() => setMode('list')}
              hitSlop={10}
              style={styles.handleArea}
              accessibilityRole="button"
              accessibilityLabel="Show list view"
            >
              <View style={styles.handle} />
            </Pressable>
            {resultsHeader}
            {loading ? (
              <ActivityIndicator color={colors.primary} style={styles.sheetLoader} />
            ) : selected ? (
              <PropertyListCard
                property={selected}
                isFavorite={favorites.includes(selected.id)}
                onToggleFavorite={() => toggleFavorite(selected.id)}
                onPress={() => openDetails(selected.id)}
              />
            ) : (
              emptyState
            )}
          </View>
        </View>
      ) : (
        <FlatList
          data={loading ? [] : results}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={resultsHeader}
          ListEmptyComponent={
            loading ? <ActivityIndicator color={colors.primary} style={styles.sheetLoader} /> : emptyState
          }
          renderItem={({ item }) => (
            <PropertyListCard
              property={item}
              isFavorite={favorites.includes(item.id)}
              onToggleFavorite={() => toggleFavorite(item.id)}
              onPress={() => openDetails(item.id)}
            />
          )}
          keyboardShouldPersistTaps="handled"
        />
      )}

      <OptionSheet
        visible={sortOpen}
        title="Sort by"
        options={SORT_OPTIONS}
        value={sort}
        onSelect={setSort}
        onClose={() => setSortOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundMint },
  flex: { flex: 1 },
  top: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logo: { width: 34, height: 32, resizeMode: 'contain' },
  name: { fontSize: 22, lineHeight: 28, fontWeight: '800', color: colors.primaryDeep },
  location: { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: '45%' },
  locationText: { flexShrink: 1 },
  badge: {
    position: 'absolute',
    top: 6,
    right: 8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.white, fontSize: 10 },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: SCREEN_PADDING,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    marginTop: -radius.xl,
  },
  handleArea: { alignItems: 'center', paddingTop: spacing.sm },
  handle: { width: 40, height: 4, borderRadius: radius.full, backgroundColor: colors.border },
  sheetLoader: { marginVertical: spacing.xl },
  resultsHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    height: 34,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  list: { paddingHorizontal: SCREEN_PADDING, paddingBottom: spacing.xl, gap: spacing.md },
});