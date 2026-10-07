import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

type Props = Omit<TextInputProps, 'style'> & {
  /** Shows a filter button on the right. */
  onFilterPress?: () => void;
  /** Makes the whole field a button (e.g. on Home it opens the Search tab). */
  onPress?: () => void;
};

export function SearchField({ onFilterPress, onPress, ...inputProps }: Props) {
  const content = (
    <View style={styles.field}>
      <Ionicons name="search" size={22} color={colors.textSecondary} />
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        editable={!onPress}
        pointerEvents={onPress ? 'none' : 'auto'}
        returnKeyType="search"
        {...inputProps}
      />
      {onFilterPress ? (
        <>
          <View style={styles.divider} />
          <Pressable
            onPress={onFilterPress}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Filters"
          >
            <Ionicons name="options-outline" size={24} color={colors.primary} />
          </Pressable>
        </>
      ) : null}
    </View>
  );

  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} accessibilityRole="search">
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 54,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  input: { flex: 1, ...typography.body, color: colors.text, paddingVertical: spacing.sm },
  divider: { width: 1, height: 26, backgroundColor: colors.border },
});