import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ThemeContext } from '../contexts/ThemeContext';
import { COLORS } from '../theme/colors';
import ThemeToggle from './ThemeToggle';

interface Props {
  showBack?: boolean;
  title?: string;
}

export default function HeaderLogo({ showBack, title }: Props) {
  const { isDarkMode } = useContext(ThemeContext);
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.leftGroup}>
        {showBack && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={[styles.backIcon, { color: COLORS.neonBlue }]}>{'<-'}</Text>
          </TouchableOpacity>
        )}
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
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  backIcon: {
    fontSize: 20,
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
  },
});
