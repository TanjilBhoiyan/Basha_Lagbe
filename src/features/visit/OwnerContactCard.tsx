import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { APP_CONFIG } from '@/config/app';
import { OwnerAvatar } from '@/features/property/OwnerAvatar';
import { colors, radius, spacing } from '@/theme';
import type { PropertyOwner } from '@/types/property';
import { formatYearMonth } from '@/utils/format';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type Props = {
  owner: PropertyOwner;
  onCall: () => void;
  onMessage: () => void;
};

/** Owner info + Call / Message buttons + trust badges (Contact & Visit screen). */
export function OwnerContactCard({ owner, onCall, onMessage }: Props) {
  const trust: { icon: IconName; title: string; text: string; warning?: boolean }[] = [
    owner.isVerified
      ? { icon: 'shield-check', title: 'Verified Owner', text: `Identity verified by ${APP_CONFIG.name}` }
      : { icon: 'shield-alert-outline', title: 'Not Verified Yet', text: 'Never pay before visiting', warning: true },
    { icon: 'home', title: 'Direct Contact', text: 'No middleman\nNo extra fees' },
    { icon: 'account-group', title: 'Safe & Secure', text: 'Chat and schedule visits safely' },
  ];

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <OwnerAvatar name={owner.name} verified={owner.isVerified} size={64} />

        <View style={styles.info}>
          <AppText style={styles.name} numberOfLines={2}>
            {owner.name}
          </AppText>
          <View style={styles.roleRow}>
            <AppText variant="caption" color="textSecondary">
              Owner
            </AppText>
            {owner.isVerified ? (
              <>
                <AppText variant="caption" color="textSecondary">
                  •
                </AppText>
                <MaterialCommunityIcons name="shield-check" size={15} color={colors.primary} />
                <AppText variant="caption" color="primaryDeep" style={styles.bold}>
                  Verified
                </AppText>
              </>
            ) : null}
          </View>
          <AppText variant="small" color="textSecondary">
            Member since {formatYearMonth(owner.memberSince)}
          </AppText>
          {owner.responseTime ? (
            <AppText variant="small" color="textSecondary">
              Responds {owner.responseTime}
            </AppText>
          ) : null}
        </View>

        <ContactButton icon="call" label="Call" filled onPress={onCall} />
        <ContactButton icon="chatbox-ellipses" label="Message" onPress={onMessage} />
      </View>

      <View style={styles.divider} />

      <View style={styles.trustRow}>
        {trust.map((t, i) => (
          <View key={t.title} style={[styles.trustItem, i > 0 && styles.trustDivider]}>
            <MaterialCommunityIcons
              name={t.icon}
              size={24}
              color={t.warning ? colors.warning : colors.primaryDeep}
            />
            <View style={styles.flex}>
              <AppText variant="small" style={styles.trustTitle}>
                {t.title}
              </AppText>
              <AppText variant="small" color="textSecondary" style={styles.trustText}>
                {t.text}
              </AppText>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function ContactButton({
  icon,
  label,
  filled,
  onPress,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  filled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.contact, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${label} owner`}
    >
      <View style={[styles.contactIcon, filled ? styles.contactFilled : styles.contactPlain]}>
        <Ionicons name={icon} size={24} color={colors.primaryDeep} />
      </View>
      <AppText variant="caption" color="primaryDeep" style={styles.bold}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#CDE9D6',
    backgroundColor: colors.backgroundMint,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2 },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 18, lineHeight: 23, fontWeight: '800', color: colors.text },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bold: { fontWeight: '700' },
  contact: { alignItems: 'center', gap: 4 },
  contactIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactFilled: { backgroundColor: colors.primaryLight },
  contactPlain: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  pressed: { opacity: 0.8 },
  divider: { height: 1, backgroundColor: '#CDE9D6', marginVertical: spacing.md },
  trustRow: { flexDirection: 'row' },
  trustItem: { flex: 1, flexDirection: 'row', gap: 6, paddingHorizontal: 6 },
  trustDivider: { borderLeftWidth: 1, borderLeftColor: '#CDE9D6' },
  flex: { flex: 1 },
  trustTitle: { fontWeight: '700', color: colors.text },
  trustText: { fontWeight: '400', lineHeight: 15 },
});