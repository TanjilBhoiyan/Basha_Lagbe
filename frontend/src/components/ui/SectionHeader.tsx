import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/theme';
import { AppText } from './AppText';

type Props = {
  title: string;
  onSeeAll?: () => void;
};

export function SectionHeader({ title, onSeeAll }: Props) {
  return (
    <View style={styles.row}>
      <AppText variant="h3" style={styles.title} accessibilityRole="header">
        {title}
      </AppText>
      {onSeeAll ? (
        <Pressable onPress={onSeeAll} style={styles.seeAll} hitSlop={8} accessibilityRole="button">
          <AppText variant="bodyBold" color="primaryDeep">
            See All
          </AppText>
          <Ionicons name="chevron-forward" size={16} color={colors.primaryDeep} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 20, fontWeight: '700' },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: spacing.xs },
});