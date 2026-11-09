import { useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react-native";
import { dateKey, shortDate } from "@/lib/format";
import { tap } from "@/lib/haptics";
import { useTheme } from "@/lib/theme";
import { Text } from "./Text";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

/** A date input with its own month grid, so it needs no native module. Values are YYYY-MM-DD. */
export function DateField({ label, value, onChange, min }: { label: string; value: string; onChange: (v: string) => void; min?: string }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(() => (value ? new Date(`${value}T00:00:00`) : new Date()));
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const count = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells: (string | null)[] = [
    ...Array.from({ length: first.getDay() }, () => null),
    ...Array.from({ length: count }, (_, i) => dateKey(new Date(first.getFullYear(), first.getMonth(), i + 1))),
  ];
  const shift = (by: number) => setCursor(new Date(first.getFullYear(), first.getMonth() + by, 1));

  return (
    <View className="flex-1 gap-1.5">
      <Text variant="label">{label}</Text>
      <Pressable accessibilityRole="button" onPress={() => setOpen(true)} className="h-12 flex-row items-center gap-2.5 rounded-xl border border-border bg-card px-3.5">
        <CalendarDays size={17} color={colors.mutedForeground} />
        <Text className={value ? "text-[15px]" : "text-[15px] text-muted-foreground"}>{value ? shortDate(value) : "Pick a date"}</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 items-center justify-center bg-black/40 px-6" onPress={() => setOpen(false)}>
          <Pressable className="w-full max-w-sm rounded-3xl p-4" style={{ backgroundColor: colors.card }}>
            <View className="mb-3 flex-row items-center justify-between">
              <Pressable accessibilityLabel="Previous month" hitSlop={8} onPress={() => shift(-1)} className="p-1">
                <ChevronLeft size={20} color={colors.foreground} />
              </Pressable>
              <Text variant="heading">{first.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</Text>
              <Pressable accessibilityLabel="Next month" hitSlop={8} onPress={() => shift(1)} className="p-1">
                <ChevronRight size={20} color={colors.foreground} />
              </Pressable>
            </View>
            <View className="flex-row flex-wrap">
              {WEEKDAYS.map((d, i) => (
                <View key={i} style={{ width: `${100 / 7}%` }} className="items-center py-1">
                  <Text variant="caption">{d}</Text>
                </View>
              ))}
              {cells.map((key, i) => {
                const off = !key || (!!min && key < min);
                const selected = key === value;
                return (
                  <View key={i} style={{ width: `${100 / 7}%` }} className="items-center py-0.5">
                    {key && (
                      <Pressable
                        disabled={off}
                        onPress={() => {
                          tap();
                          onChange(key);
                          setOpen(false);
                        }}
                        className={`h-9 w-9 items-center justify-center rounded-full ${selected ? "bg-primary" : ""}`}
                      >
                        <Text className={`text-[14px] ${selected ? "text-primary-foreground" : off ? "text-muted-foreground/40" : "text-foreground"}`}>{Number(key.slice(8))}</Text>
                      </Pressable>
                    )}
                  </View>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
