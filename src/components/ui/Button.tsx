import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radius, spacing } from '@/theme';
import { AppText } from './AppText';

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger';

type ButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  title,
  variant = 'primary',
  loading = false,
  disabled,
  fullWidth = true,
  style,
  ...rest
}: ButtonProps) {
  // Block taps while loading to prevent double submission.
  const isDisabled = disabled || loading;
  const v = VARIANTS[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: v.bg, borderColor: v.border },
        fullWidth && styles.fullWidth,
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={v.text} />
      ) : (
        <AppText variant="bodyBold" style={{ color: v.text }}>
          {title}
        </AppText>
      )}
    </Pressable>
  );
}

const VARIANTS: Record<ButtonVariant, { bg: string; border: string; text: string }> = {
  primary: { bg: colors.primary, border: colors.primary, text: colors.white },
  outline: { bg: colors.white, border: colors.primary, text: colors.primary },
  ghost: { bg: 'transparent', border: 'transparent', text: colors.primary },
  danger: { bg: colors.danger, border: colors.danger, text: colors.white },
};

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { alignSelf: 'stretch' },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
});