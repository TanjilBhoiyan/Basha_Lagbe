import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors } from '@/theme';

type Props = {
  steps: string[];
  /** 0-based index of the current step. */
  current: number;
};

/** "1 — 2 — 3 — 4" progress row; finished steps show a tick. */
export function StepIndicator({ steps, current }: Props) {
  return (
    <View style={styles.row} accessibilityLabel={`Step ${current + 1} of ${steps.length}: ${steps[current]}`}>
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <View key={label} style={styles.step}>
            {i > 0 ? <View style={[styles.line, styles.lineLeft, (done || active) && styles.lineDone]} /> : null}
            {i < steps.length - 1 ? <View style={[styles.line, styles.lineRight, done && styles.lineDone]} /> : null}
            <View style={[styles.circle, (done || active) && styles.circleActive]}>
              {done ? (
                <Ionicons name="checkmark" size={18} color={colors.white} />
              ) : (
                <AppText variant="bodyBold" style={active ? styles.numActive : styles.num}>
                  {i + 1}
                </AppText>
              )}
            </View>
            <AppText
              variant="caption"
              align="center"
              color={active || done ? 'primaryDeep' : 'textSecondary'}
              style={active && styles.labelActive}
            >
              {label}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

const SIZE = 34;

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  step: { flex: 1, alignItems: 'center', gap: 6 },
  line: { position: 'absolute', top: SIZE / 2 - 1, height: 2, backgroundColor: colors.border },
  lineLeft: { left: 0, right: '50%' },
  lineRight: { left: '50%', right: 0 },
  lineDone: { backgroundColor: colors.primary },
  circle: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleActive: { backgroundColor: colors.primaryDeep, borderColor: colors.primaryDeep },
  num: { color: colors.textSecondary },
  numActive: { color: colors.white },
  labelActive: { fontWeight: '700' },
});