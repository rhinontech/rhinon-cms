import { useRev } from "@/lib/store";
import { View, Text, Span, Pressable, TextInput, Link } from "@/components/rn";
import { ChevronRight, Download, Eye, EyeOff, Plus, Receipt } from "@/components/icons";
import { useState } from "react";
import { Amount, Line, usePayGate } from "@/components/rhinon/pay";
import {
  Badge,
  Button,
  Chip,
  Display,
  Empty,
  Eyebrow,
  Fab,
  Field,
  Meta,
  Screen,
  SectionLabel,
  Segmented,
  Sheet,
  TopBar,
  inputClass,
  stagger,
} from "@/components/rhinon/ui";
import { lakh, rupee } from "@/lib/format";
import { PAYSLIPS, SALARY_STRUCTURE, deducted, gross, net, type Claim } from "@/lib/mock-data";
import { actions, useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
type Tab = "slips" | "claims" | "salary";
const CLAIM_TONE = {
  Pending: "sun",
  Approved: "leaf",
  Paid: "cobalt",
  Rejected: "coral",
} as const;
export default function PayPage() {
  useRev();
  const [tab, setTab] = useState<Tab>("slips");
  const { hidden, toggle, overlay } = usePayGate();
  const claims = useApp((s) => s.claims);
  const [claiming, setClaiming] = useState(false);
  const latest = PAYSLIPS[0];
  const ytd = PAYSLIPS.slice(0, 7);
  if (!latest) {
    return (
      <Screen>
        <TopBar title="Pay" fallback="/more" />
        <Empty title="No payslips yet" body="Payslips appear here once payroll has run." tone="sun" />
      </Screen>
    );
  }
  const takeHome = net(latest) / gross(latest);
  return (
    <Screen fab={tab === "claims"}>
      <View className="animate-rise">
        <Eyebrow tone="sun">Pay · {latest.month}</Eyebrow>
        <Display size="hero" className="mt-3">
          Your
          {"\n"}
          pay.
        </Display>
      </View>

      <View
        className="mt-6 animate-rise overflow-hidden rounded-4xl bg-sun p-5 text-sun-foreground"
        style={stagger(1)}
      >
        <View className="flex items-center justify-between">
          <Span className="font-mono text-[11px] font-medium uppercase tracking-[0.18em]">
            Net pay · {latest.short}
          </Span>
          <Pressable
            accessibilityLabel={hidden ? "Show amounts" : "Hide amounts"}
            onPress={toggle}
            className="press grid size-10 place-items-center rounded-full bg-ink/10"
          >
            {hidden ? <EyeOff size={19} /> : <Eye size={19} />}
          </Pressable>
        </View>
        <Text className="mt-5 font-display text-[length:calc(78px*var(--ds))] font-black leading-[0.8]">
          <Amount value={net(latest)} hidden={hidden} />
        </Text>
        <Text className="mt-3 text-[14.5px]">
          Paid {latest.paidOn} · {SALARY_STRUCTURE.bank}
        </Text>

        <View className="mt-5 flex h-3 overflow-hidden rounded-full bg-ink/10">
          <View
            className="h-full bg-ink"
            style={{
              width: `${Math.round(takeHome * 100)}%`,
            }}
          />
          <View className="h-full flex-1 bg-coral" />
        </View>
        <View className="mt-2 flex justify-between font-mono text-[11px] uppercase tracking-[0.12em]">
          <Span>Take-home {Math.round(takeHome * 100)}%</Span>
          <Span>
            Deductions <Amount value={deducted(latest)} hidden={hidden} />
          </Span>
        </View>

        <View className="mt-5 grid grid-cols-[1fr_auto] gap-2.5">
          <Link
            to="/pay/$slipId"
            params={{
              slipId: latest.id,
            }}
            className="press inline-flex h-12 items-center justify-center rounded-full bg-ink text-[15px] font-semibold text-paper"
          >
            View payslip
          </Link>
          <Pressable
            accessibilityLabel="Download PDF"
            onPress={() => actions.toast("Payslip saved to Files", "sun")}
            className="press grid size-12 place-items-center rounded-full border border-ink/25"
          >
            <Download size={19} />
          </Pressable>
        </View>
      </View>

      <Segmented
        className="mt-6"
        value={tab}
        onChange={setTab}
        options={[
          {
            value: "slips",
            label: "Payslips",
          },
          {
            value: "claims",
            label: "Claims",
            badge: claims.filter((c) => c.status === "Pending").length || undefined,
          },
          {
            value: "salary",
            label: "Salary",
          },
        ]}
      />

      {tab === "slips" ? (
        <View className="mt-6">
          <View className="grid grid-cols-2 gap-2.5">
            <View className="rounded-2xl bg-sun/35 p-4">
              <Text className="font-display text-[length:calc(34px*var(--ds))] font-black leading-none">
                {hidden ? "₹ •••" : lakh(ytd.reduce((s, p) => s + gross(p), 0))}
              </Text>
              <Text className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink/60">
                Earned so far
              </Text>
            </View>
            <View className="rounded-2xl bg-coral/15 p-4">
              <Text className="font-display text-[length:calc(34px*var(--ds))] font-black leading-none">
                {hidden
                  ? "₹ •••"
                  : lakh(ytd.reduce((s, p) => s + (p.deductions[2]?.amount ?? 0), 0))}
              </Text>
              <Text className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink/60">
                Tax so far
              </Text>
            </View>
          </View>

          <SectionLabel className="mt-8">All payslips</SectionLabel>
          <View className="mt-2">
            {PAYSLIPS.map((p, i) => (
              <View
                key={p.id}
                className="press relative animate-rise border-b border-line/70 last:border-0"
                style={stagger(Math.min(i, 6))}
              >
                <Link
                  to="/pay/$slipId"
                  params={{
                    slipId: p.id,
                  }}
                  aria-label={`${p.month} payslip`}
                  className="flex items-center gap-4 py-3.5"
                >
                  <View className="grid size-14 shrink-0 place-items-center rounded-2xl bg-paper-deep font-display text-[length:calc(26px*var(--ds))] font-black uppercase leading-none">
                    {p.short}
                  </View>
                  <View className="min-w-0 flex-1">
                    <View className="block text-[16px] font-semibold leading-tight">{p.month}</View>
                    <View className="mt-1 block text-[13px] text-ink/55">
                      Paid {p.paidOn.slice(0, 6)}
                    </View>
                  </View>
                  <View className="text-right">
                    <View className="block font-display text-[length:calc(26px*var(--ds))] font-black leading-none">
                      <Amount value={net(p)} hidden={hidden} />
                    </View>
                    <Badge tone="leaf" className="mt-1.5">
                      Paid
                    </Badge>
                  </View>
                  <ChevronRight size={18} className="shrink-0 text-ink/30" />
                </Link>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {tab === "claims" ? (
        <View className="mt-6">
          <View className="grid grid-cols-2 gap-2.5">
            <View className="rounded-2xl bg-sun/35 p-4">
              <Text className="font-display text-[length:calc(34px*var(--ds))] font-black leading-none">
                {rupee(
                  claims.filter((c) => c.status === "Pending").reduce((s, c) => s + c.amount, 0),
                )}
              </Text>
              <Text className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink/60">
                Waiting for approval
              </Text>
            </View>
            <View className="rounded-2xl bg-leaf/15 p-4">
              <Text className="font-display text-[length:calc(34px*var(--ds))] font-black leading-none">
                {rupee(
                  claims.filter((c) => c.status === "Approved").reduce((s, c) => s + c.amount, 0),
                )}
              </Text>
              <Text className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink/60">
                Pays with payslip
              </Text>
            </View>
          </View>
          <View className="mt-5 space-y-2.5">
            {claims.map((c, i) => (
              <View
                key={c.id}
                className="animate-rise rounded-2xl border border-line/70 bg-card p-4"
                style={stagger(Math.min(i, 5))}
              >
                <View className="flex items-start justify-between gap-3">
                  <View className="min-w-0">
                    <Text className="text-[16px] font-semibold leading-snug">{c.title}</Text>
                    <Text className="mt-1 font-mono text-[11px] uppercase tracking-[0.1em] text-ink/50">
                      {c.category} · {c.month} · {c.payout}
                    </Text>
                  </View>
                  <Text className="shrink-0 font-display text-[length:calc(28px*var(--ds))] font-black leading-none">
                    {rupee(c.amount)}
                  </Text>
                </View>
                <View className="mt-3 flex items-center gap-2">
                  <Badge tone={CLAIM_TONE[c.status]}>{c.status}</Badge>
                  <View className="flex items-center gap-1 text-[12px] text-ink/45">
                    <Receipt size={13} /> receipt
                  </View>
                </View>
                {c.note ? (
                  <Text className="mt-3 rounded-xl bg-paper-deep px-3 py-2 text-[13.5px] italic text-ink/70">
                    “{c.note}”
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {tab === "salary" ? (
        <View className="mt-6">
          <View className="rounded-3xl bg-ink p-5 text-paper">
            <Text className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-on-ink-accent">
              Annual CTC
            </Text>
            <Text className="mt-3 font-display text-[length:calc(64px*var(--ds))] font-black leading-[0.82]">
              <Amount value={SALARY_STRUCTURE.annual} hidden={hidden} />
            </Text>
            <Text className="mt-3 text-[14.5px] text-paper/60">{SALARY_STRUCTURE.variable}</Text>
          </View>

          <SectionLabel className="mt-8">Monthly structure</SectionLabel>
          <View className="mt-3">
            {latest.earnings.map((l) => (
              <Line key={l.label} label={l.label} value={l.amount} hidden={hidden} />
            ))}
            <Line label="Gross" value={gross(latest)} hidden={hidden} strong />
          </View>

          <SectionLabel className="mt-8">Bank and statutory</SectionLabel>
          <View className="mt-3 grid grid-cols-2 gap-2.5">
            <Meta label="Account">{SALARY_STRUCTURE.bank}</Meta>
            <Meta label="PAN">{SALARY_STRUCTURE.pan}</Meta>
            <Meta label="UAN" className="col-span-2">
              {SALARY_STRUCTURE.uan}
            </Meta>
          </View>
          <Text className="mt-4 text-[13px] leading-relaxed text-ink/55">
            Read-only. Salary changes are made by HR on the web and appear here after approval.
          </Text>
        </View>
      ) : null}

      {tab === "claims" ? (
        <Fab icon={Plus} label="New claim" tone="sun" onClick={() => setClaiming(true)} />
      ) : null}
      <ClaimSheet open={claiming} onClose={() => setClaiming(false)} />
      {overlay}
    </Screen>
  );
}
const CATEGORIES = ["Travel", "Meals", "Learning", "Equipment", "Other"];
function ClaimSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Travel");
  const [amount, setAmount] = useState("");
  const [payout, setPayout] = useState<Claim["payout"]>("With payslip");
  const [receipt, setReceipt] = useState(false);
  const value = Number(amount.replace(/[^\d]/g, ""));
  const submit = () => {
    if (!title.trim() || !value) return;
    actions.addClaim({
      title: title.trim(),
      category,
      amount: value,
      payout,
    });
    setTitle("");
    setAmount("");
    setReceipt(false);
    onClose();
  };
  return (
    <Sheet open={open} onClose={onClose} eyebrow="Reimbursement" title="What did you spend?">
      <View className="space-y-5">
        <Field label="What for">
          <TextInput
            className={inputClass}
            value={title}
            onChangeText={(text) => setTitle(text)}
            placeholder="e.g. Cab to client site"
          />
        </Field>
        <Field label="Amount">
          <View className="relative">
            <View className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-display text-[length:calc(24px*var(--ds))] font-black">
              ₹
            </View>
            <TextInput
              className={cn(inputClass, "pl-10 font-mono")}
              value={amount}
              onChangeText={(text) => setAmount(text)}
              placeholder="0"
            />
          </View>
        </Field>
        <Field label="Category">
          <View className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
            {CATEGORIES.map((c) => (
              <Chip key={c} tone="sun" active={category === c} onClick={() => setCategory(c)}>
                {c}
              </Chip>
            ))}
          </View>
        </Field>
        <Field label="Paid out">
          <View className="flex gap-2">
            {(["With payslip", "Direct"] as Claim["payout"][]).map((p) => (
              <Chip key={p} active={payout === p} onClick={() => setPayout(p)}>
                {p}
              </Chip>
            ))}
          </View>
        </Field>
        <Pressable
          onPress={() => setReceipt((r) => !r)}
          className={cn(
            "press flex h-16 w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed text-[15px] font-medium",
            receipt ? "border-leaf bg-leaf/10 text-ink" : "border-ink/25 text-ink/60",
          )}
        >
          <Receipt size={20} />
          {receipt ? "receipt-1184.jpg attached" : "Add a photo of the receipt"}
        </Pressable>
        <Button tone="ink" onClick={submit} disabled={!title.trim() || !value}>
          Submit claim
        </Button>
      </View>
    </Sheet>
  );
}
