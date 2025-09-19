import * as React from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View, ActivityIndicator } from 'react-native';

import { Color, FontFamily, FontSize, StyleVariable } from '../GlobalStyles';
import { useAuth } from '../contexts/auth';

const LoginScreen = () => {
  const { login, statusMessage, isInitializing } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleLogin = React.useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await login();
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, login]);

  const disabled = isSubmitting || isInitializing;

  return (
    <ImageBackground
      source={require('../assets/PageShellBg.png')}
      resizeMode="cover"
      style={styles.background}
    >
      <View style={styles.overlay}>
        <View style={styles.header}>
          <Text style={styles.logoText}>SPAR</Text>
          <Text style={styles.subtitle}>Socratic Pupil Ask &amp; Reflect</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.title}>ようこそ！</Text>
          <Text style={styles.description}>
            Google アカウントでサインインして、チャットを開始してください。
          </Text>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.loginButton,
              disabled ? styles.loginButtonDisabled : null,
              pressed && !disabled ? styles.loginButtonPressed : null,
            ]}
            onPress={handleLogin}
            disabled={disabled}
          >
            {disabled ? (
              <ActivityIndicator color={Color.colorWhite} />
            ) : (
              <Text style={styles.loginLabel}>Google でログイン</Text>
            )}
          </Pressable>
          {statusMessage ? <Text style={styles.status}>{statusMessage}</Text> : null}
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 48,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
  },
  header: {
    alignItems: 'center',
  },
  logoText: {
    fontSize: 48,
    color: Color.colorBrandPrimary,
    fontFamily: FontFamily.roundedMplus1c,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    color: Color.colorTextSecondary,
    marginTop: 8,
  },
  card: {
    width: '100%',
    borderRadius: StyleVariable.radiusLg,
    backgroundColor: Color.colorSurfaceGlass,
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: FontFamily.roundedMplus1c,
    color: Color.colorTextPrimary,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: Color.colorTextSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  loginButton: {
    borderRadius: StyleVariable.radiusMd,
    backgroundColor: Color.colorBrandPrimary,
    paddingVertical: 14,
    alignItems: 'center',
  },
  loginButtonPressed: {
    opacity: 0.85,
  },
  loginButtonDisabled: {
    backgroundColor: Color.colorDimgray,
  },
  loginLabel: {
    fontSize: FontSize.size_18,
    color: Color.colorWhite,
    fontFamily: FontFamily.notoSansJPRegular,
    fontWeight: '600',
  },
  status: {
    fontSize: 12,
    color: Color.colorDimgray,
    textAlign: 'center',
  },
});

export default LoginScreen;
