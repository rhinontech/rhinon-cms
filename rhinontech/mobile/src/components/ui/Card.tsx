import { Pressable, View, type ViewProps } from "react-native";
import { cn } from "@/lib/cn";
import { tap } from "@/lib/haptics";

export function Card({ className, ...props }: ViewProps & { className?: string }) {
  return (
    <View
      className={cn("rounded-2xl border border-border bg-card", className)}
      style={{ shadowColor: "#0B0C10", shadowOpacity: 0.04, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }}
      {...props}
    />
  );
}

export function PressableCard({
  className,
  onPress,
  children,
}: {
  className?: string;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      className={cn("rounded-2xl border border-border bg-card active:opacity-80", className)}
    >
      {children}
    </Pressable>
  );
}
