import { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { Appearance, Platform } from "react-native";
import { colorScheme } from "nativewind";

export type SchemePreference = "system" | "light" | "dark";
const KEY = "rhinon.colorScheme";

async function read(): Promise<SchemePreference> {
  try {
    const v = Platform.OS === "web" ? globalThis.localStorage?.getItem(KEY) : await SecureStore.getItemAsync(KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

/**
 * On web, NativeWind's "system" removes the `dark` class instead of following the
 * OS, so the CSS variables stay light. Resolve it to the OS value there; native
 * follows the system on its own.
 */
function apply(pref: SchemePreference) {
  if (Platform.OS === "web" && pref === "system") {
    colorScheme.set(Appearance.getColorScheme() === "dark" ? "dark" : "light");
  } else {
    colorScheme.set(pref);
  }
}

export async function saveSchemePreference(pref: SchemePreference) {
  apply(pref);
  try {
    if (Platform.OS === "web") globalThis.localStorage?.setItem(KEY, pref);
    else await SecureStore.setItemAsync(KEY, pref);
  } catch {
    /* preference just won't persist */
  }
}

export async function loadSchemePreference(): Promise<SchemePreference> {
  return read();
}

/** Applies the saved light/dark/system choice before first paint. */
export function usePersistedColorScheme(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    void read().then((pref) => {
      apply(pref);
      setReady(true);
    });
    if (Platform.OS !== "web") return;
    const sub = Appearance.addChangeListener(() => void read().then((pref) => pref === "system" && apply(pref)));
    return () => sub.remove();
  }, []);
  return ready;
}
