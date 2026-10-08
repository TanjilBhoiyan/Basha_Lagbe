import { useRef, useState } from 'react';
import { PanResponder, StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { colors, radius } from '@/theme';

type Props = {
  /** Number of snap points (indexes 0 … steps-1). */
  steps: number;
  low: number;
  high: number;
  onChange: (low: number, high: number) => void;
};

const THUMB = 26;

/**
 * Two-thumb slider that snaps to `steps` positions.
 * Built with PanResponder so it needs no extra native library.
 */
export function RangeSlider({ steps, low, high, onChange }: Props) {
  const [width, setWidth] = useState(0);

  // Refs keep the gesture handlers (created once) reading the latest values.
  const state = useRef({ low, high, width, startLow: low, startHigh: high, onChange });
  state.current.low = low;
  state.current.high = high;
  state.current.width = width;
  state.current.onChange = onChange;

  const toIndex = (x: number) => {
    const w = state.current.width;
    if (w <= 0) return 0;
    return Math.round(Math.min(Math.max(x / w, 0), 1) * (steps - 1));
  };

  const makeResponder = (thumb: 'low' | 'high') =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        state.current.startLow = state.current.low;
        state.current.startHigh = state.current.high;
      },
      onPanResponderMove: (_, g) => {
        const s = state.current;
        const stepWidth = s.width / (steps - 1);
        if (thumb === 'low') {
          const next = Math.min(toIndex(s.startLow * stepWidth + g.dx), s.high - 1);
          if (next !== s.low) s.onChange(Math.max(next, 0), s.high);
        } else {
          const next = Math.max(toIndex(s.startHigh * stepWidth + g.dx), s.low + 1);
          if (next !== s.high) s.onChange(s.low, Math.min(next, steps - 1));
        }
      },
    });

  const lowResponder = useRef(makeResponder('low')).current;
  const highResponder = useRef(makeResponder('high')).current;

  const pos = (i: number) => (width * i) / (steps - 1);

  return (
    <View
      style={styles.container}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
    >
      <View style={styles.track} />
      <View style={[styles.fill, { left: pos(low), width: pos(high) - pos(low) }]} />
      <View
        {...lowResponder.panHandlers}
        style={[styles.thumb, { left: pos(low) - THUMB / 2 }]}
        hitSlop={14}
        accessibilityRole="adjustable"
        accessibilityLabel="Minimum price"
      />
      <View
        {...highResponder.panHandlers}
        style={[styles.thumb, { left: pos(high) - THUMB / 2 }]}
        hitSlop={14}
        accessibilityRole="adjustable"
        accessibilityLabel="Maximum price"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: THUMB + 8, justifyContent: 'center', marginHorizontal: THUMB / 2 },
  track: { height: 6, borderRadius: radius.full, backgroundColor: colors.border },
  fill: { position: 'absolute', height: 6, borderRadius: radius.full, backgroundColor: colors.primary },
  thumb: {
    position: 'absolute',
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.white,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
});