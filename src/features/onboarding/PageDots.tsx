import { Animated, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

type Props = {
  count: number;
  /** Horizontal scroll position of the pager. */
  scrollX: Animated.Value;
  pageWidth: number;
};

const DOT = 8;
const ACTIVE_DOT = 24;

export function PageDots({ count, scrollX, pageWidth }: Props) {
  return (
    <View style={styles.row} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: count }, (_, i) => {
        const inputRange = [(i - 1) * pageWidth, i * pageWidth, (i + 1) * pageWidth];
        const width = scrollX.interpolate({
          inputRange,
          outputRange: [DOT, ACTIVE_DOT, DOT],
          extrapolate: 'clamp',
        });
        const backgroundColor = scrollX.interpolate({
          inputRange,
          outputRange: [colors.primaryLight, colors.primary, colors.primaryLight],
          extrapolate: 'clamp',
        });
        return <Animated.View key={i} style={[styles.dot, { width, backgroundColor }]} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
  dot: { height: DOT, borderRadius: radius.full },
});