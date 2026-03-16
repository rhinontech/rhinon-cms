import { ActivityIndicator, Text, View } from "react-native";

export function LoadingState({ label = "Syncing Rhinon systems..." }: { label?: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-3 bg-rhinon-bg px-6">
      <ActivityIndicator color="#22D3EE" size="large" />
      <Text className="text-xs font-black uppercase tracking-[2px] text-cyan-300">Rhinon Mobile</Text>
      <Text className="text-sm font-semibold text-rhinon-muted">{label}</Text>
    </View>
  );
}
