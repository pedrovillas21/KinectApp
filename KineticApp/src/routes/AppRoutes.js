import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { AuthContext } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import CustomDrawerContent from '../components/CustomDrawerContent';

// Telas de Auth
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';
import VerifyCodeScreen from '../screens/Auth/VerifyCodeScreen';
import ResetPasswordScreen from '../screens/Auth/ResetPasswordScreen';

// Tela de Onboarding
import OnboardingScreen from '../screens/Onboarding/OnboardingScreen';

// Telas Main
import HomeScreen from '../screens/HomeScreen';
import WorkoutScreen from '../screens/WorkoutScreen';
import StatsScreen from '../screens/StatsScreen';
import SocialScreen from '../screens/SocialScreen';
import GearScreen from '../screens/GearScreen';
import ActiveSessionScreen from '../screens/ActiveSessionScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

function TabNavigator() {
  const { isDarkMode } = useContext(ThemeContext);
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDarkMode ? '#131313' : '#FFF',
          borderTopColor: isDarkMode ? '#333' : '#E0E0E0',
        },
        tabBarActiveTintColor: '#00E5FF',
        tabBarInactiveTintColor: '#888',
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Train" component={WorkoutScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
      <Tab.Screen name="Social" component={SocialScreen} />
      <Tab.Screen name="Profile" component={GearScreen} />
    </Tab.Navigator>
  );
}

function DrawerNavigator() {
  return (
    <Drawer.Navigator 
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{ headerShown: false, drawerStyle: { backgroundColor: '#1A1A1A' } }}
    >
      <Drawer.Screen name="MainTabs" component={TabNavigator} />
    </Drawer.Navigator>
  );
}

export default function AppRoutes() {
  const { isLoggedIn, hasOnboarded } = useContext(AuthContext);

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
      <Stack.Screen name="Drawer" component={DrawerNavigator} />
      <Stack.Screen name="ActiveSession" component={ActiveSessionScreen} />
    </Stack.Navigator>
  );
}
