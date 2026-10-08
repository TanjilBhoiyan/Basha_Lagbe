import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, OptionSheet } from '@/components/ui';
import { APP_CONFIG } from '@/config/app';
import { comingSoon, confirmLogout, openSupport } from '@/features/profile/accountActions';
import { SettingsGroup, SettingsRow } from '@/features/settings/SettingsRow';
import { locationService } from '@/services/locationService';
import { colors, SCREEN_PADDING, spacing } from '@/theme';
import { locationLabel } from '@/types/location';

type Language = 'en' | 'bn';

const LANGUAGES = [
  { value: 'en' as Language, label: 'English' },
  { value: 'bn' as Language, label: 'বাংলা (Bangla)' },
];

export default function SettingsScreen() {
  const [location, setLocation] = useState<string | undefined>();
  const [languageOpen, setLanguageOpen] = useState(false);

  // Refresh after coming back from the Select Location screen.
  useFocusEffect(
    useCallback(() => {
      locationService.getSelected().then((l) => setLocation(l ? locationLabel(l) : 'Not set'));
    }, []),
  );

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/profile'));

  const version = Constants.expoConfig?.version ?? '1.0.0';

  const showAbout = () =>
    Alert.alert(APP_CONFIG.name, `${APP_CONFIG.tagline}\n\nVersion ${version}`);

  const shareApp = () =>
    Share.share({
      // TODO: add the Play Store link once the app is published.
      message: `I'm using ${APP_CONFIG.name} to find rental homes in Bangladesh. ${APP_CONFIG.tagline}!`,
    });

  const selectLanguage = (lang: Language) => {
    if (lang === 'bn') comingSoon('Bangla language');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={goBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </Pressable>
        <AppText style={styles.title} accessibilityRole="header">
          Settings & More
        </AppText>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SettingsGroup>
          <SettingsRow icon="bell-outline" label="Notifications" onPress={() => comingSoon('Notification settings')} />
          <SettingsRow icon="web" label="Language" value="English" divider onPress={() => setLanguageOpen(true)} />
          <SettingsRow
            icon="map-marker"
            label="Location"
            value={location}
            divider
            onPress={() => router.push('/select-location')}
          />
          <SettingsRow
            icon="shield-check-outline"
            label="Privacy & Security"
            divider
            onPress={() => comingSoon('Privacy & security settings')}
          />
        </SettingsGroup>

        <SettingsGroup>
          <SettingsRow icon="help-circle-outline" label="Help & Support" onPress={openSupport} />
          <SettingsRow icon="information-outline" label={`About ${APP_CONFIG.name}`} divider onPress={showAbout} />
        </SettingsGroup>

        <SettingsGroup>
          <SettingsRow
            icon="file-document-outline"
            label="Terms & Conditions"
            onPress={() => comingSoon('Terms & Conditions')}
          />
          <SettingsRow
            icon="shield-outline"
            label="Privacy Policy"
            divider
            onPress={() => comingSoon('Privacy Policy')}
          />
          <SettingsRow icon="share-variant" label="Share App" divider onPress={shareApp} />
        </SettingsGroup>

        <SettingsGroup danger>
          <SettingsRow icon="logout" label="Logout" danger onPress={confirmLogout} />
        </SettingsGroup>

        <AppText variant="caption" color="textMuted" align="center">
          {APP_CONFIG.name} v{version}
        </AppText>
      </ScrollView>

      <OptionSheet
        visible={languageOpen}
        title="Language"
        options={LANGUAGES}
        value="en"
        onSelect={selectLanguage}
        onClose={() => setLanguageOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundMint },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: SCREEN_PADDING,
    paddingVertical: spacing.md,
  },
  title: { flex: 1, fontSize: 26, lineHeight: 32, fontWeight: '800', color: colors.text },
  content: { paddingHorizontal: SCREEN_PADDING, paddingBottom: spacing.xxl, gap: spacing.lg },
});