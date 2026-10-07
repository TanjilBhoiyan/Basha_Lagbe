import { useRef } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

type Props = {
  length: number;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  autoFocus?: boolean;
};

/**
 * One hidden TextInput drives the visible boxes. This keeps paste and
 * SMS autofill working, which separate inputs per digit tend to break.
 */
export function OtpInput({ length, value, onChange, error, autoFocus = true }: Props) {
  const inputRef = useRef<TextInput>(null);

  return (
    <Pressable onPress={() => inputRef.current?.focus()} accessibilityLabel="Enter verification code">
      <View style={styles.row}>
        {Array.from({ length }, (_, i) => {
          const digit = value[i];
          const isActive = i === Math.min(value.length, length - 1);
          return (
            <View
              key={i}
              style={[
                styles.box,
                isActive && styles.boxActive,
                !!digit && styles.boxFilled,
                error && styles.boxError,
              ]}
            >
              <AppText style={[styles.digit, !digit && styles.placeholder]}>{digit ?? '–'}</AppText>
            </View>
          );
        })}
      </View>

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) => onChange(text.replace(/\D/g, '').slice(0, length))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={length}
        autoFocus={autoFocus}
        caretHidden
        style={styles.hiddenInput}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  box: {
    flex: 1,
    aspectRatio: 0.85,
    maxWidth: 56,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  boxActive: { borderColor: colors.primary },
  boxFilled: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  boxError: { borderColor: colors.danger, backgroundColor: colors.dangerLight },
  digit: { fontSize: 22, fontWeight: '700', color: colors.text },
  placeholder: { color: colors.textMuted, fontWeight: '400' },
  hiddenInput: { position: 'absolute', opacity: 0, width: 1, height: 1 },
});