import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
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

/** Initials avatar with a green tick when the owner is verified. (Photo later.) */
export function OwnerAvatar({
  name,
  verified,
  size = 56,
}: {
  name: string;
  verified: boolean;
  size?: number;
}) {
  const badge = Math.round(size * 0.36);
  return (
    <View>
      <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
        <AppText style={[styles.initials, { fontSize: size * 0.36 }]}>{initials(name)}</AppText>
      </View>
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