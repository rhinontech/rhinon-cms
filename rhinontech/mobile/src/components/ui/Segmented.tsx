import { Pressable, View } from "react-native";
import { cn } from "@/lib/cn";
import { tap } from "@/lib/haptics";
import { Text } from "./Text";

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View className="flex-row rounded-xl bg-muted p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => {
              if (!active) tap();
              onChange(o.value);
            }}
            className={cn("flex-1 items-center rounded-lg py-2", active && "bg-card")}
            style={active ? { shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } } : undefined}
          >
            <Text className={cn("font-medium text-[13px]", active ? "text-foreground" : "text-muted-foreground")}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Horizontally scrolling filter chips. */
export function Chips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => {
              tap();
              onChange(o.value);
            }}
            className={cn("rounded-full border px-3.5 py-1.5", active ? "border-primary bg-primary" : "border-border bg-card")}
          >
            <Text className={cn("font-medium text-[13px]", active ? "text-primary-foreground" : "text-foreground")}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
