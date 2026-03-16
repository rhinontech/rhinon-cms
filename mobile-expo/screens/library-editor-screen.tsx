import { useEffect, useMemo, useState } from "react";
import { router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, ScrollView, Text, TextInput, View } from "react-native";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { ScreenHeader } from "@/components/ui/screen-header";
import { queryKeys, rhinonApi } from "@/lib/queries";
import type { SocialPost } from "@/lib/types";

const CHANNELS = ["LinkedIn Post", "LinkedIn Video", "LinkedIn Article"] as const;

export default function LibraryEditorScreen({ postId }: { postId?: string }) {
  const queryClient = useQueryClient();
  const postQuery = useQuery({
    queryKey: postId ? queryKeys.post(postId) : ["post-new"],
    queryFn: () => rhinonApi.post(postId!),
    enabled: !!postId,
  });

  const [mode, setMode] = useState<"editor" | "preview">("editor");
  const [title, setTitle] = useState("Scaling ops with AI");
  const [content, setContent] = useState("The best outbound systems are becoming orchestration problems, not inbox problems.");
  const [aiInstructions, setAiInstructions] = useState("Keep it crisp and credible.");
  const [channel, setChannel] = useState<(typeof CHANNELS)[number]>("LinkedIn Post");
  const [visibility, setVisibility] = useState<"PUBLIC" | "CONNECTIONS">("PUBLIC");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaTitle, setMediaTitle] = useState("");
  const [mediaDescription, setMediaDescription] = useState("");
  const [articleUrl, setArticleUrl] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");

  useEffect(() => {
    if (!postQuery.data) return;
    const post = postQuery.data;
    setTitle(post.title || post.name || "");
    setContent(post.content);
    setAiInstructions(post.aiInstructions || "");
    setChannel(post.channel);
    setVisibility(post.visibility);
    setMediaUrl(post.mediaUrl || "");
    setMediaTitle(post.mediaTitle || "");
    setMediaDescription(post.mediaDescription || "");
    setArticleUrl(post.articleUrl || "");
  }, [postQuery.data]);

  const generateMutation = useMutation({
    mutationFn: () =>
      apiRequest<{ subject?: string; body?: string; aiInstructions?: string }>("/api/ai/templates/generate", {
        method: "POST",
        body: JSON.stringify({ prompt: aiPrompt, channel }),
      }),
    onSuccess: (data) => {
      if (data.subject) setTitle(data.subject);
      if (data.body) setContent(data.body);
      if (data.aiInstructions) setAiInstructions(data.aiInstructions);
      setAiPrompt("");
    },
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      apiRequest<SocialPost>(postId ? `/api/posts/${postId}` : "/api/posts", {
        method: postId ? "PATCH" : "POST",
        body: JSON.stringify({
          title,
          content,
          aiInstructions,
          channel,
          visibility,
          mediaUrl,
          mediaTitle,
          mediaDescription,
          articleUrl,
          status: postQuery.data?.status || "Draft",
        }),
      }),
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      const post =
        saveMutation.data ||
        (await apiRequest<SocialPost>(postId ? `/api/posts/${postId}` : "/api/posts", {
          method: postId ? "PATCH" : "POST",
          body: JSON.stringify({
            title,
            content,
            aiInstructions,
            channel,
            visibility,
            mediaUrl,
            mediaTitle,
            mediaDescription,
            articleUrl,
            status: postQuery.data?.status || "Draft",
          }),
        }));

      return apiRequest(`/api/posts/${post.id}/publish`, { method: "POST" });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.posts }),
        postId ? queryClient.invalidateQueries({ queryKey: queryKeys.post(postId) }) : Promise.resolve(),
      ]);
      Alert.alert("Published", "The asset was pushed to the LinkedIn publish flow.");
      router.replace("/(tabs)/content");
    },
  });

  useEffect(() => {
    if (!saveMutation.isSuccess) return;
    void queryClient.invalidateQueries({ queryKey: queryKeys.posts });
  }, [queryClient, saveMutation.isSuccess]);

  const previewTitle = useMemo(() => title || "Untitled asset", [title]);

  if (postQuery.isLoading) {
    return <LoadingState label="Loading social asset..." />;
  }

  return (
    <ScrollView className="flex-1 bg-rhinon-bg" contentContainerStyle={{ padding: 20, gap: 16 }}>
      <ScreenHeader
        eyebrow="Library Editor"
        title={postId ? "Refine asset" : "Create asset"}
        subtitle="Edit social payloads on one tab and preview the post on the other."
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
            <Input label="AI Prompt" value={aiPrompt} onChangeText={setAiPrompt} placeholder="Ask AI for a stronger social angle..." />
            <Button loading={generateMutation.isPending} onPress={() => generateMutation.mutate()}>
              Generate Variant
            </Button>
          </Card>

          <Card className="gap-4">
            <Input label="Title" value={title} onChangeText={setTitle} />
            <View className="gap-3">
              <Text className="pl-1 text-[11px] font-black uppercase tracking-[2.5px] text-rhinon-muted">Channel</Text>
              <View className="flex-row flex-wrap gap-2">
                {CHANNELS.map((item) => (
                  <Button
                    key={item}
                    variant={channel === item ? "primary" : "secondary"}
                    className="min-h-10 px-3"
                    textClassName={channel === item ? "" : "text-rhinon-text"}
                    onPress={() => setChannel(item)}
                  >
                    {item}
                  </Button>
                ))}
              </View>
            </View>

            <View className="gap-3">
              <Text className="pl-1 text-[11px] font-black uppercase tracking-[2.5px] text-rhinon-muted">Visibility</Text>
              <View className="flex-row gap-2">
                {(["PUBLIC", "CONNECTIONS"] as const).map((item) => (
                  <Button
                    key={item}
                    variant={visibility === item ? "primary" : "secondary"}
                    className="flex-1 min-h-10"
                    textClassName={visibility === item ? "" : "text-rhinon-text"}
                    onPress={() => setVisibility(item)}
                  >
                    {item}
                  </Button>
                ))}
              </View>
            </View>

            <View className="gap-2">
              <Text className="pl-1 text-[11px] font-black uppercase tracking-[2.5px] text-rhinon-muted">Content</Text>
              <TextInput
                multiline
                value={content}
                onChangeText={setContent}
                placeholder="Write the social asset"
                placeholderTextColor="#7D8BA7"
                textAlignVertical="top"
                className="min-h-[220px] rounded-[22px] border border-rhinon-border bg-rhinon-surface px-4 py-4 text-base text-rhinon-text"
              />
            </View>

            <Input label="Media URL" value={mediaUrl} onChangeText={setMediaUrl} placeholder="https://..." />
            <Input label="Media Title" value={mediaTitle} onChangeText={setMediaTitle} />
            <Input label="Media Description" value={mediaDescription} onChangeText={setMediaDescription} />
            {channel === "LinkedIn Article" ? (
              <Input label="Article URL" value={articleUrl} onChangeText={setArticleUrl} placeholder="https://..." />
            ) : null}
            <Input label="AI Instructions" value={aiInstructions} onChangeText={setAiInstructions} />
          </Card>
        </View>
      ) : (
        <Card className="gap-3">
          <Text className="text-xs font-black uppercase tracking-[2px] text-rhinon-muted">Preview</Text>
          <Text className="text-lg font-black text-rhinon-text">{previewTitle}</Text>
          <Text className="text-sm leading-7 text-rhinon-text">{content || "No copy yet"}</Text>
          <Text className="text-xs text-rhinon-muted">Channel: {channel}</Text>
          <Text className="text-xs text-rhinon-muted">Visibility: {visibility}</Text>
        </Card>
      )}

      <View className="flex-row gap-3">
        <Button variant="secondary" className="flex-1" loading={saveMutation.isPending} onPress={() => saveMutation.mutate()}>
          Save Draft
        </Button>
        <Button className="flex-1" loading={publishMutation.isPending} onPress={() => publishMutation.mutate()}>
          Publish
        </Button>
      </View>
    </ScrollView>
  );
}
