import { useEffect, useMemo, useState } from "react";
import { router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ScrollView, Text, TextInput, View } from "react-native";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { ScreenHeader } from "@/components/ui/screen-header";
import { queryKeys, rhinonApi } from "@/lib/queries";
import type { Template } from "@/lib/types";

function applySampleVariables(content: string) {
  return content
    .replaceAll("{{lead.name}}", "Marcus Johnson")
    .replaceAll("{{lead.company}}", "TechFlow")
    .replaceAll("{{lead.title}}", "Founder & CEO")
    .replaceAll("{{sender.name}}", "Alex Mercer");
}

export default function TemplateEditorScreen({ templateId }: { templateId?: string }) {
  const queryClient = useQueryClient();
  const templateQuery = useQuery({
    queryKey: templateId ? queryKeys.template(templateId) : ["template-new"],
    queryFn: () => rhinonApi.template(templateId!),
    enabled: !!templateId,
  });

  const [mode, setMode] = useState<"editor" | "preview">("editor");
  const [name, setName] = useState("New Template");
  const [subject, setSubject] = useState("Scaling {{lead.company}}'s operations");
  const [body, setBody] = useState("Hi {{lead.name}},\n\nI noticed {{lead.company}} is scaling quickly and may be evaluating better ways to orchestrate outbound operations.\n\nWorth a quick call next week?\n\nBest,\n{{sender.name}}");
  const [aiInstructions, setAiInstructions] = useState("Keep it concise, credible, and personalized.");
  const [aiPrompt, setAiPrompt] = useState("");

  useEffect(() => {
    if (!templateQuery.data) return;
    const template = templateQuery.data;
    setName(template.name);
    setSubject(template.subject || "");
    setBody(template.body);
    setAiInstructions(template.aiInstructions || "");
  }, [templateQuery.data]);

  const generateMutation = useMutation({
    mutationFn: () =>
      apiRequest<Partial<Template>>("/api/ai/templates/generate", {
        method: "POST",
        body: JSON.stringify({ prompt: aiPrompt, channel: "Cold Email" }),
      }),
    onSuccess: (data) => {
      if (data.name) setName(data.name);
      if (data.subject) setSubject(data.subject);
      if (data.body) setBody(data.body);
      if (data.aiInstructions) setAiInstructions(data.aiInstructions);
      setAiPrompt("");
    },
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      apiRequest<Template>(templateId ? `/api/templates/${templateId}` : "/api/templates", {
        method: templateId ? "PATCH" : "POST",
        body: JSON.stringify({
          name,
          channel: "Cold Email",
          subject,
          body,
          aiInstructions,
        }),
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.templates }),
        templateId ? queryClient.invalidateQueries({ queryKey: queryKeys.template(templateId) }) : Promise.resolve(),
      ]);
      router.replace("/(tabs)/content");
    },
  });

  const previewBody = useMemo(() => applySampleVariables(body), [body]);

  if (templateQuery.isLoading) {
    return <LoadingState label="Loading template..." />;
  }

  return (
    <ScrollView className="flex-1 bg-rhinon-bg" contentContainerStyle={{ padding: 20, gap: 16 }}>
      <ScreenHeader
        eyebrow="Template Editor"
        title={templateId ? "Refine message" : "Create template"}
        subtitle="Swap between editor and preview instead of a cramped split pane."
      />

      <View className="flex-row gap-2">
        <Button variant={mode === "editor" ? "primary" : "secondary"} className="flex-1" textClassName={mode === "editor" ? "" : "text-rhinon-text"} onPress={() => setMode("editor")}>
          Editor
        </Button>
        <Button variant={mode === "preview" ? "primary" : "secondary"} className="flex-1" textClassName={mode === "preview" ? "" : "text-rhinon-text"} onPress={() => setMode("preview")}>
          Preview
        </Button>
      </View>

      {mode === "editor" ? (
        <View className="gap-4">
          <Card className="gap-4">
            <Input label="AI Prompt" value={aiPrompt} onChangeText={setAiPrompt} placeholder="Ask AI for a more specific cold-email angle..." />
            <Button loading={generateMutation.isPending} onPress={() => generateMutation.mutate()}>
              Generate Draft
            </Button>
          </Card>

          <Card className="gap-4">
            <Input label="Template Name" value={name} onChangeText={setName} />
            <Input label="Subject" value={subject} onChangeText={setSubject} />
            <View className="gap-2">
              <Text className="pl-1 text-[11px] font-black uppercase tracking-[2.5px] text-rhinon-muted">Body</Text>
              <TextInput
                multiline
                value={body}
                onChangeText={setBody}
                placeholder="Write the body"
                placeholderTextColor="#7D8BA7"
                textAlignVertical="top"
                className="min-h-[260px] rounded-[22px] border border-rhinon-border bg-rhinon-surface px-4 py-4 text-base text-rhinon-text"
              />
            </View>
            <View className="gap-2">
              <Text className="pl-1 text-[11px] font-black uppercase tracking-[2.5px] text-rhinon-muted">AI Instructions</Text>
              <TextInput
                multiline
                value={aiInstructions}
                onChangeText={setAiInstructions}
                placeholder="How should Rhinon personalize this?"
                placeholderTextColor="#7D8BA7"
                textAlignVertical="top"
                className="min-h-[120px] rounded-[22px] border border-rhinon-border bg-rhinon-surface px-4 py-4 text-base text-rhinon-text"
              />
            </View>
          </Card>
        </View>
      ) : (
        <Card className="gap-3">
          <Text className="text-xs font-black uppercase tracking-[2px] text-rhinon-muted">Preview</Text>
          <Text className="text-lg font-black text-rhinon-text">{applySampleVariables(subject || "No subject yet")}</Text>
          <Text className="text-sm leading-7 text-rhinon-text">{previewBody || "No body yet"}</Text>
        </Card>
      )}

      <Button loading={saveMutation.isPending} onPress={() => saveMutation.mutate()}>
        Save Template
      </Button>
    </ScrollView>
  );
}
