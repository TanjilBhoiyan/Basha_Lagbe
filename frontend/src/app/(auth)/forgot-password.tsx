import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';

import { AuthLayout } from '@/components/auth/AuthLayout';
import { PhoneInput } from '@/components/auth/PhoneInput';
import { AppText, Button, FormError, Input, SegmentedTabs } from '@/components/ui';
import { authService } from '@/services/authService';
import { colors } from '@/theme';
import type { LoginMethod } from '@/types/auth';
import { validateBdPhone, validateEmail } from '@/utils/validation';

export default function ForgotPasswordScreen() {
  const [method, setMethod] = useState<LoginMethod>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const handleSend = async () => {
    const fieldError = method === 'phone' ? validateBdPhone(phone) : validateEmail(email);
    setError(fieldError);
    setFormError(undefined);
    if (fieldError) return;

    setSubmitting(true);
    const result = await authService.requestPasswordReset(
      method,
      method === 'phone' ? phone : email,
    );
    setSubmitting(false);

    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    router.push({
      pathname: '/verify-otp',
      params: { phone: result.data.phone, purpose: 'reset-password' },
    });
  };

  return (
    <AuthLayout
      title="Forgot Password?"
      subtitle="Enter your phone or email. We’ll send a code to your registered phone number."
    >
      <SegmentedTabs
        value={method}
        onChange={(m) => {
          setMethod(m);
          setError(undefined);
          setFormError(undefined);
        }}
        tabs={[
          { value: 'phone', label: 'Phone', icon: 'call' },
          { value: 'email', label: 'Email', icon: 'mail-outline' },
        ]}
      />

      {method === 'phone' ? (
        <PhoneInput
          label="Phone Number"
          value={phone}
          onChangeText={(t) => {
            setPhone(t);
            setError(undefined);
          }}
          error={error}
        />
      ) : (
        <Input
          label="Email Address"
          placeholder="Enter your email address"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            setError(undefined);
          }}
          error={error}
          prefix={<Ionicons name="mail-outline" size={20} color={colors.textSecondary} />}
        />
      )}

      <FormError message={formError} />

      <Button
        title="Send Code"
        onPress={handleSend}
        loading={submitting}
        rightIcon={<Ionicons name="arrow-forward" size={20} color={colors.white} />}
      />

      <AppText align="center" color="textSecondary">
        Remember your password?{' '}
        <AppText variant="bodyBold" color="primary" onPress={() => router.back()}>
          Back to Login
        </AppText>
      </AppText>
    </AuthLayout>
  );
}