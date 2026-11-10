import { Image, View } from "react-native";
import { initials } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Text } from "./Text";

/** Initials on the panel's quiet brand tint, or the person's photo. */
export function Avatar({
  name,
  uri,
  size = 40,
  online,
  className,
}: {
  name: string | null | undefined;
  uri?: string | null;
  size?: number;
  online?: boolean;
  className?: string;
}) {
  return (
    <View className={cn("relative", className)} style={{ width: size, height: size }}>
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
      ) : (
        <View className="items-center justify-center bg-brand/10" style={{ width: size, height: size, borderRadius: size / 2 }}>
          <Text className="font-semibold text-brand" style={{ fontSize: size * 0.36, lineHeight: size * 0.46 }}>
            {initials(name)}
          </Text>
        </View>
      )}
      {online !== undefined && (
        <View
          className={cn("absolute bottom-0 right-0 rounded-full border-2 border-card", online ? "bg-success" : "bg-muted-foreground/40")}
          style={{ width: Math.max(11, size * 0.28), height: Math.max(11, size * 0.28) }}
        />
      )}
    </View>
  );
}
