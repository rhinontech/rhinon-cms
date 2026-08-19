"use client";

import { useCallback, useEffect, useState } from "react";
import {
  TbBulb,
  TbCheck,
  TbChevronRight,
  TbLayoutSidebarFilled,
  TbLayoutSidebarRightFilled,
  TbLoader,
  TbMail,
  TbSearch,
  TbSend,
  TbX,
} from "react-icons/tb";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { useSideNav } from "@/context/SideNavContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  status: string;
  title?: string;
}

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
  aiInstructions: string;
}

export function ManualOutreachPage() {
  const { isExpanded: isSubNavExpanded } = useSideNav();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(true);

  const [composer, setComposer] = useState({ subject: "", body: "" });

  const fetchLeads = useCallback(async () => {
    try {
      const data = await apiFetch<Lead[]>("/leads");
      setLeads(data);
      if (!selectedLead && data.length > 0) setSelectedLead(data[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedLead]);

  useEffect(() => {
    fetchLeads();
    apiFetch<Template[]>("/campaigns/templates").then(setTemplates).catch(() => {});
  }, [fetchLeads]);

  const filteredLeads = leads.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.company.toLowerCase().includes(search.toLowerCase())
  );

  const handleTemplateLoad = (templateId: string) => {
    setSelectedTemplateId(templateId === "none" ? "" : templateId);
    if (templateId === "none") return;
    const tpl = templates.find((t) => t.id === templateId);
    if (tpl) {
      setComposer({ subject: tpl.subject || "", body: tpl.body || "" });
    }
  };

  const handleGenerateDraft = async () => {
    if (!selectedLead) return;
    setGenerating(true);
    try {
      const data = await apiFetch<any>("/campaigns/generate", {
        method: "POST",
        body: JSON.stringify({
          leadId: selectedLead.id,
          templateId: selectedTemplateId || undefined,
        }),
      });
      setComposer({
        subject: data.subject || `Scaling ${selectedLead.company}'s operations`,
        body: data.body || "",
      });
    } catch (err) {
      toast.error("AI generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!selectedLead || !composer.subject || !composer.body) return;
    setSending(true);
    try {
      await apiFetch("/outreach/send", {
        method: "POST",
        body: JSON.stringify({
          leadId: selectedLead.id,
          subject: composer.subject,
          body: composer.body,
        }),
      });
      setSent(true);
      toast.success(`Email sent to ${selectedLead.name}`);
      setTimeout(() => setSent(false), 3000);
    } catch (err: any) {
      toast.error("Send failed: " + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="relative flex h-full min-h-0 w-full overflow-hidden">
      <main
        className={cn(
          "flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden glass-panel",
          isSubNavExpanded ? "rounded-r-xl max-sm:rounded-xl" : "rounded-xl"
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b px-3 sm:px-4">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <SubNavToggle />
            <div className="min-w-0">
              <h1 className="text-base font-semibold tracking-tight text-gray-900 truncate">Manual Send</h1>
              <p className="hidden text-xs text-gray-500 sm:block truncate">1-to-1 personalized email outreach with AI assistance.</p>
            </div>
          </div>
          {(!isPreviewExpanded || filteredLeads.length === 0) && (
            <button
              onClick={() => setIsPreviewExpanded(true)}
              className="rounded-lg p-2 text-gray-600 hover:bg-stone-100 shrink-0"
              title="Open composer"
            >
              <TbLayoutSidebarFilled size={20} />
            </button>
          )}
        </div>

        <div className="flex flex-1 flex-col overflow-auto p-3 sm:p-4">
          <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xs">
            <div className="border-b border-stone-100 bg-stone-50/50 p-3 sm:p-4">
              <div className="relative w-full max-w-sm">
                <TbSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                <Input
                  type="text"
                  placeholder="Find lead..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-white pl-9"
                />
              </div>
            </div>
            <div className="flex-1 divide-y divide-stone-50 overflow-auto">
              {loading ? (
                <div className="p-10 text-center">
                  <TbLoader className="mx-auto animate-spin text-stone-300" size={32} />
                </div>
              ) : filteredLeads.length === 0 ? (
                <div className="p-10 text-center text-sm italic text-stone-400">No leads found</div>
              ) : (
                filteredLeads.map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => {
                      setSelectedLead(lead);
                      setSent(false);
                      setIsPreviewExpanded(true);
                    }}
                    className={cn(
                      "group flex w-full items-center justify-between p-3.5 sm:p-4 text-left transition-colors hover:bg-stone-50",
                      selectedLead?.id === lead.id && "bg-blue-50/80 hover:bg-blue-50"
                    )}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="truncate text-sm font-bold text-stone-900">{lead.name}</p>
                      <p className="truncate text-xs text-stone-500">{lead.company}</p>
                    </div>
                    <TbChevronRight
                      className={cn(
                        "text-stone-300 transition-transform group-hover:translate-x-1 shrink-0",
                        selectedLead?.id === lead.id && "text-blue-600"
                      )}
                    />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Drawer Backdrop */}
      {isPreviewExpanded && (filteredLeads.length > 0 || selectedLead) && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
          onClick={() => setIsPreviewExpanded(false)}
        />
      )}

      {/* Composer aside */}
      <aside
        className={cn(
          "flex min-h-0 flex-col overflow-hidden bg-white transition-all duration-200 ease-in-out",
          isPreviewExpanded && (filteredLeads.length > 0 || selectedLead)
            ? "fixed inset-y-0 right-0 z-50 flex h-full w-full sm:w-[500px] max-w-full shadow-2xl lg:static lg:z-auto lg:h-full lg:w-[55%] lg:max-w-none lg:ml-2 lg:rounded-xl lg:shadow-none lg:border lg:border-black/5"
            : "hidden lg:flex lg:h-full lg:w-0"
        )}
      >
        {isPreviewExpanded && (filteredLeads.length > 0 || selectedLead) && (
          <div className="flex h-full flex-1 flex-col overflow-hidden">
            <div className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b bg-white px-4 sm:px-5">
              <p className="text-md -mb-px flex items-center self-stretch border-b-2 border-blue-600 font-medium tracking-tight text-black">
                Email Composer
              </p>
              <button
                onClick={() => setIsPreviewExpanded(false)}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                aria-label="Close composer"
              >
                <TbX size={18} className="lg:hidden" />
                <TbLayoutSidebarRightFilled size={20} className="hidden lg:block" />
              </button>
            </div>

            <div className="flex flex-1 flex-col overflow-auto">
              {!selectedLead ? (
                <div className="flex flex-1 flex-col items-center justify-center p-10 text-center text-stone-400">
                  <TbMail size={64} className="mb-4 opacity-10" />
                  <h3 className="mb-2 text-lg font-bold text-stone-800">Ready to reach out?</h3>
                  <p className="max-w-xs text-sm">
                    Select a lead from the list to start composing a personalized outreach message.
                  </p>
                </div>
              ) : (
                <div className="flex flex-1 flex-col overflow-hidden">
                  {/* Lead header + controls */}
                  <div className="space-y-3 border-b border-stone-100 bg-stone-50/30 p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-stone-900 text-base sm:text-lg font-bold text-white">
                          {selectedLead.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h2 className="truncate text-sm sm:text-base font-bold leading-none text-stone-900">{selectedLead.name}</h2>
                          <p className="mt-1 truncate text-xs font-medium text-stone-500">{selectedLead.email}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={handleGenerateDraft} disabled={generating} className="shrink-0 border-indigo-100 text-indigo-600 hover:bg-indigo-50 text-xs px-2.5 sm:px-3">
                        {generating ? <TbLoader className="animate-spin" size={14} /> : <TbBulb size={14} />}
                        AI Draft
                      </Button>
                    </div>

                    <Select value={selectedTemplateId || "none"} onValueChange={handleTemplateLoad}>
                      <SelectTrigger className="w-full bg-white">
                        <SelectValue placeholder="Load a template (optional)..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No template</SelectItem>
                        {templates.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Composer */}
                  <div className="flex flex-1 flex-col gap-4 sm:gap-5 overflow-auto p-4 sm:p-6">
                    <div className="space-y-1.5">
                      <Label htmlFor="manual-subject" className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                        Subject Line
                      </Label>
                      <Input
                        id="manual-subject"
                        value={composer.subject}
                        onChange={(e) => setComposer({ ...composer, subject: e.target.value })}
                        placeholder="e.g. Scaling operations at {{company}}"
                        className="font-bold"
                      />
                    </div>
                    <div className="flex min-h-0 flex-1 flex-col space-y-1.5">
                      <Label htmlFor="manual-body" className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                        Email Body
                      </Label>
                      <Textarea
                        id="manual-body"
                        value={composer.body}
                        onChange={(e) => setComposer({ ...composer, body: e.target.value })}
                        placeholder="Type your message here or generate an AI draft..."
                        className="min-h-60 sm:min-h-80 flex-1 resize-none text-sm leading-relaxed"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-stone-100 bg-stone-50/50 p-4 sm:p-5">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                      {composer.body.length > 0 && `~${Math.ceil(composer.body.length / 5)} words`}
                    </div>
                    <Button
                      onClick={handleSend}
                      disabled={sending || !composer.body || !composer.subject}
                      className={cn(sent && "bg-emerald-600 hover:bg-emerald-600")}
                    >
                      {sending ? (
                        <TbLoader className="animate-spin" size={16} />
                      ) : sent ? (
                        <TbCheck size={16} />
                      ) : (
                        <TbSend size={16} />
                      )}
                      {sent ? "Sent" : "Send Email"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
