import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button, FormError, PasswordInput } from '@/components/ui';
import { authService } from '@/services/authService';
import { colors } from '@/theme';
import { validateNewPassword } from '@/utils/validation';

export default function ResetPasswordScreen() {
  const { phone = '' } = useLocalSearchParams<{ phone: string }>();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string; form?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    const next = {
      password: validateNewPassword(password),
      confirm: confirm === password ? undefined : 'Passwords do not match',
    };
    setErrors(next);
    if (next.password || next.confirm) return;

    setSubmitting(true);
    const result = await authService.resetPassword(phone, password);
    setSubmitting(false);

    if (!result.ok) {
      setErrors({ form: result.error });
      return;
    }
    Alert.alert('Password updated', 'You can now log in with your new password.', [
      { text: 'Login', onPress: () => router.dismissTo('/login') },
    ]);
  };

  return (
    <AuthLayout title="Set New Password" subtitle="Create a strong password for your account.">
      <PasswordInput
        label="New Password"
        placeholder="Enter new password"
        value={password}
        onChangeText={(t) => {
          setPassword(t);
          setErrors((e) => ({ ...e, password: undefined }));
        }}
        error={errors.password}
        hint="Use at least 8 characters with a mix of letters, numbers and symbols."
      />
      <PasswordInput
        label="Confirm Password"
        placeholder="Re-enter new password"
        value={confirm}
        onChangeText={(t) => {
          setConfirm(t);
          setErrors((e) => ({ ...e, confirm: undefined }));
        }}
        error={errors.confirm}
      />

      <FormError message={errors.form} />

      <Button
        title="Save Password"
        onPress={handleSave}
        loading={submitting}
        rightIcon={<Ionicons name="checkmark" size={20} color={colors.white} />}
      />
    </AuthLayout>
  );
}