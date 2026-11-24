import { useState } from "react";
import { Linking } from "react-native";
import { View, Text, Span, Pressable, TextInput } from "@/components/rn";
import { Check, Info, Linkedin, Plus, Search, ShieldCheck, TriangleAlert } from "@/components/icons";
import {
  Badge, Button, Chip, Display, Empty, Eyebrow, NoAccess, Screen, SectionLabel, TopBar, inputClass, stagger,
} from "@/components/rhinon/ui";
import { api } from "@/lib/api";
import { actions, useApp, usePerm } from "@/lib/store";
import { type Tone } from "@/lib/tone";
import { cn } from "@/lib/utils";

type Confidence = "found" | "pattern" | "guess";
interface Person {
  name: string;
  title: string | null;
  linkedinUrl: string | null;
  email: string | null;
  confidence: Confidence | null;
  alternatives: string[];
  source: string;
  sources?: string[];
}
interface Result {
  company: string;
  domain: string;
  website: string;
  acceptsMail: boolean;
  publishedEmails: string[];
  pattern: string | null;
  people: Person[];
  notes: string[];
}
type VerifyStatus = "verified" | "invalid" | "catchall" | "unknown";
interface VerifyResult {
  email: string;
  status: VerifyStatus;
  detail: string | null;
}

const CONFIDENCE: Record<Confidence, { label: string; tone: Tone }> = {
  found: { label: "On their site", tone: "leaf" },
  pattern: { label: "Company pattern", tone: "sky" },
  guess: { label: "Guess", tone: "ink" },
};
const VERIFY_META: Record<VerifyStatus | "none", { label: string; tone: Tone }> = {
  verified: { label: "Verified", tone: "leaf" },
  catchall: { label: "Accepts any address", tone: "sun" },
  invalid: { label: "Not found", tone: "coral" },
  none: { label: "No working email", tone: "coral" },
  unknown: { label: "Couldn't check", tone: "ink" },
};

function Spinner() {
  return <View className="size-5 animate-spin rounded-full border-2 border-ink/15 border-t-ink" />;
}

/**
 * Dedicated CRM → Lead Finder screen, ported from the admin panel
 * (components/Admin/CRM/LeadFinder.tsx). Deliberately its own route rather
 * than a CRM tab, until it's been used for real on mobile — then it moves in
 * alongside Pipeline/Leads/Accounts. The daily queue (admin's "Daily queue"
 * tab) isn't ported here; this covers the one-off search + verify + add flow.
 */
