import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from "react-native";
import { Send } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { loadChatMessages } from "@/data/live";
import { actions, useApp } from "@/data/store";
import { useTheme } from "@/theme/ThemeProvider";
import { Eyebrow, Text, TopBar } from "@/ui";

export default function ChatThread() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const chat = useApp((s) => s.chats.find((c) => c.id === chatId));
  const [text, setText] = useState("");
  useEffect(() => { if (chatId) void loadChatMessages(chatId); }, [chatId]);
  useEffect(() => { if (chat?.unread) actions.markChatRead(chat.id); }, [chat?.id, chat?.unread]);
  if (!chat) return null;
  const title = chat.kind === "dm" ? chat.name : `# ${chat.name}`;
  const send = () => { if (text.trim()) { actions.sendChat(chat.id, text.trim()); setText(""); } };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: t.c.paper, paddingTop: insets.top + 12 }}>
      <View style={{ paddingHorizontal: 20 }}><TopBar title={title} fallback="/chat" /></View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 10 }}>
        {chat.messages.map((m) => {
          const mine = m.from === "me";
          return (
            <View key={m.id} style={{ alignItems: mine ? "flex-end" : "flex-start" }}>
              <View style={{ maxWidth: "82%", padding: 12, borderRadius: 18, backgroundColor: mine ? t.c.ink : t.c.card, borderWidth: mine ? 0 : 1, borderColor: t.c.line }}>
                <Text style={{ color: mine ? t.c.paper : t.c.ink, lineHeight: 21 }}>{m.text}</Text>
              </View>
              <Eyebrow style={{ marginTop: 4, fontSize: 9 }}>{m.at}</Eyebrow>
            </View>
          );
        })}
      </ScrollView>
      <View style={{ flexDirection: "row", gap: 10, padding: 14, paddingBottom: insets.bottom + 14, alignItems: "center" }}>
        <TextInput value={text} onChangeText={setText} placeholder="Message" placeholderTextColor={`${t.c.ink}66`} onSubmitEditing={send} style={{ flex: 1, height: 50, borderRadius: 25, paddingHorizontal: 18, backgroundColor: t.c.card, color: t.c.ink, fontFamily: t.f.sans, fontSize: 16, borderWidth: 1, borderColor: t.c.line }} />
        <Pressable onPress={send} style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: t.c.ink, alignItems: "center", justifyContent: "center" }}><Send size={20} color={t.c.paper} /></Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
