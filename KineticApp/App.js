import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { AuthProvider } from './src/contexts/AuthContext';
import AppRoutes from './src/routes/AppRoutes';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NavigationContainer>
          <AppRoutes />
        </NavigationContainer>
      </AuthProvider>
    </ThemeProvider>
  );
}
