import { Portal, View, Text, Pressable } from "@/components/rn";
import { ScanFace } from "@/components/icons";
import { useEffect } from "react";
import { Display, Eyebrow } from "./ui";

/** A Face ID style check before something sensitive is shown. Succeeds by itself in the prototype. */
export function FaceIdOverlay({
  open,
  onSuccess,
  onCancel,
}: {
  open: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(onSuccess, 1300);
    return () => window.clearTimeout(id);
  }, [open, onSuccess]);
  if (!open) return null;
  return (<Portal>
    <View className="pointer-events-auto absolute inset-0 z-[56] flex animate-fade-in flex-col items-center justify-center bg-ink/92 px-8 text-center text-paper backdrop-blur-sm">
      <View className="relative grid size-32 place-items-center rounded-[calc(var(--radius)+16px)] border-2 border-paper/30">
        <View className="absolute inset-x-3 h-0.5 animate-scan rounded-full bg-on-ink-accent" />
        <ScanFace size={64} strokeWidth={1.4} className="text-paper" />
      </View>
      <Eyebrow className="mt-8 text-on-ink-accent">Face ID</Eyebrow>
      <Display as="h2" size="lg" className="mt-2 text-paper">
        Looking for you
      </Display>
      <Text className="mt-2 max-w-[260px] text-[14px] text-paper/60">
        Confirming it's you before showing your pay.
      </Text>
      <Pressable
        onPress={onCancel}
        className="press mt-8 font-mono text-[11px] uppercase tracking-[0.18em] text-paper/60 underline underline-offset-4"
      >
        Cancel
      </Pressable>
    </View></Portal>);
}
