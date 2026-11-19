import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { AppState, LogBox } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { OfflineBar, TabBarGate, ToastLayer } from "@/components/rhinon/shell";
import { PortalHost, TwProvider } from "@/components/rn";
import { getSession, onSession, restoreSession } from "@/lib/api";
import { DEMO } from "@/lib/demo";
import { blankLive, clearLive, installLive, syncAll } from "@/lib/live";
import { FONT_FILES } from "@/theme/fonts";
import { ThemeProvider, useTheme } from "@/theme/ThemeProvider";
import { useWorkspaceTheme } from "@/theme/useWorkspaceTheme";

SplashScreen.preventAutoHideAsync().catch(() => {});

// Suppress non-fatal warnings that clutter the log
LogBox.ignoreLogs(["expo-notifications", "RCTBridge"]);

// Prevent Hermes from killing the app on unhandled JS errors in release mode.
// iOS/JSC is lenient; Android/Hermes is not — every uncaught throw is fatal.
const _global = global as any;
if (_global.ErrorUtils) {
  const prev = _global.ErrorUtils.getGlobalHandler?.();
  _global.ErrorUtils.setGlobalHandler((err: Error, isFatal?: boolean) => {
    if (!isFatal) prev?.(err, isFatal);
    // For fatal errors just log — don't let Hermes terminate the process
    console.error("[GlobalError]", err?.message ?? err);
  });
}

// Catch any unhandled promise rejections (Hermes surfaces these as fatal)
if (typeof _global.HermesInternal !== "undefined") {
  const origHandler = _global.onunhandledrejection;
  _global.onunhandledrejection = (event: any) => {
    console.error("[UnhandledRejection]", event?.reason);
    origHandler?.(event);
  };
}

function Shell() {
  const t = useTheme();
  const router = useRouter();
  const segments = useSegments();
  const [, bump] = useState(0);
  useWorkspaceTheme();
  useEffect(() => onSession(() => bump((n) => n + 1)), []);
  const signedIn = DEMO || !!getSession();
  useEffect(() => {
    if (DEMO) return;
    if (!signedIn) { clearLive(); blankLive(); return; }
    installLive();
    blankLive();
    void syncAll().catch(() => {});
    // Every sync is ~40 requests against a single-threaded API, so the background refresh is
    // every two minutes and only while the app is in the foreground. Opening the app and
    // pulling to refresh still sync straight away.
    const timer = setInterval(() => {
      if (AppState.currentState === "active") void syncAll().catch(() => {});
    }, 120_000);
    const sub = AppState.addEventListener("change", (s) => { if (s === "active") void syncAll().catch(() => {}); });
    return () => { clearInterval(timer); sub.remove(); };
  }, [signedIn]);
  const onLogin = segments[0] === "login";
  useEffect(() => {
    if (DEMO) return;
    if (!signedIn && !onLogin) router.replace("/login" as never);
    else if (signedIn && onLogin) router.replace("/" as never);
  }, [signedIn, onLogin, router]);
  return (
    <TwProvider>
      <StatusBar style={t.dark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.c.paper } }} />
      <TabBarGate />
      <OfflineBar />
      <PortalHost />
      <ToastLayer />
    </TwProvider>
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
