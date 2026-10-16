import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AppText,
  Button,
  EmptyState,
  SearchField,
  SectionHeader,
  SegmentedTabs,
} from '@/components/ui';
import { LocationRow } from '@/features/location/LocationRow';
import { locationService } from '@/services/locationService';
import { colors, radius, SCREEN_PADDING, spacing } from '@/theme';
import type { Location } from '@/types/location';

type Tab = 'recent' | 'popular';

export default function SelectLocationScreen() {
  const [tab, setTab] = useState<Tab>('recent');
  const [recent, setRecent] = useState<Location[]>([]);
  const [popular, setPopular] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Location[]>([]);
  const [selected, setSelected] = useState<Location | null>(null);
  const [saving, setSaving] = useState(false);

  const canGoBack = router.canGoBack();

  useEffect(() => {
    (async () => {
      const [recentList, popularList, current] = await Promise.all([
        locationService.getRecent(),
        locationService.getPopular(),
        locationService.getSelected(),
      ]);
      setRecent(recentList);
      setPopular(popularList);
      setSelected(current);
      // First-time users have no history, so start on "Popular".
      if (recentList.length === 0) setTab('popular');
      setLoading(false);
    })();
  }, []);

  // A pin saved on the map screen shows up here when the user comes back.
  useFocusEffect(
    useCallback(() => {
      locationService.getSelected().then((current) => {
        if (current?.isPin) setSelected(current);
      });
    }, []),
  );

  // Search as the user types (small debounce).
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => locationService.search(query).then(setResults), 250);
    return () => clearTimeout(timer);
  }, [query]);

  const handleContinue = async () => {
    if (!selected) return;
    setSaving(true);
    await locationService.select(selected);
    if (canGoBack) router.back();
    else router.replace('/home');
  };

  const renderList = (list: Location[]) =>
    list.map((loc) => (
      <LocationRow
        key={loc.id}
        location={loc}
        selected={selected?.id === loc.id}
        onPress={() => setSelected(loc)}
      />
    ));

  const topList = tab === 'recent' ? recent : popular;
  const isSearching = query.trim().length > 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        {canGoBack ? (
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={styles.back}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={28} color={colors.primaryDeep} />
          </Pressable>
        ) : null}
        <AppText style={styles.title} align="center" accessibilityRole="header">
          Select Location
        </AppText>
        <AppText color="textSecondary" align="center">
          Choose your preferred location to find rental homes
        </AppText>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SearchField
          placeholder="Search city, area or landmark"
          value={query}
          onChangeText={setQuery}
          onFilterPress={() => {}}
        />

        {!isSearching ? (
          <Pressable
            onPress={() => router.push('/pick-location')}
            style={({ pressed }) => [styles.gps, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <View style={styles.gpsIcon}>
              <MaterialCommunityIcons name="crosshairs-gps" size={22} color={colors.primaryDeep} />
            </View>
            <View style={styles.flex}>
              <AppText variant="bodyBold" color="primaryDeep">
                Use my current location
              </AppText>
              <AppText variant="caption" color="textSecondary">
                Pin your exact area on the map
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.primaryDeep} />
          </Pressable>
        ) : null}

        {!isSearching && selected?.isPin ? (
          <LocationRow location={selected} selected onPress={() => router.push('/pick-location')} />
        ) : null}

        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : isSearching ? (
          results.length ? (
            <View style={styles.list}>{renderList(results)}</View>
          ) : (
            <EmptyState
              icon="search"
              title="No locations found"
              message={`We couldn't find "${query.trim()}". Try another area or city name.`}
            />
          )
        ) : (
          <>
            <SegmentedTabs
              value={tab}
              onChange={setTab}
              tabs={[
                { value: 'recent', label: 'Recent', icon: 'time-outline' },
                { value: 'popular', label: 'Popular', icon: 'flame-outline' },
              ]}
            />

            {topList.length ? (
              <View style={styles.list}>{renderList(topList.slice(0, 3))}</View>
            ) : (
              <EmptyState
                icon="time-outline"
                title="No recent locations"
                message="Locations you choose will appear here."
              />
            )}

            <View style={styles.section}>
              <SectionHeader title="Popular Locations" onSeeAll={() => setTab('popular')} />
              <View style={styles.list}>{renderList(popular)}</View>
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Continue"
          onPress={handleContinue}
          loading={saving}
          disabled={!selected}
          rightIcon={<Ionicons name="arrow-forward" size={20} color={colors.white} />}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundMint },
  header: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  back: { position: 'absolute', left: SCREEN_PADDING, top: spacing.lg + 4, zIndex: 1 },
  title: { fontSize: 26, lineHeight: 32, fontWeight: '800', color: colors.primaryDeep },
  content: { paddingHorizontal: SCREEN_PADDING, paddingBottom: spacing.xl, gap: spacing.lg },
  loader: { marginTop: spacing.xxl },
  list: { gap: spacing.md },
  section: { gap: spacing.md, marginTop: spacing.sm },
  footer: { paddingHorizontal: SCREEN_PADDING, paddingVertical: spacing.md },
  flex: { flex: 1 },
  pressed: { opacity: 0.85 },
  gps: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    backgroundColor: colors.white,
  },
  gpsIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});