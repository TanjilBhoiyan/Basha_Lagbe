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

import { AppText, Button } from '@/components/ui';
import { BasicInfoStep } from '@/features/post/BasicInfoStep';
import {
  EMPTY_DRAFT,
  firstInvalidStep,
  hasDraftContent,
  validateStep,
  type DraftErrors,
  type PropertyDraft,
} from '@/features/post/draft';
import { PhotosStep } from '@/features/post/PhotosStep';
import { PreviewStep } from '@/features/post/PreviewStep';
import { PropertyDetailsStep } from '@/features/post/PropertyDetailsStep';
import { StepIndicator } from '@/features/post/StepIndicator';
import { postDraftService } from '@/services/postDraftService';
import { propertyPostService } from '@/services/propertyPostService';
import { colors, radius, SCREEN_PADDING, spacing } from '@/theme';

const STEPS = ['Basic Info', 'Property\nDetails', 'Photos', 'Preview'];
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
  /** "Uploading photos 2/5…" while submitting; null when idle. */
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    postDraftService.load().then(({ draft: saved, step: savedStep }) => {
      setDraft(saved);
      setStep(Math.min(savedStep, LAST));
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
    if (triedNext) setErrors(validateStep(step, next));
  };

  const goToStep = (s: number) => {
    setStep(s);
    setTriedNext(false);
    setErrors({});
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  /** Shows the step's errors; returns true when the step is OK. */
  const checkStep = (s: number) => {
    const e = validateStep(s, draft);
    setTriedNext(true);
    setErrors(e);
    if (Object.keys(e).length) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return false;
    }
    return true;
  };

  const submit = async () => {
    const bad = firstInvalidStep(draft);
    if (bad !== -1) {
      goToStep(bad);
      setTimeout(() => checkStep(bad), 0);
      return;
    }
    setSubmitting('Submitting…');
    const result = await propertyPostService.submit(draft, (done, total) =>
      setSubmitting(done < total ? `Uploading photos ${done + 1}/${total}…` : 'Saving listing…'),
    );
    setSubmitting(null);
    if (!result.ok) {
      Alert.alert('Could not submit', result.error);
      return;
    }
    await postDraftService.clear();
    setDraft(EMPTY_DRAFT);
    setRestored(false);
    goToStep(0);
    Alert.alert('Property submitted', 'We will review it soon. You can see it on your dashboard.');
    router.replace('/dashboard');
  };

  const next = () => {
    if (step === LAST) {
      submit();
      return;
    }
    if (checkStep(step)) goToStep(step + 1);
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
      <View style={styles.header}>
        <Pressable
          onPress={back}
          hitSlop={12}
          disabled={!!submitting}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <AppText style={styles.title} accessibilityRole="header">
          Add Property
        </AppText>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <StepIndicator steps={STEPS} current={step} />

          {restored && step === 0 ? (
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

          {step === 0 ? <BasicInfoStep draft={draft} errors={errors} onChange={update} /> : null}
          {step === 1 ? <PropertyDetailsStep draft={draft} errors={errors} onChange={update} /> : null}
          {step === 2 ? <PhotosStep draft={draft} errors={errors} onChange={update} /> : null}
          {step === 3 ? <PreviewStep draft={draft} onEdit={goToStep} /> : null}
        </ScrollView>

        <View style={styles.footer}>
          {step > 0 ? (
            <Button
              title="Back"
              variant="outline"
              fullWidth={false}
              onPress={back}
              disabled={!!submitting}
              style={styles.backBtn}
            />
          ) : null}
          <Button
            title={submitting ?? (step === LAST ? 'Submit Property' : 'Next')}
            onPress={next}
            disabled={!!submitting}
            style={styles.nextBtn}
            rightIcon={
              submitting ? (
                <ActivityIndicator color={colors.white} />
              ) : step === LAST ? undefined : (
                <Ionicons name="arrow-forward" size={20} color={colors.white} />
              )
            }
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SCREEN_PADDING,
    paddingVertical: spacing.md,
  },
  title: { flex: 1, textAlign: 'center', fontSize: 20, lineHeight: 26, fontWeight: '800', color: colors.text },
  headerSpacer: { width: 26 },
  content: { padding: SCREEN_PADDING, paddingTop: spacing.xs, paddingBottom: spacing.xl, gap: spacing.lg },
  restored: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
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