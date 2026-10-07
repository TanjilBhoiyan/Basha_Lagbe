import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';
import { AppText } from './AppText';

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  /** Optional link after the label, e.g. "Terms & Privacy Policy". */
  linkText?: string;
  onLinkPress?: () => void;
  error?: string;
};

export function Checkbox({ checked, onChange, label, linkText, onLinkPress, error }: Props) {
  return (
    <View>
      <View style={styles.row}>
        {/* The link is a separate touch target, so tapping it never toggles the box. */}
        <Pressable
          onPress={() => onChange(!checked)}
          style={styles.toggle}
          accessibilityRole="checkbox"
          accessibilityState={{ checked }}
          accessibilityLabel={linkText ? `${label} ${linkText}` : label}
          hitSlop={6}
        >
          <View style={[styles.box, checked && styles.boxChecked, !!error && styles.boxError]}>
            {checked ? <Ionicons name="checkmark" size={16} color={colors.white} /> : null}
          </View>
          <AppText>{label}</AppText>
        </Pressable>
        {linkText ? (
          <Pressable onPress={onLinkPress} hitSlop={6} accessibilityRole="link">
            <AppText variant="bodyBold" color="primary">
              {linkText}
            </AppText>
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <AppText variant="caption" color="danger" style={styles.error}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.xs },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  box: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  boxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  boxError: { borderColor: colors.danger },
  error: { marginTop: spacing.xs },
});