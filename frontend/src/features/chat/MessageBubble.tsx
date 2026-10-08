import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { OwnerAvatar } from '@/features/property/OwnerAvatar';
import { colors, radius, spacing } from '@/theme';
import type { ChatMessage } from '@/types/chat';
import { formatChatTime } from './chatFormat';

type Props = {
  message: ChatMessage;
  ownerName: string;
  /** Show the owner's avatar (first message of a run); otherwise keep the space. */
  showAvatar: boolean;
};

export function MessageBubble({ message, ownerName, showAvatar }: Props) {
  const mine = message.sender === 'me';

  return (
    <View style={[styles.row, mine ? styles.rowMine : styles.rowTheirs]}>
      {!mine ? (
        <View style={styles.avatarSlot}>
          {showAvatar ? <OwnerAvatar name={ownerName} verified={false} size={36} /> : null}
        </View>
      ) : null}

      <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
        <AppText style={styles.text}>{message.text}</AppText>
        <View style={styles.meta}>
          <AppText variant="small" color="textSecondary" style={styles.time}>
            {formatChatTime(message.createdAt)}
          </AppText>
          {mine ? <StatusTick status={message.status} /> : null}
        </View>
      </View>
    </View>
  );
}

function StatusTick({ status }: { status: ChatMessage['status'] }) {
  if (status === 'sent') {
    return <Ionicons name="checkmark" size={16} color={colors.textSecondary} accessibilityLabel="Sent" />;
  }
  return (
    <Ionicons
      name="checkmark-done"
      size={16}
      color={status === 'read' ? colors.primary : colors.textSecondary}
      accessibilityLabel={status === 'read' ? 'Read' : 'Delivered'}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginVertical: 4 },
  rowMine: { justifyContent: 'flex-end', paddingLeft: 48 },
  rowTheirs: { justifyContent: 'flex-start', paddingRight: 32 },
  avatarSlot: { width: 36 },
  bubble: {
    flexShrink: 1,
    paddingHorizontal: spacing.md + 2,
    paddingTop: spacing.sm + 2,
    paddingBottom: spacing.sm,
    borderRadius: radius.lg,
  },
  mine: { backgroundColor: colors.primaryLight, borderTopRightRadius: 4 },
  theirs: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: { fontSize: 15, lineHeight: 21, color: colors.text },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 2 },
  time: { fontWeight: '400', fontSize: 11 },
});