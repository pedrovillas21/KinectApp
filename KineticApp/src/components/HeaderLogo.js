import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import { COLORS } from '../theme/colors';
import ThemeToggle from './ThemeToggle';

export default function HeaderLogo({ showBack, title }) {
  const { isDarkMode } = useContext(ThemeContext);

  return (
    <View style={styles.container}>
      <View style={styles.leftGroup}>
        {showBack && <Text style={[styles.backIcon, { color: COLORS.neonBlue }]}>{'<-'}</Text>}
        <Text style={[styles.brand, { color: COLORS.neonBlue }]}>KINETIC</Text>
      </View>
      
      <View style={styles.rightGroup}>
        <ThemeToggle />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    width: '100%',
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 20,
    marginRight: 12,
    fontWeight: 'bold',
  },
  brand: {
    fontSize: 22,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 1,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  }
});
