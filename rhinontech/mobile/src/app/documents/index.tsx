import { View, Text, Pressable, Link } from "@/components/rn";
import { Camera, FileSignature, FolderOpen, ImageIcon, Plus } from "@/components/icons";
import { useState } from "react";
import { AttachSheet, AttachThumb, PreviewSheet } from "@/components/rhinon/attach";
import { Avatar, Badge, Button, Chip, Display, Empty, Eyebrow, Fab, Field, Screen, SectionLabel, Segmented, Sheet, TopBar, stagger } from "@/components/rhinon/ui";
import { nameOf } from "@/lib/mock-data";
import { DOC_KIND, PICKS, type Attachment, type DocItem, type DocKind } from "@/lib/mock-more";
import { actions, useApp } from "@/lib/store";
import { TONES } from "@/lib/tone";
import { cn } from "@/lib/utils";
type Tab = "vault" | "requests" | "sign";
const asFile = (d: DocItem): Attachment => ({
  id: d.id,
  name: d.name,
  kind: d.kind === "id" ? "image" : "pdf",
  size: d.size
});
export default function DocumentsPage() {
  const docs = useApp(s => s.docs);
  const requests = useApp(s => s.docRequests);
  const [tab, setTab] = useState<Tab>("vault");
  const [preview, setPreview] = useState<Attachment | null>(null);
  const [uploading, setUploading] = useState(false);
  const [answering, setAnswering] = useState<string | null>(null);
  const toSign = docs.filter(d => d.state === "to-sign");
  const vault = docs.filter(d => d.state !== "to-sign");
  const open = requests.filter(r => !r.done);
  return <Screen fab={tab === "vault"}>
      <TopBar title="Documents" fallback="/more" />
      <View className="animate-rise">
        <Eyebrow tone="sun">
          {toSign.length} to sign · {open.length} requested
        </Eyebrow>
        <Display size="hero" className="mt-3">
          Your
          {"\n"}
          papers.
        </Display>
      </View>

      <Segmented className="mt-6" value={tab} onChange={setTab} options={[{
      value: "vault",
      label: "Vault"
    }, {
      value: "requests",
      label: "Requests",
      badge: open.length || undefined
    }, {
      value: "sign",
      label: "To sign",
      badge: toSign.length || undefined
    }]} />

      {tab === "vault" ? <View className="mt-4 space-y-2.5">
          {vault.map((d, i) => {
        const k = DOC_KIND[d.kind];
        return <View key={d.id} className="animate-rise" style={stagger(Math.min(i, 6))}>
                <Pressable onPress={() => setPreview(asFile(d))} className="press flex w-full items-center gap-3.5 rounded-2xl border border-line/70 bg-card p-3.5 text-left">
                  <AttachThumb kind={d.kind === "id" ? "image" : "pdf"} size={48} />
                  <View className="min-w-0 flex-1">
                    <View className="block truncate text-[15.5px] font-semibold leading-tight">
                      {d.name}
                    </View>
                    <View className="mt-0.5 block font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink/50">
                      {d.date} · {d.size}
                    </View>
                  </View>
                  <View className="flex flex-col items-end gap-1.5">
                    <Badge tone={k.tone}>{k.label}</Badge>
                    {d.state === "signed" ? <Badge tone="leaf">Signed</Badge> : null}
                  </View>
                </Pressable>
              </View>;
      })}
        </View> : null}

      {tab === "requests" ? <View className="mt-4 space-y-3">
          {requests.map((r, i) => <View key={r.id} className="animate-rise rounded-3xl border border-line/70 bg-card p-4" style={stagger(Math.min(i, 6))}>
              <View className="flex items-start justify-between gap-3">
                <Text className="text-[16.5px] font-semibold leading-snug">{r.title}</Text>
                <Badge tone={r.done ? "leaf" : "coral"}>
                  {r.done ? "Submitted" : `Due ${r.due}`}
                </Badge>
              </View>
              <Text className="mt-1.5 text-[14px] leading-relaxed text-ink/65">{r.note}</Text>
              <View className="mt-3 flex items-center justify-between">
                <View className="flex items-center gap-2 text-[13px] text-ink/60">
                  <Avatar name={nameOf(r.by)} size={24} /> Asked by {nameOf(r.by).split(" ")[0]}
                </View>
                {!r.done ? <Pressable onPress={() => setAnswering(r.id)} className="press inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-[14px] font-semibold text-paper">
                    <Camera size={16} /> Upload
                  </Pressable> : null}
              </View>
            </View>)}
        </View> : null}

      {tab === "sign" ? <View className="mt-4">
          {toSign.length === 0 ? <Empty tone="sun" title="Nothing to sign" body="New letters and policies from HR will show up here." /> : <View className="space-y-3">
              {toSign.map((d, i) => <View key={d.id} className="press relative animate-rise rounded-3xl bg-sun p-5 text-sun-foreground" style={stagger(i)}>
                  <Link to="/documents/sign/$docId" params={{
            docId: d.id
          }} aria-label={`Sign ${d.name}`} className="absolute inset-0 z-0 rounded-3xl" />
                  <View className="pointer-events-none relative z-10">
                    <Text className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] opacity-85">
                      {d.date}
                    </Text>
                    <Display as="h3" size="lg" className="mt-3">
                      {d.name}
                    </Display>
                    <View className="mt-3 inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-[14px] font-semibold text-paper">
                      <FileSignature size={16} /> Review and sign
                    </View>
                  </View>
                </View>)}
            </View>}
          <Text className="mt-5 text-center text-[13px] text-ink/50">
            Signed copies are saved to your vault automatically.
          </Text>
        </View> : null}

      {tab === "vault" ? <Fab icon={Plus} label="Upload a document" tone="sun" onClick={() => setUploading(true)} /> : null}

      <UploadSheet open={uploading} onClose={() => setUploading(false)} />
      <AttachSheet open={answering !== null} onClose={() => setAnswering(null)} onPick={() => {
      if (answering) actions.submitRequest(answering);
    }} />
      <PreviewSheet file={preview} onClose={() => setPreview(null)} />
    </Screen>;
}
function UploadSheet({
  open,
  onClose
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [kind, setKind] = useState<DocKind>("other");
  const sources = [{
    id: "camera",
    label: "Scan with the camera",
    icon: Camera,
    tone: "coral"
  }, {
    id: "photos",
    label: "Photo library",
    icon: ImageIcon,
    tone: "sky"
  }, {
    id: "files",
    label: "Files",
    icon: FolderOpen,
    tone: "sun"
  }] as const;
  return <Sheet open={open} onClose={onClose} eyebrow="Vault" title="Add a document">
      <View className="space-y-5">
        <Field label="What is it">
          <View className="flex flex-wrap gap-2">
            {(Object.keys(DOC_KIND) as DocKind[]).map(k => <Chip key={k} tone={DOC_KIND[k].tone} active={kind === k} onClick={() => setKind(k)}>
                {DOC_KIND[k].label}
              </Chip>)}
          </View>
        </Field>
        <Field label="From">
          <View className="space-y-2">
            {sources.map(s => {
            const Icon = s.icon;
            return <View key={s.id}>
                  <Button tone="outline" className="justify-start" onClick={() => {
                const file = PICKS[s.id][0];
                actions.addDoc(file?.name ?? "New document", kind);
                onClose();
              }}>
                    <View className={cn("grid size-9 place-items-center rounded-xl", TONES[s.tone].solid)}>
                      <Icon size={18} />
                    </View>
                    {s.label}
                  </Button>
                </View>;
          })}
          </View>
        </Field>
        <SectionLabel>Stays private to you and HR</SectionLabel>
      </View>
    </Sheet>;
}