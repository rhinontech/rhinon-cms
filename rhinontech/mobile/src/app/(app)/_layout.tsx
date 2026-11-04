import { Stack } from "expo-router";
import { useTheme } from "@/lib/theme";

export default function AppLayout() {
  const { colors } = useTheme();
  // Every screen draws its own coloured header.
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />;
}
