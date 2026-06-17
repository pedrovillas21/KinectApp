import React, { useContext } from 'react';
import { View, Switch, StyleSheet } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import Icon from './Icon';

export default function ThemeToggle() {
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);

  return (
    <View style={styles.container}>
      <View style={styles.label}>
        <Icon name={isDarkMode ? 'moon' : 'sun'} size={18} color={isDarkMode ? '#FFF' : '#333'} />
      </View>
      <Switch
        value={isDarkMode}
        onValueChange={toggleTheme}
        trackColor={{ false: '#767577', true: '#00E5FF' }}
        thumbColor={isDarkMode ? '#fff' : '#f4f3f4'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    marginRight: 8,
    fontSize: 16,
  },
});
