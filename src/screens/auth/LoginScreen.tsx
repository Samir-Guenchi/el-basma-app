import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useAuthStore } from '@/store';
import { LanguageSwitcher } from '@/components';
import { isRTL, getTextAlign } from '@/utils/rtl';

const loginSchema = Yup.object().shape({
  email: Yup.string().email('validation.invalidEmail').required('validation.required'),
  password: Yup.string().min(6, 'validation.minLength').required('validation.required'),
});

export const LoginScreen: React.FC = () => {
  const { t } = useTranslation();
  const { login, isLoading, error, clearError } = useAuthStore();
  const rtl = isRTL();

  const handleLogin = async (values: { email: string; password: string }) => {
    try {
      await login(values.email, values.password);
    } catch (err) {
      Alert.alert(t('common.error'), t('auth.invalidCredentials'));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <LanguageSwitcher compact />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{t('common.appName')}</Text>
        <Text style={styles.subtitle}>{t('auth.login')}</Text>

        <Formik
          initialValues={{ email: '', password: '' }}
          validationSchema={loginSchema}
          onSubmit={handleLogin}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { textAlign: getTextAlign() }]}>
                  {t('auth.email')}
                </Text>
                <TextInput
                  style={[styles.input, { textAlign: getTextAlign() }]}
                  placeholder={t('auth.email')}
                  value={values.email}
                  onChangeText={handleChange('email')}
                  onBlur={handleBlur('email')}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel={t('auth.email')}
                />
                {touched.email && errors.email && (
                  <Text style={styles.errorText}>{t(errors.email, { min: 6 })}</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { textAlign: getTextAlign() }]}>
                  {t('auth.password')}
                </Text>
                <TextInput
                  style={[styles.input, { textAlign: getTextAlign() }]}
                  placeholder={t('auth.password')}
                  value={values.password}
                  onChangeText={handleChange('password')}
                  onBlur={handleBlur('password')}
                  secureTextEntry
                  accessibilityLabel={t('auth.password')}
                />
                {touched.password && errors.password && (
                  <Text style={styles.errorText}>{t(errors.password, { min: 6 })}</Text>
                )}
              </View>

              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>{t('auth.forgotPassword')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                onPress={() => handleSubmit()}
                disabled={isLoading}
                accessibilityRole="button"
                accessibilityLabel={t('auth.login')}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.loginButtonText}>{t('auth.login')}</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </Formik>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    paddingTop: 48,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#E91E63',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 48,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#F5F5F5',
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#E91E63',
    fontSize: 14,
  },
  loginButton: {
    height: 52,
    backgroundColor: '#E91E63',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
