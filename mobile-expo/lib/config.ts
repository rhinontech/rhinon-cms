import Constants from "expo-constants";

// For local development, 'localhost' often fails on physical devices.
// We try to get the debugger host or use a fallback.
const getBaseUrl = () => {
  const debuggerHost = Constants.expoConfig?.hostUri;
  const localhost = debuggerHost ? debuggerHost.split(":")[0] : "localhost";

  return (
    process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || `http://${localhost}:3000`
  );
};

export const API_BASE_URL = getBaseUrl();
