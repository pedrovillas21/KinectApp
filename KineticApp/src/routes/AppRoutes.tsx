import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { AuthContext } from '../contexts/AuthContext';
import BottomTabBar from '../components/BottomTabBar';

import WelcomeScreen from '../screens/Auth/WelcomeScreen';
import RecurringUserScreen from '../screens/Auth/RecurringUserScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';
import VerifyCodeScreen from '../screens/Auth/VerifyCodeScreen';
import ResetPasswordScreen from '../screens/Auth/ResetPasswordScreen';

import OnboardingScreen from '../screens/Onboarding/OnboardingScreen';

import HomeScreen from '../screens/HomeScreen';
import WorkoutScreen from '../screens/WorkoutScreen';
import StatsScreen from '../screens/StatsScreen';
import SocialScreen from '../screens/SocialScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ActiveSessionScreen from '../screens/ActiveSessionScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs(): React.ReactElement {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <BottomTabBar {...props} />}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Train" component={WorkoutScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
      <Tab.Screen name="Social" component={SocialScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppRoutes(): React.ReactElement | null {
  const { isLoggedIn, hasOnboarded, isLoadingAuth, rememberedUser, justLoggedOut } =
    useContext(AuthContext);

  if (isLoadingAuth) {
    return null;
  }

  if (!isLoggedIn) {
    // Logout explícito → Login direto. App reaberto com sessão lembrada → card RecurringUser.
    // Primeiro acesso (sem lembrado, sem logout) → Welcome.
    const initialAuthRoute = justLoggedOut
      ? 'Login'
      : rememberedUser
      ? 'RecurringUser'
      : 'Welcome';
    return (
      // key distinta dos outros navigators: garante remontagem ao alternar logado/deslogado,
      // sem isso o React reconcilia a mesma instância de Stack.Navigator e o initialRouteName
      // (avaliado só na 1ª montagem) nunca reflete o estado atual de auth.
      <Stack.Navigator
        key="auth-stack"
        screenOptions={{ headerShown: false }}
        initialRouteName={initialAuthRoute}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="RecurringUser" component={RecurringUserScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      </Stack.Navigator>
    );
  }

  if (!hasOnboarded) {
    return (
      <Stack.Navigator key="onboarding-stack" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator key="main-stack" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="ActiveSession" component={ActiveSessionScreen} />
    </Stack.Navigator>
  );
}
