import { useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Alert, ScrollView, Text, TextInput, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/loading-state";
import { ScreenHeader } from "@/components/ui/screen-header";
import { formatDate, formatShortDateTime } from "@/lib/format";
import { queryKeys, rhinonApi } from "@/lib/queries";

export default function ConversationScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const leadQuery = useQuery({
    queryKey: queryKeys.lead(params.id),
    queryFn: () => rhinonApi.lead(params.id),
    enabled: !!params.id,
  });
  const campaignsQuery = useQuery({ queryKey: queryKeys.campaigns, queryFn: rhinonApi.campaigns });

  const [replyDraft, setReplyDraft] = useState("");
  const [drafting, setDrafting] = useState(false);

  if (leadQuery.isLoading || campaignsQuery.isLoading) {
    return <LoadingState label="Loading conversation..." />;
  }

  const lead = leadQuery.data;
  if (!lead) {
    return <LoadingState label="Conversation not found." />;
  }
  const firstName = lead.name.split(" ")[0];
  const campaign = campaignsQuery.data?.find((item) => item.id === lead.campaignId);

  async function generateReply() {
    setDrafting(true);
    setTimeout(() => {
      setReplyDraft(
        `Hi ${firstName},\n\nTuesday works well on our side. Does 10:00 AM PST fit your schedule? I can send over a calendar hold.\n\nBest,\nAlex`
      );
      setDrafting(false);
    }, 1200);
  }

  return (
    <ScrollView className="flex-1 bg-rhinon-bg" contentContainerStyle={{ padding: 20, gap: 16 }}>
      <ScreenHeader
        eyebrow="Conversation"
        title={lead.name}
        subtitle={`${lead.company} • ${lead.email}`}
      />

      <Card className="gap-3">
        <Text className="text-xs font-black uppercase tracking-[2px] text-rhinon-muted">Outbound</Text>
        <Text className="text-xs text-rhinon-muted">{formatDate(lead.addedAt)}</Text>
        <Text className="text-sm leading-7 text-rhinon-text">
          Hi {firstName}, I noticed {lead.company} is scaling rapidly and may be evaluating better outbound systems. Worth a quick conversation next week?
        </Text>
      </Card>

      <Card className="gap-3 border-cyan-400/10 bg-cyan-400/5">
        <Text className="text-xs font-black uppercase tracking-[2px] text-cyan-300">Inbound Reply</Text>
        <Text className="text-sm leading-7 text-rhinon-text">
          {lead.status === "Interested"
            ? "Thanks for reaching out. We are evaluating vendors right now. Let’s talk Tuesday."
            : lead.status === "Bounced"
              ? "Your previous message bounced. Please confirm the right point of contact."
              : "I’ll pass this along to our engineering director."}
        </Text>
      </Card>

      <Card className="gap-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-black text-rhinon-text">Reply Composer</Text>
          <Button variant="secondary" className="min-h-10 px-3" loading={drafting} onPress={generateReply}>
            AI Draft
          </Button>
        </View>
        <TextInput
          multiline
          value={replyDraft}
          onChangeText={setReplyDraft}
          placeholder="Draft a reply"
          placeholderTextColor="#7D8BA7"
          textAlignVertical="top"
          className="min-h-[180px] rounded-[22px] border border-rhinon-border bg-rhinon-surface px-4 py-4 text-base text-rhinon-text"
        />
        <Button onPress={() => Alert.alert("Draft saved", "Reply handling remains local-only in mobile v1.")}>
          Save Reply Draft
        </Button>
      </Card>

      <Card className="gap-3">
        <Text className="text-sm font-black uppercase tracking-[2px] text-rhinon-muted">Context</Text>
        <Text className="text-sm text-rhinon-muted">Status: {lead.status}</Text>
        <Text className="text-sm text-rhinon-muted">Campaign: {campaign?.name || "No active campaign"}</Text>
        <Text className="text-sm text-rhinon-muted">Last activity: {formatShortDateTime(lead.lastActivityAt || lead.addedAt)}</Text>
      </Card>
    </ScrollView>
  );
}
