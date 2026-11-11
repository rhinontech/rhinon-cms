import { View, Text, Span, Pressable, TextInput } from "@/components/rn";
import { ArrowRight, Eye, EyeOff, TriangleAlert } from "@/components/icons";
import { useEffect, useRef, useState } from "react";
import {
  Button,
  Display,
  Eyebrow,
  Field,
  Logo,
  Screen,
  Sheet,
  inputClass,
  stagger,
} from "@/components/rhinon/ui";
import { ApiError, login, loginMfa } from "@/lib/api";
import { DEMO } from "@/lib/demo";
import { actions } from "@/lib/store";
import { cn } from "@/lib/utils";
type Step = "credentials" | "code";
type TextInputHandle = { focus: () => void };

/** Four colour pillars: the four home tiles, standing up. */
function Pillars({ small = false }: { small?: boolean }) {
  const pillars = [
    {
      cls: "bg-coral",
      h: small ? 64 : 118,
    },
    {
      cls: "bg-cobalt",
      h: small ? 96 : 172,
    },
    {
      cls: "bg-sun",
      h: small ? 48 : 92,
    },
    {
      cls: "bg-leaf",
      h: small ? 80 : 142,
    },
  ];
  return (
    <View className={cn("relative flex items-end gap-2.5", small ? "h-24" : "h-[172px]")}>
      {pillars.map((p, i) => (
        <View
          key={p.cls}
          className={cn("w-full animate-rise rounded-t-[999px] rounded-b-2xl", p.cls)}
          style={{
            height: p.h,
            ...stagger(i),
          }}
        />
      ))}
      <View
        className={cn(
          "absolute -top-1 right-3 rounded-full bg-violet",
          small ? "size-8" : "size-12",
        )}
        style={stagger(5)}
      />
    </View>
  );
}
export default function LoginPage() {
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState(DEMO ? "kabir@rhinontech.in" : "");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [forgot, setForgot] = useState(false);
  const mfa = useRef<string | null>(null);
  const refs = useRef<(TextInputHandle | null)[]>([]);

  const submitCredentials = async () => {
    setError(null);
    if (!email.includes("@") || !password || busy) return;
    setBusy(true);
    try {
      const r = await login(email.trim(), password);
      if (r) {
        mfa.current = r.mfaToken;
        setStep("code");
      } else actions.toast("Signed in", "leaf");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Can't reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };
  const verify = async (digits: string) => {
    setError(null);
    setBusy(true);
    try {
      await loginMfa(mfa.current ?? "", digits);
      actions.toast("Welcome back", "leaf");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Can't reach the server. Check your connection and try again.");
      setCode(["", "", "", "", "", ""]);
      setTimeout(() => refs.current[0]?.focus(), 50);
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    if (step === "code" && code.every(Boolean)) void verify(code.join(""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, step]);
  useEffect(() => {
    if (step === "code") refs.current[0]?.focus();
  }, [step]);
  const setDigit = (i: number, v: string) => {
    const digits = v.replace(/\D/g, "");
    if (digits.length > 1) {
      // a pasted or auto-filled code
      const t = digits.slice(0, 6);
      setCode(Array.from({ length: 6 }, (_, k) => t[k] ?? ""));
      refs.current[Math.min(t.length, 5)]?.focus();
      return;
    }
    setCode((c) => c.map((x, k) => (k === i ? digits : x)));
    if (digits && i < 5) refs.current[i + 1]?.focus();
  };
  const onKey = (i: number, key: string) => {
    if (key === "Backspace" && !code[i] && i > 0) refs.current[i - 1]?.focus();
  };
  return (
    <Screen>
      <View className="flex animate-rise items-center gap-2.5">
        <Logo size={36} />
        <Span className="font-mono text-[11px] font-medium uppercase tracking-[0.24em] text-ink/70">
          Rhinon
        </Span>
      </View>

      <View className="mt-8">
        <Pillars small={step === "code"} />
      </View>

      {step === "credentials" ? (
        <View key="credentials" className="mt-8 animate-rise">
          <Eyebrow tone="coral">Sign in · Rhinon Tech</Eyebrow>
          <Display size="hero" className="mt-3">
            Hello
            {"\n"}
            again.
          </Display>
          <Text className="mt-4 text-[16px] leading-relaxed text-ink/60">
            Use your work email. We'll ask for your authenticator code next.
          </Text>

          <View className="mt-6 gap-4">
            <Field label="Work email">
              <TextInput
                className={inputClass}
                value={email}
                onChangeText={(text) => setEmail(text)}
                placeholder="you@company.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </Field>
            <Field label="Password">
              <View className="relative">
                <TextInput
                  className={cn(inputClass, "pr-14")}
                  secureTextEntry={!show}
                  autoCapitalize="none"
                  onSubmitEditing={() => void submitCredentials()}
                  value={password}
                  onChangeText={(text) => setPassword(text)}
                  placeholder="Your password"
                />
                <Pressable
                  accessibilityLabel={show ? "Hide password" : "Show password"}
                  onPress={() => setShow((s) => !s)}
                  className="absolute right-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full text-ink/50"
                >
                  {show ? <EyeOff size={19} /> : <Eye size={19} />}
                </Pressable>
              </View>
            </Field>

            {error ? <ErrorLine>{error}</ErrorLine> : null}

            <Button
              tone="ink"
              onPress={() => void submitCredentials()}
              trailing={busy ? undefined : ArrowRight}
              disabled={busy || !password || !email}
            >
              {busy ? <Spinner /> : "Sign in"}
            </Button>
          </View>

          <Pressable
            onPress={() => setForgot(true)}
            className="mt-4 block w-full text-center font-mono text-[11px] uppercase tracking-[0.16em] text-ink/60 underline underline-offset-4"
          >
            Forgot password?
          </Pressable>
          <Text className="mt-8 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-ink/35">
            Guests and clients use the web portal
          </Text>
        </View>
      ) : (
        <View key="code" className="mt-8 animate-rise">
          <Eyebrow tone="coral">Authenticator app</Eyebrow>
          <Display size="hero" className="mt-3">
            Two-step
            {"\n"}
            check.
          </Display>
          <Text className="mt-4 text-[16px] leading-relaxed text-ink/60">
            Enter the 6-digit code for <Span className="font-semibold text-ink">{email}</Span>.
          </Text>

          <View className="mt-6 grid grid-cols-6 gap-2">
            {code.map((d, i) => (
              <TextInput
                key={i}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                value={d}
                accessibilityLabel={`Digit ${i + 1}`}
                maxLength={1}
                editable={!busy}
                onChangeText={(text) => setDigit(i, text)}
                onKeyPress={(e) => onKey(i, e.nativeEvent.key)}
                keyboardType="number-pad"
                selectTextOnFocus
                className={cn(
                  "h-16 w-full rounded-2xl border bg-card text-center font-display text-[length:calc(34px*var(--ds))] font-black outline-none transition-colors focus:border-ink",
                  d ? "border-ink" : "border-line",
                  error && "border-coral",
                )}
              />
            ))}
          </View>

          {error ? <ErrorLine className="mt-4">{error}</ErrorLine> : null}
          {busy ? (
            <View className="mt-5 flex items-center justify-center gap-2.5">
              <Spinner dark />
              <Text className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink/60">Checking</Text>
            </View>
          ) : (
            <Text className="mt-5 text-center text-[13px] text-ink/50">
              Open your authenticator app and enter the current code.
            </Text>
          )}

          <View className="mt-6 grid gap-2.5">
            <Button
              tone="outline"
              onClick={() => actions.toast("Backup codes are in your security settings", "violet")}
            >
              Use a backup code
            </Button>
            <Button
              tone="ghost"
              onClick={() => {
                setStep("credentials");
                setCode(["", "", "", "", "", ""]);
                setError(null);
              }}
            >
              Back
            </Button>
          </View>
        </View>
      )}

      <Sheet
        open={forgot}
        onClose={() => setForgot(false)}
        eyebrow="Password"
        title="Reset it by email"
      >
        <View className="space-y-5">
          <Field label="Work email">
            <TextInput
              className={inputClass}
              value={email}
              onChangeText={(text) => setEmail(text)}
              keyboardType="email-address"
            />
          </Field>
          <Button
            tone="ink"
            onClick={() => {
              setForgot(false);
              actions.toast("Reset link sent. Check your inbox.", "coral");
            }}
          >
            Send reset link
          </Button>
        </View>
      </Sheet>
    </Screen>
  );
}
function ErrorLine({ children, className }: { children: string; className?: string }) {
  return (
    <View
      className={cn(
        "flex items-start gap-2.5 rounded-2xl bg-coral/12 px-4 py-3 text-[14px] leading-snug text-coral-deep",
        className,
      )}
    >
      <TriangleAlert size={18} className="mt-0.5 shrink-0" />
      <Text className="shrink">{children}</Text>
    </View>
  );
}
function Spinner({ dark = false }: { dark?: boolean }) {
  return (
    <View
      className={cn(
        "inline-block size-5 animate-spin rounded-full border-2",
        dark ? "border-ink/20 border-t-ink" : "border-paper/30 border-t-paper",
      )}
    />
  );
}
