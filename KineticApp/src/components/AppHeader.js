import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { ThemeContext } from '../contexts/ThemeContext';
import { COLORS } from '../theme/colors';

/**
 * Header fixo global para todas as telas do App (pós-login).
 * Dark Mode fixo — sol/lua decorativo (toggle desabilitado por ora).
 */
export default function AppHeader() {
  const navigation = useNavigation();
  // isDarkMode sempre true enquanto light mode não for implementado
  const { isDarkMode } = useContext(ThemeContext);

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  return (
    <View style={styles.wrapper}>
      {/* Hamburguer menu */}
      <TouchableOpacity
        style={styles.menuBtn}
        onPress={openDrawer}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <View style={styles.bar} />
        <View style={[styles.bar, styles.barMid]} />
        <View style={styles.bar} />
      </TouchableOpacity>

      {/* Logo centralizada */}
      <Text style={styles.brand}>KINETIC</Text>

      {/* Ícone sol/lua — decorativo, toggle desativado */}
      <View style={styles.themeBtn}>
        <Text style={styles.themeIcon}>{isDarkMode ? '🌙' : '☀️'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 12,
    paddingBottom: 14,
    backgroundColor: COLORS.darkBackground,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
  },
  menuBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    gap: 5,
  },
  bar: {
    height: 2,
    width: 22,
    backgroundColor: COLORS.neonBlue,
    borderRadius: 2,
  },
  barMid: {
    width: 14,
  },
  brand: {
    color: COLORS.neonBlue,
    fontSize: 22,
    fontStyle: 'italic',
    fontWeight: '900',
    letterSpacing: 2,
  },
  themeBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeIcon: {
    fontSize: 20,
  },
});
