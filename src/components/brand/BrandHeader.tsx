import { Image, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { APP_CONFIG } from '@/config/app';
import { colors, spacing } from '@/theme';

/** Small logo + app name, used at the top of onboarding and auth screens. */
export function BrandHeader() {
  return (
    <View style={styles.row} accessible accessibilityLabel={APP_CONFIG.name}>
      <Image
        source={require('../../../assets/images/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <View>
        <AppText style={styles.name}>{APP_CONFIG.name}</AppText>
        <AppText variant="caption" color="textSecondary">
          {APP_CONFIG.shortTagline}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logo: { width: 40, height: 37 },
  name: { fontSize: 20, lineHeight: 24, fontWeight: '800', color: colors.primaryDeep },
});