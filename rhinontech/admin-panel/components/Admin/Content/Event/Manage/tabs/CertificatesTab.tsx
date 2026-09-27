"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { AlignCenter, AlignLeft, AlignRight, Award, Bold, Download, Eye, ImagePlus, Loader2, Save, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmailBodyEditor } from "@/components/Admin/Outreach/shared/EmailBodyEditor";
import type { ManageContext } from "../EventManage";
import { eventsApi, type CertificateField, type CertificateTemplate } from "../api";
import { ConfirmDialog, PlaceholderHelp, TestEmailDialog } from "../ui";

/**
 * The same four fonts the server draws with (backend src/assets/fonts), loaded
 * here by the same names, so what the admin places is what the guest gets.
 */
const FONTS = ["Playfair Display", "Inter", "JetBrains Mono", "Great Vibes"] as const;
const FONT_CSS =
  "https://fonts.googleapis.com/css2?family=Great+Vibes&family=Inter:wght@600&family=JetBrains+Mono:wght@500&family=Playfair+Display:wght@700&display=swap";
const LEGACY: Record<string, string> = { serif: "Playfair Display", "sans-serif": "Inter", monospace: "JetBrains Mono", cursive: "Great Vibes" };

const FIELD_LABEL: Record<CertificateField["id"], string> = { name: "Recipient name", date: "Issue date", certificateId: "Certificate ID" };
const SAMPLE: Record<CertificateField["id"], string> = { name: "Priya Sharma", date: "November 6, 2026", certificateId: "UC-SAMP-LE01" };

function defaultFields(): CertificateField[] {
  return [
    { id: "name", x: 50, y: 46, fontSize: 72, fontFamily: "Great Vibes", color: "#0B1B3D", alignment: "center", fontWeight: "normal" },
    { id: "date", x: 25, y: 84, fontSize: 26, fontFamily: "Inter", color: "#334155", alignment: "center", fontWeight: "bold" },
    { id: "certificateId", x: 75, y: 84, fontSize: 22, fontFamily: "JetBrains Mono", color: "#334155", alignment: "center", fontWeight: "bold" },
  ];
}

function useCertificateFonts() {
  useEffect(() => {
    if (document.querySelector(`link[href="${FONT_CSS}"]`)) return;
    const link = Object.assign(document.createElement("link"), { rel: "stylesheet", href: FONT_CSS });
    document.head.appendChild(link);
  }, []);
}

function readImage(file: File): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve({ dataUrl: String(reader.result), width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => reject(new Error("That file isn't an image we can read"));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error("Could not read the file"));
    reader.readAsDataURL(file);
  });
}

