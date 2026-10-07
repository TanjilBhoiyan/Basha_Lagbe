import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandHeader } from '@/components/brand/BrandHeader';
import { AppText, Button } from '@/components/ui';
import { BasicInfoStep } from '@/features/post/BasicInfoStep';
import {
  EMPTY_DRAFT,
  hasDraftContent,
  validateBasicInfo,
  type DraftErrors,
  type PropertyDraft,
} from '@/features/post/draft';
import { StepIndicator } from '@/features/post/StepIndicator';
import { postDraftService } from '@/services/postDraftService';
import { colors, radius, SCREEN_PADDING, spacing } from '@/theme';

const STEPS = ['Basic\nInformation', 'Property\nDetails', 'Photos &\nAmenities', 'Review &\nPublish'];
const LAST = STEPS.length - 1;

export default function PostScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [draft, setDraft] = useState<PropertyDraft>(EMPTY_DRAFT);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<DraftErrors>({});
  /** Show errors live only after the owner tried to go next once. */
  const [triedNext, setTriedNext] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    postDraftService.load().then(({ draft: saved, step: savedStep }) => {
      setDraft(saved);
      setStep(savedStep);
      setRestored(hasDraftContent(saved));
      setLoaded(true);
    });
  }, []);

  // Auto-save the draft (short delay so we don't write on every key press).
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => postDraftService.save(draft, step), 400);
    return () => clearTimeout(t);
  }, [draft, step, loaded]);

  const update = (patch: Partial<PropertyDraft>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    if (triedNext && step === 0) setErrors(validateBasicInfo(next));
  };

  const goToStep = (s: number) => {
    setStep(s);
    setTriedNext(false);
    setErrors({});
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const next = () => {
    if (step === 0) {
      const e = validateBasicInfo(draft);
      setTriedNext(true);
      setErrors(e);
      if (Object.keys(e).length) {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
        return;
      }
    }
    if (step === LAST) {
      Alert.alert('Coming soon', 'Publishing will be available once all steps are built.');
      return;
    }
    goToStep(step + 1);
  };

  const back = () => (step > 0 ? goToStep(step - 1) : router.navigate('/home'));

  const startOver = () =>
    Alert.alert('Start over?', 'Everything you entered will be cleared.', [
      { text: 'Keep editing', style: 'cancel' },
      {
        text: 'Start over',
        style: 'destructive',
        onPress: async () => {
          await postDraftService.clear();
          setDraft(EMPTY_DRAFT);
          setRestored(false);
          goToStep(0);
        },
      },
    ]);

  if (!loaded) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <BrandHeader />

          <View style={styles.titleRow}>
            <Pressable onPress={back} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back">
              <Ionicons name="arrow-back" size={26} color={colors.text} />
            </Pressable>
            <AppText style={styles.title} accessibilityRole="header">
              Add Property
            </AppText>
          </View>

          <StepIndicator steps={STEPS} current={step} />

          {restored ? (
            <View style={styles.restored}>
              <Ionicons name="document-text-outline" size={18} color={colors.primaryDeep} />
              <AppText variant="caption" style={styles.flex}>
                We saved your draft. Continue where you left off.
              </AppText>
              <Pressable onPress={startOver} hitSlop={8} accessibilityRole="button">
                <AppText variant="caption" color="danger" style={styles.bold}>
                  Start over
                </AppText>
              </Pressable>
            </View>
          ) : null}

          {step === 0 ? (
            <BasicInfoStep draft={draft} errors={errors} onChange={update} />
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="construct-outline" size={40} color={colors.primary} />
              <AppText variant="h3" align="center">
                {STEPS[step].replace('\n', ' ')}
              </AppText>
              <AppText color="textSecondary" align="center">
                This step will be built with its design next.
              </AppText>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {step > 0 ? (
            <Button title="Back" variant="outline" fullWidth={false} onPress={back} style={styles.backBtn} />
          ) : null}
          <Button
            title={step === LAST ? 'Publish' : 'Next'}
            onPress={next}
            style={styles.nextBtn}
            rightIcon={<Ionicons name="arrow-forward" size={20} color={colors.white} />}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundMint },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.backgroundMint },
  flex: { flex: 1 },
  bold: { fontWeight: '700' },
  content: { padding: SCREEN_PADDING, paddingBottom: spacing.xl, gap: spacing.lg },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  title: { fontSize: 26, lineHeight: 32, fontWeight: '800', color: colors.text },
  restored: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
  },
  placeholder: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.xxl,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: SCREEN_PADDING,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.backgroundMint,
  },
  backBtn: { minHeight: 56, borderRadius: radius.lg, paddingHorizontal: spacing.xl },
  nextBtn: { flex: 1, minHeight: 56, borderRadius: radius.lg, backgroundColor: colors.primaryDeep, borderColor: colors.primaryDeep },
});