"use client";

import { useCallback, useEffect, useState } from "react";
import { TbBrandLinkedin, TbMail, TbPlus, TbTemplate } from "react-icons/tb";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { useConfirm } from "@/components/Admin/Common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "../shared/EmptyState";
import { TemplateCard } from "./TemplateCard";
import { TemplateSheet } from "./TemplateSheet";
import { EMAIL_CHANNELS, SOCIAL_CHANNELS, type Template } from "./types";

type ChannelFilter = "All" | "Email" | "LinkedIn";

export function TemplatesPage() {
  const confirm = useConfirm();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("All");

  const [sheetMode, setSheetMode] = useState<"view" | "create" | "edit">("view");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      const data = await apiFetch<Template[]>("/campaigns/templates");
      setTemplates(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const filtered = templates.filter((t) => {
    if (channelFilter === "Email") return EMAIL_CHANNELS.includes(t.channel);
    if (channelFilter === "LinkedIn") return SOCIAL_CHANNELS.includes(t.channel);
    return true;
  });

  const openView = (t: Template) => {
    setActiveTemplate(t);
    setSheetMode("view");
    setSheetOpen(true);
  };

  const openCreate = () => {
    setActiveTemplate(null);
    setSheetMode("create");
    setSheetOpen(true);
  };

  const handleDuplicate = async (template: Template) => {
    try {
      await apiFetch("/campaigns/templates", {
        method: "POST",
        body: JSON.stringify({
          name: `${template.name} (Copy)`,
          channel: template.channel,
          subject: template.subject,
          body: template.body,
          imageUrl: template.imageUrl,
          aiInstructions: template.aiInstructions,
          visibility: template.visibility,
          mediaTitle: template.mediaTitle,
          mediaDescription: template.mediaDescription,
          articleUrl: template.articleUrl,
        }),
      });
      toast.success("Template duplicated");
      fetchTemplates();
    } catch {
      toast.error("Duplicate failed");
    }
  };

  const handleDelete = async (template: Template) => {
    const ok = await confirm({ title: `Delete "${template.name}"?`, confirmLabel: "Delete", destructive: true });
    if (!ok) return;
    try {
      await apiFetch(`/campaigns/templates/${template.id}`, { method: "DELETE" });
      toast.success("Template deleted");
      fetchTemplates();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <main className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl glass-panel">
      <div className="flex h-16 shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-3">
          <SubNavToggle />
          <div>
            <h1 className="text-base font-semibold tracking-tight text-gray-900">Templates</h1>
            <p className="text-xs text-gray-500">Reusable content for email & LinkedIn campaigns.</p>
          </div>
        </div>
        <Button size="sm" onClick={openCreate}>
          <TbPlus size={15} /> New Template
        </Button>
      </div>

      <div className="flex-1 space-y-4 overflow-auto p-4">
        <Tabs value={channelFilter} onValueChange={(v) => setChannelFilter(v as ChannelFilter)}>
          <TabsList>
            <TabsTrigger value="All">
              All <span className="text-[10px] text-stone-400 tabular-nums">{templates.length}</span>
            </TabsTrigger>
            <TabsTrigger value="Email">
              <TbMail size={13} /> Email
              <span className="text-[10px] text-stone-400 tabular-nums">
                {templates.filter((t) => EMAIL_CHANNELS.includes(t.channel)).length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="LinkedIn">
              <TbBrandLinkedin size={13} /> LinkedIn
              <span className="text-[10px] text-stone-400 tabular-nums">
                {templates.filter((t) => SOCIAL_CHANNELS.includes(t.channel)).length}
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<TbTemplate size={40} />}
            title={channelFilter === "All" ? "No templates yet" : `No ${channelFilter} templates`}
            description="Write one yourself, or describe it and let AI draft a starting point."
            action={
              <Button size="sm" onClick={openCreate}>
                <TbPlus size={15} /> New Template
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {filtered.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                onOpen={() => openView(t)}
                onDuplicate={() => handleDuplicate(t)}
                onDelete={() => handleDelete(t)}
              />
            ))}
          </div>
        )}
      </div>

      <TemplateSheet
        mode={sheetMode}
        template={activeTemplate}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSaved={fetchTemplates}
        onDeleted={fetchTemplates}
      />
    </main>
  );
}
