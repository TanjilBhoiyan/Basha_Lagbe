import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, EmptyState, SegmentedTabs } from '@/components/ui';
import { PhotoViewer } from '@/features/property/PhotoViewer';
import { propertyService } from '@/services/propertyService';
import { colors, radius, SCREEN_PADDING, spacing } from '@/theme';
import type { Property } from '@/types/property';

type Tab = 'photos' | 'video';

export default function GalleryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('photos');
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  useEffect(() => {
    propertyService.getById(id).then((p) => {
      setProperty(p);
      setLoading(false);
    });
  }, [id]);

  const goBack = () =>
    router.canGoBack()
      ? router.back()
      : router.replace({ pathname: '/property/[id]', params: { id } });

  const contentWidth = width - SCREEN_PADDING * 2;
  const halfWidth = (contentWidth - spacing.sm) / 2;
  const images = property?.images ?? [];
  const [first, ...rest] = images;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={goBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </Pressable>
        <AppText style={styles.title} accessibilityRole="header">
          Gallery
        </AppText>
      </View>

      <View style={styles.tabs}>
        <SegmentedTabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'photos', label: `Photos (${images.length})`, icon: 'image' },
            { value: 'video', label: 'Video', icon: 'play-circle-outline' },
          ]}
        />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : !property ? (
        <EmptyState
          icon="images-outline"
          title="Photos not available"
          message="This listing may have been removed."
          actionLabel="Go back"
          onAction={goBack}
        />
      ) : tab === 'photos' ? (
        <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
          {first ? (
            <Pressable
              onPress={() => setViewerIndex(0)}
              accessibilityRole="imagebutton"
              accessibilityLabel={`Photo 1 of ${images.length}`}
            >
              <Image source={first} style={[styles.photo, { width: contentWidth, height: contentWidth * 0.62 }]} />
              <View style={styles.counter}>
                <Ionicons name="images-outline" size={14} color={colors.white} />
                <AppText variant="caption" style={styles.counterText}>
                  1 / {images.length}
                </AppText>
              </View>
            </Pressable>
          ) : null}

          <View style={styles.row}>
            {rest.map((img, i) => (
              <Pressable
                key={i}
                onPress={() => setViewerIndex(i + 1)}
                accessibilityRole="imagebutton"
                accessibilityLabel={`Photo ${i + 2} of ${images.length}`}
              >
                <Image source={img} style={[styles.photo, { width: halfWidth, height: halfWidth * 0.72 }]} />
              </Pressable>
            ))}
          </View>
        </ScrollView>
      ) : property.videoUrl ? (
        <View style={styles.videoWrap}>
          <Pressable
            onPress={() => Linking.openURL(property.videoUrl!)}
            accessibilityRole="button"
            accessibilityLabel="Play property video"
          >
            <Image source={first} style={[styles.photo, { width: contentWidth, height: contentWidth * 0.56 }]} />
            <View style={styles.playOverlay}>
              <View style={styles.playButton}>
                <Ionicons name="play" size={32} color={colors.primaryDeep} />
              </View>
            </View>
          </Pressable>
          <AppText variant="caption" color="textSecondary" align="center">
            Tap to watch the property tour
          </AppText>
        </View>
      ) : (
        <EmptyState
          icon="videocam-outline"
          title="No video yet"
          message="The owner hasn't added a video tour for this property."
        />
      )}

      <PhotoViewer images={images} startIndex={viewerIndex} onClose={() => setViewerIndex(null)} />
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
  title: { fontSize: 26, lineHeight: 32, fontWeight: '800', color: colors.text },
  tabs: { paddingHorizontal: SCREEN_PADDING, paddingBottom: spacing.md },
  loader: { marginTop: spacing.xxl },
  grid: { paddingHorizontal: SCREEN_PADDING, paddingBottom: spacing.xl, gap: spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  photo: { borderRadius: radius.lg },
  counter: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  counterText: { color: colors.white, fontWeight: '600' },
  videoWrap: { paddingHorizontal: SCREEN_PADDING, gap: spacing.md },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: radius.lg,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});