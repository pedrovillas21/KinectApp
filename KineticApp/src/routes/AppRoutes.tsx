import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { AuthContext } from '../contexts/AuthContext';
import BottomTabBar from '../components/BottomTabBar';

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
import GearScreen from '../screens/GearScreen';
import ActiveSessionScreen from '../screens/ActiveSessionScreen';

interface AuthContextShape {
  isLoggedIn: boolean;
  hasOnboarded: boolean;
  isLoadingAuth: boolean;
}

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
      <Tab.Screen name="Profile" component={GearScreen} />
    </Tab.Navigator>
  );
}

export default function AppRoutes(): React.ReactElement | null {
  const { isLoggedIn, hasOnboarded, isLoadingAuth } = useContext(
    AuthContext,
  ) as AuthContextShape;

  if (isLoadingAuth) {
    return null;
  }

  if (!isLoggedIn) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
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
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="ActiveSession" component={ActiveSessionScreen} />
    </Stack.Navigator>
  );
}
