import { ScrollView, Text } from "react-native";
import { Card } from "@/components/ui/card";
import { ScreenHeader } from "@/components/ui/screen-header";
import { API_BASE_URL } from "@/lib/config";

export default function SettingsScreen() {
  return (
    <ScrollView className="flex-1 bg-rhinon-bg" contentContainerStyle={{ padding: 20, gap: 16 }}>
      <ScreenHeader
        eyebrow="Settings"
        title="Environment"
        subtitle="Current mobile integration defaults and phase-one guardrails."
      />

      <Card className="gap-2">
        <Text className="text-lg font-black text-rhinon-text">Visual Theme</Text>
        <Text className="text-sm leading-6 text-rhinon-muted">
          This mobile build uses a dedicated Rhinon dark palette instead of the default Expo boilerplate styling.
        </Text>
      </Card>

      <Card className="gap-2">
        <Text className="text-lg font-black text-rhinon-text">API Base URL</Text>
        <Text className="text-sm leading-6 text-rhinon-muted">{API_BASE_URL}</Text>
        <Text className="text-xs leading-5 text-rhinon-muted">
          Use your LAN IP instead of localhost when testing on a physical device.
        </Text>
      </Card>

      <Card className="gap-2">
        <Text className="text-lg font-black text-rhinon-text">Phase 1 Scope</Text>
        <Text className="text-sm leading-6 text-rhinon-muted">
          Dashboard, leads, campaigns, templates, library assets, inbox, and team visibility are included. LinkedIn reconnect flows and Apollo discovery UI remain web-only for now.
        </Text>
      </Card>
    </ScrollView>
  );
}
