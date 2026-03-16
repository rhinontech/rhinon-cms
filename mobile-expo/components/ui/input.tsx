import { Text, TextInput, type TextInputProps, View } from "react-native";
import { cn } from "@/lib/cn";

export function Input({
  label,
  className,
  inputClassName,
  ...props
}: TextInputProps & {
  label?: string;
  className?: string;
  inputClassName?: string;
}) {
  return (
    <View className={cn("gap-2", className)}>
      {label ? (
        <Text className="pl-1 text-[11px] font-black uppercase tracking-[2.5px] text-rhinon-muted">{label}</Text>
      ) : null}
      <TextInput
        placeholderTextColor="#7D8BA7"
        className={cn(
          "min-h-14 rounded-[22px] border border-rhinon-border bg-rhinon-surface px-4 text-base text-rhinon-text",
          inputClassName
        )}
        {...props}
      />
    </View>
  );
}
