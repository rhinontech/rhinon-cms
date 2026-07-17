"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import { TextStyleKit } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import { TableKit } from "@tiptap/extension-table";
import Image from "@tiptap/extension-image";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { TbPlus, TbFileText, TbLayoutSidebarLeftCollapse, TbLayoutSidebarLeftExpand, TbMoodSmile, TbUsersPlus, TbLockAccess } from "react-icons/tb";
import { cn } from "@/lib/utils";
import { apiFetch, apiUpload } from "@/lib/api";
import { useSideNav } from "@/context/SideNavContext";
import { isImageIcon, type PageDoc, type PageNode } from "./types";
import { usePagesStore } from "./pagesStore";
import { EMOJI_GRID } from "./emoji";
import { createSlashCommandExtension, type SlashPageHandlers } from "./slashCommand";
import { BubbleToolbar } from "./BubbleToolbar";
import { ShareDialog } from "./ShareDialog";
import { CoverImage } from "./CoverImage";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TbUpload, TbLoader } from "react-icons/tb";

type SaveStatus = "idle" | "saving" | "saved" | "conflict" | "error";

/**
 * Page links are stored as plain text + link mark, so a renamed page would go
 * stale inside parent docs. On every load we rewrite the text of any link
 * pointing at /pages/<id> to the page's current icon + title from the tree.
 */
function syncPageLinkTitles(node: any, byId: Map<string, PageNode>): void {
  if (!node || typeof node !== "object") return;
  if (node.type === "text" && Array.isArray(node.marks)) {
    const link = node.marks.find((m: any) => m?.type === "link");
    const match = typeof link?.attrs?.href === "string" && link.attrs.href.match(/\/pages\/([0-9a-f-]{36})$/i);
    if (match) {
      const target = byId.get(match[1]);
      if (target) {
        const glyph = target.icon && !isImageIcon(target.icon) ? target.icon : "📄";
        node.text = `${glyph} ${target.title || "Untitled"}`;
      }
    }
  }
  if (Array.isArray(node.content)) node.content.forEach((child: any) => syncPageLinkTitles(child, byId));
}

