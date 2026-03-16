import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import "@/global.css";
import { LoadingState } from "@/components/ui/loading-state";
import { AppProvider } from "@/providers/app-provider";
import { useAuth } from "@/providers/auth-provider";

export default function RootLayout() {
  return (
    <AppProvider>
      <RootNavigator />
    </AppProvider>
  );
}

function RootNavigator() {
  const router = useRouter();
  const segments = useSegments();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";
    if (!user && !inAuthGroup) {
      router.replace("/(auth)/login");
      return;
    }

    if (user && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [loading, router, segments, user]);

  if (loading) {
    return <LoadingState label="Booting Rhinon Mobile..." />;
  }

  return (
    <ThemeProvider
      value={{
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: "#060A12",
          card: "#101826",
          border: "#1D2A3E",
          text: "#F5F7FB",
          primary: "#22D3EE",
          notification: "#F43F5E",
        },
      }}
    >
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#0C1320" },
          headerTintColor: "#F5F7FB",
          headerShadowVisible: false,
          headerTitleStyle: {
            fontWeight: "800",
            fontSize: 16,
          },
          contentStyle: { backgroundColor: "#060A12" },
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="leads/[id]" options={{ title: "Lead Intel" }} />
        <Stack.Screen name="campaigns/new" options={{ title: "New Campaign" }} />
        <Stack.Screen name="campaigns/[id]" options={{ title: "Campaign Engine" }} />
        <Stack.Screen name="content/templates/new" options={{ title: "New Template" }} />
        <Stack.Screen name="content/templates/[id]" options={{ title: "Edit Template" }} />
        <Stack.Screen name="content/library/new" options={{ title: "New Asset" }} />
        <Stack.Screen name="content/library/[id]" options={{ title: "Edit Asset" }} />
        <Stack.Screen name="inbox/[id]" options={{ title: "Conversation" }} />
        <Stack.Screen name="more/index" options={{ title: "Profile" }} />
        <Stack.Screen name="more/team" options={{ title: "Team & Access" }} />
        <Stack.Screen name="more/settings" options={{ title: "Settings" }} />
      </Stack>
    </ThemeProvider>
  );
}