export default function CrmFinderScreen() {
  const isPlatformOrg = useApp((s) => s.isPlatformOrg);
  const canWriteCrm = usePerm("crm", "write");
  const canWriteOutreach = usePerm("outreach", "write");
  const canWrite = canWriteCrm || canWriteOutreach;

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [chosenEmail, setChosenEmail] = useState<Record<number, string>>({});
  const [checks, setChecks] = useState<Record<number, { status: VerifyStatus | "none"; detail: string | null }>>({});
  const [checking, setChecking] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  if (!isPlatformOrg || !canWrite) {
    return (
      <Screen>
        <TopBar title="Lead Finder" fallback="/crm" />
        <NoAccess
          title="Not available here"
          body={
            !isPlatformOrg
              ? "Lead Finder is a Rhinon Tech tool and isn't available on this workspace."
              : "Ask an admin for CRM or Outreach write access."
          }
        />
      </Screen>
    );
  }

  const search = async () => {
    const q = query.trim();
    if (!q) return;
    const isSite = /^(https?:\/\/)?[a-z0-9-]+(\.[a-z0-9-]+)+(\/.*)?$/i.test(q);
    setSearching(true);
    setError(null);
    setResult(null);
    try {
      const r = await api<Result>("/leads/finder", { method: "POST", body: isSite ? { website: q } : { company: q } });
      setResult(r);
      setSelected(new Set(r.people.flatMap((p, i) => (p.email && p.confidence !== "guess" ? [i] : []))));
      setChosenEmail({});
      setChecks({});
    } catch (e: any) {
      setError(e?.message ?? "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const emailOf = (i: number) => chosenEmail[i] ?? result?.people[i]?.email ?? null;

  const verify = async (i: number) => {
    if (!result) return;
    const p = result.people[i];
    const current = emailOf(i);
    if (!current) return;
    const emails = [current, ...[p.email, ...p.alternatives].filter((e): e is string => Boolean(e) && e !== current)];
    setChecking((s) => new Set(s).add(i));
    try {
      const { best, tried } = await api<{ best: VerifyResult | null; tried: VerifyResult[] }>("/leads/finder/verify", {
        method: "POST",
        body: { emails },
      });
      if (best) {
        setChosenEmail((c) => ({ ...c, [i]: best.email }));
        setChecks((c) => ({ ...c, [i]: { status: best.status, detail: best.detail } }));
      } else {
        const allInvalid = tried.length > 0 && tried.every((t) => t.status === "invalid");
        setChecks((c) => ({ ...c, [i]: { status: allInvalid ? "none" : "unknown", detail: tried.at(-1)?.detail ?? null } }));
        if (allInvalid) setSelected((s) => { const n = new Set(s); n.delete(i); return n; });
      }
    } catch (e: any) {
      actions.toast(e?.message ?? "Check failed", "coral");
    } finally {
      setChecking((s) => { const n = new Set(s); n.delete(i); return n; });
    }
  };

  const addToCrm = async () => {
    if (!result) return;
    const rows = [...selected]
      .map((i) => ({ p: result.people[i], email: emailOf(i) }))
      .filter((r): r is { p: Person; email: string } => Boolean(r.email));
    if (!rows.length) return;
    setSaving(true);
    try {
      const res = await api<{ imported: number; duplicates: number }>("/leads/import", {
        method: "POST",
        body: {
          newGroupName: `Lead Finder · ${result.company}`,
          leads: rows.map(({ p, email }) => ({
            name: p.name,
            email,
            company: result.company,
            title: p.title,
            linkedinUrl: p.linkedinUrl,
            website: result.website,
            emailStatus: checks[result.people.indexOf(p)]?.status === "verified"
              ? "verified"
              : checks[result.people.indexOf(p)]?.status === "catchall"
                ? "catchall"
                : email === p.email ? p.confidence : "guess",
            source: "Lead Finder",
          })),
        },
      });
      actions.toast(
        `${res.imported} added to CRM${res.duplicates ? ` · ${res.duplicates} already there` : ""}`,
        "leaf",
      );
      setSelected(new Set());
    } catch (e: any) {
      actions.toast(e?.message ?? "Could not add to CRM", "coral");
    } finally {
      setSaving(false);
    }
  };

  const selectableCount = result?.people.filter((p) => p.email).length ?? 0;
  const allSelected = selectableCount > 0 && selected.size === selectableCount;

  return (
    <Screen>
      <TopBar title="Lead Finder" fallback="/crm" />
      <View className="animate-rise">
        <Eyebrow tone="rose">CRM · sourcing</Eyebrow>
        <Display size="hero" className="mt-3">
          Find
          {"\n"}
          the people.
        </Display>
        <Text className="mt-3 text-[14px] leading-relaxed text-ink/60">
          A company name or website in — the people who run it and their likely emails out. Nothing is saved until
          you add it, and nothing is ever emailed from here.
        </Text>
      </View>

      <View className="relative mt-6 block animate-rise" style={stagger(1)}>
        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="e.g. Razorpay or supabase.com"
          className={cn(inputClass, "rounded-full py-3.5 pl-11")}
          autoCapitalize="none"
          returnKeyType="search"
          onSubmitEditing={() => void search()}
          accessibilityLabel="Company name or website"
        />
      </View>
      <Button
        tone="rose"
        className="mt-3"
        disabled={searching || !query.trim()}
        onClick={() => void search()}
        icon={searching ? undefined : Search}
      >
        {searching ? "Searching…" : "Find people"}
      </Button>

      {searching && (
        <View className="mt-5 flex items-center gap-3 rounded-2xl border border-line/70 bg-card p-5">
          <Spinner />
          <Text className="flex-1 text-[13.5px] leading-relaxed text-ink/60">
            Finding the website, reading its pages and searching the web for its leadership — usually 20–40 seconds.
          </Text>
        </View>
      )}

      {error && (
        <View className="mt-5 flex items-start gap-2 rounded-2xl border border-coral/30 bg-coral/10 px-4 py-3.5">
          <TriangleAlert size={16} className="mt-0.5 shrink-0 text-coral-deep" />
          <Text className="flex-1 text-[13.5px] text-coral-deep">{error}</Text>
        </View>
      )}

      {!result && !searching && !error && (
        <View className="mt-6 space-y-2.5">
          {[
            ["1. Finds the company", "From its name with a search, or straight from the website you give."],
            ["2. Finds the people", "Founders and leaders named on the site and across the web, with titles and LinkedIn."],
            ["3. Works out emails", "Uses addresses on their site or their public email format; marks every guess as a guess."],
          ].map(([t, d]) => (
            <View key={t} className="rounded-2xl border border-line/70 bg-card p-4">
              <Text className="text-[14px] font-semibold">{t}</Text>
              <Text className="mt-1 text-[13px] leading-relaxed text-ink/55">{d}</Text>
            </View>
          ))}
        </View>
      )}

      {result && (
        <View className="mt-6">
          {/* Company */}
          <View className="rounded-2xl border border-line/70 bg-card p-4">
            <View className="flex items-center justify-between gap-3">
              <View className="min-w-0 flex-1">
                <Text className="text-[16px] font-semibold">{result.company}</Text>
                <Text className="mt-0.5 truncate text-[12.5px] text-ink/55">{result.domain}</Text>
              </View>
              <Badge tone={result.acceptsMail ? "leaf" : "coral"}>
                {result.acceptsMail ? "Receives email" : "No mail"}
              </Badge>
            </View>
            {result.publishedEmails.length > 0 && (
              <View className="mt-3 flex flex-wrap items-center gap-1.5">
                <Span className="text-[11px] text-ink/45">On their site:</Span>
                {result.publishedEmails.map((e) => (
                  <View key={e} className="rounded-md bg-paper-deep px-2 py-0.5">
                    <Text className="font-mono text-[11px]">{e}</Text>
                  </View>
                ))}
              </View>
            )}
            {result.notes.length > 0 && (
              <View className="mt-3 space-y-1">
                {result.notes.map((n) => (
                  <View key={n} className="flex items-start gap-1.5">
                    <Info size={13} className="mt-0.5 shrink-0 text-ink/40" />
                    <Text className="flex-1 text-[12px] text-ink/55">{n}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* People */}
          {result.people.length === 0 ? (
            <Empty
              tone="rose"
              title="No one to contact"
              body="This domain can't receive email. Check the website address and search again."
            />
          ) : (
            <>
              <View className="mt-5 flex items-center justify-between">
                <SectionLabel right={<Span className="text-ink/45">{selected.size} selected</Span>}>
                  {result.people.length} {result.people.length === 1 ? "person" : "people"}
                </SectionLabel>
                <Pressable
                  onPress={() =>
                    setSelected(allSelected ? new Set() : new Set(result.people.flatMap((p, i) => (p.email ? [i] : []))))
                  }
                >
                  <Text className="text-[12.5px] font-medium text-rose-deep">
                    {allSelected ? "Clear all" : "Select all"}
                  </Text>
                </Pressable>
              </View>

              <View className="mt-2 space-y-2.5">
                {result.people.map((p, i) => {
                  const conf = p.confidence ? CONFIDENCE[p.confidence] : null;
                  const options = p.email ? [p.email, ...p.alternatives] : [];
                  const current = emailOf(i);
                  const isChecking = checking.has(i);
                  const check = checks[i];
                  return (
                    <View key={`${p.name}-${i}`} className="rounded-2xl border border-line/70 bg-card p-3.5">
                      <View className="flex items-start gap-3">
                        <Pressable
                          disabled={!p.email}
                          accessibilityLabel={selected.has(i) ? "Deselect" : "Select"}
                          onPress={() =>
                            setSelected((s) => {
                              const n = new Set(s);
                              if (n.has(i)) n.delete(i);
                              else n.add(i);
                              return n;
                            })
                          }
                          className={cn(
                            "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-2",
                            selected.has(i) ? "border-rose bg-rose text-rose-foreground" : "border-ink/20 bg-transparent",
                            !p.email && "opacity-30",
                          )}
                        >
                          {selected.has(i) ? <Check size={14} strokeWidth={3} /> : null}
                        </Pressable>
                        <View className="min-w-0 flex-1">
                          <View className="flex items-center gap-1.5">
                            <Text className="truncate text-[15px] font-semibold">{p.name}</Text>
                            {p.linkedinUrl && (
                              <Pressable onPress={() => void Linking.openURL(p.linkedinUrl!)}>
                                <Linkedin size={14} className="text-[#0a66c2]" />
                              </Pressable>
                            )}
                          </View>
                          <Text className="truncate text-[12.5px] text-ink/55">
                            {p.title ?? "Title unknown"} · {(p.sources ?? [p.source]).join(" + ")}
                          </Text>

                          {options.length > 0 && (
                            <>
                              <Text className="mt-2 truncate font-mono text-[12.5px] text-ink/80">{current ?? "—"}</Text>
                              {options.length > 1 && (
                                <View className="mt-1.5 flex flex-wrap gap-1.5">
                                  {options.map((o) => (
                                    <Chip key={o} tone="ink" active={current === o} onClick={() => setChosenEmail((c) => ({ ...c, [i]: o }))}>
                                      {o === p.email ? "Primary" : "Alt"}
                                    </Chip>
                                  ))}
                                </View>
                              )}
                            </>
                          )}

                          <View className="mt-2 flex items-center gap-2">
                            {check ? (
                              <Badge tone={VERIFY_META[check.status].tone} dot={check.status !== "verified"}>
                                {VERIFY_META[check.status].label}
                              </Badge>
                            ) : (
                              conf && <Badge tone={conf.tone} dot={false}>{conf.label}</Badge>
                            )}
                            {p.email && check?.status !== "verified" && (
                              <Pressable
                                disabled={isChecking}
                                onPress={() => void verify(i)}
                                className="flex items-center gap-1 rounded-full border border-ink/15 px-2.5 py-1"
                              >
                                {isChecking ? <Spinner /> : <ShieldCheck size={13} />}
                                <Text className="text-[11.5px] font-medium">{isChecking ? "Checking…" : "Verify"}</Text>
                              </Pressable>
                            )}
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>

              <Button
                tone="rose"
                className="mt-4"
                icon={Plus}
                disabled={!selected.size || saving}
                onClick={() => void addToCrm()}
              >
                {saving ? "Adding…" : `Add ${selected.size || ""} to CRM`}
              </Button>
              <Text className="mt-3 px-1 text-[12px] leading-relaxed text-ink/45">
                &ldquo;Verify&rdquo; asks the company&rsquo;s mail server whether the mailbox exists — nothing is sent. Added
                leads land in the CRM list &ldquo;Lead Finder · {result.company}&rdquo;.
              </Text>
            </>
          )}
        </View>
      )}
    </Screen>
  );
}
