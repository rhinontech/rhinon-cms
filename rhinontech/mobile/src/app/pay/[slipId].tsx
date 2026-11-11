import { useRev } from "@/lib/store";
import { View, Text, Span } from "@/components/rn";
import { useLocalSearchParams } from "expo-router";
import { Download, Eye, EyeOff, Share2 } from "@/components/icons";
import { Amount, Line, usePayGate } from "@/components/rhinon/pay";
import {
  Badge,
  Button,
  Display,
  Empty,
  Eyebrow,
  IconButton,
  Screen,
  SectionLabel,
  TopBar,
} from "@/components/rhinon/ui";
import { PAYSLIPS, SALARY_STRUCTURE, deducted, gross, net } from "@/lib/mock-data";
import { actions } from "@/lib/store";
export default function PayslipPage() {
  useRev();
  const { slipId } = useLocalSearchParams<{
    slipId: string;
  }>();
  const slip = PAYSLIPS.find((p) => p.id === slipId);
  const { hidden, toggle, overlay } = usePayGate();
  if (!slip) {
    return (
      <Screen>
        <TopBar title="Payslip" fallback="/pay" />
        <Empty
          title="Payslip not found"
          body="Payslips appear here once payroll has run."
          tone="sun"
        />
      </Screen>
    );
  }
  const g = gross(slip);
  const d = deducted(slip);
  const n = net(slip);
  return (
    <Screen>
      <TopBar
        title="Payslip"
        fallback="/pay"
        right={
          <>
            <IconButton
              icon={hidden ? EyeOff : Eye}
              label={hidden ? "Show amounts" : "Hide amounts"}
              onClick={toggle}
            />
            <IconButton
              icon={Share2}
              label="Share"
              onClick={() => actions.toast("Link copied", "sun")}
            />
          </>
        }
      />

      <Eyebrow tone="sun">{slip.month}</Eyebrow>
      <Display size="hero" className="mt-3">
        Net pay
      </Display>
      <Text className="mt-5 font-display text-[length:calc(78px*var(--ds))] font-black leading-[0.82]">
        <Amount value={n} hidden={hidden} />
      </Text>
      <View className="mt-4 flex flex-wrap items-center gap-2">
        <Badge tone="leaf">Paid {slip.paidOn}</Badge>
        <Badge tone="ink" dot={false}>
          {SALARY_STRUCTURE.bank}
        </Badge>
      </View>

      <View className="mt-6 flex h-4 overflow-hidden rounded-full bg-ink/10">
        <View
          className="h-full bg-ink"
          style={{
            width: `${Math.round((n / g) * 100)}%`,
          }}
        />
        <View className="h-full flex-1 bg-coral" />
      </View>
      <View className="mt-2 flex justify-between font-mono text-[11px] uppercase tracking-[0.12em] text-ink/60">
        <Span>Take-home</Span>
        <Span>Deductions</Span>
      </View>

      <View className="mt-8 rounded-3xl border border-line/70 bg-card p-5">
        <SectionLabel className="mb-2">Earnings</SectionLabel>
        <View>
          {slip.earnings.map((l) => (
            <Line key={l.label} label={l.label} value={l.amount} hidden={hidden} />
          ))}
          <Line label="Gross earnings" value={g} hidden={hidden} strong />
        </View>

        <SectionLabel className="mb-2 mt-7">Deductions</SectionLabel>
        <View>
          {slip.deductions.map((l) => (
            <Line key={l.label} label={l.label} value={l.amount} hidden={hidden} />
          ))}
          <Line label="Total deductions" value={d} hidden={hidden} strong />
        </View>
      </View>

      <View className="mt-3 rounded-3xl bg-ink p-5 text-paper">
        <Text className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-on-ink-accent">
          Credited to your account
        </Text>
        <Text className="mt-3 font-display text-[length:calc(56px*var(--ds))] font-black leading-[0.85]">
          <Amount value={n} hidden={hidden} />
        </Text>
        <Text className="mt-2 text-[14px] text-paper/60">
          {SALARY_STRUCTURE.bank} · {slip.paidOn}
        </Text>
      </View>

      <View className="mt-5 grid gap-2.5">
        <Button
          tone="ink"
          icon={Download}
          onClick={() => actions.toast("Payslip saved to Files", "sun")}
        >
          Download PDF
        </Button>
        <Button tone="outline" icon={Share2} onClick={() => actions.toast("Link copied", "sun")}>
          Share securely
        </Button>
      </View>

      <Text className="mt-6 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-ink/40">
        Computer generated · no signature required
      </Text>
      {overlay}
    </Screen>
  );
}
