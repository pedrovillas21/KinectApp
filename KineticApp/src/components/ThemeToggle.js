import React, { useContext } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';

export default function ThemeToggle() {
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: isDarkMode ? '#FFF' : '#333' }]}>
        {isDarkMode ? '🌙' : '☀️'}
      </Text>
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
  }
});
