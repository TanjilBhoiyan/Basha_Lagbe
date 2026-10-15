import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { apiImage } from '@/services/apiClient';
import { colors } from '@/theme';

/** "Md. Rahman" -> "R", "Nasrin Akter" -> "NA" */
export function initials(name: string) {
  return name
    .replace(/^(Md\.|Mr\.|Mrs\.)\s*/i, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

/** Profile photo (or initials when there is none) with a green tick when the person is verified. */
export function OwnerAvatar({
  name,
  verified,
  photo,
  size = 56,
}: {
  name: string;
  verified: boolean;
  /** Profile photo URL from the API ("/static/..." or https). */
  photo?: string | null;
  size?: number;
}) {
  const badge = Math.round(size * 0.36);
  const circle = { width: size, height: size, borderRadius: size / 2 };
  return (
    <View>
      {photo ? (
        <Image source={apiImage(photo)} style={[styles.photo, circle]} accessibilityLabel={`${name}'s photo`} />
      ) : (
        <View style={[styles.avatar, circle]}>
          <AppText style={[styles.initials, { fontSize: size * 0.36 }]}>{initials(name)}</AppText>
        </View>
      )}
      {verified ? (
        <View style={[styles.badge, { width: badge, height: badge, borderRadius: badge / 2 }]}>
          <Ionicons name="checkmark" size={badge * 0.6} color={colors.white} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  photo: { backgroundColor: colors.surface },
  initials: { fontWeight: '800', color: colors.primaryDeep },
  badge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});