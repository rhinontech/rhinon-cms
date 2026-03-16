import { View } from "react-native";
import { cn } from "@/lib/cn";

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <View
      style={{
        shadowColor: "#020617",
        shadowOpacity: 0.24,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
        elevation: 10,
      }}
      className={cn("rounded-[28px] border border-white/10 bg-rhinon-card/95 p-5", className)}
    >
      {children}
    </View>
  );
}
