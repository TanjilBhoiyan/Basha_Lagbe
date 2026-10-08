import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, EmptyState } from '@/components/ui';
import { PropertyListCard } from '@/features/search/PropertyListCard';
import { propertyService } from '@/services/propertyService';
import { colors, radius, SCREEN_PADDING, spacing } from '@/theme';
import type { Property } from '@/types/property';

const UNDO_MS = 4000;

export default function SavedPropertiesScreen() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  /** Last removed property, so the user can undo an accidental tap. */
  const [removed, setRemoved] = useState<{ property: Property; index: number } | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    const ids = await propertyService.getFavoriteIds();
    // Newest saved first; skip listings that were removed by the owner.
    const list = await Promise.all([...ids].reverse().map((id) => propertyService.getById(id)));
    setProperties(list.filter((p): p is Property => p !== null));
  }, []);

  // Reload when the screen is shown (hearts may change on other screens).
  useFocusEffect(
    useCallback(() => {
      load().finally(() => setLoading(false));
    }, [load]),
  );

  useEffect(
    () => () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
    },
    [],
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const unsave = async (property: Property) => {
    const index = properties.findIndex((p) => p.id === property.id);
    setProperties((list) => list.filter((p) => p.id !== property.id));
    await propertyService.toggleFavorite(property.id);
    setRemoved({ property, index });
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setRemoved(null), UNDO_MS);
  };

  const undo = async () => {
    if (!removed) return;
    if (undoTimer.current) clearTimeout(undoTimer.current);
    await propertyService.toggleFavorite(removed.property.id);
    setProperties((list) => {
      const next = [...list];
      next.splice(removed.index, 0, removed.property);
      return next;
    });
    setRemoved(null);
  };

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/profile'));

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={goBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </Pressable>
        <View style={styles.flex}>
          <AppText style={styles.title} accessibilityRole="header">
            Saved Properties
          </AppText>
          {!loading && properties.length > 0 ? (
            <AppText color="textSecondary">
              {properties.length} {properties.length === 1 ? 'property' : 'properties'} saved by you
            </AppText>
          ) : null}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={properties}
          keyExtractor={(p) => p.id}
          contentContainerStyle={[styles.list, properties.length === 0 && styles.listEmpty]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="heart-outline"
              title="No saved properties yet"
              message="Tap the heart on any property to save it here and compare later."
              actionLabel="Browse homes"
              onAction={() => router.push('/search')}
            />
          }
          renderItem={({ item }) => (
            <PropertyListCard
              property={item}
              isFavorite
              onToggleFavorite={() => unsave(item)}
              onPress={() => router.push({ pathname: '/property/[id]', params: { id: item.id } })}
            />
          )}
        />
      )}

      {removed ? (
        <View style={styles.snackbar} accessibilityLiveRegion="polite">
          <AppText variant="caption" style={styles.snackText} numberOfLines={1}>
            Removed “{removed.property.title}”
          </AppText>
          <Pressable onPress={undo} hitSlop={10} accessibilityRole="button">
            <AppText variant="bodyBold" style={styles.undo}>
              UNDO
            </AppText>
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
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
  title: { fontSize: 26, lineHeight: 32, fontWeight: '800', color: colors.text },
  loader: { marginTop: spacing.xxl },
  list: { paddingHorizontal: SCREEN_PADDING, paddingBottom: spacing.xxl, gap: spacing.md },
  listEmpty: { flexGrow: 1, justifyContent: 'center' },
  snackbar: {
    position: 'absolute',
    left: SCREEN_PADDING,
    right: SCREEN_PADDING,
    bottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.text,
  },
  snackText: { flex: 1, color: colors.white },
  undo: { color: '#86EFAC' },
});