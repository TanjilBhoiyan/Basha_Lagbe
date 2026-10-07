import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Button, EmptyState, FormError } from '@/components/ui';
import { PropertyListCard } from '@/features/search/PropertyListCard';
import { OwnerContactCard } from '@/features/visit/OwnerContactCard';
import { DateStrip, PickerLabel, TimeSlotPicker } from '@/features/visit/VisitPickers';
import {
  formatTimeSlot,
  formatVisitDate,
  isSlotAvailable,
  TIME_SLOTS,
  upcomingDays,
} from '@/features/visit/visitSlots';
import { propertyService } from '@/services/propertyService';
import { visitService } from '@/services/visitService';
import { colors, radius, SCREEN_PADDING, spacing } from '@/theme';
import type { Property, PropertyType } from '@/types/property';
import type { VisitRequest } from '@/types/visit';

const MESSAGE_MAX = 500;

const TYPE_WORD: Record<PropertyType, string> = {
  apartment: 'apartment',
  room: 'room',
  house: 'house',
  sublet: 'sublet room',
  office: 'office space',
  shop: 'shop',
  mess: 'mess seat',
};

const defaultMessage = (p: Property) =>
  `Hi, I'm interested in this ${TYPE_WORD[p.type]}. I would like to schedule a visit. Please let me know if this time works for you.`;

