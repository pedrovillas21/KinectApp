import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Svg, { Circle, Path, Polyline } from 'react-native-svg';

const T = {
  primary:    '#00E5FF',
  primaryDim: 'rgba(0,229,255,0.10)',
  primarySoft:'rgba(0,229,255,0.20)',
  text3:      'rgba(245,246,247,0.36)',
};

const GRADIENT_COLORS    = ['rgba(19,19,19,0)', 'rgba(19,19,19,0.96)', '#131313'] as const;
const GRADIENT_LOCATIONS: [number, number, number] = [0, 0.28, 1];

type IconName = 'home' | 'train' | 'stats' | 'social' | 'profile';

const ROUTE_META: Record<string, { label: string; icon: IconName }> = {
  Home:    { label: 'Home',    icon: 'home'    },
  Train:   { label: 'Treinar', icon: 'train'   },
  Stats:   { label: 'Stats',   icon: 'stats'   },
  Social:  { label: 'Social',  icon: 'social'  },
  Profile: { label: 'Perfil',  icon: 'profile' },
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
          <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" {...common} />
          <Polyline points="9 22 9 12 15 12 15 22" {...common} />
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
          <Path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" {...common} />
          <Circle cx="9" cy="7" r="4" {...common} />
          <Path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" {...common} />
        </Svg>
      );
    case 'profile':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" {...common} />
          <Circle cx="12" cy="7" r="4" {...common} />
        </Svg>
      );
  }
}

export default function BottomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 26) }]}
    >
      {/* blur + gradient de fundo */}
      <BlurView style={StyleSheet.absoluteFill} intensity={10} tint="dark" pointerEvents="none" />
      <LinearGradient
        colors={GRADIENT_COLORS}
        locations={GRADIENT_LOCATIONS}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const meta     = ROUTE_META[route.name] ?? { label: route.name, icon: 'home' as IconName };
          const isFocused = state.index === index;
          const color     = isFocused ? T.primary : T.text3;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
          };

          const onLongPress = () => navigation.emit({ type: 'tabLongPress', target: route.key });

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
                  isFocused && { backgroundColor: T.primaryDim, borderColor: T.primarySoft },
                ]}
              >
                <TabIcon name={meta.icon} color={color} />
              </View>
              <Text style={[styles.label, { color, fontWeight: isFocused ? '700' : '500' }]} numberOfLines={1}>
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
    left: 0, right: 0, bottom: 0,
    paddingTop: 0,
    backgroundColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    gap: 3,
  },
  iconWrap: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.3,
  },
});
