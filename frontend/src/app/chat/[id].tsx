import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandHeader } from '@/components/brand/BrandHeader';
import { AppText, EmptyState } from '@/components/ui';
import { ChatInput } from '@/features/chat/ChatInput';
import { ChatPropertyCard } from '@/features/chat/ChatPropertyCard';
import { dayKey, dayLabel } from '@/features/chat/chatFormat';
import { MessageBubble } from '@/features/chat/MessageBubble';
import { OwnerAvatar } from '@/features/property/OwnerAvatar';
import { chatService } from '@/services/chatService';
import { colors, radius, SCREEN_PADDING, spacing } from '@/theme';
import type { ChatMessage, ChatSummary } from '@/types/chat';
import { comingSoon } from '@/utils/comingSoon';

type ListItem =
  | { kind: 'day'; key: string; label: string }
  | { kind: 'message'; key: string; message: ChatMessage; showAvatar: boolean };

/** Tap-to-send questions for a tenant's first message. */
const QUICK_QUESTIONS = [
  'Is this still available?',
  'Is the rent negotiable?',
  'Can I visit this week?',
  'How much is the advance?',
];

/** Messages (oldest first) -> list rows with day separators, newest first for the inverted list. */
function buildItems(messages: ChatMessage[]): ListItem[] {
  const items: ListItem[] = [];
  messages.forEach((m, i) => {
    const prev = messages[i - 1];
    if (!prev || dayKey(prev.createdAt) !== dayKey(m.createdAt)) {
      items.push({ kind: 'day', key: `day_${dayKey(m.createdAt)}`, label: dayLabel(m.createdAt) });
    }
    const firstOfRun = !prev || prev.sender !== m.sender || dayKey(prev.createdAt) !== dayKey(m.createdAt);
    items.push({ kind: 'message', key: m.id, message: m, showAvatar: firstOfRun });
  });
  return items.reverse();
}

