import { Linking, Pressable, ScrollView, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Building2, Globe, Link2, Mail, MapPin, Phone, type LucideIcon } from "lucide-react-native";
import { useApi } from "@/lib/useApi";
import { useTheme } from "@/lib/theme";
import { fullDateTime, htmlToText, money } from "@/lib/format";
import { LEAD_STATUS_TONE } from "@/lib/crm";
import { tap } from "@/lib/haptics";
import type { Lead } from "@/lib/types";
import { Avatar, Badge, Card, ErrorState, SectionTitle, Spinner, Text } from "@/components/ui";

interface LeadDetail extends Lead {
  location?: string | null;
  industry?: string | null;
  owner?: { fullName: string } | null;
  account?: { name: string } | null;
  campaign?: { name: string } | null;
  activities?: { id: string; type: string; content: string; timestamp: string }[];
  deals?: { id: string; title: string; value: string | number; status: string; stage?: { name: string; color: string | null } | null }[];
}

function ActionButton({ icon: Icon, label, onPress }: { icon: LucideIcon; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      className="flex-1 items-center gap-1.5 rounded-2xl bg-muted py-3 active:opacity-70"
    >
      <Icon size={20} color={colors.foreground} />
      <Text className="font-medium text-[12px]">{label}</Text>
    </Pressable>
  );
}

function InfoRow({ icon: Icon, value, first }: { icon: LucideIcon; value: string; first?: boolean }) {
  const { colors } = useTheme();
  return (
    <View className={`flex-row items-center gap-3 px-4 py-3.5 ${first ? "" : "border-t border-border"}`}>
      <Icon size={16} color={colors.mutedForeground} />
      <Text selectable numberOfLines={1} className="flex-1 text-[15px]">
        {value}
      </Text>
    </View>
  );
}

const safeUrl = (u: string) => (/^https?:\/\//i.test(u) ? u : `https://${u}`);

export default function LeadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: lead, error, loading, refresh } = useApi<LeadDetail>(`/leads/${id}`);

  if (loading && !lead) return <Spinner />;
  if (error && !lead) return <ErrorState message={error} onRetry={refresh} />;
  if (!lead) return null;

  const info: { icon: LucideIcon; value: string }[] = [
    { icon: Mail, value: lead.email },
    lead.phone ? { icon: Phone, value: lead.phone } : null,
    lead.account?.name || lead.company ? { icon: Building2, value: lead.account?.name || lead.company } : null,
    lead.location ? { icon: MapPin, value: lead.location } : null,
    lead.website ? { icon: Globe, value: lead.website } : null,
  ].filter(Boolean) as { icon: LucideIcon; value: string }[];

  const activities = [...(lead.activities ?? [])].sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 48 }}>
      <View className="items-center px-5 pt-4">
        <Avatar name={lead.name} size={76} />
        <Text variant="title" className="mt-3 text-center">
          {lead.name}
        </Text>
        <Text variant="caption" className="mt-1 text-center text-[14px]">
          {[lead.title, lead.company].filter(Boolean).join(" at ")}
        </Text>
        <View className="mt-3 flex-row gap-2">
          <Badge label={lead.status} tone={LEAD_STATUS_TONE[lead.status] ?? "neutral"} />
          {lead.lifecycleStage && <Badge label={lead.lifecycleStage} />}
        </View>
      </View>

      <View className="mt-6 flex-row gap-3 px-5">
        <ActionButton icon={Mail} label="Email" onPress={() => Linking.openURL(`mailto:${lead.email}`)} />
        {lead.phone && <ActionButton icon={Phone} label="Call" onPress={() => Linking.openURL(`tel:${lead.phone}`)} />}
        {lead.linkedinUrl && <ActionButton icon={Link2} label="LinkedIn" onPress={() => Linking.openURL(safeUrl(lead.linkedinUrl!))} />}
      </View>

      <SectionTitle title="Details" />
      <Card className="mx-5">
        {info.map((row, i) => (
          <InfoRow key={i} icon={row.icon} value={row.value} first={i === 0} />
        ))}
      </Card>
      <View className="mt-2 flex-row flex-wrap gap-x-4 gap-y-1 px-6">
        <Text variant="caption">Source: {lead.source}</Text>
        {lead.owner && <Text variant="caption">Owner: {lead.owner.fullName}</Text>}
        {lead.campaign && <Text variant="caption">Campaign: {lead.campaign.name}</Text>}
      </View>

      {!!lead.deals?.length && (
        <>
          <SectionTitle title="Deals" />
          <Card className="mx-5">
            {lead.deals.map((d, i) => (
              <View key={d.id} className={`flex-row items-center gap-3 px-4 py-3.5 ${i ? "border-t border-border" : ""}`}>
                <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.stage?.color || "#94A3B8" }} />
                <View className="flex-1">
                  <Text numberOfLines={1} className="font-medium text-[15px]">
                    {d.title}
                  </Text>
                  <Text variant="caption">{d.stage?.name ?? d.status}</Text>
                </View>
                <Text className="font-semibold text-[15px]">{money(d.value)}</Text>
              </View>
            ))}
          </Card>
        </>
      )}

      {lead.notes ? (
        <>
          <SectionTitle title="Notes" />
          <Card className="mx-5 p-4">
            <Text selectable className="text-[15px] leading-[22px]">
              {lead.notes}
            </Text>
          </Card>
        </>
      ) : null}

      {!!activities.length && (
        <>
          <SectionTitle title="Activity" />
          <View className="px-5">
            {activities.slice(0, 15).map((a, i) => (
              <View key={a.id} className="flex-row gap-3">
                <View className="items-center">
                  <View className="mt-1.5 h-2.5 w-2.5 rounded-full bg-brand" />
                  {i < Math.min(activities.length, 15) - 1 && <View className="w-px flex-1 bg-border" />}
                </View>
                <View className="flex-1 pb-5">
                  <Text className="font-medium text-[14px]">{a.type.replace(/([a-z])([A-Z])/g, "$1 $2")}</Text>
                  {/* Activity text can carry a lead's raw email — rendered as text only. */}
                  <Text numberOfLines={3} variant="caption" className="mt-0.5 text-[13px] leading-[18px]">
                    {htmlToText(a.content)}
                  </Text>
                  <Text variant="caption" className="mt-1 text-[11px]">
                    {fullDateTime(a.timestamp)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}
