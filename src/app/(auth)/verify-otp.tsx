import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OtpInput } from '@/components/auth/OtpInput';
import { BrandHeader } from '@/components/brand/BrandHeader';
import { AppText, Button, FormError } from '@/components/ui';
import {
  authService,
  MOCK_OTP_CODE,
  OTP_LENGTH,
  OTP_RESEND_SECONDS,
} from '@/services/authService';
import { session } from '@/services/session';
import { colors, SCREEN_PADDING, spacing } from '@/theme';
import type { OtpPurpose } from '@/types/auth';
import { maskBdPhone } from '@/utils/validation';

function formatSeconds(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function VerifyOtpScreen() {
  const { phone = '', purpose = 'register' } = useLocalSearchParams<{
    phone: string;
    purpose: OtpPurpose;
  }>();
  const { height } = useWindowDimensions();

  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(OTP_RESEND_SECONDS);
  const lastSubmitted = useRef('');

  // Resend countdown.
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const verify = async (value: string) => {
    if (value.length !== OTP_LENGTH || verifying) return;
    lastSubmitted.current = value;
    setVerifying(true);
    setError(undefined);
    const result = await authService.verifyOtp(phone, value, purpose);
    setVerifying(false);

    if (!result.ok) {
      setError(result.error);
      setCode('');
      return;
    }

    if (purpose === 'register' && result.data) {
      await session.save(result.data);
      // TODO: go to Home once it exists.
      router.replace('/ui-preview');
    } else {
      router.replace({ pathname: '/reset-password', params: { phone } });
    }
  };

  // Submit automatically once all digits are entered (only once per code).
  useEffect(() => {
    if (code.length === OTP_LENGTH && code !== lastSubmitted.current) {
      verify(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const handleResend = async () => {
    setResending(true);
    const result = await authService.resendOtp(phone);
    setResending(false);
    if (result.ok) {
      setSecondsLeft(OTP_RESEND_SECONDS);
      setError(undefined);
      setCode('');
      lastSubmitted.current = '';
    }
  };

  const illustrationSize = Math.min(260, height * 0.3);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <BrandHeader />
          </View>

          <Image
            source={require('../../../assets/images/otp-illustration.jpg')}
            style={[styles.illustration, { width: illustrationSize, height: illustrationSize }]}
            accessible={false}
          />

          <View style={styles.textBlock}>
            <AppText style={styles.title} align="center" accessibilityRole="header">
              OTP Verification
            </AppText>
            <AppText color="textSecondary" align="center" style={styles.subtitle}>
              Enter the {OTP_LENGTH}-digit code sent to
            </AppText>
            <AppText variant="h3" align="center">
              {maskBdPhone(phone)}
            </AppText>
          </View>

          <OtpInput length={OTP_LENGTH} value={code} onChange={setCode} error={!!error} />

          <FormError message={error} />

          <View style={styles.resendRow}>
            {secondsLeft > 0 ? (
              <AppText color="textSecondary">
                Resend code in{' '}
                <AppText variant="bodyBold" color="primary">
                  {formatSeconds(secondsLeft)}
                </AppText>
              </AppText>
            ) : (
              <Pressable onPress={handleResend} disabled={resending} hitSlop={8}>
                <AppText variant="bodyBold" color="primary">
                  {resending ? 'Sending…' : 'Resend code'}
                </AppText>
              </Pressable>
            )}
          </View>

          <Button
            title="Verify"
            onPress={() => verify(code)}
            loading={verifying}
            disabled={code.length !== OTP_LENGTH}
            rightIcon={<Ionicons name="arrow-forward" size={20} color={colors.white} />}
          />

          <Pressable
            onPress={() => router.back()}
            style={styles.changeNumber}
            hitSlop={8}
            accessibilityRole="button"
          >
            <AppText variant="bodyBold" color="primary">
              Change number
            </AppText>
          </Pressable>

          {__DEV__ ? (
            <AppText variant="caption" color="textMuted" align="center">
              Test code: {MOCK_OTP_CODE}
            </AppText>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundMint },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: SCREEN_PADDING + 4, paddingBottom: spacing.xxl, gap: spacing.lg },
  header: { paddingTop: spacing.lg },
  illustration: { alignSelf: 'center' },
  textBlock: { gap: spacing.xs },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '800', color: colors.primaryDeep },
  subtitle: { fontSize: 16 },
  resendRow: { alignItems: 'center' },
  changeNumber: { alignSelf: 'center' },
});