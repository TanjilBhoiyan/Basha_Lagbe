import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandHeader } from '@/components/brand/BrandHeader';
import { AppText } from '@/components/ui';
import { initials } from '@/features/property/OwnerAvatar';
import { comingSoon, confirmLogout, openSupport } from '@/features/profile/accountActions';
import { ProfileMenuItem } from '@/features/profile/ProfileMenuItem';
import { locationService } from '@/services/locationService';
import { onboardingStorage } from '@/services/onboardingStorage';
import { session } from '@/services/session';
import { colors, radius, SCREEN_PADDING, spacing } from '@/theme';
import type { User } from '@/types/auth';
import { formatBdPhone } from '@/utils/validation';

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);

  useFocusEffect(
    useCallback(() => {
      session.getUser().then(setUser);
    }, []),
  );

  /** Developer helper: wipes all local state so every flow can be tested again. */
  const resetAll = async () => {
    await Promise.all([session.clear(), onboardingStorage.reset(), locationService.clear()]);
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BrandHeader />

        <View style={styles.titleRow}>
          <Pressable
            onPress={() => router.navigate('/home')}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go to home"
          >
            <Ionicons name="arrow-back" size={26} color={colors.text} />
          </Pressable>
          <AppText style={styles.title} accessibilityRole="header">
            My Profile
          </AppText>
        </View>

        <View style={styles.card}>
          <View>
            <View style={styles.avatar}>
              <AppText style={styles.initials}>{user ? initials(user.fullName) : ''}</AppText>
            </View>
            <Pressable
              onPress={() => comingSoon('Profile photo')}
              style={styles.camera}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Change profile photo"
            >
              <Ionicons name="camera" size={16} color={colors.white} />
            </Pressable>
          </View>

          <View style={styles.info}>
            <AppText style={styles.name} numberOfLines={2}>
              {user?.fullName ?? 'Guest'}
            </AppText>
            {user ? (
              <>
                <View style={styles.line}>
                  <Ionicons name="call-outline" size={16} color={colors.textSecondary} />
                  <AppText variant="caption" color="textSecondary">
                    {formatBdPhone(user.phone)}
                  </AppText>
                </View>
                <View style={styles.line}>
                  <Ionicons name="mail-outline" size={16} color={colors.textSecondary} />
                  <AppText variant="caption" color="textSecondary" numberOfLines={1} style={styles.flex}>
                    {user.email}
                  </AppText>
                </View>
                <View style={[styles.verified, !user.phoneVerified && styles.notVerified]}>
                  <MaterialCommunityIcons
                    name={user.phoneVerified ? 'check-decagram' : 'alert-circle-outline'}
                    size={16}
                    color={user.phoneVerified ? colors.primary : colors.warning}
                  />
                  <AppText
                    variant="caption"
                    style={[styles.verifiedText, !user.phoneVerified && { color: colors.warning }]}
                  >
                    {user.phoneVerified ? 'Phone Verified' : 'Phone not verified'}
                  </AppText>
                </View>
              </>
            ) : null}
          </View>
        </View>

        <View style={styles.menu}>
          <ProfileMenuItem icon="account" label="Edit Profile" onPress={() => comingSoon('Edit profile')} />
          <ProfileMenuItem
            icon="shield-check"
            label="Identity Verification"
            badge={{ text: 'Not verified', color: colors.warning, background: colors.warningLight }}
            onPress={() => comingSoon('Identity verification (NID)')}
          />
          <ProfileMenuItem icon="home" label="My Properties" onPress={() => router.push('/dashboard')} />
          <ProfileMenuItem icon="message-text" label="Messages" onPress={() => router.navigate('/messages')} />
          <ProfileMenuItem icon="calendar-month" label="Visit Requests" onPress={() => router.push('/visits')} />
          <ProfileMenuItem icon="heart" label="Saved Properties" onPress={() => router.push('/saved')} />
          <ProfileMenuItem icon="star" label="My Reviews" onPress={() => comingSoon('Reviews')} />
          <ProfileMenuItem icon="headset" label="Help & Support" onPress={openSupport} />
          <ProfileMenuItem icon="cog" label="Settings & More" onPress={() => router.push('/settings')} />
          <ProfileMenuItem icon="logout" label="Logout" danger onPress={confirmLogout} />
        </View>

        {__DEV__ ? (
          <Pressable onPress={resetAll} style={styles.devReset} accessibilityRole="button">
            <AppText variant="caption" color="textMuted" align="center">
              Reset everything (dev only)
            </AppText>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const AVATAR = 96;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundMint },
  flex: { flex: 1 },
  content: { padding: SCREEN_PADDING, paddingBottom: spacing.xxl, gap: spacing.lg },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  title: { fontSize: 26, lineHeight: 32, fontWeight: '800', color: colors.text },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#CDE9D6',
    backgroundColor: colors.primaryLight,
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    backgroundColor: colors.white,
    borderWidth: 3,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontSize: 34, fontWeight: '800', color: colors.primaryDeep },
  camera: {
    position: 'absolute',
    right: -2,
    bottom: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryDeep,
    borderWidth: 2.5,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: 5 },
  name: { fontSize: 20, lineHeight: 26, fontWeight: '800', color: colors.text },
  line: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  verified: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: 2,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: colors.white,
  },
  notVerified: { backgroundColor: colors.warningLight },
  verifiedText: { fontWeight: '700', color: colors.primaryDeep },
  menu: { gap: spacing.sm + 2 },
  devReset: { paddingVertical: spacing.sm },
});