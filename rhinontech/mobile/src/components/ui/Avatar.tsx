import { Image, View } from "react-native";
import { initials } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Text } from "./Text";

// Stable per-name tint so the same person always gets the same colour.
const TINTS = ["#6366F1", "#0EA5E9", "#10B981", "#F59E0B", "#EC4899", "#8B5CF6", "#14B8A6", "#F97316"];
function tintFor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return TINTS[Math.abs(h) % TINTS.length];
}

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
  const tint = tintFor(name || "?");
  return (
    <View className={cn("relative", className)} style={{ width: size, height: size }}>
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
      ) : (
        <View
          className="items-center justify-center"
          style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: `${tint}22` }}
        >
          <Text className="font-semibold" style={{ color: tint, fontSize: size * 0.36 }}>
            {initials(name)}
          </Text>
        </View>
      )}
      {online !== undefined && (
        <View
          className={cn("absolute bottom-0 right-0 rounded-full border-2 border-background", online ? "bg-success" : "bg-muted-foreground/40")}
          style={{ width: size * 0.3, height: size * 0.3 }}
        />
      )}
    </View>
  );
}
