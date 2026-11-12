import { Platform } from "react-native";

/**
 * Web only: opening any URL with ?demo=1 runs the app on the built-in sample data with no sign-in,
 * for design review and screenshots. Native builds never enter this mode.
 */
export const DEMO =
  Platform.OS === "web" && typeof location !== "undefined" && new URLSearchParams(location.search).has("demo");
