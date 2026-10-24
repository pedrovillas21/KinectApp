import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONT, KINETIC } from '../theme/kinetic';
import Icon, { IconName } from './Icon';
import Text from './ui/Text';

const ROUTE_META: Record<string, { label: string; icon: IconName }> = {
  Home: { label: 'Início', icon: 'home' },
  Train: { label: 'Treinos', icon: 'dumbbell' },
  Social: { label: 'Comunidade', icon: 'users' },
  Stats: { label: 'Progresso', icon: 'progress' },
  Profile: { label: 'Você', icon: 'user' },
};

/**
 * Barra de abas de borda a borda, fundo sólido e linha fina no topo. Fica no
 * fluxo do layout (não é absoluta), então as telas não precisam de espaçador.
 */
export default function BottomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {state.routes.map((route, index) => {
        const meta = ROUTE_META[route.name] ?? { label: route.name, icon: 'home' as IconName };
        const isFocused = state.index === index;
        const color = isFocused ? KINETIC.primary : KINETIC.textMuted;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
        };
        const onLongPress = () => navigation.emit({ type: 'tabLongPress', target: route.key });
        const { options } = descriptors[route.key];

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel={options.tabBarAccessibilityLabel ?? meta.label}
            onPress={onPress}
            onLongPress={onLongPress}
            android_ripple={{ color: 'rgba(255,255,255,0.06)', borderless: true }}
            style={styles.tab}
          >
            <Icon name={meta.icon} size={22} color={color} strokeWidth={1.7} />
            <Text style={styles.label} color={color} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
              {meta.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: KINETIC.bg,
    borderTopWidth: 1,
    borderTopColor: KINETIC.hairline,
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  label: {
    fontFamily: FONT.medium,
    fontSize: 10.5,
    lineHeight: 13,
  },
});
