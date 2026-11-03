import { TextInput, View } from "react-native";
import { Search } from "lucide-react-native";
import { useTheme } from "@/lib/theme";

export function SearchBar({ value, onChangeText, placeholder = "Search" }: { value: string; onChangeText: (v: string) => void; placeholder?: string }) {
  const { colors } = useTheme();
  return (
    <View className="h-10 flex-row items-center gap-2 rounded-xl bg-muted px-3">
      <Search size={16} color={colors.mutedForeground} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        className="flex-1 font-sans text-[15px] text-foreground"
        returnKeyType="search"
        clearButtonMode="while-editing"
        autoCorrect={false}
      />
    </View>
  );
}
