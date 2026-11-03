import { forwardRef, useState } from "react";
import { TextInput, View, type TextInputProps } from "react-native";
import { cn } from "@/lib/cn";
import { useTheme } from "@/lib/theme";
import { Text } from "./Text";

export const Input = forwardRef<React.ComponentRef<typeof TextInput>, TextInputProps & { label?: string; icon?: React.ReactNode; className?: string }>(
  function Input({ label, icon, className, onFocus, onBlur, ...props }, ref) {
    const { colors } = useTheme();
    const [focused, setFocused] = useState(false);
    return (
      <View className={cn("gap-1.5", className)}>
        {label && <Text variant="label">{label}</Text>}
        <View
          className={cn(
            "h-12 flex-row items-center gap-2.5 rounded-xl border bg-card px-3.5",
            focused ? "border-foreground/40" : "border-border"
          )}
        >
          {icon}
          <TextInput
            ref={ref}
            placeholderTextColor={colors.mutedForeground}
            className="flex-1 font-sans text-[15px] text-foreground"
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            {...props}
          />
        </View>
      </View>
    );
  }
);
