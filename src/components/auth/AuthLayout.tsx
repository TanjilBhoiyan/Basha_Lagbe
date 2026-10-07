import type { ReactNode } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandHeader } from '@/components/brand/BrandHeader';
import { AppText } from '@/components/ui';
import { colors, radius, SCREEN_PADDING, spacing } from '@/theme';

const HERO_ASPECT = 1080 / 720;

type Props = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

/**
 * Shared layout for Login / Register / Forgot Password:
 * brand header + title over the living-room image, then a white form card.
 */
export function AuthLayout({ title, subtitle, children }: Props) {
  const { width } = useWindowDimensions();
  const heroImageWidth = width * 0.68;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <Image
              source={require('../../../assets/images/login-hero.jpg')}
              style={[
                styles.heroImage,
                { width: heroImageWidth, height: heroImageWidth / HERO_ASPECT },
              ]}
              resizeMode="cover"
              accessible={false}
            />
            <BrandHeader />
            <View style={styles.heroText}>
              <AppText style={styles.title} accessibilityRole="header">
                {title}
              </AppText>
              <AppText color="textSecondary" style={styles.subtitle}>
                {subtitle}
              </AppText>
            </View>
          </View>

          <View style={styles.card}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundMint },
  flex: { flex: 1 },
  scroll: { flexGrow: 1 },
  hero: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl + spacing.lg,
    minHeight: 250,
  },
  heroImage: { position: 'absolute', right: 0, bottom: spacing.md },
  heroText: { marginTop: spacing.xxl, maxWidth: '62%', gap: spacing.sm },
  title: { fontSize: 30, lineHeight: 36, fontWeight: '800', color: colors.primaryDeep },
  subtitle: { fontSize: 15, lineHeight: 22 },
  card: {
    flex: 1,
    marginTop: -spacing.xl,
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl + 4,
    borderTopRightRadius: radius.xl + 4,
    paddingHorizontal: SCREEN_PADDING + 4,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
});