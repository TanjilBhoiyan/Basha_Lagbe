import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, ComingSoon } from '@/components/ui';
import { locationService } from '@/services/locationService';
import { onboardingStorage } from '@/services/onboardingStorage';
import { session } from '@/services/session';
import { spacing } from '@/theme';
import type { User } from '@/types/auth';

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    session.getUser().then(setUser);
  }, []);

  const logout = async () => {
    await session.clear();
    router.replace('/login');
  };

  /** Developer helper: wipes all local state so every flow can be tested again. */
  const resetAll = async () => {
    await Promise.all([session.clear(), onboardingStorage.reset(), locationService.clear()]);
    router.replace('/');
  };

  return (
    <ComingSoon
      icon="person-outline"
      title={user ? user.fullName : 'Profile'}
      message={user ? `+880${user.phone} · ${user.email}` : 'Profile details coming soon.'}
    >
      <View style={styles.actions}>
        <Button title="My Visit Requests" variant="secondary" onPress={() => router.push('/visits')} />
        <Button title="Logout" variant="outline" onPress={logout} />
        <Button title="Reset everything (dev)" variant="danger" onPress={resetAll} />
        <AppText variant="caption" color="textMuted" align="center">
          Full profile screen comes later.
        </AppText>
      </View>
    </ComingSoon>
  );
}

const styles = StyleSheet.create({
  actions: { alignSelf: 'stretch', gap: spacing.md, marginTop: spacing.lg },
});