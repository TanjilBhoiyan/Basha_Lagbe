import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { FiltersProvider } from '@/features/filters/FiltersContext';
import { colors } from '@/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <FiltersProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="filters" options={{ animation: 'slide_from_bottom' }} />
        </Stack>
      </FiltersProvider>
    </SafeAreaProvider>
  );
}