import { useState } from "react";
import { View } from "react-native";

import { replace } from "@/lib/nav";
import { Button, Display, Eyebrow, Field, Screen, Text } from "@/ui";

export default function Login() {
  const [email, setEmail] = useState("kabir@rhinontech.in");
  const [pw, setPw] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"creds" | "otp">("creds");
  const [err, setErr] = useState("");
  return (
    <Screen>
      <Eyebrow>Rhinon Tech</Eyebrow>
      <Display style={{ marginTop: 12 }}>{"Welcome\nback."}</Display>
      <View style={{ marginTop: 28 }}>
        {step === "creds" ? (
          <>
            <Field label="Work email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
            <Field label="Password" value={pw} onChangeText={setPw} secureTextEntry />
            <Button disabled={!email || !pw} onPress={() => setStep("otp")}>Continue</Button>
          </>
        ) : (
          <>
            <Text style={{ marginBottom: 14, opacity: 0.65 }}>Enter the 6-digit code from your authenticator. (Prototype code: 123456)</Text>
            <Field label="Code" value={code} onChangeText={(v) => { setCode(v); setErr(""); }} keyboardType="number-pad" maxLength={6} />
            {err ? <Text style={{ color: "#c0392b", marginBottom: 10 }}>{err}</Text> : null}
            <Button disabled={code.length < 6} onPress={() => (code === "123456" ? replace("/") : setErr("That code didn't work."))}>Sign in</Button>
          </>
        )}
      </View>
    </Screen>
  );
}
