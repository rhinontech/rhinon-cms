import { useState } from "react";
import { View } from "react-native";

import { ApiError, login, loginMfa } from "@/lib/api";
import { Button, Display, Eyebrow, Field, Screen, Text } from "@/ui";

export default function Login() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [code, setCode] = useState("");
  const [mfa, setMfa] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true); setErr("");
    try { await fn(); } catch (e) { setErr(e instanceof ApiError ? e.message : "Can't reach the server."); } finally { setBusy(false); }
  };

  return (
    <Screen>
      <Eyebrow>Rhinon Tech</Eyebrow>
      <Display style={{ marginTop: 12 }}>{"Welcome\nback."}</Display>
      <View style={{ marginTop: 28 }}>
        {!mfa ? (
          <>
            <Field label="Work email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
            <Field label="Password" value={pw} onChangeText={setPw} secureTextEntry />
            {err ? <Text style={{ color: "#c0392b", marginBottom: 10 }}>{err}</Text> : null}
            <Button disabled={!email || !pw || busy} onPress={() => run(async () => { const r = await login(email.trim(), pw); if (r) setMfa(r.mfaToken); })}>{busy ? "Signing in…" : "Sign in"}</Button>
          </>
        ) : (
          <>
            <Text style={{ marginBottom: 14, opacity: 0.65 }}>Enter the 6-digit code from your authenticator app.</Text>
            <Field label="Code" value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} />
            {err ? <Text style={{ color: "#c0392b", marginBottom: 10 }}>{err}</Text> : null}
            <Button disabled={code.length < 6 || busy} onPress={() => run(() => loginMfa(mfa, code))}>Verify</Button>
          </>
        )}
      </View>
    </Screen>
  );
}