export function PageEditor({ id }: { id: string }) {
  const { isExpanded, toggleSideNav } = useSideNav();
  const router = useRouter();
  const pathname = usePathname();
  const roleSlug = pathname.split("/")[1];

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<PageDoc | null>(null);
  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [treePages, setTreePages] = useState<PageNode[]>([]);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [shareOpen, setShareOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const lastUpdatedAtRef = useRef<string | null>(null);
  const dirtyRef = useRef(false);

  // useEditor + onUpdate are wired up once at mount, so the imperative save path
  // must read live values through refs rather than closing over render-scoped
  // state — otherwise it forever saves the id/title/icon from the first render.
  const idRef = useRef(id);
  const titleRef = useRef(title);
  const iconRef = useRef(icon);
  const coverImageRef = useRef(coverImage);
  useEffect(() => { idRef.current = id; }, [id]);
  useEffect(() => { titleRef.current = title; }, [title]);
  useEffect(() => { iconRef.current = icon; }, [icon]);
  useEffect(() => { coverImageRef.current = coverImage; }, [coverImage]);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRef = useRef<Editor | null>(null);
  // View-only users must never attempt a write — this is the final guard save()
  // checks regardless of how dirtyRef ended up true (e.g. a stray transaction
  // during a page-switch race). Kept as a ref since save() has empty deps.
  const canEditRef = useRef(false);

  const save = useCallback(async () => {
    const currentEditor = editorRef.current;
    if (!dirtyRef.current || !currentEditor || !canEditRef.current) {
      dirtyRef.current = false;
      return;
    }
    dirtyRef.current = false;
    setSaveStatus("saving");
    const savedId = idRef.current;
    try {
      const updated = await apiFetch<PageDoc>(`/pages/${savedId}`, {
        method: "PUT",
        body: JSON.stringify({
          title: titleRef.current,
          icon: iconRef.current,
          coverImage: coverImageRef.current,
          content: currentEditor.getJSON(),
          expectedUpdatedAt: lastUpdatedAtRef.current,
        }),
      });
      // Don't clobber the ref if the user already navigated to another page
      // while this save was in flight.
      if (idRef.current === savedId) {
        lastUpdatedAtRef.current = updated.updatedAt;
      }
      usePagesStore.getState().notifyPageUpdate(savedId, { title: titleRef.current, icon: iconRef.current });
      setSaveStatus("saved");
    } catch (err: any) {
      if (String(err.message || "").includes("updated elsewhere")) {
        setSaveStatus("conflict");
      } else {
        setSaveStatus("error");
      }
    }
  }, []);

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(save, 800);
  }, [save]);

  // Flush any pending save, then navigate — used by breadcrumbs, page links,
  // and the "/page" slash command so the embed row is persisted before leaving.
  const navigateToPage = useCallback(
    async (href: string) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      await save();
      router.push(href);
    },
    [save, router]
  );

  // The slash-command extension is constructed once at editor init; it reaches
  // the latest page context through this ref.
  const slashHandlersRef = useRef<SlashPageHandlers | null>(null);
  slashHandlersRef.current = {
    createSubPage: async () => {
      try {
        return await apiFetch<{ id: string; title: string }>("/pages", {
          method: "POST",
          body: JSON.stringify({ title: "Untitled", parentId: idRef.current }),
        });
      } catch (err: any) {
        alert(err.message || "Failed to create page");
        return null;
      }
    },
    openPage: (pageId: string) => navigateToPage(`/${roleSlug}/pages/${pageId}`),
  };

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
      Placeholder.configure({ placeholder: "Write, or press '/' for commands…" }),
      TextStyleKit,
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TableKit.configure({ table: { resizable: false } }),
      Image,
      TaskList,
      TaskItem.configure({ nested: true }),
      createSlashCommandExtension(roleSlug, slashHandlersRef),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "page-tiptap min-h-[60vh] px-1 py-2 text-[16px] leading-relaxed text-stone-800 outline-none",
      },
      // Links navigate on click, Notion-style: internal page links flush the
      // pending save and route in-app; external ones open a new tab.
      handleClick: (_view, _pos, event) => {
        const anchor = (event.target as HTMLElement).closest?.("a");
        const href = anchor?.getAttribute("href");
        if (!href) return false;
        if (href.startsWith("/")) {
          const handlers = slashHandlersRef.current;
          const match = href.match(/\/pages\/([0-9a-f-]{36})$/i);
          if (handlers && match) handlers.openPage(match[1]);
        } else {
          window.open(href, "_blank", "noopener");
        }
        return true;
      },
    },
    onUpdate: () => {
      dirtyRef.current = true;
      scheduleSave();
    },
  });

  useEffect(() => {
    editorRef.current = editor ?? null;
  }, [editor]);

  const load = useCallback(async (pageId: string) => {
    setLoading(true);
    setSaveStatus("idle");
    setLoadError(null);
    // A page you can't (yet) open must never be mistaken for one you can edit —
    // otherwise a stray keystroke before the real access check lands would
    // schedule a write. Cleared again once the real page.myAccess arrives below.
    canEditRef.current = false;
    try {
      const [doc, tree] = await Promise.all([
        apiFetch<PageDoc>(`/pages/${pageId}`),
        apiFetch<PageNode[]>("/pages/tree"),
      ]);
      setPage(doc);
      setTitle(doc.title);
      setIcon(doc.icon);
      setCoverImage(doc.coverImage);
      lastUpdatedAtRef.current = doc.updatedAt;
      setTreePages(tree);
      canEditRef.current = doc.myAccess === "edit";
      // Refresh embedded page-link labels with the pages' current icons/titles.
      const content = doc.content ? JSON.parse(JSON.stringify(doc.content)) : "";
      if (content) syncPageLinkTitles(content, new Map(tree.map((p) => [p.id, p])));
      editor?.commands.setContent(content || "", { emitUpdate: false });
    } catch (err: any) {
      setPage(null);
      setLoadError(err.message || "Failed to load page");
    } finally {
      setLoading(false);
    }
  }, [editor]);

  useEffect(() => {
    if (editor) load(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, editor]);

  // Flush a pending save when navigating away.
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (dirtyRef.current) save();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleTitleChange = (v: string) => {
    setTitle(v);
    dirtyRef.current = true;
    scheduleSave();
  };

  const handleIconChange = (v: string) => {
    setIcon(v);
    dirtyRef.current = true;
    scheduleSave();
  };

  const handleCoverChange = (v: string | null) => {
    setCoverImage(v);
    dirtyRef.current = true;
    scheduleSave();
  };

  const createChild = async () => {
    try {
      const child = await apiFetch<{ id: string }>("/pages", {
        method: "POST",
        body: JSON.stringify({ title: "Untitled", parentId: id }),
      });
      router.push(`/${roleSlug}/pages/${child.id}`);
    } catch (err: any) {
      alert(err.message || "Failed to create sub-page");
    }
  };

  const canEdit = page?.myAccess === "edit";

  useEffect(() => {
    canEditRef.current = canEdit;
    editor?.setEditable(canEdit);
  }, [editor, canEdit]);

  const children = useMemo(() => treePages.filter((p) => p.parentId === id), [treePages, id]);

  // Ancestor chain for the breadcrumb trail (root … parent), walked from the tree.
  const ancestors = useMemo(() => {
    const byId = new Map(treePages.map((p) => [p.id, p]));
    const chain: PageNode[] = [];
    let node = byId.get(id);
    let guard = 0;
    while (node?.parentId && guard++ < 20) {
      node = byId.get(node.parentId);
      if (!node) break;
      chain.unshift(node);
    }
    return chain;
  }, [treePages, id]);

  const updateVisibility = async (visibility: "private" | "workspace") => {
    if (!page) return;
    setPage({ ...page, visibility });
    try {
      await apiFetch(`/pages/${id}`, { method: "PUT", body: JSON.stringify({ visibility, expectedUpdatedAt: lastUpdatedAtRef.current }) });
      load(id);
    } catch (err: any) {
      alert(err.message || "Failed to update visibility");
    }
  };

  return (
    <div className={cn("flex h-full min-h-0 w-full flex-col overflow-hidden glass-panel", isExpanded ? "rounded-r-xl" : "rounded-xl")}>
      <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-black/5 px-4">
        <div className="flex min-w-0 items-center gap-1">
          <button onClick={toggleSideNav} className="shrink-0 rounded-md p-1.5 text-gray-500 hover:bg-gray-100">
            {isExpanded ? <TbLayoutSidebarLeftCollapse size={18} /> : <TbLayoutSidebarLeftExpand size={18} />}
          </button>
          {/* Breadcrumbs: ancestor chain → current page, Notion-style */}
          <nav className="flex min-w-0 items-center gap-1 text-sm">
            {loadError && <span className="px-1.5 py-0.5 font-medium text-gray-900">Pages</span>}
            {!loadError && ancestors.map((a) => (
              <span key={a.id} className="flex min-w-0 items-center gap-1">
                <button
                  onClick={() => navigateToPage(`/${roleSlug}/pages/${a.id}`)}
                  className="max-w-[160px] truncate rounded-md px-1.5 py-0.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                >
                  {a.icon && !isImageIcon(a.icon) ? `${a.icon} ` : ""}{a.title || "Untitled"}
                </button>
                <span className="shrink-0 text-gray-300">/</span>
              </span>
            ))}
            {!loadError && (
              <span className="max-w-[200px] truncate px-1.5 py-0.5 font-medium text-gray-900">
                {icon && !isImageIcon(icon) ? `${icon} ` : ""}{title || "Untitled"}
              </span>
            )}
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <SaveIndicator status={saveStatus} onReload={() => load(id)} />
          {canEdit && (
            <button
              onClick={() => setShareOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-2.5 py-1 text-xs font-medium text-stone-600 hover:bg-stone-50"
            >
              <TbUsersPlus size={14} /> Share
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loadError ? (
          <div className="mx-auto flex h-full max-w-md flex-col items-center justify-center gap-3 px-10 text-center">
            <TbLockAccess size={32} className="text-stone-300" />
            <p className="text-sm font-medium text-stone-700">{loadError}</p>
            <p className="text-xs text-stone-400">
              You may need to be granted access, or the page may have been removed.
            </p>
            <button
              onClick={() => router.push(`/${roleSlug}/pages`)}
              className="mt-2 rounded-lg border border-stone-200 px-3.5 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-50"
            >
              Back to Pages
            </button>
          </div>
        ) : loading || !editor ? (
          <div className="mx-auto max-w-3xl px-10 py-16">
            <div className="mb-4 h-10 w-2/3 animate-pulse rounded bg-stone-100" />
            <div className="h-40 animate-pulse rounded bg-stone-50" />
          </div>
        ) : (
          <>
            {/* Cover bleeds edge-to-edge across the panel, outside the content column */}
            <CoverImage coverImage={coverImage} onChange={handleCoverChange} disabled={!canEdit} />

            <div className="mx-auto max-w-3xl px-10 pb-10">
              <div className={coverImage ? "relative z-10 -mt-7 mb-1" : "pt-6"}>
                <IconPicker icon={icon} onChange={handleIconChange} disabled={!canEdit} withBackground={!!coverImage} />
              </div>

            <input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              disabled={!canEdit}
              placeholder="Untitled"
              className="mt-2 w-full border-none bg-transparent text-4xl font-black tracking-tight text-stone-900 outline-none placeholder:text-stone-300 disabled:cursor-not-allowed"
            />

            {!canEdit && (
              <p className="mt-2 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
                You have view-only access to this page.
              </p>
            )}

            <div className="mt-6">
              <BubbleToolbar editor={editor} />
              <EditorContent editor={editor} />
            </div>

            {children.length > 0 && (
              <div className="mt-10 border-t border-stone-100 pt-5">
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-stone-400">Sub-pages</p>
                <div className="space-y-1">
                  {children.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => router.push(`/${roleSlug}/pages/${c.id}`)}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-stone-700 hover:bg-stone-50"
                    >
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden rounded-sm">
                        {isImageIcon(c.icon) ? (
                          <img src={c.icon!} alt="" className="h-full w-full object-cover" />
                        ) : c.icon ? (
                          c.icon
                        ) : (
                          <TbFileText size={14} className="text-stone-400" />
                        )}
                      </span>
                      <span className="truncate">{c.title || "Untitled"}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {canEdit && (
              <button
                onClick={createChild}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-stone-400 hover:text-stone-700"
              >
                <TbPlus size={13} /> Add sub-page
              </button>
            )}
            </div>
          </>
        )}
      </div>

      {page && (
        <ShareDialog
          pageId={id}
          open={shareOpen}
          onOpenChange={setShareOpen}
          visibility={page.visibility}
          onVisibilityChange={updateVisibility}
        />
      )}
    </div>
  );
}

function IconPicker({
  icon,
  onChange,
  disabled,
  withBackground,
}: {
  icon: string | null;
  onChange: (v: string) => void;
  disabled?: boolean;
  withBackground?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"emoji" | "upload">("emoji");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await apiUpload<{ url: string }>("/content/upload-image", file);
      onChange(url);
      setOpen(false);
    } catch (err: any) {
      alert(err.message || "Icon upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          disabled={disabled}
          className={cn(
            "flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl text-4xl leading-none hover:bg-stone-100 disabled:cursor-not-allowed disabled:hover:bg-transparent",
            withBackground && "border-4 border-white bg-white shadow-sm hover:bg-white"
          )}
        >
          {isImageIcon(icon) ? (
            <img src={icon!} alt="" className="h-full w-full object-cover" />
          ) : icon ? (
            icon
          ) : (
            <TbMoodSmile size={28} className="text-stone-300" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-2">
        <div className="mb-2 flex items-center gap-1 border-b border-stone-100 pb-2">
          <button
            onClick={() => setTab("emoji")}
            className={cn("rounded-md px-2.5 py-1 text-xs font-medium", tab === "emoji" ? "bg-stone-900 text-white" : "text-stone-500 hover:bg-stone-100")}
          >
            Emoji
          </button>
          <button
            onClick={() => setTab("upload")}
            className={cn("rounded-md px-2.5 py-1 text-xs font-medium", tab === "upload" ? "bg-stone-900 text-white" : "text-stone-500 hover:bg-stone-100")}
          >
            Upload image
          </button>
          {icon && (
            <button
              onClick={() => { onChange(""); setOpen(false); }}
              className="ml-auto rounded-md px-2 py-1 text-xs font-medium text-stone-400 hover:bg-stone-50"
            >
              Remove
            </button>
          )}
        </div>

        {tab === "emoji" ? (
          <div className="grid grid-cols-8 gap-1">
            {EMOJI_GRID.map((e) => (
              <button
                key={e}
                onClick={() => { onChange(e); setOpen(false); }}
                className="rounded-md p-1.5 text-xl hover:bg-stone-100"
              >
                {e}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-4">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 px-3.5 py-2 text-sm font-medium hover:bg-stone-100 disabled:opacity-50"
            >
              {uploading ? <TbLoader size={15} className="animate-spin" /> : <TbUpload size={15} />}
              {uploading ? "Uploading…" : "Choose an image"}
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function SaveIndicator({ status, onReload }: { status: SaveStatus; onReload: () => void }) {
  if (status === "conflict") {
    return (
      <button onClick={onReload} className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100">
        Updated elsewhere — reload
      </button>
    );
  }
  const label = { idle: "", saving: "Saving…", saved: "Saved", error: "Save failed" }[status];
  if (!label) return <span />;
  return (
    <span className={cn("text-xs font-medium", status === "error" ? "text-red-500" : "text-stone-400")}>
      {label}
    </span>
  );
}
