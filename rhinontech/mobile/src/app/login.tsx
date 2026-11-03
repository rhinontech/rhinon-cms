import { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Lock, Mail, ShieldCheck } from "lucide-react-native";
import { useAuth } from "@/lib/auth";
import { API_URL } from "@/lib/api";
import { useTheme } from "@/lib/theme";
import { success } from "@/lib/haptics";
import { Button, Input, Text } from "@/components/ui";

export default function LoginScreen() {
  const { signIn, verifyMfa } = useAuth();
  const { colors, isDark } = useTheme();
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
      <LinearGradient
        colors={isDark ? ["#1E1B4B", "#0E0F14"] : ["#EEF2FF", "#FFFFFF"]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 420 }}
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 64, paddingBottom: insets.bottom + 24 }}
      >
        <View className="px-6">
          <View className="mb-10 h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <Text className="font-bold text-[24px] text-primary-foreground">R</Text>
          </View>
          <Text variant="largeTitle">{mfaToken ? "Two-step check" : "Welcome back"}</Text>
          <Text variant="body" className="mt-2 text-muted-foreground">
            {mfaToken ? "Enter the 6-digit code from your authenticator app." : "Sign in to your Rhinon workspace."}
          </Text>

          <View className="mt-9 gap-4">
            {mfaToken ? (
              <Input
                label="Authentication code"
                icon={<ShieldCheck size={18} color={colors.mutedForeground} />}
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
                  icon={<Mail size={18} color={colors.mutedForeground} />}
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
                  icon={<Lock size={18} color={colors.mutedForeground} />}
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
        </View>

        <View className="mt-auto items-center pt-10">
          <Text variant="caption">{API_URL.replace(/^https?:\/\//, "")}</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
