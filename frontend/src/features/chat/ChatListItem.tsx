import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { initials } from '@/features/property/OwnerAvatar';
import { apiImage } from '@/services/apiClient';
import { colors, radius, spacing } from '@/theme';
import type { ChatSummary } from '@/types/chat';
import { formatListTime } from './chatFormat';

const ROLE_STYLE = {
  owner: { label: 'Owner', color: '#1D4ED8', background: colors.infoLight, avatar: colors.primaryDeep },
  tenant: { label: 'Tenant', color: '#B45309', background: colors.warningLight, avatar: '#B45309' },
} as const;

/** One row on the Messages tab. */
export function ChatListItem({ chat, onPress }: { chat: ChatSummary; onPress: () => void }) {
  const role = ROLE_STYLE[chat.other.role];
  const last = chat.lastMessage;
  const unread = chat.unreadCount > 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`Chat with ${chat.other.name} about ${chat.property.title}${unread ? `, ${chat.unreadCount} unread` : ''}`}
    >
      <View>
        {chat.property.image ? (
          <Image source={chat.property.image} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.noThumb]}>
            <Ionicons name="home-outline" size={26} color={colors.primary} />
          </View>
        )}
        {chat.other.avatarUrl ? (
          <Image source={apiImage(chat.other.avatarUrl)} style={[styles.avatar, styles.avatarPhoto]} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: role.avatar }]}>
            <AppText style={styles.avatarText}>{initials(chat.other.name)}</AppText>
          </View>
        )}
      </View>

      <View style={styles.middle}>
        <View style={styles.nameRow}>
          <AppText variant="bodyBold" numberOfLines={1} style={styles.name}>
            {chat.other.name}
          </AppText>
          {chat.other.isVerified ? (
            <MaterialCommunityIcons name="check-decagram" size={16} color={colors.primary} />
          ) : null}
          <View style={[styles.role, { backgroundColor: role.background }]}>
            <AppText style={[styles.roleText, { color: role.color }]}>{role.label}</AppText>
          </View>
        </View>
        <AppText variant="caption" numberOfLines={1} style={styles.property}>
          {chat.property.title}
        </AppText>
        {last ? (
          <View style={styles.lastRow}>
            {last.mine ? (
              <Ionicons
                name={last.read ? 'checkmark-done' : 'checkmark'}
                size={16}
                color={last.read ? colors.primary : colors.textMuted}
              />
            ) : null}
            <AppText
              variant="caption"
              numberOfLines={1}
              style={[styles.last, unread && styles.lastUnread]}
            >
              {last.mine ? `You: ${last.text}` : last.text}
            </AppText>
          </View>
        ) : null}
      </View>

      <View style={styles.right}>
        {last ? (
          <AppText variant="small" style={[styles.time, unread && styles.timeUnread]}>
            {formatListTime(last.createdAt)}
          </AppText>
        ) : null}
        {unread ? (
          <View style={styles.badge}>
            <AppText style={styles.badgeText}>{chat.unreadCount > 99 ? '99+' : chat.unreadCount}</AppText>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const THUMB = 58;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E9EFEC',
  },
  pressed: { opacity: 0.7 },
  thumb: { width: THUMB, height: THUMB, borderRadius: 14, backgroundColor: colors.surface },
  noThumb: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight },
  avatar: {
    position: 'absolute',
    right: -6,
    bottom: -6,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.backgroundMint,
  },
  avatarPhoto: { backgroundColor: colors.surface },
  avatarText: { fontSize: 10, fontWeight: '800', color: colors.white },
  middle: { flex: 1, minWidth: 0, gap: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { flexShrink: 1, fontSize: 15.5 },
  role: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: radius.sm, marginLeft: 2 },
  roleText: { fontSize: 10.5, fontWeight: '700' },
  property: { color: colors.primary, fontWeight: '600' },
  lastRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  last: { flexShrink: 1, color: colors.textSecondary },
  lastUnread: { color: colors.text, fontWeight: '700' },
  right: { alignItems: 'flex-end', gap: 6, alignSelf: 'stretch', justifyContent: 'center' },
  time: { color: colors.textMuted, fontWeight: '400' },
  timeUnread: { color: colors.primary, fontWeight: '700' },
  badge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 12, fontWeight: '800', color: colors.white },
});