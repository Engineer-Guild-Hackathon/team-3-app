import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useFonts } from "expo-font";
import { SafeAreaProvider } from "react-native-safe-area-context";

import Chat from "./screens/Chat";
import Home from "./screens/Home";
import { ChatStoreProvider } from "./contexts/chatStore";
import type { RootStackParamList } from "./navigation/types";

const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  const [fontsLoaded, error] = useFonts({
    "NotoSansJP-Regular": require("./assets/fonts/NotoSansJP-Regular.ttf"),
  });

  if (!fontsLoaded && !error) {
    return null;
  }

  return (
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
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Chat"
              component={Chat}
              options={{ headerShown: false }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </ChatStoreProvider>
    </SafeAreaProvider>
  );
};

export default App;
