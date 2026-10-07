import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import type { PropertyOwner } from '@/types/property';
import { formatYearMonth } from '@/utils/format';
import { OwnerAvatar } from './OwnerAvatar';

export function OwnerCard({ owner, onPress }: { owner: PropertyOwner; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`Owner ${owner.name}${owner.isVerified ? ', verified' : ''}`}
    >
      <OwnerAvatar name={owner.name} verified={owner.isVerified} />

      <View style={styles.info}>
        {owner.isVerified ? (
          <View style={styles.verifiedRow}>
            <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
            <AppText variant="caption" color="primary" style={styles.bold}>
              Verified Owner
            </AppText>
          </View>
        ) : (
          <AppText variant="caption" color="textSecondary">
            Owner
          </AppText>
        )}
        <AppText variant="h3">{owner.name}</AppText>
        <AppText variant="caption" color="textSecondary">
          Member since {formatYearMonth(owner.memberSince)}
        </AppText>
      </View>

      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  pressed: { opacity: 0.85 },
  info: { flex: 1, gap: 1 },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bold: { fontWeight: '700' },
});