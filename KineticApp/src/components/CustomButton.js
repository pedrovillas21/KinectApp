import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';

export default function CustomButton({ onPress, title, isLoading, isDarkMode }) {
  return (
    <TouchableOpacity 
      style={[
        styles.button, 
        isDarkMode ? styles.buttonDark : styles.buttonLight
      ]} 
      onPress={onPress}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator color={isDarkMode ? "#000" : "#FFF"} />
      ) : (
        <Text style={[
          styles.text, 
          isDarkMode ? styles.textDark : styles.textLight
        ]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  buttonDark: {
    backgroundColor: '#00E5FF', // Neon Blue
  },
  buttonLight: {
    backgroundColor: '#131313',
  },
  text: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  textDark: {
    color: '#000',
  },
  textLight: {
    color: '#FFF',
  }
});
