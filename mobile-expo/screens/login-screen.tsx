import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowRight, Radar, ShieldCheck, Sparkles } from "lucide-react-native";
import { useAuth } from "@/providers/auth-provider";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/lib/config";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("alex@rhinon.tech");
  const [password, setPassword] = useState("password");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    try {
      setLoading(true);
      await login(email, password);
      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert("Authentication failed", error.message || "Unable to authorize the session.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#060A12" }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.select({ ios: "padding", android: undefined })}
          className="flex-1"
        >
          <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
            <View className="absolute -left-10 top-16 h-40 w-40 rounded-full bg-cyan-400/10" />
            <View className="absolute right-[-30px] top-32 h-52 w-52 rounded-full bg-violet-500/10" />
            <View className="flex-1 px-6 pb-6 pt-4">
              <View className="gap-7">
                <View className="gap-5">
                  <View className="w-32 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2">
                    <Text className="text-[11px] font-black uppercase tracking-[3px] text-cyan-300">
                      Rhinon Mobile
                    </Text>
                  </View>

                  <View className="gap-4">
                    <View className="h-[72px] w-[72px] items-center justify-center rounded-[30px] border border-cyan-400/20 bg-[#0D1827]">
                      <ShieldCheck color="#7DE3FF" size={34} />
                    </View>

                    <View className="gap-3">
                      <Text className="text-[40px] font-black leading-[44px] text-rhinon-text">
                        Operate every outbound motion from one native cockpit.
                      </Text>
                      <Text className="max-w-[92%] text-[15px] leading-7 text-rhinon-muted">
                        Leads, campaigns, templates, social publishing, and inbox execution tuned for a phone-first control loop.
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row gap-3">
                    <View className="flex-1 rounded-[22px] border border-rhinon-border bg-rhinon-surface px-4 py-4">
                      <View className="mb-3 h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400/10">
                        <Radar color="#7DE3FF" size={18} />
                      </View>
                      <Text className="text-[11px] font-black uppercase tracking-[2px] text-rhinon-muted">
                        Live Sync
                      </Text>
                      <Text className="mt-1 text-base font-bold text-rhinon-text">Realtime ops</Text>
                    </View>
                    <View className="flex-1 rounded-[22px] border border-rhinon-border bg-rhinon-surface px-4 py-4">
                      <View className="mb-3 h-10 w-10 items-center justify-center rounded-2xl bg-violet-400/10">
                        <Sparkles color="#A78BFA" size={18} />
                      </View>
                      <Text className="text-[11px] font-black uppercase tracking-[2px] text-rhinon-muted">
                        AI Layer
                      </Text>
                      <Text className="mt-1 text-base font-bold text-rhinon-text">Draft + enrich</Text>
                    </View>
                  </View>
                </View>

                <Card className="gap-5 border-cyan-400/10 bg-[#0A1220]">
                  <View className="gap-2">
                    <Text className="text-[11px] font-black uppercase tracking-[3px] text-cyan-300">
                      Session Access
                    </Text>
                    <Text className="text-2xl font-black text-rhinon-text">Authorize your operator session</Text>
                    <Text className="text-sm leading-6 text-rhinon-muted">
                      Use the current demo account while the mobile auth layer is wired to the same Rhinon backend.
                    </Text>
                  </View>

                  <Input
                    label="Email Address"
                    value={email}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    onChangeText={setEmail}
                  />
                  <Input
                    label="Password"
                    value={password}
                    secureTextEntry
                    onChangeText={setPassword}
                  />

                  <Button
                    onPress={handleLogin}
                    loading={loading}
                    icon={<ArrowRight color="#020617" size={16} />}
                  >
                    Authorize Session
                  </Button>

                  <Pressable
                    onPress={() => {
                      setEmail("alex@rhinon.tech");
                      setPassword("password");
                    }}
                    className="rounded-[22px] border border-rhinon-border bg-white/5 px-4 py-4"
                  >
                    <View className="flex-row items-center justify-between gap-3">
                      <View className="flex-row items-center gap-3">
                        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-violet-400/10">
                          <Sparkles color="#A78BFA" size={17} />
                        </View>
                        <View>
                          <Text className="text-sm font-bold text-rhinon-text">Use demo credentials</Text>
                          <Text className="text-xs text-rhinon-muted">alex@rhinon.tech / password</Text>
                        </View>
                      </View>
                      <ArrowRight color="#7D8BA7" size={16} />
                    </View>
                  </Pressable>
                </Card>
              </View>

              <View className="mt-auto gap-2 pt-6">
                <Text className="text-[11px] font-black uppercase tracking-[3px] text-rhinon-muted">
                  API Target
                </Text>
                <Text className="text-sm text-rhinon-muted">{API_BASE_URL}</Text>
                <Text className="text-xs leading-5 text-rhinon-muted">
                  Use `localhost` only on the iOS simulator. On a real device, point this to your computer&apos;s LAN IP.
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
