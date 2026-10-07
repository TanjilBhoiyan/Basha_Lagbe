import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, spacing } from '@/theme';
import type { PropertyMapProps } from './mapTypes';

/** react-native-maps has no web support; this keeps the web preview from crashing. */
export function PropertyMap({ properties }: PropertyMapProps) {
  return (
    <View style={styles.container}>
      <AppText color="textSecondary" align="center">
        Map is available on the mobile app ({properties.length} properties).
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.primaryLight,
  },
});