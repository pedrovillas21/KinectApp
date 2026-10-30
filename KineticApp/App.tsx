import 'react-native-gesture-handler';
import React, { useContext, useEffect, useMemo } from 'react';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
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
import { AuthProvider, AuthContext } from './src/contexts/AuthContext';
import { TextScaleProvider, useTextScale } from './src/contexts/TextScaleContext';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppRoutes from './src/routes/AppRoutes';
import AlertHost from './src/components/ui/AlertHost';

// Keep the native splash visible until the auth bootstrap and the fonts are ready.
SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { isLoadingAuth } = useContext(AuthContext);
  const { ready: textScaleReady } = useTextScale();
  const { ready: themeReady, scheme, colors: c } = useTheme();
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
  // Preferências lidas antes de pintar: sem pulo de tamanho nem de tema.
  const fontsReady = (fontsLoaded || !!fontError) && textScaleReady && themeReady;

  // Fundo das transições de pilha igual ao das telas.
  const navTheme = useMemo(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: { ...base.colors, primary: c.primary, background: c.bg, card: c.surface1, text: c.text, border: c.hairline, notification: c.danger },
    };
  }, [scheme, c]);

  useEffect(() => {
    if (!isLoadingAuth && fontsReady) {
      SplashScreen.hideAsync();
    }
  }, [isLoadingAuth, fontsReady]);

  if (!fontsReady) return null;

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <AppRoutes />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <TextScaleProvider>
          <AuthProvider>
            <AppContent />
            <AlertHost />
          </AuthProvider>
        </TextScaleProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
