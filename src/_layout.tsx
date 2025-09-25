import AntsomiRnSDK from "@antsomicorp/antsomirnsdk";
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  ThemeProvider,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { Linking, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useColorScheme } from "@/hooks/useColorScheme";
import { Home, Order, Profile } from "./pages";

const Stack = createNativeStackNavigator();

const linking = {
  prefixes: ["pone://"],
  config: {
    screens: {
      home: "home",
      order: "order/:id",
      profile: "profile",
    },
  },
};

const getAntsomiConfig = () => {
  const portalId = "564892334";
  const propsId = Platform.OS === "ios" ? "565035995" : "565035994";
  const appId = "3b3944df-6a35-40a4-9238-87c24df62f8c";
  const appGroupId = `group.${appId}.antsomi`;
  AntsomiRnSDK.config(portalId, propsId, appId, appGroupId);
  AntsomiRnSDK.requestNotificationPermission();

  AntsomiRnSDK.onPendingLink((link: string) => {
    console.log("Link from Antsomi", link);
    setTimeout(() => {
      Linking.openURL(link).catch((err) => {
        console.error("Failed to open URL: ", err);
      });
    }, 500);
  });

  AntsomiRnSDK.onOpenedNotification((notification) => {
    console.log("Notification from Antsomi", notification);
  });
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  getAntsomiConfig();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <GestureHandlerRootView>
        <SafeAreaProvider>
          <NavigationContainer linking={linking}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="home" component={Home} />
              <Stack.Screen name="order" component={Order} />
              <Stack.Screen name="profile" component={Profile} />
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
      </GestureHandlerRootView>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
