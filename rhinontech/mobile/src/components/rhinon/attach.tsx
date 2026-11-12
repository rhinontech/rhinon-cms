import { View, Pressable } from "@/components/rn";
import {
  Camera,
  Download,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  ImageIcon,
  Share2,
  X,
  type LucideIcon,
} from "@/components/icons";
import { PICKS, type AttachKind, type Attachment } from "@/lib/mock-more";
import { actions } from "@/lib/store";
import { TONES, type Tone } from "@/lib/tone";
import { cn } from "@/lib/utils";
import { Button, Display, Sheet } from "./ui";
export const KIND_ICON: Record<AttachKind, LucideIcon> = {
  image: ImageIcon,
  pdf: FileText,
  doc: FileText,
  sheet: FileSpreadsheet,
};
export const KIND_TONE: Record<AttachKind, Tone> = {
  image: "sky",
  pdf: "coral",
  doc: "cobalt",
  sheet: "leaf",
};

/** A small tinted tile that tells you what a file is. */
export function AttachThumb({ kind, size = 44 }: { kind: AttachKind; size?: number }) {
  const Icon = KIND_ICON[kind];
  return (
    <View
      className={cn("grid shrink-0 place-items-center rounded-xl", TONES[KIND_TONE[kind]].solid)}
      style={{
        width: size,
        height: size,
      }}
    >
      <Icon size={size * 0.46} strokeWidth={2} />
    </View>
  );
}

/** A file row. Tap to preview; the optional X removes it before sending. */
export function AttachmentRow({
  file,
  onOpen,
  onRemove,
  className,
}: {
  file: Attachment;
  onOpen?: (f: Attachment) => void;
  onRemove?: (f: Attachment) => void;
  className?: string;
}) {
  return (
    <View
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-line/70 bg-card p-2.5 pr-3",
        className,
      )}
    >
      <Pressable
        onPress={() => onOpen?.(file)}
        className="press flex min-w-0 flex-1 items-center gap-3 text-left"
        accessibilityLabel={`Open ${file.name}`}
      >
        <AttachThumb kind={file.kind} />
        <View className="min-w-0">
          <View className="block truncate text-[14.5px] font-semibold leading-tight">
            {file.name}
          </View>
          <View className="block font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink/50">
            {file.size}
          </View>
        </View>
      </Pressable>
      {onRemove ? (
        <Pressable
          accessibilityLabel={`Remove ${file.name}`}
          onPress={() => onRemove(file)}
          className="press grid size-8 place-items-center rounded-full bg-ink/8 text-ink"
        >
          <X size={16} />
        </Pressable>
      ) : null}
    </View>
  );
}
const SOURCES: {
  id: "camera" | "photos" | "files";
  label: string;
  hint: string;
  icon: LucideIcon;
  tone: Tone;
}[] = [
  {
    id: "camera",
    label: "Camera",
    hint: "Take a photo or scan a page",
    icon: Camera,
    tone: "coral",
  },
  {
    id: "photos",
    label: "Photo library",
    hint: "Pick from your photos",
    icon: ImageIcon,
    tone: "sky",
  },
  {
    id: "files",
    label: "Files",
    hint: "PDFs, sheets and documents",
    icon: FolderOpen,
    tone: "sun",
  },
];

/** Where an attachment comes from. The prototype hands back sample files. */
export function AttachSheet({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (files: Attachment[]) => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} eyebrow="Attach" title="Add from…">
      <View className="space-y-2.5">
        {SOURCES.map((s) => {
          const Icon = s.icon;
          return (
            <View key={s.id}>
              <Pressable
                onPress={() => {
                  const stamp = Date.now();
                  onPick(
                    PICKS[s.id].map((f, i) => ({
                      ...f,
                      id: `${f.id}-${stamp}-${i}`,
                    })),
                  );
                  onClose();
                }}
                className="press flex w-full items-center gap-4 rounded-3xl border border-line/70 bg-card p-3.5 text-left"
              >
                <View
                  className={cn("grid size-12 place-items-center rounded-2xl", TONES[s.tone].solid)}
                >
                  <Icon size={22} />
                </View>
                <View className="min-w-0 flex-1">
                  <View className="block text-[16px] font-semibold leading-tight">{s.label}</View>
                  <View className="block text-[13px] text-ink/55">{s.hint}</View>
                </View>
              </Pressable>
            </View>
          );
        })}
      </View>
    </Sheet>
  );
}

/** A drawn stand-in for the file itself, so the preview has something to show. */
function PagePreview({ file }: { file: Attachment }) {
  if (file.kind === "image") {
    return (
      <View className="relative h-56 overflow-hidden rounded-3xl bg-sky">
        <View className="absolute -left-6 top-10 size-40 rounded-full bg-sun" />
        <View className="absolute right-6 top-6 size-24 rounded-[calc(var(--radius)+6px)] bg-coral" />
        <View className="absolute -bottom-10 left-1/3 size-48 rounded-full bg-leaf" />
      </View>
    );
  }
  if (file.kind === "sheet") {
    return (
      <View className="grid h-56 grid-cols-4 grid-rows-6 gap-px overflow-hidden rounded-2xl border border-line bg-line">
        {Array.from(
          {
            length: 24,
          },
          (_, i) => (
            <View key={i} className={cn("bg-card", i < 4 && "bg-leaf/25")} />
          ),
        )}
      </View>
    );
  }
  return (
    <View className="h-56 overflow-hidden rounded-2xl border border-line bg-card p-5">
      <View className="block h-3.5 w-2/3 rounded bg-ink/80" />
      <View className="mt-4 block h-2 w-full rounded bg-ink/15" />
      <View className="mt-2 block h-2 w-11/12 rounded bg-ink/15" />
      <View className="mt-2 block h-2 w-full rounded bg-ink/15" />
      <View className="mt-2 block h-2 w-3/4 rounded bg-ink/15" />
      <View className="mt-6 block h-2 w-full rounded bg-ink/15" />
      <View className="mt-2 block h-2 w-5/6 rounded bg-ink/15" />
    </View>
  );
}

/** Opens any attachment: a preview, with download and share. */
export function PreviewSheet({ file, onClose }: { file: Attachment | null; onClose: () => void }) {
  return (
    <Sheet
      open={file !== null}
      onClose={onClose}
      eyebrow={file ? `${file.kind.toUpperCase()} · ${file.size}` : ""}
    >
      {file ? (
        <View>
          <Display as="h2" size="md" className="mb-4 break-words">
            {file.name}
          </Display>
          <PagePreview file={file} />
          <View className="mt-5 grid grid-cols-[1fr_auto] gap-2.5">
            <Button
              tone="ink"
              icon={Download}
              onClick={() => {
                actions.toast("Saved to Files", "sun");
                onClose();
              }}
            >
              Download
            </Button>
            <Pressable
              accessibilityLabel="Share"
              onPress={() => actions.toast("Link copied", "sun")}
              className="press grid size-14 place-items-center rounded-full border border-ink/20"
            >
              <Share2 size={20} />
            </Pressable>
          </View>
        </View>
      ) : null}
    </Sheet>
  );
}
