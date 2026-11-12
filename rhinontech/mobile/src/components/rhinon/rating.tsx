import { View, Text, Pressable } from "@/components/rn";
import { RATING_LABELS } from "@/lib/mock-more";
import { TONES, type Tone } from "@/lib/tone";
import { cn } from "@/lib/utils";
const RAMP: Tone[] = ["coral", "sun", "sky", "leaf", "violet"];

/** Five big tappable blocks, 1 to 5, with the chosen label underneath. */
export function RatingPicker({
  value,
  onChange,
  labels = RATING_LABELS,
}: {
  value: number | null;
  onChange: (v: number) => void;
  labels?: string[];
}) {
  return (
    <View>
      <View className="grid grid-cols-5 gap-2" accessibilityLabel="Rating">
        {RAMP.map((tone, i) => {
          const n = i + 1;
          const on = value === n;
          return (
            <Pressable
              key={n}
              accessibilityLabel={`${n} of 5 · ${labels[i] ?? ""}`}
              onPress={() => onChange(n)}
              className={cn(
                "press grid h-16 place-items-center rounded-2xl border-2 font-display text-[length:calc(30px*var(--ds))] leading-none transition-colors",
                on
                  ? cn(TONES[tone].solid, "border-transparent")
                  : "border-line bg-card text-ink/55",
              )}
            >
              {n}
            </Pressable>
          );
        })}
      </View>
      <Text className="mt-2.5 h-4 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-ink/60">
        {value ? labels[value - 1] : "Tap to rate"}
      </Text>
    </View>
  );
}
