import { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { router } from "expo-router";
import { api } from "@/lib/api";
import { useChatDirectory } from "@/lib/chat";
import type { Conversation } from "@/lib/types";
import { Avatar, BackButton, Backdrop, FieldLabel, FormScreen, GlassHeader, Input, PeoplePicker, SearchBar, Segmented, Text } from "@/components/ui";

type Kind = "direct" | "group" | "channel";

const open = (c: Conversation, title: string, presence = "", avatar = "") =>
  router.replace({ pathname: "/chat/[id]", params: { id: c.id, title, kind: c.kind, presence, avatar } });

function DirectPicker() {
  const directory = useChatDirectory();
  const [search, setSearch] = useState("");
  const term = search.trim().toLowerCase();
  const start = async (id: string) => {
    const person = directory.get(id);
    try {
      const c = await api.post<Conversation>("/team-chat/conversations/direct", { userId: id });
      open(c, person?.name ?? "Direct message", person?.presence ?? "", person?.avatarUrl ?? "");
    } catch (err) {
      Alert.alert("Couldn't start chat", err instanceof Error ? err.message : "Try again");
    }
  };
  return (
    <View className="gap-2">
      <SearchBar value={search} onChangeText={setSearch} placeholder="Search people" />
      {[...directory.values()]
        .filter((p) => !term || p.name.toLowerCase().includes(term))
        .slice(0, 40)
        .map((p) => (
          <Pressable key={p.id} accessibilityRole="button" onPress={() => start(p.id)} className="flex-row items-center gap-3 px-1 py-1.5 active:opacity-60">
            <Avatar name={p.name} uri={p.avatarUrl} size={38} online={p.presence === "online"} />
            <View className="flex-1">
              <Text numberOfLines={1} className="font-medium text-[15px]">
                {p.name}
              </Text>
              {!!p.department && <Text variant="caption">{p.department}</Text>}
            </View>
          </Pressable>
        ))}
    </View>
  );
}

export default function NewChatScreen() {
  const [kind, setKind] = useState<Kind>("direct");
  const [name, setName] = useState("");
  const [members, setMembers] = useState<string[]>([]);
  const toggle = (id: string) => setMembers((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));
  const tabs = (
    <Segmented
      value={kind}
      onChange={setKind}
      options={[
        { value: "direct", label: "Person" },
        { value: "group", label: "Group" },
        { value: "channel", label: "Channel" },
      ]}
    />
  );

  if (kind === "direct") {
    return (
      <View className="flex-1 bg-background">
        <Backdrop />
        <GlassHeader left={<BackButton />} title="New chat" />
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 48 }}>
          {tabs}
          <DirectPicker />
        </ScrollView>
      </View>
    );
  }

  const save = async () => {
    const clean = name.trim();
    const c = await api.post<Conversation>("/team-chat/conversations", { kind, name: clean, memberIds: members });
    open(c, kind === "channel" ? `# ${clean}` : clean || "Group");
  };

  return (
    <FormScreen title="New chat" saveLabel={`Create ${kind}`} onSave={save} canSave={kind === "channel" ? !!name.trim() : members.length > 0}>
      {tabs}
      <Input label={kind === "channel" ? "Channel name" : "Group name (optional)"} value={name} onChangeText={setName} />
      <FieldLabel label={`Members${members.length ? ` (${members.length})` : ""}`}>
        <PeoplePicker selected={members} onToggle={toggle} />
      </FieldLabel>
    </FormScreen>
  );
}
