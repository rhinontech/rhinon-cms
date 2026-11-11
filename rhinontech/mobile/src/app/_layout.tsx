import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";

import { clearLive, blankLive, installLive, syncAll } from "@/data/live";
import { getSession, onSession, restoreSession } from "@/lib/api";
import { AppState } from "react-native";
import { useWorkspaceTheme } from "@/theme/useWorkspaceTheme";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { FONT_FILES } from "@/theme/fonts";
import { ThemeProvider, useTheme } from "@/theme/ThemeProvider";
import { ToastLayer } from "@/ui";

SplashScreen.preventAutoHideAsync().catch(() => {});

function Shell() {
  const t = useTheme();
  const router = useRouter();
  const segments = useSegments();
  const [, bump] = useState(0);
  useWorkspaceTheme();
  useEffect(() => onSession(() => bump((n) => n + 1)), []);
  const signedIn = !!getSession();
  useEffect(() => {
    if (!signedIn) { clearLive(); return; }
    installLive();
    blankLive();
    void syncAll();
    const timer = setInterval(() => void syncAll(), 45_000);
    const sub = AppState.addEventListener("change", (s) => { if (s === "active") void syncAll(); });
    return () => { clearInterval(timer); sub.remove(); };
  }, [signedIn]);
  const onLogin = segments[0] === "login";
  useEffect(() => {
    if (!signedIn && !onLogin) router.replace("/login" as never);
    else if (signedIn && onLogin) router.replace("/" as never);
  }, [signedIn, onLogin, router]);
  return (
    <>
      <StatusBar style={t.dark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.c.paper } }} />
      <ToastLayer />
    </>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts(FONT_FILES);
  const [ready, setReady] = useState(false);
  useEffect(() => { restoreSession().finally(() => setReady(true)); }, []);
  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync().catch(() => {});
  }, [loaded, error]);
  if ((!loaded && !error) || !ready) return null;
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Shell />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
