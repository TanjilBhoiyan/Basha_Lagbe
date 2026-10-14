import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import type { IncomingVisit } from '@/types/visit';
import { formatTimeRange, formatVisitDateLong } from './visitSlots';
import { STATUS_STYLE, type VisitDisplayStatus } from './visitStatus';

type Props = {
  visit: IncomingVisit;
  status: VisitDisplayStatus;
  /** Shows a spinner on the buttons while a confirm/decline is being sent. */
  busy: boolean;
  onConfirm: () => void;
  onDecline: () => void;
  onCall: () => void;
};

/** Owner side: one tenant's request to visit one of my properties. */
export function OwnerVisitCard({ visit, status, busy, onConfirm, onDecline, onCall }: Props) {
  const badge = STATUS_STYLE[status];

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <AppText variant="bodyBold" numberOfLines={2} style={styles.flex}>
          {visit.property.title}
        </AppText>
        <View style={[styles.badge, { backgroundColor: badge.background }]}>
          <MaterialCommunityIcons name={badge.icon} size={14} color={badge.color} />
          <AppText variant="small" style={[styles.badgeText, { color: badge.color }]}>
            {badge.label}
          </AppText>
        </View>
      </View>

      <Line icon="location" text={visit.property.areaLabel} green />
      <Line icon="calendar-outline" text={formatVisitDateLong(visit.date)} />
      <Line icon="time-outline" text={formatTimeRange(visit.time)} />

      <View style={styles.tenant}>
        <Ionicons name="person-circle-outline" size={22} color={colors.primaryDeep} />
        <View style={styles.flex}>
          <AppText variant="bodyBold">{visit.tenant.name}</AppText>
          {visit.message ? (
            <AppText variant="caption" color="textSecondary" numberOfLines={3}>
              “{visit.message}”
            </AppText>
          ) : null}
        </View>
      </View>

      {status === 'pending' ? (
        <View style={styles.actions}>
          <Action label="Decline" icon="close" variant="outline" disabled={busy} onPress={onDecline} />
          <Action label="Confirm" icon="check" variant="filled" disabled={busy} loading={busy} onPress={onConfirm} />
        </View>
      ) : status === 'confirmed' ? (
        <View style={styles.actions}>
          <Action label={`Call ${visit.tenant.name.split(' ')[0]}`} icon="phone" variant="soft" onPress={onCall} />
        </View>
      ) : null}
    </View>
  );
}

function Line({
  icon,
  text,
  green,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  text: string;
  green?: boolean;
}) {
  return (
    <View style={styles.line}>
      <Ionicons name={icon} size={16} color={green ? colors.primary : colors.textSecondary} />
      <AppText variant="caption" color="textSecondary">
        {text}
      </AppText>
    </View>
  );
}

function Action({
  label,
  icon,
  variant,
  onPress,
  disabled,
  loading,
}: {
  label: string;
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  variant: 'filled' | 'outline' | 'soft';
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const color = variant === 'filled' ? colors.white : variant === 'outline' ? colors.danger : colors.primaryDeep;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.action,
        variant === 'filled' ? styles.filled : variant === 'outline' ? styles.outline : styles.soft,
        (pressed || disabled) && styles.dim,
      ]}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <>
          <MaterialCommunityIcons name={icon} size={18} color={color} />
          <AppText variant="caption" style={[styles.actionLabel, { color }]}>
            {label}
          </AppText>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    gap: 6,
  },
  flex: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  line: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tenant: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 42,
    borderRadius: radius.md,
  },
  filled: { backgroundColor: colors.primaryDeep },
  outline: { borderWidth: 1.5, borderColor: colors.danger, backgroundColor: colors.white },
  soft: { backgroundColor: colors.primaryLight },
  dim: { opacity: 0.7 },
  actionLabel: { fontSize: 14, fontWeight: '700' },
});