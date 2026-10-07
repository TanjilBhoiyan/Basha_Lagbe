import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, SearchField, SectionHeader } from '@/components/ui';
import { AreaCard } from '@/features/home/AreaCard';
import { CategoryGrid } from '@/features/home/CategoryGrid';
import { HomeHeader } from '@/features/home/HomeHeader';
import { PropertyCard } from '@/features/home/PropertyCard';
import { PropertyCardSkeleton } from '@/features/home/PropertyCardSkeleton';
import { locationService } from '@/services/locationService';
import { propertyService } from '@/services/propertyService';
import { colors, SCREEN_PADDING, spacing } from '@/theme';
import { locationLabel, type Location } from '@/types/location';
import type { Property, PropertyType } from '@/types/property';

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width * 0.68, 300);

  const [location, setLocation] = useState<Location | null>(null);
  const [areas, setAreas] = useState<Location[]>([]);
  const [category, setCategory] = useState<PropertyType | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Re-read the selected location whenever Home comes back into focus
  // (e.g. after changing it on the Select Location screen).
  useFocusEffect(
    useCallback(() => {
      locationService.getSelected().then(setLocation);
    }, []),
  );

  useEffect(() => {
    locationService.getPopular().then(setAreas);
    propertyService.getFavoriteIds().then(setFavorites);
  }, []);

  const loadProperties = useCallback(async () => {
    const list = await propertyService.getRecommended({
      locationId: location?.id,
      type: category ?? undefined,
    });
    setProperties(list);
  }, [location?.id, category]);

  useEffect(() => {
    setLoading(true);
    loadProperties().finally(() => setLoading(false));
  }, [loadProperties]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProperties();
    setRefreshing(false);
  };

  const selectArea = async (area: Location) => {
    await locationService.select(area);
    setLocation(area);
  };

  const toggleFavorite = async (id: string) => {
    setFavorites(await propertyService.toggleFavorite(id));
  };

  const comingSoon = (feature: string) =>
    Alert.alert('Coming soon', `${feature} will be available in a later step.`);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        <View style={styles.padded}>
          <HomeHeader
            locationText={location ? locationLabel(location) : 'Select location'}
            onLocationPress={() => router.push('/select-location')}
            onNotificationsPress={() => comingSoon('Notifications')}
            hasUnreadNotifications
          />

          <SearchField
            placeholder="Search area, landmark or property"
            onPress={() => router.push('/search')}
          />

          <CategoryGrid
            selected={category}
            onSelect={(c) => {
              if (c.type === null) {
                comingSoon('More categories');
                return;
              }
              // Tapping the active category again clears the filter.
              setCategory((current) => (current === c.type ? null : c.type));
            }}
          />

          <SectionHeader title="Popular Areas" onSeeAll={() => router.push('/select-location')} />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        >
          {areas.map((area) => (
            <AreaCard key={area.id} location={area} onPress={() => selectArea(area)} />
          ))}
        </ScrollView>

        <View style={styles.padded}>
          <SectionHeader title="Recommended for You" onSeeAll={() => router.push('/search')} />
        </View>

        {loading ? (
          <ScrollView
            horizontal
            scrollEnabled={false}
            contentContainerStyle={styles.horizontalList}
          >
            <PropertyCardSkeleton width={cardWidth} />
            <PropertyCardSkeleton width={cardWidth} />
          </ScrollView>
        ) : properties.length === 0 ? (
          <View style={styles.padded}>
            <EmptyState
              icon="home-outline"
              title="No properties found"
              message="Try another category or location."
              actionLabel="Show all"
              onAction={() => setCategory(null)}
            />
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {properties.map((p) => (
              <PropertyCard
                key={p.id}
                property={p}
                width={cardWidth}
                isFavorite={favorites.includes(p.id)}
                onToggleFavorite={() => toggleFavorite(p.id)}
                onPress={() => comingSoon('Property details')}
              />
            ))}
          </ScrollView>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundMint },
  content: { paddingTop: spacing.md, paddingBottom: spacing.xxl, gap: spacing.lg },
  padded: { paddingHorizontal: SCREEN_PADDING, gap: spacing.lg },
  horizontalList: { paddingHorizontal: SCREEN_PADDING, gap: spacing.md },
});