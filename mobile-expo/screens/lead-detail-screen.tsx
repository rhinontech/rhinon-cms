import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, ScrollView, Text, TextInput, View } from "react-native";
import { Sparkles } from "lucide-react-native";
import { apiRequest } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { ScreenHeader } from "@/components/ui/screen-header";
import { formatDate, formatShortDateTime } from "@/lib/format";
import { queryKeys, rhinonApi } from "@/lib/queries";

export default function LeadDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const leadQuery = useQuery({
    queryKey: queryKeys.lead(params.id),
    queryFn: () => rhinonApi.lead(params.id),
    enabled: !!params.id,
  });
  const activitiesQuery = useQuery({
    queryKey: queryKeys.leadActivities(params.id),
    queryFn: () => rhinonApi.leadActivities(params.id),
    enabled: !!params.id,
  });
  const templatesQuery = useQuery({ queryKey: queryKeys.templates, queryFn: rhinonApi.templates });

  const [tab, setTab] = useState<"outreach" | "activity">("outreach");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [subject, setSubject] = useState("");
  const [draft, setDraft] = useState("");
  const [enrichmentText, setEnrichmentText] = useState("");

  useEffect(() => {
    if (leadQuery.data) {
      setDraft(leadQuery.data.aiDraft || "");
      setSubject(`Scaling ${leadQuery.data.company}'s operations`);
    }
  }, [leadQuery.data]);

  useEffect(() => {
    if (!selectedTemplateId && templatesQuery.data?.length) {
      setSelectedTemplateId(templatesQuery.data[0].id);
    }
  }, [selectedTemplateId, templatesQuery.data]);

  const templateOptions = useMemo(() => {
    return (templatesQuery.data ?? []).filter((template) => template.channel === "Cold Email" || template.channel === "Email");
  }, [templatesQuery.data]);

  const generateMutation = useMutation({
    mutationFn: () =>
      apiRequest<{ draft: string; subject?: string }>("/api/ai/generate", {
        method: "POST",
        body: JSON.stringify({
          leadId: params.id,
          templateId: selectedTemplateId || null,
          customPrompt: customPrompt || null,
        }),
      }),
    onSuccess: async (data) => {
      setDraft(data.draft);
      if (data.subject) setSubject(data.subject);
      await queryClient.invalidateQueries({ queryKey: queryKeys.leadActivities(params.id) });
    },
  });

  const enrichMutation = useMutation({
    mutationFn: () =>
      apiRequest<Record<string, any>>("/api/ai/enrich", {
        method: "POST",
        body: JSON.stringify({ leadId: params.id }),
      }),
    onSuccess: async (data) => {
      const message = Object.values(data).filter(Boolean).join(" • ") || "Lead enriched with AI intel.";
      setEnrichmentText(message);
      await queryClient.invalidateQueries({ queryKey: queryKeys.leadActivities(params.id) });
    },
  });

  const sendMutation = useMutation({
    mutationFn: () =>
      apiRequest<{ success: true }>("/api/outreach/send", {
        method: "POST",
        body: JSON.stringify({
          leadId: params.id,
          subject,
          body: draft,
        }),
      }),
    onSuccess: async () => {
      Alert.alert("Outreach sent", "The draft was sent via the Rhinon delivery flow.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.leads }),
        queryClient.invalidateQueries({ queryKey: queryKeys.lead(params.id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.leadActivities(params.id) }),
      ]);
    },
  });

  if (leadQuery.isLoading || activitiesQuery.isLoading || templatesQuery.isLoading) {
    return <LoadingState label="Loading lead context..." />;
  }

  const lead = leadQuery.data;
  if (!lead) {
    return <LoadingState label="Lead not found." />;
  }

  return (
    <ScrollView className="flex-1 bg-rhinon-bg" contentContainerStyle={{ padding: 20, gap: 16 }}>
      <ScreenHeader
        eyebrow="Lead Intel"
        title={lead.name}
        subtitle={`${lead.title || "Prospect"} • ${lead.company}`}
        right={<Badge label={lead.status} tone={lead.status === "Interested" || lead.status === "Replied" ? "emerald" : "slate"} />}
      />

      <Card className="gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-black uppercase tracking-[2px] text-rhinon-muted">Contact</Text>
          <Text className="text-sm text-rhinon-muted">{formatDate(lead.addedAt)}</Text>
        </View>
        <Text className="text-base font-semibold text-rhinon-text">{lead.email}</Text>
        <Text className="text-sm text-rhinon-muted">{lead.linkedinUrl || "LinkedIn profile not set"}</Text>
      </Card>

      <View className="flex-row gap-2">
        <Button variant={tab === "outreach" ? "primary" : "secondary"} className="flex-1" textClassName={tab === "outreach" ? "" : "text-rhinon-text"} onPress={() => setTab("outreach")}>
          Outreach
        </Button>
        <Button variant={tab === "activity" ? "primary" : "secondary"} className="flex-1" textClassName={tab === "activity" ? "" : "text-rhinon-text"} onPress={() => setTab("activity")}>
          Activity
        </Button>
      </View>

      {tab === "outreach" ? (
        <View className="gap-4">
          <Card className="gap-3">
            <Text className="text-sm font-black uppercase tracking-[2px] text-rhinon-muted">Template</Text>
            <View className="flex-row flex-wrap gap-2">
              {templateOptions.map((template) => (
                <Button
                  key={template.id}
                  variant={selectedTemplateId === template.id ? "primary" : "secondary"}
                  className="min-h-10 px-3"
                  textClassName={selectedTemplateId === template.id ? "" : "text-rhinon-text"}
                  onPress={() => setSelectedTemplateId(template.id)}
                >
                  {template.name}
                </Button>
              ))}
            </View>
            <Text className="text-sm leading-6 text-rhinon-muted">
              Choose a base template, then optionally bias the generated draft with a manual prompt.
            </Text>
          </Card>

          <Card className="gap-3">
            <Input label="Manual Prompt" value={customPrompt} onChangeText={setCustomPrompt} placeholder="Focus on ROI, security, or another angle..." />
            <View className="flex-row gap-3">
              <Button variant="secondary" className="flex-1" loading={enrichMutation.isPending} onPress={() => enrichMutation.mutate()}>
                Enrich
              </Button>
              <Button className="flex-1" loading={generateMutation.isPending} onPress={() => generateMutation.mutate()}>
                Generate
              </Button>
            </View>
            {enrichmentText ? (
              <View className="rounded-2xl border border-violet-400/20 bg-violet-400/10 p-4">
                <View className="mb-2 flex-row items-center gap-2">
                  <Sparkles color="#A78BFA" size={14} />
                  <Text className="text-xs font-black uppercase tracking-[2px] text-violet-300">AI Intel</Text>
                </View>
                <Text className="text-sm leading-6 text-violet-300">{enrichmentText}</Text>
              </View>
            ) : null}
          </Card>

          <Card className="gap-3">
            <Input label="Subject" value={subject} onChangeText={setSubject} placeholder="Email subject" />
            <View className="gap-2">
              <Text className="pl-1 text-[11px] font-black uppercase tracking-[2.5px] text-rhinon-muted">Draft</Text>
              <TextInput
                multiline
                value={draft}
                onChangeText={setDraft}
                placeholder="Generated draft will appear here"
                placeholderTextColor="#7D8BA7"
                textAlignVertical="top"
                className="min-h-[220px] rounded-[22px] border border-rhinon-border bg-rhinon-surface px-4 py-4 text-base text-rhinon-text"
              />
            </View>
            <Button loading={sendMutation.isPending} onPress={() => sendMutation.mutate()}>
              Launch Outreach
            </Button>
          </Card>
        </View>
      ) : (
        <Card className="gap-4">
          <Text className="text-lg font-black text-rhinon-text">Activity Feed</Text>
          {(activitiesQuery.data ?? []).map((activity) => (
            <View key={activity.id} className="rounded-2xl border border-rhinon-border bg-[#0B1320] p-4">
              <View className="mb-2 flex-row items-center justify-between gap-3">
                <Text className="text-sm font-bold text-rhinon-text">{activity.type}</Text>
                <Text className="text-xs text-rhinon-muted">{formatShortDateTime(activity.timestamp)}</Text>
              </View>
              <Text className="text-sm leading-6 text-rhinon-muted">{activity.content}</Text>
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  );
}
