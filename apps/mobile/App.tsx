import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import Chat from './screens/Chat';
import Home from './screens/Home';
import { ChatStoreProvider } from './contexts/chatStore';
import { AuthProvider } from './contexts/auth';
import type { RootStackParamList } from './navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

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
            </Stack.Navigator>
          </NavigationContainer>
        </ChatStoreProvider>
      </SafeAreaProvider>
    </AuthProvider>
  );
};

export default App;
