import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { AuthContext } from '../contexts/AuthContext';
import usePendingInviteRedeem from '../hooks/usePendingInviteRedeem';
import BottomTabBar from '../components/BottomTabBar';

import WelcomeScreen from '../screens/Auth/WelcomeScreen';
import RecurringUserScreen from '../screens/Auth/RecurringUserScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';
import VerifyCodeScreen from '../screens/Auth/VerifyCodeScreen';
import ResetPasswordScreen from '../screens/Auth/ResetPasswordScreen';
import ConfirmEmailScreen from '../screens/Auth/ConfirmEmailScreen';
import PhoneRequiredScreen from '../screens/Auth/PhoneRequiredScreen';
import TermsRequiredScreen from '../screens/Auth/TermsRequiredScreen';

import OnboardingScreen from '../screens/Onboarding/OnboardingScreen';

import HomeScreen from '../screens/HomeScreen';
import WorkoutScreen from '../screens/WorkoutScreen';
import StatsScreen from '../screens/StatsScreen';
import SocialScreen from '../screens/SocialScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ActiveSessionScreen from '../screens/ActiveSessionScreen';
import WorkoutCameraScreen from '../screens/WorkoutCameraScreen';
import NewWorkoutPostScreen from '../screens/NewWorkoutPostScreen';
import ProfilePostsScreen from '../screens/ProfilePostsScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import CompareProgressScreen from '../screens/CompareProgressScreen';
import SettingsScreen from '../screens/SettingsScreen';
import TrainerProfileScreen from '../screens/TrainerProfileScreen';
import ProtocolScreen from '../screens/ProtocolScreen';
import AnamnesisScreen from '../screens/AnamnesisScreen';
import type { MainStackParamList, MainTabParamList } from '../navigation/types';

const Stack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator<MainStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs(): React.ReactElement {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <BottomTabBar {...props} />}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Train" component={WorkoutScreen} />
      <Tab.Screen name="Social" component={SocialScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppRoutes(): React.ReactElement | null {
  const { isLoggedIn, hasOnboarded, isLoadingAuth, rememberedUser, justLoggedOut, currentUser } =
    useContext(AuthContext);
  usePendingInviteRedeem(isLoggedIn ? currentUser?.email ?? null : null);

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
        <Stack.Screen name="ConfirmEmail" component={ConfirmEmailScreen} />
      </Stack.Navigator>
    );
  }

  // Aceite dos Termos/Política (versão vigente) antes de qualquer outra coisa: conta criada
  // pelo personal/empresa ou termos atualizados. O backend também barra a API até o aceite.
  if (currentUser?.termsAccepted === false) {
    return (
      <Stack.Navigator key="terms-stack" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="TermsRequired" component={TermsRequiredScreen} />
      </Stack.Navigator>
    );
  }

  // Celular virou obrigatório (atalho de WhatsApp com o personal): conta antiga sem ele
  // não passa daqui até cadastrar.
  if (!currentUser?.phone) {
    return (
      <Stack.Navigator key="phone-stack" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="PhoneRequired" component={PhoneRequiredScreen} />
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
    <MainStack.Navigator key="main-stack" screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="MainTabs" component={MainTabs} />
      {/* gestureEnabled: false — no native-stack o swipe-back do iOS completa nativamente
          antes do beforeRemove conseguir bloquear; sem isso o usuário sai da sessão
          arrastando pro lado e pula a confirmação/salvamento parcial do treino. */}
      <MainStack.Screen
        name="ActiveSession"
        component={ActiveSessionScreen}
        options={{ gestureEnabled: false }}
      />
      <MainStack.Screen
        name="WorkoutCamera"
        component={WorkoutCameraScreen}
        options={{ animation: 'fade', statusBarHidden: true }}
      />
      <MainStack.Screen name="NewWorkoutPost" component={NewWorkoutPostScreen} />
      <MainStack.Screen name="UserProfile" component={UserProfileScreen} />
      <MainStack.Screen name="CompareProgress" component={CompareProgressScreen} />
      <MainStack.Screen name="Settings" component={SettingsScreen} />
      <MainStack.Screen name="Protocol" component={ProtocolScreen} />
      <MainStack.Screen name="Anamnesis" component={AnamnesisScreen} />
      <MainStack.Screen name="TrainerProfile" component={TrainerProfileScreen} />
      <MainStack.Screen name="ProfilePosts" component={ProfilePostsScreen} />
    </MainStack.Navigator>
  );
}
