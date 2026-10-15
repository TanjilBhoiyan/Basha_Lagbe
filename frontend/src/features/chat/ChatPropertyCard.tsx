import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import type { ChatSummary } from '@/types/chat';
import { formatTaka } from '@/utils/format';

/** Compact listing card at the top of a chat; tap opens the listing. */
export function ChatPropertyCard({
  property,
  onPress,
}: {
  property: ChatSummary['property'];
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`Open listing ${property.title}`}
    >
      {property.image ? (
        <Image source={property.image} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.noImage]}>
          <Ionicons name="home-outline" size={28} color={colors.primary} />
        </View>
      )}
      <View style={styles.body}>
        <AppText variant="bodyBold" numberOfLines={1}>
          {property.title}
        </AppText>
        <View style={styles.row}>
          <Ionicons name="location" size={14} color={colors.primary} />
          <AppText variant="caption" color="textSecondary" numberOfLines={1}>
            {property.areaLabel}
          </AppText>
        </View>
        <AppText style={styles.rent}>
          {formatTaka(property.monthlyRent)}
          <AppText variant="caption" color="primaryDeep" style={styles.bold}>
            {' '}
            / month
          </AppText>
        </AppText>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm,
    paddingRight: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  pressed: { opacity: 0.85 },
  image: { width: 100, height: 70, borderRadius: radius.md },
  noImage: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight },
  body: { flex: 1, gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  rent: { fontSize: 17, lineHeight: 22, fontWeight: '800', color: colors.primaryDeep },
  bold: { fontWeight: '700' },
});