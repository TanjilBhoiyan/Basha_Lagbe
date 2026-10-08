import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { MESSAGE_MAX_LENGTH } from '@/services/chatService';
import { colors, SCREEN_PADDING, spacing } from '@/theme';

type Props = {
  onSend: (text: string) => Promise<boolean>;
  onAttach: () => void;
};

/** Attach button + growing text box + send button. */
export function ChatInput({ onSend, onAttach }: Props) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const canSend = text.trim().length > 0 && !sending;

  const send = async () => {
    if (!canSend) return;
    setSending(true);
    const ok = await onSend(text);
    setSending(false);
    if (ok) setText('');
  };

  return (
    <View style={styles.bar}>
      <Pressable
        onPress={onAttach}
        style={styles.attach}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel="Attach a photo"
      >
        <Ionicons name="attach" size={24} color={colors.textSecondary} style={styles.attachIcon} />
      </Pressable>

      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Type a message..."
        placeholderTextColor={colors.textMuted}
        multiline
        maxLength={MESSAGE_MAX_LENGTH}
        style={styles.input}
        accessibilityLabel="Message"
      />

      <Pressable
        onPress={send}
        disabled={!canSend}
        style={[styles.send, !canSend && styles.sendDisabled]}
        accessibilityRole="button"
        accessibilityLabel="Send message"
        accessibilityState={{ disabled: !canSend }}
      >
        <Ionicons name="paper-plane" size={22} color={colors.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: SCREEN_PADDING,
    paddingVertical: spacing.sm + 2,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  attach: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachIcon: { transform: [{ rotate: '45deg' }] },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    paddingHorizontal: spacing.lg,
    paddingTop: 13,
    paddingBottom: 13,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  send: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.5 },
});