function Designer({ event, template, onSaved }: { event: ManageContext["event"]; template: CertificateTemplate | null; onSaved: (t: CertificateTemplate) => void }) {
  useCertificateFonts();
  const [name, setName] = useState(template?.certificateName ?? "Certificate of Participation");
  const [image, setImage] = useState(template?.templateImage ?? "");
  const [size, setSize] = useState(template?.imageSize ?? { width: 0, height: 0 });
  const [fields, setFields] = useState<CertificateField[]>(
    template?.fields?.length ? template.fields.map((f) => ({ ...f, fontFamily: LEGACY[f.fontFamily] ?? f.fontFamily })) : defaultFields()
  );
  const [selected, setSelected] = useState<CertificateField["id"]>("name");
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [scale, setScale] = useState(1);
  const stage = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const drag = useRef<CertificateField["id"] | null>(null);

  useEffect(() => {
    const el = stage.current;
    if (!el || !size.width) return;
    const update = () => setScale(el.clientWidth / size.width);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [size.width, image]);

  const patch = (id: CertificateField["id"], values: Partial<CertificateField>) =>
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...values } : f)));

  const moveTo = (e: ReactPointerEvent) => {
    if (!drag.current || !stage.current) return;
    const rect = stage.current.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
    patch(drag.current, { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
  };

  const onFile = async (file?: File) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Use an image under 8 MB");
      return;
    }
    try {
      const img = await readImage(file);
      setImage(img.dataUrl);
      setSize({ width: img.width, height: img.height });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not read the image");
    }
  };

  const save = async () => {
    if (!image) {
      toast.error("Upload the certificate artwork first");
      return;
    }
    setSaving(true);
    try {
      const saved = await eventsApi.saveCertificate(String(event.id), { certificateName: name, imageSize: size, fields, templateImage: image });
      setImage(saved.templateImage);
      onSaved(saved);
      toast.success("Certificate design saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const field = fields.find((f) => f.id === selected)!;

  return (
    <div className="glass-card rounded-2xl p-6 space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold">Design</h3>
          <p className="text-[13px] text-muted-foreground">Upload blank artwork, then drag each field into place. The fonts match what the server prints.</p>
        </div>
        <div className="flex gap-2">
          <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          <Button variant="outline" className="gap-1.5" onClick={() => fileInput.current?.click()}><ImagePlus className="size-4" /> {image ? "Replace artwork" : "Upload artwork"}</Button>
          <Button variant="outline" className="gap-1.5" disabled={!template || previewing} onClick={async () => {
            setPreviewing(true);
            try { setPreview(await eventsApi.previewCertificate(String(event.id))); } catch (err) { toast.error(err instanceof Error ? err.message : "Save the design first"); } finally { setPreviewing(false); }
          }}>
            {previewing ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />} Server preview
          </Button>
          <Button className="gap-1.5" disabled={saving} onClick={save}>{saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save design</Button>
        </div>
      </div>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_280px] gap-6">
        <div>
          {image ? (
            <div
              ref={stage}
              className="relative w-full select-none overflow-hidden rounded-xl border border-border bg-muted touch-none"
              style={{ aspectRatio: size.width && size.height ? `${size.width} / ${size.height}` : "1.414 / 1" }}
              onPointerMove={moveTo}
              onPointerUp={() => (drag.current = null)}
              onPointerLeave={() => (drag.current = null)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="Certificate artwork" className="absolute inset-0 size-full object-fill pointer-events-none" draggable={false} />
              {fields.map((f) => (
                <div
                  key={f.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${FIELD_LABEL[f.id]} — drag to move`}
                  onPointerDown={(e) => { drag.current = f.id; setSelected(f.id); (e.target as HTMLElement).setPointerCapture?.(e.pointerId); }}
                  onKeyDown={(e) => {
                    const step = e.shiftKey ? 2 : 0.5;
                    const moves: Record<string, Partial<CertificateField>> = { ArrowLeft: { x: f.x - step }, ArrowRight: { x: f.x + step }, ArrowUp: { y: f.y - step }, ArrowDown: { y: f.y + step } };
                    if (moves[e.key]) { e.preventDefault(); patch(f.id, moves[e.key]); }
                  }}
                  className={`absolute cursor-move whitespace-nowrap rounded px-1 outline-none ${selected === f.id ? "ring-2 ring-primary ring-offset-1" : "hover:ring-1 hover:ring-primary/50"}`}
                  style={{
                    left: `${f.x}%`,
                    top: `${f.y}%`,
                    transform: `translate(${f.alignment === "left" ? "0" : f.alignment === "right" ? "-100%" : "-50%"}, -50%)`,
                    fontFamily: `"${f.fontFamily}"`,
                    fontWeight: f.fontWeight === "normal" ? 400 : 700,
                    fontSize: `${f.fontSize * scale}px`,
                    color: f.color,
                    lineHeight: 1,
                  }}
                >
                  {SAMPLE[f.id]}
                </div>
              ))}
            </div>
          ) : (
            <button type="button" onClick={() => fileInput.current?.click()}
              className="grid w-full place-items-center rounded-xl border border-dashed border-border bg-muted/30 py-24 text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors">
              <span className="flex flex-col items-center gap-2 text-[13px] font-medium">
                <ImagePlus className="size-7" /> Upload the blank certificate artwork
                <span className="text-[12px] font-normal">PNG or JPG, landscape, around 2000 × 1414 px</span>
              </span>
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cert-name">Certificate name</Label>
            <Input id="cert-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Field</Label>
            <div className="grid gap-1.5">
              {fields.map((f) => (
                <button key={f.id} type="button" onClick={() => setSelected(f.id)}
                  className={`rounded-lg border px-3 py-2 text-left text-[13px] transition-colors ${selected === f.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"}`}>
                  {FIELD_LABEL[f.id]}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-border p-3 space-y-3">
            <div className="space-y-1.5">
              <Label>Font</Label>
              <Select value={field.fontFamily} onValueChange={(v) => patch(field.id, { fontFamily: v })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{FONTS.map((f) => <SelectItem key={f} value={f}><span style={{ fontFamily: `"${f}"` }}>{f}</span></SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Size · {field.fontSize}px</Label>
              <input type="range" min={10} max={200} value={field.fontSize} onChange={(e) => patch(field.id, { fontSize: Number(e.target.value) })} className="w-full accent-primary" />
            </div>
            <div className="flex items-center gap-2">
              <input type="color" value={field.color} onChange={(e) => patch(field.id, { color: e.target.value })} className="size-9 rounded-md border border-border bg-transparent cursor-pointer" aria-label="Text colour" />
              <div className="flex rounded-md border border-border">
                {([["left", AlignLeft], ["center", AlignCenter], ["right", AlignRight]] as const).map(([a, Icon]) => (
                  <button key={a} type="button" aria-label={`Align ${a}`} aria-pressed={field.alignment === a} onClick={() => patch(field.id, { alignment: a })}
                    className={`grid place-items-center size-9 ${field.alignment === a ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50"}`}>
                    <Icon className="size-4" />
                  </button>
                ))}
              </div>
              <button type="button" aria-label="Bold" aria-pressed={field.fontWeight !== "normal"} onClick={() => patch(field.id, { fontWeight: field.fontWeight === "normal" ? "bold" : "normal" })}
                className={`grid place-items-center size-9 rounded-md border border-border ${field.fontWeight !== "normal" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>
                <Bold className="size-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label className="text-[12px]">X %</Label><Input type="number" step={0.5} value={field.x} onChange={(e) => patch(field.id, { x: Number(e.target.value) })} /></div>
              <div className="space-y-1"><Label className="text-[12px]">Y %</Label><Input type="number" step={0.5} value={field.y} onChange={(e) => patch(field.id, { y: Number(e.target.value) })} /></div>
            </div>
            <p className="text-[11.5px] text-muted-foreground">Tip: select a field and use the arrow keys (Shift for bigger steps).</p>
          </div>
        </div>
      </div>

      <Dialog open={Boolean(preview)} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Server preview</DialogTitle>
            <DialogDescription>Rendered by the backend exactly as guests will receive it, with sample values.</DialogDescription>
          </DialogHeader>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {preview ? <img src={preview} alt="Rendered certificate" className="w-full rounded-lg border border-border" /> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CertificateEmail({ event, template }: { event: ManageContext["event"]; template: CertificateTemplate }) {
  const [subject, setSubject] = useState(template.emailSubject ?? "Your certificate — {{eventTitle}}");
  const [body, setBody] = useState(template.emailBody ?? "");
  const [busy, setBusy] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      await eventsApi.saveCertificateEmail(String(event.id), subject, body);
      toast.success("Certificate email saved");
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
      return false;
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="glass-card rounded-2xl p-6 space-y-4">
      <div>
        <h3 className="text-[15px] font-semibold">Certificate email</h3>
        <p className="text-[13px] text-muted-foreground">Sent with the certificate attached when it&apos;s issued. Leave the body empty to issue without emailing.</p>
      </div>
      <div className="space-y-1.5"><Label htmlFor="ce-subject">Subject</Label><Input id="ce-subject" value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
      <EmailBodyEditor value={body} onChange={setBody} placeholder={"Congratulations {{recipientName}}!\n\n…"} minHeight="200px" />
      <PlaceholderHelp extra={[
        { token: "{{recipientName}}", meaning: "Name on the certificate" },
        { token: "{{certificateId}}", meaning: "Certificate ID" },
        { token: "{{certificateLink}}", meaning: "Download link (1 hour)" },
        { token: "{{verifyLink}}", meaning: "Public verification page" },
      ]} />
      <div className="flex justify-end gap-2">
        <Button variant="outline" className="gap-1.5" disabled={busy} onClick={async () => { if (await save()) setTestOpen(true); }}><Send className="size-4" /> Save & test</Button>
        <Button disabled={busy} onClick={save} className="gap-1.5">{busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save</Button>
      </div>
      <TestEmailDialog open={testOpen} onOpenChange={setTestOpen} title="Test the certificate email" onSend={(email) => eventsApi.testCertificateEmail(String(event.id), email)} />
    </div>
  );
}

function Issuing({ event, guests, reloadGuests }: ManageContext) {
  const approvedGuests = guests.filter((g) => g.guestType === "Approved");
  const certApproved = approvedGuests.filter((g) => g.certificateApproved);
  const issued = approvedGuests.filter((g) => g.certificateGenerated);
  const ready = certApproved.filter((g) => !g.certificateGenerated);
  const workshop = event.eventType === "Workshop";
  const [approveOpen, setApproveOpen] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const issueAll = async () => {
    const total = ready.length;
    setProgress({ done: 0, total });
    let done = 0;
    const failures: string[] = [];
    try {
      // Batches keep each request short; loop until the server reports none left.
      for (let guard = 0; guard < 200; guard++) {
        const res = await eventsApi.bulkIssueCertificates(String(event.id));
        done += res.issued;
        failures.push(...res.failed.map((f) => `${f.name}: ${f.error}`));
        setProgress({ done, total });
        if (!res.remaining || (!res.issued && res.failed.length)) break;
      }
      toast.success(`${done} certificate(s) issued${failures.length ? ` · ${failures.length} failed` : ""}`);
      if (failures.length) toast.error(failures.slice(0, 3).join("\n"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Issuing stopped");
    } finally {
      setProgress(null);
      await reloadGuests();
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 space-y-5">
      <div>
        <h3 className="text-[15px] font-semibold">Issue certificates</h3>
        <p className="text-[13px] text-muted-foreground">
          Approve, then issue. {workshop ? "Workshop certificates are approved from submitted feedback." : "Team events approve the primary member and their teammate together."}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        {[["Approved guests", approvedGuests.length], ["Certificate approved", certApproved.length], ["Issued", issued.length]].map(([label, value]) => (
          <div key={label as string} className="rounded-xl border border-border p-3">
            <p className="text-[22px] font-semibold tabular-nums">{value}</p>
            <p className="text-[12px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
      {progress ? (
        <div className="space-y-2">
          <Progress value={progress.total ? (progress.done / progress.total) * 100 : 0} />
          <p className="text-[12.5px] text-muted-foreground">Issued {progress.done} of {progress.total}…</p>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" className="gap-1.5" onClick={() => setApproveOpen(true)} disabled={Boolean(progress)}><Award className="size-4" /> Bulk approve</Button>
        <Button className="gap-1.5" disabled={!ready.length || Boolean(progress)} onClick={issueAll}>
          {progress ? <Loader2 className="size-4 animate-spin" /> : <Award className="size-4" />} Issue {ready.length} certificate{ready.length === 1 ? "" : "s"}
        </Button>
      </div>
      {issued.length ? (
        <ul className="divide-y divide-border rounded-xl border border-border max-h-72 overflow-y-auto">
          {issued.map((g) => (
            <li key={g.id} className="flex items-center justify-between gap-3 p-3 text-[13px]">
              <span className="min-w-0 truncate"><span className="font-medium">{g.name}</span> · <span className="font-mono text-muted-foreground">{g.certificateId}</span></span>
              <Button size="sm" variant="ghost" className="gap-1.5" onClick={async () => {
                try { window.open(await eventsApi.certificateUrl(g.id), "_blank"); } catch (err) { toast.error(err instanceof Error ? err.message : "Could not open"); }
              }}><Download className="size-3.5" /> Download</Button>
            </li>
          ))}
        </ul>
      ) : null}
      <ConfirmDialog open={approveOpen} onOpenChange={setApproveOpen} title="Approve certificates in bulk?"
        description={workshop ? "Every approved guest who has submitted feedback is approved." : "Every approved team member with a submission — and their named teammate — is approved."}
        confirmLabel="Approve"
        onConfirm={async () => {
          const res = await eventsApi.bulkApproveCertificates(String(event.id));
          toast.success(`${res.stats.approved} approved${res.stats.skipped ? ` · ${res.stats.skipped} not eligible yet` : ""}`);
          await reloadGuests();
        }} />
    </div>
  );
}

export default function CertificatesTab(ctx: ManageContext) {
  const [template, setTemplate] = useState<CertificateTemplate | null | undefined>(undefined);
  const load = useCallback(() => eventsApi.certificate(String(ctx.event.id)).then(setTemplate).catch(() => setTemplate(null)), [ctx.event.id]);
  useEffect(() => { load(); }, [load]);
  if (template === undefined) return <div className="grid place-items-center py-16 text-muted-foreground"><Loader2 className="size-5 animate-spin" /></div>;
  return (
    <div className="space-y-6">
      <Designer event={ctx.event} template={template} onSaved={setTemplate} />
      {template ? (
        <div className="grid xl:grid-cols-2 gap-6">
          <CertificateEmail event={ctx.event} template={template} />
          <Issuing {...ctx} />
        </div>
      ) : null}
    </div>
  );
}
