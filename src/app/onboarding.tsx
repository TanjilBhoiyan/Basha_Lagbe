import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandHeader } from '@/components/brand/BrandHeader';
import { AppText, Button } from '@/components/ui';
import { OnboardingSlide } from '@/features/onboarding/OnboardingSlide';
import { PageDots } from '@/features/onboarding/PageDots';
import { ONBOARDING_SLIDES, type OnboardingSlideData } from '@/features/onboarding/slides';
import { onboardingStorage } from '@/services/onboardingStorage';
import { colors, SCREEN_PADDING, spacing } from '@/theme';

export default function OnboardingScreen() {
  const { width, height } = useWindowDimensions();
  const listRef = useRef<FlatList<OnboardingSlideData>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [index, setIndex] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [listHeight, setListHeight] = useState(0);

  const isLast = index === ONBOARDING_SLIDES.length - 1;
  // Keep the illustration large but leave room for text and buttons on short screens.
  const imageSize = Math.min(width, height * 0.52);

  const finish = async () => {
    if (finishing) return;
    setFinishing(true);
    await onboardingStorage.markComplete();
    // TODO: replace with the login screen once it exists.
    router.replace('/ui-preview');
  };

  const handleNext = () => {
    if (isLast) {
      finish();
      return;
    }
    const next = index + 1;
    listRef.current?.scrollToIndex({ index: next, animated: true });
    setIndex(next);
  };

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <BrandHeader />
        {!isLast ? (
          <Pressable
            onPress={finish}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
          >
            <AppText variant="bodyBold" color="primary">
              Skip
            </AppText>
          </Pressable>
        ) : null}
      </View>

      <Animated.FlatList
        ref={listRef}
        data={ONBOARDING_SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <OnboardingSlide
            slide={item}
            width={width}
            height={listHeight}
            imageSize={imageSize}
          />
        )}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumEnd}
        onLayout={(e) => setListHeight(e.nativeEvent.layout.height)}
        style={styles.list}
      />

      <View style={styles.footer}>
        <PageDots count={ONBOARDING_SLIDES.length} scrollX={scrollX} pageWidth={width} />
        <Button
          title={isLast ? 'Get Started' : 'Next'}
          onPress={handleNext}
          loading={finishing}
          rightIcon={<Ionicons name="arrow-forward" size={20} color={colors.white} />}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundMint },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SCREEN_PADDING,
    paddingVertical: spacing.sm,
  },
  list: { flex: 1 },
  footer: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.xl,
  },
});