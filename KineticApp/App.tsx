import 'react-native-gesture-handler';
import React, { useContext, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
} from '@expo-google-fonts/geist';
import {
  GeistMono_400Regular,
  GeistMono_500Medium,
  GeistMono_600SemiBold,
} from '@expo-google-fonts/geist-mono';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { AuthProvider, AuthContext } from './src/contexts/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppRoutes from './src/routes/AppRoutes';
import AlertHost from './src/components/ui/AlertHost';

// Keep the native splash visible until the auth bootstrap and the fonts are ready.
SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { isLoadingAuth } = useContext(AuthContext);
  // Erro de carregamento cai no fallback do sistema em vez de travar o splash.
  const [fontsLoaded, fontError] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
    GeistMono_400Regular,
    GeistMono_500Medium,
    GeistMono_600SemiBold,
  });
  const fontsReady = fontsLoaded || !!fontError;

  useEffect(() => {
    if (!isLoadingAuth && fontsReady) {
      SplashScreen.hideAsync();
    }
  }, [isLoadingAuth, fontsReady]);

  if (!fontsReady) return null;

  return (
    <NavigationContainer>
      {/* App é dark fixo: ícones da barra de status sempre claros. */}
      <StatusBar style="light" />
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
          <AlertHost />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
