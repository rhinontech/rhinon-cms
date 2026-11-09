import { useState } from "react";
import { Linking, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { AtSign, Building2, Globe, Link2, Mail, MapPin, Pencil, Phone, Plus, Sparkles, type LucideIcon } from "lucide-react-native";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { useTheme } from "@/lib/theme";
import { LEAD_STATUS_TONE } from "@/lib/crm";
import { success } from "@/lib/haptics";
import { fullDateTime, htmlToText, money } from "@/lib/format";
import type { Lead } from "@/lib/types";
import { Avatar, BackButton, Backdrop, Badge, Button, Card, ErrorState, GlassHeader, HeaderButton, IconTile, ScrollScreen, SectionTitle, Spinner, Tappable, Text } from "@/components/ui";

interface LeadDetail extends Lead {
  location?: string | null;
  enrichment?: Record<string, unknown> | null;
  industry?: string | null;
  owner?: { fullName: string } | null;
  account?: { name: string } | null;
  campaign?: { name: string } | null;
  activities?: { id: string; type: string; content: string; timestamp: string }[];
  deals?: { id: string; title: string; value: string | number; status: string; stage?: { name: string; color: string | null } | null }[];
}

function ActionButton({ icon, label, onPress }: { icon: LucideIcon; label: string; onPress: () => void }) {
  return (
    <Tappable accessibilityRole="button" className="flex-1" onPress={onPress}>
      <Card className="items-center gap-2 py-3.5">
        <IconTile icon={icon} size={38} />
        <Text className="font-medium text-[12px]">{label}</Text>
      </Card>
    </Tappable>
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

/** "potentialPainPoint" → "Potential pain point". */
const fieldLabel = (key: string) => key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase()).replace(/(?<=\s)[A-Z]/g, (c) => c.toLowerCase());

/** AI output, shown field by field as plain text. Whatever it returns that's readable gets a row. */
function enrichmentRows(enrichment: Record<string, unknown> | null | undefined) {
  return Object.entries(enrichment ?? {}).flatMap(([key, value]) => {
    if (key === "error") return [];
    const text = Array.isArray(value) ? value.filter((v) => typeof v === "string").join(", ") : typeof value === "string" || typeof value === "number" ? String(value) : "";
    return text.trim() ? [{ key, label: fieldLabel(key), text }] : [];
  });
}

const safeUrl = (u: string) => (/^https?:\/\//i.test(u) ? u : `https://${u}`);

export default function LeadScreen() {
  const { colors } = useTheme();
  const { can } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: lead, error, loading, refreshing, refresh, reload } = useApi<LeadDetail>(`/leads/${id}`);
  const [enriching, setEnriching] = useState(false);
  const [enrichError, setEnrichError] = useState<string | null>(null);

  const enrich = async () => {
    setEnriching(true);
    setEnrichError(null);
    try {
      await api.post(`/leads/${id}/enrich`);
      success();
      await reload();
    } catch (err) {
      setEnrichError(err instanceof Error ? err.message : "Enrichment failed");
    } finally {
      setEnriching(false);
    }
  };

  if (!lead) {
    return (
      <View className="flex-1 bg-background">
        <Backdrop />
        <GlassHeader left={<BackButton />} title="Lead" />
        {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={refresh} /> : null}
      </View>
    );
  }

  const info: { icon: LucideIcon; value: string }[] = [
    { icon: Mail, value: lead.email },
    lead.phone ? { icon: Phone, value: lead.phone } : null,
    lead.account?.name || lead.company ? { icon: Building2, value: lead.account?.name || lead.company } : null,
    lead.location ? { icon: MapPin, value: lead.location } : null,
    lead.website ? { icon: Globe, value: lead.website } : null,
  ].filter(Boolean) as { icon: LucideIcon; value: string }[];

  const activities = [...(lead.activities ?? [])].sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));

  return (
    <ScrollScreen
      detail
      refreshing={refreshing}
      onRefresh={refresh}
      header={
        <GlassHeader
          left={<BackButton />}
          title={lead.name}
          right={can("crm:write", "outreach:write") ? <HeaderButton icon={Pencil} label="Edit lead" onPress={() => router.push({ pathname: "/crm/lead-form", params: { id } })} /> : undefined}
        />
      }
    >
      <View className="items-center px-5 pt-5">
        <Avatar name={lead.name} size={76} />
        <Text variant="title" className="mt-3 text-center">
          {lead.name}
        </Text>
        <Text variant="caption" className="mt-1 text-center text-[14px] leading-5">
          {[lead.title, lead.company].filter(Boolean).join(" at ")}
        </Text>
        <View className="mt-3 flex-row gap-2">
          <Badge label={lead.status} tone={LEAD_STATUS_TONE[lead.status] ?? "neutral"} />
          {lead.lifecycleStage && <Badge label={lead.lifecycleStage} />}
        </View>
      </View>

      <View className="mt-5 flex-row gap-3 px-5">
        <ActionButton icon={Mail} label="Email" onPress={() => Linking.openURL(`mailto:${lead.email}`)} />
        {lead.phone && <ActionButton icon={Phone} label="Call" onPress={() => Linking.openURL(`tel:${lead.phone}`)} />}
        {lead.linkedinUrl && <ActionButton icon={Link2} label="LinkedIn" onPress={() => Linking.openURL(safeUrl(lead.linkedinUrl!))} />}
        {lead.instagramUrl && <ActionButton icon={AtSign} label="Instagram" onPress={() => Linking.openURL(safeUrl(lead.instagramUrl!))} />}
      </View>

      <SectionTitle title="Details" />
      <Card className="mx-5">
        {info.map((row, i) => (
          <InfoRow key={i} icon={row.icon} value={row.value} first={i === 0} />
        ))}
      </Card>
      <View className="mt-2 flex-row flex-wrap gap-x-4 gap-y-1 px-6">
        <Text variant="caption" className="text-[13px]">Source: {lead.source}</Text>
        {lead.owner && <Text variant="caption" className="text-[13px]">Owner: {lead.owner.fullName}</Text>}
        {lead.campaign && <Text variant="caption" className="text-[13px]">Campaign: {lead.campaign.name}</Text>}
      </View>

      {(() => {
        const rows = enrichmentRows(lead.enrichment);
        const canEnrich = can("crm:write", "outreach:write");
        if (!rows.length && !canEnrich) return null;
        return (
          <>
            <SectionTitle title="AI insights" />
            {!!rows.length && (
              <Card className="mx-5 mb-3 overflow-hidden">
                {rows.map((row, i) => (
                  <View key={row.key} className={`px-4 py-3 ${i ? "border-t border-border" : ""}`}>
                    <Text variant="caption">{row.label}</Text>
                    <Text selectable className="mt-0.5 text-[14px] leading-5">
                      {row.text}
                    </Text>
                  </View>
                ))}
              </Card>
            )}
            {canEnrich && <Button className="mx-5" variant="secondary" title={rows.length ? "Enrich again" : "Enrich with AI"} icon={<Sparkles size={16} color={colors.foreground} />} loading={enriching} onPress={enrich} />}
            {enrichError && <Text className="mx-6 mt-2 text-[13px] text-destructive">{enrichError}</Text>}
          </>
        );
      })()}

      {(!!lead.deals?.length || can("crm:write", "outreach:write")) && (
        <>
          <SectionTitle
            title="Deals"
            action={can("crm:write", "outreach:write") ? <HeaderButton icon={Plus} label="Add deal" onPress={() => router.push({ pathname: "/crm/deal-form", params: { primaryLeadId: id } })} /> : undefined}
          />
          <Card className="mx-5">
            {lead.deals?.map((d, i) => (
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
    </ScrollScreen>
  );
}
