import { forwardRef } from 'react';
import { StyleSheet, View, type TextInput } from 'react-native';

import { AppText, Input, type InputProps } from '@/components/ui';
import { colors, spacing } from '@/theme';

type Props = Omit<InputProps, 'prefix' | 'keyboardType'>;

/** Bangladeshi phone field with a fixed +880 country code. */
export const PhoneInput = forwardRef<TextInput, Props>(function PhoneInput(props, ref) {
  return (
    <Input
      ref={ref}
      placeholder="1XXX XXX XXX"
      keyboardType="phone-pad"
      maxLength={11}
      autoComplete="tel"
      textContentType="telephoneNumber"
      {...props}
      prefix={
        <View style={styles.prefix}>
          <AppText style={styles.flag}>🇧🇩</AppText>
          <AppText color="text">+880</AppText>
          <View style={styles.separator} />
        </View>
      }
    />
  );
});

const styles = StyleSheet.create({
  prefix: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flag: { fontSize: 20 },
  separator: { width: 1, height: 24, backgroundColor: colors.border, marginLeft: spacing.xs },
});