import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  View,
  type ImageSourcePropType,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { AppText } from '@/components/ui';
import { colors, radius, SCREEN_PADDING, spacing } from '@/theme';

type Props = {
  images: ImageSourcePropType[];
  width: number;
  height: number;
  /** Tapping a photo or the counter opens the full gallery. */
  onOpenGallery?: () => void;
};

/** Swipeable photos with a "1 / N" counter and a tappable thumbnail strip. */
export function PhotoGallery({ images, width, height, onOpenGallery }: Props) {
  const listRef = useRef<FlatList<ImageSourcePropType>>(null);
  const thumbsRef = useRef<FlatList<ImageSourcePropType>>(null);
  const [index, setIndex] = useState(0);

  const goTo = (i: number) => {
    setIndex(i);
    listRef.current?.scrollToIndex({ index: i, animated: true });
    thumbsRef.current?.scrollToIndex({ index: i, animated: true, viewPosition: 0.5 });
  };

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(i);
    thumbsRef.current?.scrollToIndex({ index: i, animated: true, viewPosition: 0.5 });
  };

  return (
    <View>
      <View>
        <FlatList
          ref={listRef}
          data={images}
          keyExtractor={(_, i) => String(i)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onMomentumEnd}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          renderItem={({ item }) => (
            <Pressable onPress={onOpenGallery} accessibilityLabel="Open gallery">
              <Image source={item} style={{ width, height }} resizeMode="cover" />
            </Pressable>
          )}
        />
        <Pressable
          onPress={onOpenGallery}
          style={styles.counter}
          accessibilityRole="button"
          accessibilityLabel={`Photo ${index + 1} of ${images.length}. Open gallery`}
        >
          <Ionicons name="images-outline" size={16} color={colors.white} />
          <AppText variant="caption" style={styles.counterText}>
            {index + 1} / {images.length}
          </AppText>
        </Pressable>
      </View>

      {images.length > 1 ? (
        <FlatList
          ref={thumbsRef}
          data={images}
          keyExtractor={(_, i) => `t${i}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbs}
          getItemLayout={(_, i) => ({ length: THUMB_W + spacing.sm, offset: (THUMB_W + spacing.sm) * i, index: i })}
          renderItem={({ item, index: i }) => (
            <Pressable
              onPress={() => goTo(i)}
              style={[styles.thumb, i === index && styles.thumbActive]}
              accessibilityRole="button"
              accessibilityLabel={`Show photo ${i + 1}`}
            >
              <Image source={item} style={styles.thumbImage} />
            </Pressable>
          )}
        />
      ) : null}
    </View>
  );
}

const THUMB_W = 76;

const styles = StyleSheet.create({
  counter: {
    position: 'absolute',
    left: SCREEN_PADDING,
    bottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  counterText: { color: colors.white, fontWeight: '600' },
  thumbs: { paddingHorizontal: SCREEN_PADDING, paddingVertical: spacing.sm, gap: spacing.sm },
  thumb: {
    width: THUMB_W,
    height: 58,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  thumbActive: { borderColor: colors.primary },
  thumbImage: { width: '100%', height: '100%' },
});