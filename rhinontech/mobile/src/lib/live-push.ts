/**
 * Push notification registration for Expo.
 *
 * Requires a development build (not Expo Go) and either an APNs key (iOS)
 * or FCM credentials (Android) configured in app.json / EAS secrets.
 *
 * Usage: call registerPush() after a successful login; call unregisterPush()
 * before clearing the session on logout.
 */
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { api } from "./api";

// Show alerts, play sound and set badge while the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

let registeredToken: string | null = null;

/** Request permission and register the Expo push token with the backend. No-op in Expo Go or on simulators. */
export async function registerPush(): Promise<void> {
  if (!Device.isDevice) return; // simulators can't receive push
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    const { status } =
      existing === "granted"
        ? { status: existing }
        : await Notifications.requestPermissionsAsync();
    if (status !== "granted") return;

    const { data: token } = await Notifications.getExpoPushTokenAsync();
    if (!token || token === registeredToken) return;

    await api("/notifications/device-token", {
      method: "POST",
      body: { token, platform: Platform.OS },
    });
    registeredToken = token;
  } catch (err: any) {
    // Non-fatal: the app still works without push
    console.warn("[Push] registration failed:", err.message);
  }
}

/** Remove the token from the backend so this device stops receiving pushes after logout. */
export async function unregisterPush(): Promise<void> {
  if (!registeredToken) return;
  try {
    await api("/notifications/device-token", {
      method: "DELETE",
      body: { token: registeredToken },
    });
  } catch {
    // best-effort
  } finally {
    registeredToken = null;
  }
}
