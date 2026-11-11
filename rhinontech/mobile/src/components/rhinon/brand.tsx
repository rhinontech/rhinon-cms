import { View, Text, Pressable } from "@/components/rn";
import { Check, ChevronDown } from "@/components/icons";
import { BRANDS } from "@/lib/mock-data";
import { actions, useApp } from "@/lib/store";
import { TONES } from "@/lib/tone";
import { cn } from "@/lib/utils";
import { Sheet } from "./ui";

/** The brand a module is showing, as a pill. Tap it to switch. */
export function BrandChip({ onClick }: { onClick: () => void }) {
  const brand = useApp((s) => s.brand);
  const current = BRANDS.find((b) => b.id === brand) ?? BRANDS[0]!;
  return (
    <Pressable
      onPress={onClick}
      className="press inline-flex h-10 items-center gap-2 rounded-full border border-ink/15 bg-card pl-3.5 pr-3 font-mono text-[11px] font-medium uppercase tracking-[0.14em]"
    >
      <View className={cn("size-2.5 rounded-full", TONES[current.tone].dot)} />
      {current.name}
      <ChevronDown size={15} />
    </Pressable>
  );
}
export function BrandPickSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const brand = useApp((s) => s.brand);
  return (
    <Sheet open={open} onClose={onClose} eyebrow="Brand" title="Which brand?">
      <View className="space-y-2.5">
        {BRANDS.map((b) => (
          <View key={b.id}>
            <Pressable
              onPress={() => {
                actions.setBrand(b.id);
                onClose();
              }}
              className={cn(
                "press flex w-full items-center gap-4 rounded-3xl p-4 text-left",
                brand === b.id ? TONES[b.tone].solid : "border border-line/70 bg-card",
              )}
            >
              <View
                className={cn(
                  "grid size-12 place-items-center rounded-2xl font-display text-[26px] font-black",
                  brand === b.id ? "bg-paper/20" : TONES[b.tone].solid,
                )}
              >
                {b.name[0]}
              </View>
              <View className="min-w-0 flex-1">
                <View className="block text-[17px] font-semibold leading-tight">{b.name}</View>
                <View className="block font-mono text-[11px] tracking-[0.08em] opacity-70">
                  {b.domain}
                </View>
              </View>
              {brand === b.id ? <Check size={20} strokeWidth={2.6} /> : null}
            </Pressable>
          </View>
        ))}
      </View>
      <Text className="mt-5 text-[13px] leading-relaxed text-ink/55">
        Inbox, CRM, Outreach and Analytics are kept separate for each brand.
      </Text>
    </Sheet>
  );
}
