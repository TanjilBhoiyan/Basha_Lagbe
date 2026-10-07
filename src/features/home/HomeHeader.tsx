import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { APP_CONFIG } from '@/config/app';
import { colors, radius, spacing } from '@/theme';

type Props = {
  locationText: string;
  onLocationPress: () => void;
  onNotificationsPress: () => void;
  hasUnreadNotifications?: boolean;
};

export function HomeHeader({
  locationText,
  onLocationPress,
  onNotificationsPress,
  hasUnreadNotifications,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.brand}>
          <Image source={require('../../../assets/images/logo.png')} style={styles.logo} />
          <AppText style={styles.name}>{APP_CONFIG.name}</AppText>
        </View>
        <Pressable
          onPress={onNotificationsPress}
          hitSlop={10}
          style={styles.bell}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <Ionicons name="notifications" size={24} color={colors.primaryDeep} />
          {hasUnreadNotifications ? <View style={styles.dot} /> : null}
        </Pressable>
      </View>

      <Pressable
        onPress={onLocationPress}
        style={styles.location}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={`Current location ${locationText}. Change location`}
      >
        <Ionicons name="location" size={18} color={colors.primary} />
        <AppText variant="bodyBold">{locationText}</AppText>
        <Ionicons name="chevron-down" size={18} color={colors.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logo: { width: 34, height: 32, resizeMode: 'contain' },
  name: { fontSize: 22, lineHeight: 28, fontWeight: '800', color: colors.primaryDeep },
  bell: { padding: spacing.xs },
  dot: {
    position: 'absolute',
    top: 4,
    right: 5,
    width: 9,
    height: 9,
    borderRadius: radius.full,
    backgroundColor: colors.danger,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  location: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: 'flex-start' },
});