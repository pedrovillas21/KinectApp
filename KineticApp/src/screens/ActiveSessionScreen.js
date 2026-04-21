import React, { useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import { COLORS } from '../theme/colors';

export default function ActiveSessionScreen({ navigation }) {
  const { isDarkMode } = useContext(ThemeContext);
  const isDark = isDarkMode;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? COLORS.darkBackground : COLORS.lightBackground }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{color: COLORS.neonBlue, fontSize: 24}}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: isDark ? COLORS.textPrimaryDark : COLORS.textPrimaryLight }]}>Sessão Ativa</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.content}>
        <Text style={{color: '#888', textAlign: 'center'}}>Tela de Sessão Ativa em construção.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