/** Adds messages, skipping ones we already have (the socket also echoes my own messages). */
const merge = (list: ChatMessage[], add: ChatMessage[]) => {
  const ids = new Set(list.map((m) => m.id));
  return [...list, ...add.filter((m) => !ids.has(m.id))].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
};

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const listRef = useRef<FlatList<ListItem>>(null);

  const [chat, setChat] = useState<ChatSummary | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  /** False once the first message is loaded (no older page left). */
  const [hasOlder, setHasOlder] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const [summary, page] = await Promise.all([chatService.get(id), chatService.getMessages(id)]);
      if (!active) return;
      setChat(summary);
      if (page.ok) {
        setMessages(page.data);
        setHasOlder(page.data.length >= 50);
      }
      setLoading(false);
      if (summary) chatService.markRead(id);
    })();

    // Live: new messages in this chat, and blue ticks when the other person reads.
    const offMessage = chatService.onMessage((m) => {
      if (m.conversationId !== id) return;
      setMessages((list) => merge(list, [m]));
      if (m.sender === 'them') chatService.markRead(id);
    });
    const offRead = chatService.onRead((e) => {
      if (e.conversationId !== id) return;
      setMessages((list) =>
        list.map((m) => (m.sender === 'me' && m.createdAt <= e.readAt ? { ...m, status: 'read' } : m)),
      );
    });
    return () => {
      active = false;
      offMessage();
      offRead();
    };
  }, [id]);

  const loadOlder = useCallback(async () => {
    if (!hasOlder || loadingOlder || !messages.length) return;
    setLoadingOlder(true);
    const page = await chatService.getMessages(id, messages[0].createdAt);
    if (page.ok) {
      setMessages((list) => merge(list, page.data));
      setHasOlder(page.data.length >= 50);
    }
    setLoadingOlder(false);
  }, [hasOlder, loadingOlder, messages, id]);

  const items = useMemo(() => buildItems(messages), [messages]);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/messages'));

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!chat) {
    return (
      <SafeAreaView style={styles.center}>
        <EmptyState
          icon="chatbubbles-outline"
          title="This chat is not available"
          message="The listing may have been removed by the owner."
          actionLabel="Go back"
          onAction={goBack}
        />
      </SafeAreaView>
    );
  }

  const other = chat.other;
  const isTenant = chat.myRole === 'tenant';

  const openProperty = () => router.push({ pathname: '/property/[id]', params: { id: chat.property.id } });
  const callOther = () => Linking.openURL(`tel:+880${other.phone}`);

  const openMenu = () =>
    Alert.alert(other.name, undefined, [
      { text: 'View listing', onPress: openProperty },
      ...(isTenant
        ? [
            {
              text: 'Request a visit',
              onPress: () => router.push({ pathname: '/contact/[id]', params: { id: chat.property.id } }),
            },
          ]
        : []),
      {
        text: 'Report this user',
        style: 'destructive' as const,
        onPress: () => comingSoon('Reporting'),
      },
      { text: 'Cancel', style: 'cancel' as const },
    ]);

  const send = async (text: string) => {
    const result = await chatService.send(id, text);
    if (!result.ok) {
      Alert.alert('Message not sent', result.error);
      return false;
    }
    setMessages((list) => merge(list, [result.data]));
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
    return true;
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={goBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </Pressable>
        <BrandHeader />
      </View>

      <View style={styles.propertyWrap}>
        <ChatPropertyCard property={chat.property} onPress={openProperty} />
      </View>

      <View style={styles.otherRow}>
        <OwnerAvatar name={other.name} verified={false} photo={other.avatarUrl} size={56} />
        <View style={styles.flex}>
          <View style={styles.nameRow}>
            <AppText variant="h3" style={styles.bold} numberOfLines={1}>
              {other.name}
            </AppText>
            {other.isVerified ? (
              <Ionicons name="checkmark-circle" size={18} color={colors.primary} accessibilityLabel="Verified" />
            ) : null}
          </View>
          <AppText variant="caption" color="textSecondary">
            {other.role === 'owner' ? 'Property Owner' : 'Interested Tenant'}
          </AppText>
        </View>
        <Pressable
          onPress={callOther}
          hitSlop={10}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel={`Call ${other.name}`}
        >
          <Ionicons name="call" size={26} color={colors.primaryDeep} />
        </Pressable>
        <Pressable onPress={openMenu} hitSlop={10} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="More options">
          <Ionicons name="ellipsis-vertical" size={22} color={colors.text} />
        </Pressable>
      </View>

      <KeyboardAvoidingView style={styles.chatArea} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {messages.length === 0 ? (
          <ScrollView contentContainerStyle={styles.empty} keyboardShouldPersistTaps="handled">
            <Ionicons name="chatbubbles-outline" size={48} color={colors.primary} />
            <AppText variant="h3" align="center">
              Say hello to {other.name}
            </AppText>
            {isTenant ? (
              <>
                <AppText color="textSecondary" align="center">
                  Ask about the rent, advance or a good time to visit. Never pay before seeing the property.
                </AppText>
                <View style={styles.quickWrap}>
                  {QUICK_QUESTIONS.map((q) => (
                    <Pressable key={q} onPress={() => send(q)} style={styles.quick} accessibilityRole="button">
                      <AppText variant="caption" color="primaryDeep" style={styles.bold}>
                        {q}
                      </AppText>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}
          </ScrollView>
        ) : (
          <FlatList
            ref={listRef}
            data={items}
            inverted
            keyExtractor={(item) => item.key}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            onEndReached={loadOlder}
            onEndReachedThreshold={0.3}
            ListFooterComponent={loadingOlder ? <ActivityIndicator color={colors.primary} style={styles.older} /> : null}
            renderItem={({ item }) =>
              item.kind === 'day' ? (
                <View style={styles.dayPill}>
                  <AppText variant="caption" color="textSecondary">
                    {item.label}
                  </AppText>
                </View>
              ) : (
                <MessageBubble
                  message={item.message}
                  otherName={other.name}
                  otherPhoto={other.avatarUrl}
                  showAvatar={item.showAvatar}
                />
              )
            }
          />
        )}

        <ChatInput
          onSend={send}
          onAttach={() => comingSoon('Sending photos in chat')}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, padding: spacing.xl },
  flex: { flex: 1 },
  bold: { fontWeight: '700' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: SCREEN_PADDING,
    paddingVertical: spacing.sm,
  },
  propertyWrap: { paddingHorizontal: SCREEN_PADDING, paddingBottom: spacing.md },
  otherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: SCREEN_PADDING,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: { padding: spacing.xs },
  chatArea: { flex: 1, backgroundColor: colors.backgroundMint },
  list: { paddingHorizontal: SCREEN_PADDING, paddingVertical: spacing.md },
  older: { marginVertical: spacing.md },
  dayPill: {
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
    marginVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: '#E8EEEA',
  },
  empty: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
  quickWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.md },
  quick: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
});