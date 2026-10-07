import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AuthLayout } from '@/components/auth/AuthLayout';
import { PhoneInput } from '@/components/auth/PhoneInput';
import {
  AppText,
  Button,
  FormError,
  Input,
  PasswordInput,
  SegmentedTabs,
  TextDivider,
} from '@/components/ui';
import { authService } from '@/services/authService';
import { goToAppHome } from '@/services/navigation';
import { session } from '@/services/session';
import { colors, spacing } from '@/theme';
import type { LoginMethod } from '@/types/auth';
import { validateBdPhone, validateEmail, validatePasswordPresent } from '@/utils/validation';

type Errors = { identifier?: string; password?: string; form?: string };

export default function LoginScreen() {
  const [method, setMethod] = useState<LoginMethod>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const identifier = method === 'phone' ? phone : email;

  const handleLogin = async () => {
    const next: Errors = {
      identifier: method === 'phone' ? validateBdPhone(phone) : validateEmail(email),
      password: validatePasswordPresent(password),
    };
    setErrors(next);
    if (next.identifier || next.password) return;

    setSubmitting(true);
    const result = await authService.login(method, identifier, password);
    setSubmitting(false);

    if (!result.ok) {
      setErrors({ form: result.error });
      return;
    }
    await session.save(result.data);
    await goToAppHome();
  };

  const handleGoogle = () => {
    Alert.alert('Coming soon', 'Google sign-in will be available in a later version.');
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Login to continue your search for the perfect rental home."
    >
      <SegmentedTabs
        value={method}
        onChange={(m) => {
          setMethod(m);
          setErrors({});
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
            setErrors((e) => ({ ...e, identifier: undefined, form: undefined }));
          }}
          error={errors.identifier}
          returnKeyType="next"
        />
      ) : (
        <Input
          label="Email Address"
          placeholder="Enter your email address"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            setErrors((e) => ({ ...e, identifier: undefined, form: undefined }));
          }}
          error={errors.identifier}
          prefix={<Ionicons name="mail-outline" size={20} color={colors.textSecondary} />}
        />
      )}

      <View>
        <PasswordInput
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            setErrors((e) => ({ ...e, password: undefined, form: undefined }));
          }}
          error={errors.password}
          onSubmitEditing={handleLogin}
          returnKeyType="done"
        />
        <Pressable
          onPress={() => router.push('/forgot-password')}
          style={styles.forgot}
          hitSlop={8}
          accessibilityRole="link"
        >
          <AppText variant="bodyBold" color="primary">
            Forgot Password?
          </AppText>
        </Pressable>
      </View>

      <FormError message={errors.form} />

      <Button
        title="Login"
        onPress={handleLogin}
        loading={submitting}
        rightIcon={<Ionicons name="arrow-forward" size={20} color={colors.white} />}
      />

      <TextDivider />

      <Button
        title="Continue with Google"
        variant="secondary"
        onPress={handleGoogle}
        leftIcon={<Ionicons name="logo-google" size={20} color="#4285F4" />}
      />

      <AppText align="center" color="textSecondary">
        Don’t have an account?{' '}
        <AppText
          variant="bodyBold"
          color="primary"
          onPress={() => router.push('/register')}
          accessibilityRole="link"
        >
          Register
        </AppText>
      </AppText>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  forgot: { alignSelf: 'flex-end', marginTop: spacing.md },
});