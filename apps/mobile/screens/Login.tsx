import * as React from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View, ActivityIndicator, Image } from 'react-native';

import { Color, FontFamily, FontSize, StyleVariable } from '../GlobalStyles';
import { useAuth } from '../contexts/auth';

const LoginScreen = () => {
  const { login, isInitializing } = useAuth();
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

  const isBusy = isSubmitting || isInitializing;

  return (
    <ImageBackground
      source={require('../assets/PageShellBg.png')}
      resizeMode="cover"
      style={styles.background}
    >
      <View style={styles.overlay}>
        <View style={styles.header}>
          <Image
            source={require('../assets/SPARLogo.png')}
            style={styles.logo}
            accessibilityRole="image"
            accessibilityLabel="SPAR"
          />
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
              isBusy ? styles.loginButtonDisabled : null,
              pressed && !isBusy ? styles.loginButtonPressed : null,
            ]}
            onPress={handleLogin}
            disabled={isBusy}
          >
            {isBusy ? (
              <ActivityIndicator color={Color.colorWhite} size="small" />
            ) : (
              <View style={styles.loginContent}>
                <View style={styles.loginIconWrapper}>
                  <Image source={require('../assets/google-icon.png')} style={styles.loginIcon} />
                </View>
                <Text style={styles.loginLabel}>Google でログイン</Text>
              </View>
            )}
          </Pressable>
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
    gap: 12,
  },
  logo: {
    width: 360,
    height: 140,
    resizeMode: 'contain',
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
    fontSize: 32,
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
  loginContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loginIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Color.colorWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  loginLabel: {
    fontSize: FontSize.size_24,
    color: Color.colorWhite,
    fontFamily: FontFamily.roundedMplus1c,
    fontWeight: '600',
  },
});

export default LoginScreen;
