import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/theme';
import { AppText } from './AppText';

export function TextDivider({ text = 'or' }: { text?: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.line} />
      <AppText color="textSecondary">{text}</AppText>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
});