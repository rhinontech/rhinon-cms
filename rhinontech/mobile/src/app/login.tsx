import { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Lock, Mail, ShieldCheck } from "lucide-react-native";
import { useAuth } from "@/lib/auth";
import { API_URL } from "@/lib/api";
import { lift, useTheme } from "@/lib/theme";
import { success } from "@/lib/haptics";
import { Backdrop, Button, Input, Text } from "@/components/ui";

export default function LoginScreen() {
  const { signIn, verifyMfa } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const passwordRef = useRef<React.ComponentRef<typeof TextInput>>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      if (mfaToken) {
        await verifyMfa(mfaToken, code);
        success();
      } else {
        const res = await signIn(email, password);
        if (res.status === "mfa") setMfaToken(res.mfaToken);
        else success();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  const canSubmit = mfaToken ? code.trim().length >= 6 : email.trim() && password;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-background">
      <Backdrop />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 56, paddingBottom: insets.bottom + 20, paddingHorizontal: 20 }}>
        <View className="mb-8 px-1">
          <View className="mb-7 h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Text className="font-bold text-[22px] leading-7 text-primary-foreground">R</Text>
          </View>
          <Text variant="largeTitle">{mfaToken ? "Two-step check" : "Welcome back"}</Text>
          <Text className="mt-1.5 text-muted-foreground">{mfaToken ? "Enter the 6-digit code from your authenticator app." : "Sign in to your Rhinon workspace."}</Text>
        </View>

        {/* The panel's `glass-modal`. */}
        <View className="gap-4 rounded-3xl p-5" style={[{ backgroundColor: colors.glassModal, borderWidth: 1, borderColor: colors.glassEdge }, lift(colors.shadow, "panel")]}>
          {mfaToken ? (
            <Input
              label="Authentication code"
              icon={<ShieldCheck size={19} color={colors.mutedForeground} />}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
              maxLength={8}
              autoFocus
              onSubmitEditing={submit}
            />
          ) : (
            <>
              <Input
                label="Email"
                icon={<Mail size={19} color={colors.mutedForeground} />}
                value={email}
                onChangeText={setEmail}
                placeholder="you@company.com"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="username"
                autoComplete="email"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
              <Input
                ref={passwordRef}
                label="Password"
                icon={<Lock size={19} color={colors.mutedForeground} />}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                textContentType="password"
                autoComplete="current-password"
                returnKeyType="go"
                onSubmitEditing={submit}
              />
            </>
          )}

          {error && (
            <View className="rounded-xl bg-destructive/10 px-3.5 py-3">
              <Text className="text-[13px] text-destructive">{error}</Text>
            </View>
          )}

          <Button title={mfaToken ? "Verify" : "Sign in"} onPress={submit} loading={busy} disabled={!canSubmit} className="mt-2" />
          {mfaToken && (
            <Button
              title="Use a different account"
              variant="ghost"
              onPress={() => {
                setMfaToken(null);
                setCode("");
                setError(null);
              }}
            />
          )}

        </View>

        <View className="mt-auto items-center pt-8">
          <Text variant="caption">{API_URL.replace(/^https?:\/\//, "")}</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
