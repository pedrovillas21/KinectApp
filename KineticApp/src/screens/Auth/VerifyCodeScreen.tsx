import React, { useContext } from 'react';
import {
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ThemeContext } from '../../contexts/ThemeContext';
import { COLORS } from '../../theme/colors';
import HeaderLogo from '../../components/HeaderLogo';
import CustomInput from '../../components/CustomInput';
import PrimaryButton from '../../components/PrimaryButton';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function VerifyCodeScreen({ navigation }: Props) {
  const { isDarkMode } = useContext(ThemeContext);

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? COLORS.darkBackground : COLORS.lightBackground },
      ]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        <HeaderLogo showBack />

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text
            style={[
              styles.title,
              { color: isDarkMode ? COLORS.textPrimaryDark : COLORS.textPrimaryLight },
            ]}
          >
            Verifique seu E-mail
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: isDarkMode ? COLORS.textSecondaryDark : COLORS.textSecondaryLight },
            ]}
          >
            Enviamos um código de 6 dígitos para recuperar sua conta.
          </Text>

          <CustomInput label="CÓDIGO DE VERIFICAÇÃO" placeholder="000000" />

          <PrimaryButton
            title="VERIFICAR"
            onPress={() => navigation.navigate('ResetPassword')}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 24 },
  content: { flexGrow: 1, justifyContent: 'center', paddingBottom: 40 },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 40,
  },
});
