import { Ionicons } from '@expo/vector-icons';
import type { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

export type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

type IconName = ComponentProps<typeof Ionicons>['name'];

const TAB_CONFIG: Record<string, { label: string; icon: IconName; activeIcon: IconName }> = {
  home: { label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  search: { label: 'Search', icon: 'search-outline', activeIcon: 'search' },
  post: { label: 'Post', icon: 'add', activeIcon: 'add' },
  messages: { label: 'Messages', icon: 'chatbox-ellipses-outline', activeIcon: 'chatbox-ellipses' },
  profile: { label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
};

type Props = TabBarProps & {
  /** Route names that should show a red dot (e.g. unread messages). */
  badges?: string[];
};

export function TabBar({ state, navigation, badges = [] }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {state.routes.map((route, index) => {
        const config = TAB_CONFIG[route.name];
        if (!config) return null;
        const focused = state.index === index;
        const isPost = route.name === 'post';
        const color = focused ? colors.primary : colors.textSecondary;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={styles.item}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={config.label}
          >
            {isPost ? (
              <View style={styles.postButton}>
                <Ionicons name="add" size={28} color={colors.white} />
              </View>
            ) : (
              <View>
                <Ionicons name={focused ? config.activeIcon : config.icon} size={24} color={color} />
                {badges.includes(route.name) ? <View style={styles.badge} /> : null}
              </View>
            )}
            <AppText variant="small" style={[styles.label, { color }]}>
              {config.label}
            </AppText>
            {focused && !isPost ? <View style={styles.indicator} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 2 },
  label: { fontSize: 12, fontWeight: '600' },
  postButton: {
    width: 46,
    height: 46,
    borderRadius: radius.full,
    backgroundColor: colors.primaryDeep,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -spacing.lg,
    borderWidth: 3,
    borderColor: colors.white,
  },
  badge: {
    position: 'absolute',
    top: -1,
    right: -3,
    width: 9,
    height: 9,
    borderRadius: radius.full,
    backgroundColor: colors.danger,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  indicator: {
    width: 28,
    height: 3,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    marginTop: 2,
  },
});