import { Tabs, useRouter } from "expo-router";
import { Platform, Pressable, View } from "react-native";
import { Inbox, LayoutDashboard, Menu, Rocket, Sparkles, Users } from "lucide-react-native";

export default function TabLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#22D3EE",
        tabBarInactiveTintColor: "#7D8BA7",
        headerStyle: { backgroundColor: "#0C1320" },
        headerTintColor: "#F5F7FB",
        headerShadowVisible: false,
        headerTitleStyle: {
          fontWeight: "800",
          fontSize: 16,
        },
        tabBarStyle: {
          position: "absolute",
          bottom: Platform.OS === "ios" ? 30 : 20,
          left: 20,
          right: 20,
          height: 66,
          backgroundColor: "#0C1320",
          borderRadius: 24,
          borderTopWidth: 0,
          paddingBottom: Platform.OS === "ios" ? 0 : 4,
          borderWidth: 1,
          borderColor: "#1D2A3E",
          shadowColor: "#000",
          shadowOpacity: 0.4,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 8 },
          elevation: 12,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "800",
          letterSpacing: 0.5,
          marginBottom: 8,
        },
        tabBarIconStyle: {
          marginTop: 8,
        },
        headerRight: () => (
          <Pressable
            onPress={() => router.push("/more")}
            style={({ pressed }) => ({
              marginRight: 18,
              height: 40,
              width: 40,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#111A2C",
              borderWidth: 1,
              borderColor: "#1D2A3E",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Menu color="#F5F7FB" size={20} />
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Hub",
          tabBarIcon: ({ color }) => <LayoutDashboard color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="leads"
        options={{
          title: "Leads",
          tabBarIcon: ({ color }) => <Users color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="campaigns"
        options={{
          title: "Launch",
          tabBarIcon: ({ color }) => <Rocket color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="content"
        options={{
          title: "Assets",
          tabBarIcon: ({ color }) => <Sparkles color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: "Inbox",
          tabBarIcon: ({ color }) => <Inbox color={color} size={22} />,
        }}
      />
    </Tabs>
  );
}
