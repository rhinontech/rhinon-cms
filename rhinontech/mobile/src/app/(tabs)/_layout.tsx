import { Tabs } from "expo-router";

/** The tab bar itself is drawn once by the root layout (components/rhinon/shell.tsx), like the prototype's shell. */
export default function TabsLayout() {
  return (
    <Tabs tabBar={() => null} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="work" />
      <Tabs.Screen name="inbox" />
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="more" />
    </Tabs>
  );
}
