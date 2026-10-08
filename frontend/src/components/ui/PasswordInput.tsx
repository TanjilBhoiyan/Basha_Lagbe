import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useState } from 'react';
import { Pressable, type TextInput } from 'react-native';

import { colors } from '@/theme';
import { Input, type InputProps } from './Input';

type Props = Omit<InputProps, 'secureTextEntry' | 'prefix' | 'suffix'>;

export const PasswordInput = forwardRef<TextInput, Props>(function PasswordInput(props, ref) {
  const [visible, setVisible] = useState(false);

  return (
    <Input
      ref={ref}
      {...props}
      secureTextEntry={!visible}
      autoCapitalize="none"
      autoCorrect={false}
      prefix={<Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />}
      suffix={
        <Pressable
          onPress={() => setVisible((v) => !v)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Hide password' : 'Show password'}
        >
          <Ionicons
            name={visible ? 'eye-outline' : 'eye-off-outline'}
            size={22}
            color={colors.textSecondary}
          />
        </Pressable>
      }
    />
  );
});