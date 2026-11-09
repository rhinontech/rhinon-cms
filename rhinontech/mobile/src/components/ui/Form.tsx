import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { Check, Paperclip, X } from "lucide-react-native";
import { useChatDirectory } from "@/lib/chat";
import { useTheme } from "@/lib/theme";
import { tap } from "@/lib/haptics";
import { Avatar } from "./Avatar";
import { Backdrop } from "./Backdrop";
import { Button } from "./Button";
import { BackButton, GlassHeader } from "./Screen";
import { SearchBar } from "./SearchBar";
import { Text } from "./Text";

/** A pushed create/edit screen: fixed header, scrolling fields, one save button, inline error. */
export function FormScreen({
  title,
  saveLabel = "Save",
  onSave,
  canSave = true,
  right,
  children,
}: {
  title: string;
  saveLabel?: string;
  /** Throw to show the message and stay on the form. */
  onSave: () => Promise<void>;
  canSave?: boolean;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-background">
      <Backdrop />
      <GlassHeader left={<BackButton />} title={title} right={right} />
      <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 48 }}>
        {children}
        {error && (
          <View className="rounded-xl bg-destructive/10 px-3.5 py-3">
            <Text className="text-[13px] text-destructive">{error}</Text>
          </View>
        )}
        <Button title={saveLabel} onPress={save} loading={busy} disabled={!canSave} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="gap-1.5">
      <Text variant="label">{label}</Text>
      {children}
    </View>
  );
}

/** Choose one or several people from the team directory. */
export function PeoplePicker({ selected, onToggle, exclude }: { selected: string[]; onToggle: (id: string) => void; exclude?: string[] }) {
  const { colors } = useTheme();
  const directory = useChatDirectory();
  const [search, setSearch] = useState("");
  const term = search.trim().toLowerCase();
  const people = [...directory.values()].filter((p) => !exclude?.includes(p.id) && (!term || p.name.toLowerCase().includes(term)));
  return (
    <View className="gap-2">
      <SearchBar value={search} onChangeText={setSearch} placeholder="Search people" />
      {people.slice(0, 40).map((p) => {
        const on = selected.includes(p.id);
        return (
          <Pressable
            key={p.id}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            onPress={() => {
              tap();
              onToggle(p.id);
            }}
            className="flex-row items-center gap-3 rounded-xl px-1 py-1.5 active:opacity-60"
          >
            <Avatar name={p.name} uri={p.avatarUrl} size={36} />
            <Text numberOfLines={1} className="flex-1 text-[15px]">
              {p.name}
            </Text>
            <View className={`h-5 w-5 items-center justify-center rounded-full ${on ? "bg-brand" : "border-2 border-border"}`}>{on && <Check size={13} color={colors.brandForeground} strokeWidth={3} />}</View>
          </Pressable>
        );
      })}
    </View>
  );
}

/** A removable chip for a file waiting to be sent. */
export function FileChip({ name, onRemove }: { name: string; onRemove: () => void }) {
  const { colors } = useTheme();
  return (
    <View className="max-w-[240px] flex-row items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5">
      <Paperclip size={13} color={colors.mutedForeground} />
      <Text numberOfLines={1} className="shrink text-[12px]">
        {name}
      </Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${name}`} hitSlop={8} onPress={onRemove}>
        <X size={14} color={colors.mutedForeground} />
      </Pressable>
    </View>
  );
}
