import { Text, View } from "react-native";

export function ScreenHeader({
  eyebrow,
  title,
  subtitle,
  right,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <View className="flex-row items-start justify-between gap-4">
      <View className="flex-1 gap-2">
        {eyebrow ? (
          <Text className="text-[11px] font-black uppercase tracking-[3.5px] text-cyan-300">{eyebrow}</Text>
        ) : null}
        <Text className="text-[32px] font-black leading-9 text-rhinon-text">{title}</Text>
        {subtitle ? <Text className="text-sm leading-6 text-rhinon-muted">{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}
