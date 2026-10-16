import { forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, spacing } from '@/theme';

import type { AppMapHandle, AppMapProps } from './mapTypes';

/** Web build only: Google Maps (react-native-maps) runs on phones, so the browser shows a note instead. */
export const AppMap = forwardRef<AppMapHandle, AppMapProps>(function AppMap(_props, ref) {
  useImperativeHandle(ref, () => ({ flyTo: () => {} }));

  return (
    <View style={styles.container}>
      <AppText color="textSecondary" align="center">
        The map is available in the Basa Lagbe app.
      </AppText>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.primaryLight,
  },
});