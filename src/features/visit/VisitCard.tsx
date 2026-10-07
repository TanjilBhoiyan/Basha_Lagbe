import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import type { Property } from '@/types/property';
import type { VisitRequest } from '@/types/visit';
import { formatTimeRange, formatVisitDateLong } from './visitSlots';
import { STATUS_STYLE, type VisitDisplayStatus } from './visitStatus';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export type VisitAction = {
  key: string;
  label: string;
  icon: IconName;
  variant: 'filled' | 'soft' | 'outline';
  onPress: () => void;
};

type Props = {
  visit: VisitRequest;
  property: Property;
  status: VisitDisplayStatus;
  actions: VisitAction[];
  onPress: () => void;
};

export function VisitCard({ visit, property, status, actions, onPress }: Props) {
  const badge = STATUS_STYLE[status];
  // One button fits beside the photo (like the design); two go in a full-width row.
  const inline = actions.length === 1;

  return (
    <View style={styles.card}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.top, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`${property.title}, ${badge.label}`}
      >
        <View>
          <Image source={property.images[0]} style={styles.image} />
          {property.images.length > 1 ? (
            <View style={styles.dots}>
              {property.images.map((_, i) => (
                <View key={i} style={[styles.dot, i === 0 && styles.dotActive]} />
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.info}>
          <View style={styles.titleRow}>
            <AppText variant="bodyBold" numberOfLines={2} style={styles.title}>
              {property.title}
            </AppText>
            <View style={[styles.badge, { backgroundColor: badge.background }]}>
              <MaterialCommunityIcons name={badge.icon} size={14} color={badge.color} />
              <AppText variant="small" style={[styles.badgeText, { color: badge.color }]}>
                {badge.label}
              </AppText>
            </View>
          </View>
          <InfoLine icon="location" text={property.areaLabel} green />
          <InfoLine icon="calendar-outline" text={formatVisitDateLong(visit.date)} />
          <InfoLine icon="time-outline" text={formatTimeRange(visit.time)} />
          {inline ? <ActionButton action={actions[0]} /> : null}
        </View>
      </Pressable>

      {!inline && actions.length ? (
        <View style={styles.actions}>
          {actions.map((a) => (
            <ActionButton key={a.key} action={a} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function InfoLine({
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
      <AppText variant="caption" color="textSecondary" numberOfLines={1} style={styles.flex}>
        {text}
      </AppText>
    </View>
  );
}

function ActionButton({ action }: { action: VisitAction }) {
  const filled = action.variant === 'filled';
  const color = filled ? colors.white : colors.primaryDeep;
  return (
    <Pressable
      onPress={action.onPress}
      style={({ pressed }) => [
        styles.action,
        filled ? styles.actionFilled : action.variant === 'soft' ? styles.actionSoft : styles.actionOutline,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
    >
      <MaterialCommunityIcons name={action.icon} size={18} color={color} />
      <AppText variant="caption" style={[styles.actionLabel, { color }]} numberOfLines={1}>
        {action.label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.sm + 2,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    gap: spacing.sm + 2,
  },
  top: { flexDirection: 'row', gap: spacing.md },
  pressed: { opacity: 0.85 },
  image: { width: 116, height: 120, borderRadius: radius.md },
  dots: { position: 'absolute', bottom: 6, left: 8, flexDirection: 'row', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.6)' },
  dotActive: { backgroundColor: colors.white },
  info: { flex: 1, gap: 5 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  title: { flex: 1, fontSize: 14, lineHeight: 19 },
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
  flex: { flex: 1 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
    minHeight: 42,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  actionFilled: { backgroundColor: colors.primaryDeep },
  actionSoft: { backgroundColor: colors.primaryLight },
  actionOutline: { borderWidth: 1.5, borderColor: colors.primaryDeep, backgroundColor: colors.white },
  actionLabel: { fontSize: 14, fontWeight: '700' },
});