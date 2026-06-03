import 'react-native-gesture-handler';
import React, { useContext, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { AuthProvider, AuthContext } from './src/contexts/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppRoutes from './src/routes/AppRoutes';

// Keep the native splash visible until the auth bootstrap completes.
SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { isLoadingAuth } = useContext(AuthContext);

  useEffect(() => {
    if (!isLoadingAuth) {
      SplashScreen.hideAsync();
    }
  }, [isLoadingAuth]);

  return (
    <NavigationContainer>
      <AppRoutes />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
