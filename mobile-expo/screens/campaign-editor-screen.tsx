import { useMemo, useState } from "react";
import { router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ScrollView, Text, View } from "react-native";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScreenHeader } from "@/components/ui/screen-header";
import { queryKeys, rhinonApi } from "@/lib/queries";
import type { Channel, Campaign } from "@/lib/types";

const CHANNELS: Channel[] = ["Email", "LinkedIn Post", "LinkedIn Video", "LinkedIn Article"];

export default function CampaignEditorScreen() {
  const queryClient = useQueryClient();
  const templatesQuery = useQuery({ queryKey: queryKeys.templates, queryFn: rhinonApi.templates });
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [channel, setChannel] = useState<Channel>("Email");
  const [templateId, setTemplateId] = useState("");
  const [dailyLimit, setDailyLimit] = useState("50");
  const [leadsTotal, setLeadsTotal] = useState("100");

  const availableTemplates = useMemo(() => {
    return (templatesQuery.data ?? []).filter((template) => {
      if (channel === "Email") {
        return template.channel === "Cold Email" || template.channel === "Email";
      }
      return template.channel === channel;
    });
  }, [channel, templatesQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      apiRequest<Campaign>("/api/campaigns", {
        method: "POST",
        body: JSON.stringify({
          name,
          channel,
          templateId: templateId || null,
          stage: "Draft",
          dailyLimit: Number(dailyLimit),
          leadsTotal: Number(leadsTotal),
          leadsProcessed: 0,
          startDate: new Date().toISOString(),
        }),
      }),
    onSuccess: async (campaign) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.campaigns });
      router.replace({ pathname: "/campaigns/[id]", params: { id: campaign.id } });
    },
  });

  function advanceStep() {
    setStep((current) => Math.min(2, current + 1));
  }

  function retreatStep() {
    setStep((current) => Math.max(0, current - 1));
  }

  return (
    <ScrollView className="flex-1 bg-rhinon-bg" contentContainerStyle={{ padding: 20, gap: 16 }}>
      <ScreenHeader
        eyebrow="Campaign Setup"
        title="Create engine"
        subtitle="Build a mobile-native campaign in three compact steps."
      />

      {step === 0 ? (
        <Card className="gap-4">
          <Input label="Campaign Name" value={name} onChangeText={setName} placeholder="Q3 Expansion Sweep" />
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
        </Card>
      ) : null}

      {step === 1 ? (
        <Card className="gap-4">
          <Text className="text-sm font-black uppercase tracking-[2px] text-rhinon-muted">Template Selection</Text>
          <View className="flex-row flex-wrap gap-2">
            {availableTemplates.map((template) => (
              <Button
                key={template.id}
                variant={templateId === template.id ? "primary" : "secondary"}
                className="min-h-10 px-3"
                textClassName={templateId === template.id ? "" : "text-rhinon-text"}
                onPress={() => setTemplateId(template.id)}
              >
                {template.name}
              </Button>
            ))}
          </View>
          <Text className="text-sm leading-6 text-rhinon-muted">
            Select an optional template seed. You can still process or publish the campaign later with generated drafts.
          </Text>
        </Card>
      ) : null}

      {step === 2 ? (
        <>
          <Card className="gap-4">
            <Input label="Daily Limit" value={dailyLimit} onChangeText={setDailyLimit} keyboardType="numeric" />
            <Input label="Lead Total" value={leadsTotal} onChangeText={setLeadsTotal} keyboardType="numeric" />
          </Card>

          <Card className="gap-3">
            <Text className="text-lg font-black text-rhinon-text">Review</Text>
            <Text className="text-sm text-rhinon-muted">Name: {name || "Untitled campaign"}</Text>
            <Text className="text-sm text-rhinon-muted">Channel: {channel}</Text>
            <Text className="text-sm text-rhinon-muted">Daily Limit: {dailyLimit}</Text>
            <Text className="text-sm text-rhinon-muted">Lead Total: {leadsTotal}</Text>
            <Text className="text-sm text-rhinon-muted">
              Template: {availableTemplates.find((item) => item.id === templateId)?.name || "None selected"}
            </Text>
          </Card>
        </>
      ) : null}

      <View className="flex-row gap-3">
        <Button variant="secondary" className="flex-1" onPress={retreatStep}>
          Back
        </Button>
        {step === 2 ? (
          <Button className="flex-1" loading={saveMutation.isPending} onPress={() => saveMutation.mutate()}>
            Save Campaign
          </Button>
        ) : (
          <Button className="flex-1" onPress={advanceStep}>
            Next
          </Button>
        )}
      </View>
    </ScrollView>
  );
}
