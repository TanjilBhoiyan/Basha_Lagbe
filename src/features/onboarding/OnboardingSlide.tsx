import { Image, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, spacing } from '@/theme';
import type { OnboardingSlideData } from './slides';

type Props = {
  slide: OnboardingSlideData;
  width: number;
  /** Height of the pager, so content can be centered vertically. */
  height: number;
  imageSize: number;
};

export function OnboardingSlide({ slide, width, height, imageSize }: Props) {
  return (
    <View style={[styles.container, { width, height }]}>
      <View style={styles.imageArea}>
        <Image
          source={slide.image}
          style={{ width: imageSize, height: imageSize }}
          resizeMode="contain"
          accessible={false}
        />
      </View>

      <View style={styles.textArea}>
        <AppText style={styles.title} align="center" accessibilityRole="header">
          {slide.title}
          {slide.highlight ? (
            <AppText style={[styles.title, styles.highlight]}>{`\n${slide.highlight}`}</AppText>
          ) : null}
        </AppText>
        <AppText color="textSecondary" align="center" style={styles.description}>
          {slide.description}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center' },
  imageArea: { alignItems: 'center' },
  textArea: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    color: colors.primaryDeep,
  },
  highlight: { color: colors.primary },
  description: { fontSize: 16, lineHeight: 24 },
});