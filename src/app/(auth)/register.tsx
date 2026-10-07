import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { AuthLayout } from '@/components/auth/AuthLayout';
import { PhoneInput } from '@/components/auth/PhoneInput';
import { AppText, Button, Checkbox, FormError, Input, PasswordInput } from '@/components/ui';
import { APP_CONFIG } from '@/config/app';
import { authService } from '@/services/authService';
import { colors } from '@/theme';
import {
  validateBdPhone,
  validateEmail,
  validateFullName,
  validateNewPassword,
} from '@/utils/validation';

type Field = 'fullName' | 'phone' | 'email' | 'password' | 'terms';
type Errors = Partial<Record<Field | 'form', string>>;

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const clearError = (field: Field) =>
    setErrors((e) => ({ ...e, [field]: undefined, form: undefined }));

  const handleRegister = async () => {
    const next: Errors = {
      fullName: validateFullName(fullName),
      phone: validateBdPhone(phone),
      email: validateEmail(email),
      password: validateNewPassword(password),
      terms: agreed ? undefined : 'Please accept the Terms & Privacy Policy',
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    setSubmitting(true);
    const result = await authService.register({ fullName, phone, email, password });
    setSubmitting(false);

    if (!result.ok) {
      setErrors({ form: result.error });
      return;
    }
    router.push({
      pathname: '/verify-otp',
      params: { phone: result.data.phone, purpose: 'register' },
    });
  };

  const openTerms = () => {
    // TODO: open the Terms & Privacy screen once it exists.
    Alert.alert('Terms & Privacy Policy', 'This page will be added soon.');
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle={`Join ${APP_CONFIG.name} to find your perfect rental home.`}
    >
      <Input
        label="Full Name"
        placeholder="Enter your full name"
        autoCapitalize="words"
        autoComplete="name"
        value={fullName}
        onChangeText={(t) => {
          setFullName(t);
          clearError('fullName');
        }}
        error={errors.fullName}
        prefix={<Ionicons name="person-outline" size={20} color={colors.textSecondary} />}
      />

      <PhoneInput
        label="Phone Number"
        value={phone}
        onChangeText={(t) => {
          setPhone(t);
          clearError('phone');
        }}
        error={errors.phone}
      />

      <Input
        label="Email Address"
        placeholder="Enter your email address"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        value={email}
        onChangeText={(t) => {
          setEmail(t);
          clearError('email');
        }}
        error={errors.email}
        prefix={<Ionicons name="mail-outline" size={20} color={colors.textSecondary} />}
      />

      <PasswordInput
        label="Password"
        placeholder="Enter your password"
        value={password}
        onChangeText={(t) => {
          setPassword(t);
          clearError('password');
        }}
        error={errors.password}
        hint="Use at least 8 characters with a mix of letters, numbers and symbols."
      />

      <Checkbox
        checked={agreed}
        onChange={(v) => {
          setAgreed(v);
          clearError('terms');
        }}
        error={errors.terms}
        label="I agree to the"
        linkText="Terms & Privacy Policy"
        onLinkPress={openTerms}
      />

      <FormError message={errors.form} />

      <Button
        title="Register"
        onPress={handleRegister}
        loading={submitting}
        rightIcon={<Ionicons name="arrow-forward" size={20} color={colors.white} />}
      />

      <AppText align="center" color="textSecondary">
        Already have an account?{' '}
        <AppText
          variant="bodyBold"
          color="primary"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/login'))}
          accessibilityRole="link"
        >
          Login
        </AppText>
      </AppText>
    </AuthLayout>
  );
}