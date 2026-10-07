import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Button, Input } from '@/components/ui';
import { APP_CONFIG } from '@/config/app';
import { colors, SCREEN_PADDING, spacing } from '@/theme';

/**
 * Temporary UI-kit preview to verify the theme on the emulator.
 * Will be replaced by the splash/onboarding flow in the next step.
 */
export default function UiPreviewScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const phoneError = phone.length > 0 && !/^1[3-9]\d{8}$/.test(phone)
    ? 'Enter a valid number, e.g. 1712345678'
    : undefined;

  const handleSubmit = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1500);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <AppText variant="h1" color="primary">{APP_CONFIG.name}</AppText>
        <AppText color="textSecondary">{APP_CONFIG.tagline}</AppText>

        <View style={styles.section}>
          <AppText variant="h3">Typography</AppText>
          <AppText variant="h2">Heading 2</AppText>
          <AppText variant="body">Body text — 3 Bedroom Apartment, Mirpur 10</AppText>
          <AppText variant="bodyBold" color="primary">
            {APP_CONFIG.currency.symbol}25,000/month
          </AppText>
          <AppText variant="caption" color="textSecondary">Caption text</AppText>
        </View>

        <View style={styles.section}>
          <AppText variant="h3">Input</AppText>
          <Input
            label="Phone Number"
            placeholder="1XXXXXXXXX"
            keyboardType="phone-pad"
            maxLength={10}
            value={phone}
            onChangeText={setPhone}
            error={phoneError}
            prefix={<AppText color="textSecondary">+880</AppText>}
          />
        </View>

        <View style={styles.section}>
          <AppText variant="h3">Buttons</AppText>
          <Button title="Primary Button" loading={loading} onPress={handleSubmit} />
          <Button title="Outline Button" variant="outline" />
          <Button title="Ghost Button" variant="ghost" />
          <Button title="Disabled Button" disabled />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: SCREEN_PADDING, gap: spacing.sm },
  section: { marginTop: spacing.xl, gap: spacing.md },
});