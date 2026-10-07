import { Stack } from 'expo-router';

import { colors } from '@/theme';

export default function AuthLayoutRoute() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.backgroundMint },
      }}
    />
  );
}