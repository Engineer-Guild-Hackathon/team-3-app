import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ActivityIndicator, View, StyleSheet } from 'react-native';

import Chat from './screens/Chat';
import Home from './screens/Home';
import LoginScreen from './screens/Login';
import Setting from './screens/Setting';
import { ChatStoreProvider } from './contexts/chatStore';
import { SubjectStoreProvider } from './contexts/subjectStore';
import { AuthProvider, useAuth } from './contexts/auth';
import type { RootStackParamList } from './navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#2563eb" />
  </View>
);

const AppContent = () => {
  const { isInitializing, isAuthenticated } = useAuth();

  if (isInitializing) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <SubjectStoreProvider>
      <ChatStoreProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{ headerShown: false }}
          >
            <Stack.Screen
              name="Home"
              component={Home}
            />
            <Stack.Screen
              name="Chat"
              component={Chat}
            />
            <Stack.Screen
              name="Settings"
              component={Setting}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </ChatStoreProvider>
    </SubjectStoreProvider>
  );
};

const App = () => {
  const [fontsLoaded, fontError] = useFonts({
    'NotoSansJP-Regular': require('./assets/fonts/NotoSansJP-Regular.ttf'),
    'Rounded Mplus 1c': require('./assets/fonts/NotoSansJP-Regular.ttf'),
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AuthProvider>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </AuthProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
