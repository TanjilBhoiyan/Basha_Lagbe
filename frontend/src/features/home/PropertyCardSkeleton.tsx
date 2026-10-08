import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

/** Grey placeholder shown while recommended properties load. */
export function PropertyCardSkeleton({ width }: { width: number }) {
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.card, { width, opacity }]}>
      <View style={styles.image} />
      <View style={styles.body}>
        <View style={[styles.line, { width: '80%' }]} />
        <View style={[styles.line, { width: '55%' }]} />
        <View style={[styles.line, { width: '40%', height: 18 }]} />
        <View style={styles.button} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: { height: 150, backgroundColor: colors.border },
  body: { padding: spacing.md, gap: spacing.sm },
  line: { height: 12, borderRadius: radius.sm, backgroundColor: colors.border },
  button: { height: 40, borderRadius: radius.md, backgroundColor: colors.border, marginTop: spacing.xs },
});