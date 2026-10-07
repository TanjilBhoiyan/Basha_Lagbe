export const colors = {
  // Brand
  primary: '#16A34A',
  primaryDark: '#15803D',
  primaryLight: '#DCFCE7',

  // Neutrals
  background: '#FFFFFF',
  surface: '#F8FAF9',
  border: '#E5E7EB',
  text: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  white: '#FFFFFF',

  // Status
  success: '#16A34A',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  info: '#2563EB',
  infoLight: '#DBEAFE',

  // Misc
  favorite: '#EF4444',
  overlay: 'rgba(0, 0, 0, 0.4)',
} as const;

export type ColorName = keyof typeof colors;