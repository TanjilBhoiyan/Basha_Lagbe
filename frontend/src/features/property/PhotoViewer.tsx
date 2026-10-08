import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  View,
  type ImageSourcePropType,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui';
import { colors, SCREEN_PADDING, spacing } from '@/theme';

type Props = {
  images: ImageSourcePropType[];
  /** Index to open at; `null` = closed. */
  startIndex: number | null;
  onClose: () => void;
};

/** Full-screen, swipeable photo viewer on a black background. */
export function PhotoViewer({ images, startIndex, onClose }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<ImageSourcePropType>>(null);
  const [index, setIndex] = useState(startIndex ?? 0);

  useEffect(() => {
    if (startIndex !== null) setIndex(startIndex);
  }, [startIndex]);

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));

  return (
    <Modal
      visible={startIndex !== null}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        {startIndex !== null ? (
          <FlatList
            ref={listRef}
            data={images}
            keyExtractor={(_, i) => String(i)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={startIndex}
            getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
            onMomentumScrollEnd={onMomentumEnd}
            renderItem={({ item }) => (
              <View style={{ width, height, justifyContent: 'center' }}>
                <Image source={item} style={{ width, height: width * 0.75 }} resizeMode="contain" />
              </View>
            )}
          />
        ) : null}

        <View style={[styles.top, { top: insets.top + spacing.sm }]}>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={styles.close}
            accessibilityRole="button"
            accessibilityLabel="Close photo viewer"
          >
            <Ionicons name="close" size={26} color={colors.white} />
          </Pressable>
          <AppText variant="bodyBold" style={styles.counter}>
            {index + 1} / {images.length}
          </AppText>
          <View style={styles.close} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  top: {
    position: 'absolute',
    left: SCREEN_PADDING,
    right: SCREEN_PADDING,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  close: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  counter: { color: colors.white },
});