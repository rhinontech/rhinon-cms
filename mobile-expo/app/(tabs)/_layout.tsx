import { Tabs, router } from "expo-router";
import { Pressable, View } from "react-native";
import { Inbox, LayoutDashboard, Menu, Rocket, Sparkles, Users } from "lucide-react-native";

export default function TabLayout() {
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
          left: 16,
          right: 16,
          bottom: 16,
          height: 78,
          paddingTop: 10,
          paddingBottom: 10,
          paddingHorizontal: 6,
          borderTopWidth: 0,
          backgroundColor: "transparent",
          borderRadius: 28,
          shadowColor: "#020617",
          shadowOpacity: 0.35,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 14 },
          elevation: 16,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "800",
          letterSpacing: 0.8,
        },
        tabBarBackground: () => (
          <View
            style={{
              flex: 1,
              borderRadius: 28,
              borderWidth: 1,
              borderColor: "#182335",
              backgroundColor: "#0C1320",
            }}
          />
        ),
        headerRight: () => (
          <Pressable
            onPress={() => router.push("/more")}
            style={{
              marginRight: 18,
              height: 40,
              width: 40,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#111A2C",
              borderWidth: 1,
              borderColor: "#1D2A3E",
            }}
          >
            <Menu color="#F5F7FB" size={20} />
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => <LayoutDashboard color={color} size={20} />,
        }}
      />
      <Tabs.Screen
        name="leads"
        options={{
          title: "Leads",
          tabBarIcon: ({ color }) => <Users color={color} size={20} />,
        }}
      />
      <Tabs.Screen
        name="campaigns"
        options={{
          title: "Campaigns",
          tabBarIcon: ({ color }) => <Rocket color={color} size={20} />,
        }}
      />
      <Tabs.Screen
        name="content"
        options={{
          title: "Content",
          tabBarIcon: ({ color }) => <Sparkles color={color} size={20} />,
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: "Inbox",
          tabBarIcon: ({ color }) => <Inbox color={color} size={20} />,
        }}
      />
    </Tabs>
  );
}
