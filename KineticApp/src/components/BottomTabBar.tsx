import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

const T = {
  bg: '#0a0d10',
  text: '#f5f6f7',
  text2: 'rgba(245,246,247,0.62)',
  accent: '#1ee0ee',
  accentDim: 'rgba(30,224,238,0.10)',
  accentSoft: 'rgba(30,224,238,0.16)',
};

type IconName = 'home' | 'train' | 'stats' | 'social' | 'profile';

const ROUTE_META: Record<string, { label: string; icon: IconName }> = {
  Home: { label: 'Início', icon: 'home' },
  Train: { label: 'Treinar', icon: 'train' },
  Stats: { label: 'Stats', icon: 'stats' },
  Social: { label: 'Social', icon: 'social' },
  Profile: { label: 'Perfil', icon: 'profile' },
};

function TabIcon({ name, color }: { name: IconName; color: string }) {
  const size = 22;
  const common = {
    fill: 'none' as const,
    stroke: color,
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (name) {
    case 'home':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M3.5 11 12 4l8.5 7V20a1 1 0 0 1-1 1h-4v-6h-7v6h-4a1 1 0 0 1-1-1v-9Z" {...common} />
        </Svg>
      );
    case 'train':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M6 4v16M18 4v16M3 8h3M3 16h3M18 8h3M18 16h3M6 12h12" {...common} />
        </Svg>
      );
    case 'stats':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M3 20h18M6 20V10M11 20V4M16 20v-7M21 20V8" {...common} />
        </Svg>
      );
    case 'social':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx="9" cy="8" r="3" {...common} />
          <Path d="M3 20c0-3 3-5 6-5s6 2 6 5" {...common} />
          <Circle cx="17" cy="9" r="2.5" {...common} />
          <Path d="M14 20c0-2.5 2-4 3-4s4 1.5 4 4" {...common} />
        </Svg>
      );
    case 'profile':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx="12" cy="9" r="3.5" {...common} />
          <Path d="M5 20c0-4 3-6 7-6s7 2 7 6" {...common} />
        </Svg>
      );
  }
}

export default function BottomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.wrapper, { bottom: insets.bottom + 8 }]}
    >
      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const meta =
            ROUTE_META[route.name] ?? { label: route.name, icon: 'home' as IconName };
          const isFocused = state.index === index;
          const color = isFocused ? T.accent : T.text2;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };

          const { options } = descriptors[route.key];

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? meta.label}
              onPress={onPress}
              onLongPress={onLongPress}
              android_ripple={{ color: 'rgba(255,255,255,0.06)', borderless: true }}
              style={styles.tab}
            >
              <View
                style={[
                  styles.iconWrap,
                  isFocused && {
                    backgroundColor: T.accentDim,
                    borderColor: T.accentSoft,
                  },
                ]}
              >
                <TabIcon name={meta.icon} color={color} />
              </View>
              <Text
                style={[styles.label, { color }]}
                numberOfLines={1}
              >
                {meta.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 12,
    right: 12,
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 4,
    backgroundColor: T.bg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    gap: 4,
  },
  iconWrap: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
});
