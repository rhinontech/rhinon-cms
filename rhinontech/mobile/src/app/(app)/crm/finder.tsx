import { useState } from "react";
import { Pressable, ScrollView, View, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Check, Search, Sparkles } from "lucide-react-native";
import { api } from "@/lib/api";
import { useTheme } from "@/lib/theme";
import { success, tap } from "@/lib/haptics";
import { Backdrop, BackButton, Badge, Button, Card, EmptyState, GlassHeader, Input, SectionTitle, Text, type Tone } from "@/components/ui";

interface Person {
  name: string;
  title: string | null;
  linkedinUrl: string | null;
  email: string | null;
  confidence: "found" | "pattern" | "guess" | null;
  alternatives: string[];
}
interface FinderResult {
  company: string;
  website: string;
  people: Person[];
  notes: string[];
}
type VerifyStatus = "verified" | "invalid" | "catchall" | "unknown";
interface VerifyResult {
  email: string;
  status: VerifyStatus;
}

const CONFIDENCE: Record<string, { label: string; tone: Tone }> = {
  found: { label: "Found", tone: "success" },
  pattern: { label: "Likely", tone: "brand" },
  guess: { label: "Guess", tone: "warning" },
};
const CHECKED: Record<VerifyStatus, { label: string; tone: Tone }> = {
  verified: { label: "Verified", tone: "success" },
  invalid: { label: "Invalid", tone: "danger" },
  catchall: { label: "Catch-all", tone: "warning" },
  unknown: { label: "Unknown", tone: "neutral" },
};

/** Company name or website in, people and likely emails out; you import the ones you pick. */
export default function LeadFinderScreen() {
  const { colors } = useTheme();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FinderResult | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [checks, setChecks] = useState<Record<number, VerifyResult>>({});
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const search = async () => {
    const q = query.trim();
    setSearching(true);
    setError(null);
    setDone(null);
    setResult(null);
    try {
      const r = await api.post<FinderResult>("/leads/finder", /^\S+\.\S{2,}$/.test(q) ? { website: q } : { company: q });
      setResult(r);
      // Same default as the web panel: everyone whose email is better than a guess.
      setSelected(new Set(r.people.flatMap((p, i) => (p.email && p.confidence !== "guess" ? [i] : []))));
      setChecks({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const toggle = (i: number) => {
    tap();
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const emailOf = (i: number) => checks[i]?.email ?? result?.people[i]?.email ?? null;

  const verify = async () => {
    if (!result) return;
    setChecking(true);
    setError(null);
    try {
      const found: Record<number, VerifyResult> = {};
      for (const i of selected) {
        const p = result.people[i];
        if (!p.email || checks[i]) continue;
        const { best, tried } = await api.post<{ best: VerifyResult | null; tried: VerifyResult[] }>("/leads/finder/verify", { emails: [p.email, ...p.alternatives] });
        const pick = best ?? tried[0];
        if (pick) found[i] = pick;
      }
      setChecks((cur) => ({ ...cur, ...found }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't check those emails");
    } finally {
      setChecking(false);
    }
  };

  const importLeads = async () => {
    if (!result) return;
    setSaving(true);
    setError(null);
    try {
      const leads = [...selected].flatMap((i) => {
        const p = result.people[i];
        const email = emailOf(i);
        if (!email) return [];
        const status = checks[i]?.status;
        return [{ name: p.name, email, company: result.company, title: p.title, linkedinUrl: p.linkedinUrl, website: result.website, emailStatus: status === "verified" || status === "catchall" ? status : p.confidence, source: "Lead Finder" }];
      });
      const res = await api.post<{ imported: number; duplicates: number }>("/leads/import", { newGroupName: `Lead Finder · ${result.company}`, leads });
      success();
      setSelected(new Set());
      setDone(`Added ${res.imported} lead${res.imported === 1 ? "" : "s"}${res.duplicates ? `, ${res.duplicates} already in your CRM` : ""}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add those leads");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-background">
      <Backdrop />
      <GlassHeader left={<BackButton />} title="Lead finder" />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 48 }}>
        <View className="gap-3 px-5 pt-4">
          <Input label="Company name or website" value={query} onChangeText={setQuery} placeholder="acme.com" autoCapitalize="none" autoCorrect={false} returnKeyType="search" onSubmitEditing={() => query.trim() && void search()} />
          <Button title="Find people" icon={<Search size={16} color={colors.primaryForeground} />} loading={searching} disabled={!query.trim()} onPress={search} />
          {error && (
            <View className="rounded-xl bg-destructive/10 px-3.5 py-3">
              <Text className="text-[13px] text-destructive">{error}</Text>
            </View>
          )}
          {done && (
            <Pressable onPress={() => router.back()} className="rounded-xl bg-success/10 px-3.5 py-3">
              <Text className="text-[13px] text-success">{done} Tap to go back to your leads.</Text>
            </Pressable>
          )}
        </View>

        {searching ? (
          <View className="items-center gap-3 py-12">
            <ActivityIndicator color={colors.mutedForeground} />
            <Text variant="caption" className="text-[13px]">
              Searching. This can take a little while.
            </Text>
          </View>
        ) : !result ? (
          <EmptyState icon={Sparkles} title="Find people at any company" message="You'll choose who to add before anything is saved." />
        ) : (
          <>
            <SectionTitle title={`${result.company} (${result.people.length})`} />
            {result.people.length ? (
              <Card className="mx-5 overflow-hidden">
                {result.people.map((p, i) => {
                  const on = selected.has(i);
                  const email = emailOf(i);
                  const badge = checks[i] ? CHECKED[checks[i].status] : p.confidence ? CONFIDENCE[p.confidence] : null;
                  return (
                    <Pressable key={i} disabled={!email} accessibilityRole="checkbox" accessibilityState={{ checked: on, disabled: !email }} onPress={() => toggle(i)} className={`flex-row items-center gap-3 px-4 py-3 ${i ? "border-t border-border" : ""} ${email ? "" : "opacity-50"}`}>
                      <View className={`h-5 w-5 items-center justify-center rounded-full ${on ? "bg-brand" : "border-2 border-border"}`}>{on && <Check size={13} color={colors.brandForeground} strokeWidth={3} />}</View>
                      <View className="flex-1">
                        <Text numberOfLines={1} className="font-medium text-[15px]">
                          {p.name}
                        </Text>
                        {!!p.title && (
                          <Text numberOfLines={1} variant="caption">
                            {p.title}
                          </Text>
                        )}
                        <Text numberOfLines={1} variant="caption" className="mt-0.5 text-[13px]">
                          {email ?? "No email found"}
                        </Text>
                      </View>
                      {badge && <Badge label={badge.label} tone={badge.tone} />}
                    </Pressable>
                  );
                })}
              </Card>
            ) : (
              <Text variant="caption" className="px-5 text-[13px]">
                Nobody turned up for this company.
              </Text>
            )}
            {result.notes.map((n, i) => (
              <Text key={i} variant="caption" className="mx-6 mt-2 text-[13px] leading-[18px]">
                {n}
              </Text>
            ))}
            {selected.size > 0 && (
              <View className="mt-5 flex-row gap-3 px-5">
                <Button className="flex-1" variant="secondary" title="Check emails" loading={checking} disabled={saving} onPress={verify} />
                <Button className="flex-1" title={`Add ${selected.size}`} loading={saving} disabled={checking} onPress={importLeads} />
              </View>
            )}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
