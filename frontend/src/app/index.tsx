import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppText } from '@/components/ui';
import { APP_CONFIG } from '@/config/app';
import { goToAppHome } from '@/services/navigation';
import { onboardingStorage } from '@/services/onboardingStorage';
import { session } from '@/services/session';
import { colors, spacing } from '@/theme';

const SPLASH_DURATION_MS = 2200;
const CITY_ASPECT_RATIO = 1080 / 855;

export default function SplashScreen() {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const { width, height } = useWindowDimensions();

  // Full-width illustration, capped so the brand block always has room on short screens.
  const cityHeight = Math.min(width / CITY_ASPECT_RATIO, height * 0.5);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();

    // Read stored state while the splash is showing, then route.
    const stateReady = Promise.all([session.getUser(), onboardingStorage.isComplete()]);
    let cancelled = false;
    const timer = setTimeout(async () => {
      const [user, onboardingDone] = await stateReady;
      if (cancelled) return;
      if (user) {
        await goToAppHome();
      } else {
        router.replace(onboardingDone ? '/login' : '/onboarding');
      }
    }, SPLASH_DURATION_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [opacity, scale]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.brand, { opacity, transform: [{ scale }] }]}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
        <AppText style={styles.title} align="center" accessibilityRole="header">
          {APP_CONFIG.name}
        </AppText>
        <AppText variant="h3" color="textSecondary" align="center" style={styles.tagline}>
          {APP_CONFIG.tagline}
        </AppText>
      </Animated.View>

      <Image
        source={require('../../assets/images/splash-city.jpg')}
        style={{ width, height: cityHeight }}
        resizeMode="cover"
        accessible={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundMint,
  },
  brand: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxl,
  },
  logo: {
    width: 110,
    height: 103,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 38,
    lineHeight: 46,
    fontWeight: '800',
    color: colors.primaryDeep,
  },
  tagline: {
    marginTop: spacing.sm,
    fontWeight: '400',
    maxWidth: 260,
  },
});