import "../global.css";

import { useEffect } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  useFonts,
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
} from "@expo-google-fonts/geist";
import { AuthProvider, useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { usePersistedColorScheme } from "@/lib/colorScheme";

void SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { status } = useAuth();
  const { colors, isDark } = useTheme();

  useEffect(() => {
    if (status !== "loading") void SplashScreen.hideAsync();
  }, [status]);

  if (status === "loading") return null;

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Protected guard={status === "signedIn"}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={status !== "signedIn"}>
          <Stack.Screen name="login" options={{ animation: "fade" }} />
        </Stack.Protected>
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Geist_400Regular, Geist_500Medium, Geist_600SemiBold, Geist_700Bold });
  const schemeReady = usePersistedColorScheme();

  if (!fontsLoaded || !schemeReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
