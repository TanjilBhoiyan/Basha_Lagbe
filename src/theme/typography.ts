import type { TextStyle } from 'react-native';

export const typography = {
  h1: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  h2: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  h3: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  bodyBold: { fontSize: 15, lineHeight: 22, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  small: { fontSize: 11, lineHeight: 14, fontWeight: '500' },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;