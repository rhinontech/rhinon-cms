import { useState } from "react";
import { Alert, View } from "react-native";
import { router } from "expo-router";
import { Paperclip } from "lucide-react-native";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { useTheme } from "@/lib/theme";
import { textToHtml } from "@/lib/format";
import { pickFile, uploadMailFile, type UploadedFile } from "@/lib/files";
import { success } from "@/lib/haptics";
import { Button, Chips, FieldLabel, FileChip, FormScreen, Input } from "@/components/ui";

const parseEmails = (s: string) => s.split(/[\s,;]+/).map((e) => e.trim()).filter(Boolean);
const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export default function ComposeScreen() {
  const { colors } = useTheme();
  const addresses = useApi<{ address: string; name: string | null }[]>("/inbox/addresses");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const sender = from || addresses.data?.[0]?.address || "";

  const attach = async () => {
    const file = await pickFile();
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadMailFile(file);
      setFiles((f) => [...f, uploaded]);
    } catch (err) {
      Alert.alert("Couldn't attach file", err instanceof Error ? err.message : "Try again");
    } finally {
      setUploading(false);
    }
  };

  const send = async () => {
    const toEmails = parseEmails(to);
    const ccEmails = parseEmails(cc);
    const bad = [...toEmails, ...ccEmails].find((e) => !validEmail(e));
    if (bad) throw new Error(`"${bad}" isn't a valid email address.`);
    await api.post("/inbox", { toEmails, ccEmails, subject: subject.trim(), body: textToHtml(body.trim()), attachments: files, ...(sender ? { from: sender } : {}) });
    success();
    router.back();
  };

  return (
    <FormScreen title="New email" saveLabel="Send" onSave={send} canSave={!!to.trim() && !!subject.trim() && !!body.trim() && !uploading}>
      {(addresses.data?.length ?? 0) > 1 && (
        <FieldLabel label="From">
          <Chips options={addresses.data!.map((a) => ({ value: a.address, label: a.address }))} value={sender} onChange={setFrom} />
        </FieldLabel>
      )}
      <Input label="To" value={to} onChangeText={setTo} placeholder="name@company.com" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" />
      <Input label="Cc" value={cc} onChangeText={setCc} placeholder="Optional" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" />
      <Input label="Subject" value={subject} onChangeText={setSubject} />
      <Input label="Message" value={body} onChangeText={setBody} multiline tall placeholder="Write your email…" />
      {!!files.length && (
        <View className="flex-row flex-wrap gap-2">
          {files.map((f, i) => (
            <FileChip key={f.key} name={f.name} onRemove={() => setFiles((all) => all.filter((_, x) => x !== i))} />
          ))}
        </View>
      )}
      <Button variant="secondary" title="Attach a file" icon={<Paperclip size={16} color={colors.foreground} />} loading={uploading} onPress={attach} />
    </FormScreen>
  );
}
