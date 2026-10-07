import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
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
import { propertyService } from '@/services/propertyService';
import { colors, radius, SCREEN_PADDING, spacing } from '@/theme';
import type { ChatMessage } from '@/types/chat';
import type { Property } from '@/types/property';

type ListItem =
  | { kind: 'day'; key: string; label: string }
  | { kind: 'message'; key: string; message: ChatMessage; showAvatar: boolean };

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

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const listRef = useRef<FlatList<ListItem>>(null);

  const [property, setProperty] = useState<Property | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [ownerTyping, setOwnerTyping] = useState(false);
  const [loading, setLoading] = useState(true);

  const propertyId = chatService.propertyIdOf(id);

  useEffect(() => {
    const unsubscribe = chatService.subscribe(id, (state) => {
      setMessages(state.messages);
      setOwnerTyping(state.ownerTyping);
    });
    (async () => {
      const [p, msgs] = await Promise.all([
        propertyService.getById(propertyId),
        chatService.getMessages(id),
      ]);
      setProperty(p);
      setMessages(msgs);
      setLoading(false);
    })();
    return unsubscribe;
  }, [id, propertyId]);

  const items = useMemo(() => buildItems(messages), [messages]);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/home'));

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!property) {
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

  const owner = property.owner;
  const online = chatService.isOwnerOnline(property.id);
  const statusText = ownerTyping
    ? 'typing…'
    : online
      ? 'Online'
      : owner.responseTime
        ? `Usually responds ${owner.responseTime}`
        : '';

  const openProperty = () =>
    router.push({ pathname: '/property/[id]', params: { id: property.id } });
  const callOwner = () => Linking.openURL(`tel:+880${owner.phone}`);

  const openMenu = () =>
    Alert.alert(owner.name, undefined, [
      { text: 'View listing', onPress: openProperty },
      {
        text: 'Request a visit',
        onPress: () => router.push({ pathname: '/contact/[id]', params: { id: property.id } }),
      },
      {
        text: 'Report this user',
        style: 'destructive',
        onPress: () => Alert.alert('Coming soon', 'Reporting will be available in a later step.'),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);

  const send = async (text: string) => {
    const result = await chatService.send(id, text);
    if (!result.ok) {
      Alert.alert('Message not sent', result.error);
      return false;
    }
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
        <ChatPropertyCard property={property} onPress={openProperty} />
      </View>

      <View style={styles.ownerRow}>
        <View>
          <OwnerAvatar name={owner.name} verified={false} size={56} />
          {online ? <View style={styles.onlineDot} /> : null}
        </View>
        <View style={styles.flex}>
          <View style={styles.nameRow}>
            <AppText variant="h3" style={styles.bold} numberOfLines={1}>
              {owner.name}
            </AppText>
            {owner.isVerified ? (
              <Ionicons name="checkmark-circle" size={18} color={colors.primary} accessibilityLabel="Verified" />
            ) : null}
          </View>
          <AppText variant="caption" color="textSecondary">
            Property Owner
          </AppText>
          {statusText ? (
            <AppText variant="caption" color={ownerTyping || online ? 'primary' : 'textSecondary'}>
              {statusText}
            </AppText>
          ) : null}
        </View>
        <Pressable onPress={callOwner} hitSlop={10} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Call owner">
          <Ionicons name="call" size={26} color={colors.primaryDeep} />
        </Pressable>
        <Pressable onPress={openMenu} hitSlop={10} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="More options">
          <Ionicons name="ellipsis-vertical" size={22} color={colors.text} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.chatArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {messages.length === 0 ? (
          <ScrollView contentContainerStyle={styles.empty} keyboardShouldPersistTaps="handled">
            <Ionicons name="chatbubbles-outline" size={48} color={colors.primary} />
            <AppText variant="h3" align="center">
              Say hello to {owner.name}
            </AppText>
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
            ListHeaderComponent={
              ownerTyping ? (
                <AppText variant="caption" color="textSecondary" style={styles.typing}>
                  {owner.name} is typing…
                </AppText>
              ) : null
            }
            renderItem={({ item }) =>
              item.kind === 'day' ? (
                <View style={styles.dayPill}>
                  <AppText variant="caption" color="textSecondary">
                    {item.label}
                  </AppText>
                </View>
              ) : (
                <MessageBubble message={item.message} ownerName={owner.name} showAvatar={item.showAvatar} />
              )
            }
          />
        )}

        <ChatInput
          onSend={send}
          onAttach={() =>
            Alert.alert('Coming soon', 'Sending photos in chat will be available in a later step.')
          }
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
  ownerRow: {
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
  onlineDot: {
    position: 'absolute',
    right: 0,
    bottom: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    borderWidth: 2.5,
    borderColor: colors.white,
  },
  iconBtn: { padding: spacing.xs },
  chatArea: { flex: 1, backgroundColor: colors.backgroundMint },
  list: { paddingHorizontal: SCREEN_PADDING, paddingVertical: spacing.md },
  dayPill: {
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
    marginVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: '#E8EEEA',
  },
  typing: { marginLeft: 44, marginTop: spacing.xs },
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