import { getSession } from "@/lib/api";
import { useRev } from "@/lib/store";
import { View, Text, Span, Pressable, TextInput } from "@/components/rn";
import { useLocalSearchParams } from "expo-router";
import { useRouter } from "@/lib/router";
import { Check, ShieldCheck } from "@/components/icons";
import { useState } from "react";
import { SignaturePad } from "@/components/rhinon/signature";
import {
  Button,
  Display,
  Empty,
  Eyebrow,
  ProgressBar,
  Screen,
  SectionLabel,
  Segmented,
  TopBar,
  inputClass,
} from "@/components/rhinon/ui";
import { ME } from "@/lib/mock-data";
import { DOC_BODY } from "@/lib/mock-more";
import { actions, useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
export default function SignPage() {
  useRev();
  const { docId } = useLocalSearchParams<{
    docId: string;
  }>();
  const doc = useApp((s) => s.docs.find((d) => d.id === docId));
  const router = useRouter();
  const [mode, setMode] = useState<"type" | "draw">("type");
  const [name, setName] = useState<string>(ME.name);
  const [inked, setInked] = useState(false);
  const [agree, setAgree] = useState(false);
  const [done, setDone] = useState(false);
  if (!doc) {
    return (
      <Screen>
        <TopBar title="Sign" fallback="/documents" />
        <Empty title="Document not found" body="It may have been withdrawn by HR." tone="sun" />
      </Screen>
    );
  }
  const body = DOC_BODY[doc.id] ?? [
    "This document is shown here for your review. Read it through, then sign below.",
  ];
  const ready = agree && (mode === "type" ? name.trim().length > 2 : inked);
  if (done || doc.state === "signed") {
    return (
      <Screen>
        <TopBar title="Signed" fallback="/documents" back={false} />
        <View className="flex flex-1 flex-col items-center justify-center text-center">
          <View className="grid size-28 animate-pop place-items-center rounded-[calc(var(--radius)+16px)] bg-leaf text-leaf-foreground">
            <Check size={56} strokeWidth={2.6} />
          </View>
          <Display size="xl" className="mt-8">
            Signed.
          </Display>
          <Text className="mt-3 max-w-[280px] text-[15.5px] leading-relaxed text-ink/60">
            “{doc.name}” is signed and a copy is in your vault. HR has been notified.
          </Text>
          <View className="mt-8 w-full">
            <Button
              tone="ink"
              onClick={() =>
                void router.navigate({
                  to: "/documents",
                })
              }
            >
              Back to documents
            </Button>
          </View>
        </View>
      </Screen>
    );
  }
  return (
    <Screen>
      <TopBar title="Sign" fallback="/documents" />
      <Eyebrow tone="sun">{doc.date}</Eyebrow>
      <Display size="xl" className="mt-2">
        {doc.name}
      </Display>
      <ProgressBar value={ready ? 1 : agree ? 0.66 : 0.33} tone="sun" className="mt-4" />
      <Text className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink/50">
        Step {ready ? 3 : agree ? 2 : 1} of 3 · read, agree, sign
      </Text>

      <View className="mt-5 space-y-3.5 rounded-3xl border border-line bg-card p-5 shadow-sm">
        {body.map((p, i) => (
          <Text
            key={i}
            className={cn("text-[15px] leading-relaxed", i === 0 ? "text-ink" : "text-ink/80")}
          >
            {p}
          </Text>
        ))}
        <Text className="pt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink/40">
          {getSession()?.orgName || "Rhinon Tech"} · Page 1 of 1
        </Text>
      </View>

      <SectionLabel className="mb-3 mt-8">Your signature</SectionLabel>
      <Segmented
        value={mode}
        onChange={setMode}
        options={[
          {
            value: "type",
            label: "Type it",
          },
          {
            value: "draw",
            label: "Draw it",
          },
        ]}
      />
      <View className="mt-3">
        {mode === "type" ? (
          <View>
            <TextInput
              className={inputClass}
              value={name}
              onChangeText={(text) => setName(text)}
              placeholder="Your full name"
              accessibilityLabel="Type your name"
            />
            <View className="mt-3 grid h-32 place-items-center rounded-3xl border-2 border-dashed border-ink/25 bg-card px-4">
              <Span
                className="truncate text-[48px] leading-none text-ink"
                style={{
                  fontFamily: '"Caveat", cursive',
                  fontWeight: 700,
                }}
              >
                {name || "Your name"}
              </Span>
            </View>
          </View>
        ) : (
          <SignaturePad onInk={setInked} />
        )}
      </View>

      <View className="mt-5 flex cursor-pointer items-start gap-3.5 rounded-2xl bg-paper-deep p-4">
        <Pressable
          accessibilityLabel="I have read this and agree"
          onPress={() => setAgree((a) => !a)}
          className={cn(
            "mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg border-2 transition-colors",
            agree ? "border-ink bg-ink text-paper" : "border-ink/30 bg-card",
          )}
        >
          {agree ? <Check size={15} strokeWidth={3.4} /> : null}
        </Pressable>
        <Span className="text-[14px] leading-snug text-ink/80">
          I have read this document and agree that my typed or drawn signature is legally binding.
        </Span>
      </View>

      <Button
        tone="ink"
        className="mt-5"
        icon={ShieldCheck}
        disabled={!ready}
        onClick={() => {
          actions.signDoc(doc.id);
          setDone(true);
        }}
      >
        Sign and submit
      </Button>
    </Screen>
  );
}