export default function ContactVisitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);

  const [property, setProperty] = useState<Property | null>(null);
  const [existing, setExisting] = useState<VisitRequest | null>(null);
  const [loading, setLoading] = useState(true);

  const [showTwoWeeks, setShowTwoWeeks] = useState(false);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const days = useMemo(() => upcomingDays(showTwoWeeks ? 14 : 7), [showTwoWeeks]);

  useEffect(() => {
    (async () => {
      const [p, visit] = await Promise.all([
        propertyService.getById(id),
        visitService.getActiveForProperty(id),
      ]);
      setProperty(p);
      setExisting(visit);
      // Pre-select the existing request's slot if it is still bookable,
      // otherwise the first free slot (like the design).
      if (visit && isSlotAvailable(visit.date, visit.time)) {
        setDate(visit.date);
        setTime(visit.time);
        setMessage(visit.message);
      } else {
        const first = upcomingDays(1)[0].iso;
        setDate(first);
        setTime(TIME_SLOTS.find((t) => isSlotAvailable(first, t)) ?? null);
      }
      setLoading(false);
    })();
  }, [id]);

  const goBack = () =>
    router.canGoBack()
      ? router.back()
      : router.replace({ pathname: '/property/[id]', params: { id } });

  const selectDate = (iso: string) => {
    setDate(iso);
    setError(null);
    // Keep the chosen time if it exists on the new day, else pick the first free one.
    if (!time || !isSlotAvailable(iso, time)) {
      setTime(TIME_SLOTS.find((t) => isSlotAvailable(iso, t)) ?? null);
    }
  };

  // Card content width: screen padding, card padding and borders removed.
  const cardInner = width - SCREEN_PADDING * 2 - spacing.lg * 2 - 2;

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
          icon="home-outline"
          title="This listing is no longer available"
          message="It may have been rented out or removed by the owner."
          actionLabel="Go back"
          onAction={goBack}
        />
      </SafeAreaView>
    );
  }

  const callOwner = () => Linking.openURL(`tel:+880${property.owner.phone}`);
  const openChat = () =>
    Alert.alert('Coming soon', 'Messaging will be available in the next step.');

  const send = async () => {
    if (!date || !time) {
      setError('Please select a date and time for your visit.');
      return;
    }
    setError(null);
    setSending(true);
    const result = await visitService.request({
      propertyId: property.id,
      date,
      time,
      message: message.trim() || defaultMessage(property),
    });
    setSending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const wasUpdate = existing !== null;
    setExisting(result.data);
    Alert.alert(
      wasUpdate ? 'Visit request updated' : 'Visit request sent',
      `${property.owner.name} will be notified about your visit on ${formatVisitDate(date)} at ${formatTimeSlot(time)}.`,
    );
  };

  const cancelRequest = () => {
    if (!existing) return;
    Alert.alert('Cancel visit request?', 'The owner will be told you are no longer coming.', [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Cancel request',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          await visitService.cancel(existing.id);
          setExisting(null);
          setCancelling(false);
        },
      },
    ]);
  };

  const timeAvailable = (t: string) => (date ? isSlotAvailable(date, t) : false);
  const noSlotsOnDay = date !== null && !TIME_SLOTS.some(timeAvailable);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={goBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </Pressable>
        <View style={styles.flex}>
          <AppText style={styles.title} accessibilityRole="header">
            Contact & Visit
          </AppText>
          <AppText color="textSecondary">Get in touch and schedule a visit</AppText>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <PropertyListCard property={property} onPress={goBack} />

          <OwnerContactCard owner={property.owner} onCall={callOwner} onMessage={openChat} />

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIcon}>
                <MaterialCommunityIcons name="calendar-month" size={26} color={colors.primaryDeep} />
              </View>
              <View style={styles.flex}>
                <AppText variant="h3" style={styles.bold}>
                  Request a Visit
                </AppText>
                <AppText variant="caption" color="textSecondary">
                  Choose a date and time to visit this property
                </AppText>
              </View>
            </View>

            {existing ? (
              <View style={styles.existing}>
                <MaterialCommunityIcons name="calendar-clock" size={22} color={colors.primaryDeep} />
                <View style={styles.flex}>
                  <AppText variant="caption" style={styles.bold}>
                    {existing.status === 'confirmed' ? 'Visit confirmed' : 'Visit requested'} ·{' '}
                    {formatVisitDate(existing.date)}, {formatTimeSlot(existing.time)}
                  </AppText>
                  <AppText variant="small" color="textSecondary" style={styles.normal}>
                    {existing.status === 'confirmed'
                      ? 'The owner confirmed your visit.'
                      : 'Waiting for the owner to confirm. Pick a new slot below to change it.'}
                  </AppText>
                </View>
                <Pressable onPress={cancelRequest} disabled={cancelling} hitSlop={8} accessibilityRole="button">
                  {cancelling ? (
                    <ActivityIndicator size="small" color={colors.danger} />
                  ) : (
                    <AppText variant="caption" color="danger" style={styles.bold}>
                      Cancel
                    </AppText>
                  )}
                </Pressable>
              </View>
            ) : null}

            <PickerLabel
              right={
                <Pressable
                  onPress={() => setShowTwoWeeks((v) => !v)}
                  hitSlop={8}
                  style={styles.link}
                  accessibilityRole="button"
                >
                  <AppText variant="caption" color="primaryDeep" style={styles.bold}>
                    {showTwoWeeks ? 'Show 1 Week' : 'See Next 2 Weeks'}
                  </AppText>
                  <Ionicons
                    name={showTwoWeeks ? 'chevron-up' : 'chevron-forward'}
                    size={16}
                    color={colors.primaryDeep}
                  />
                </Pressable>
              }
            >
              Select Date
            </PickerLabel>
            <DateStrip days={days} selected={date} onSelect={selectDate} width={cardInner} />

            <PickerLabel>Select Time</PickerLabel>
            <TimeSlotPicker
              slots={TIME_SLOTS}
              selected={time}
              isAvailable={timeAvailable}
              onSelect={(t) => {
                setTime(t);
                setError(null);
              }}
            />
            {noSlotsOnDay ? (
              <AppText variant="caption" color="textSecondary">
                No more slots today. Please pick another day.
              </AppText>
            ) : null}

            <AppText variant="bodyBold">
              Add a Message{' '}
              <AppText color="textSecondary" style={styles.normal}>
                (Optional)
              </AppText>
            </AppText>
            <View style={styles.messageBox}>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder={defaultMessage(property)}
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={MESSAGE_MAX}
                textAlignVertical="top"
                style={styles.messageInput}
                onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 250)}
                accessibilityLabel="Message to the owner"
              />
              <AppText variant="small" color="textMuted" align="right" style={styles.normal}>
                {message.length}/{MESSAGE_MAX}
              </AppText>
            </View>

            <FormError message={error ?? undefined} />

            <Button
              title={existing ? 'Update Visit Request' : 'Send Visit Request'}
              loading={sending}
              onPress={send}
              style={styles.send}
              leftIcon={<Ionicons name="paper-plane" size={20} color={colors.white} />}
            />
            <AppText variant="small" color="textSecondary" align="center" style={styles.normal}>
              The owner will be notified about your visit request and may contact you soon.
            </AppText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, padding: spacing.xl },
  flex: { flex: 1 },
  bold: { fontWeight: '700' },
  normal: { fontWeight: '400' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: SCREEN_PADDING,
    paddingVertical: spacing.md,
  },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '800', color: colors.text },
  content: { paddingHorizontal: SCREEN_PADDING, paddingBottom: spacing.xxl, gap: spacing.md },
  card: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    gap: spacing.md,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  existing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
  },
  link: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  messageBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  messageInput: { minHeight: 72, fontSize: 15, lineHeight: 21, color: colors.text, padding: 0 },
  send: { minHeight: 56, borderRadius: radius.full, backgroundColor: colors.primaryDeep, borderColor: colors.primaryDeep },
});