"use client";

import { useCallback, useEffect, useState } from "react";
import {
  TbMail,
  TbLoader,
  TbSearch,
  TbBulb,
  TbSend,
  TbCheck,
  TbChevronRight,
  TbLayoutSidebarFilled,
  TbLayoutSidebarRightFilled,
  TbTemplate,
} from "react-icons/tb";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { useSideNav } from "@/context/SideNavContext";

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
    setSelectedTemplateId(templateId);
    if (!templateId) return;
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
      alert("AI Generation failed");
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
      setTimeout(() => setSent(false), 3000);
    } catch (err: any) {
      alert("Send failed: " + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      <main
        className={cn(
          "flex h-full min-h-0 w-full flex-col overflow-hidden bg-stone-50",
          isSubNavExpanded ? "rounded-r-xl" : "rounded-xl"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <div className="flex items-center gap-3">
            <SubNavToggle />
            <div>
              <h1 className="text-base font-semibold tracking-tight text-gray-900">Manual Send</h1>
              <p className="text-xs text-gray-500">1-to-1 personalized email outreach with AI assistance.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(!isPreviewExpanded || filteredLeads.length === 0) && (
              <button
                onClick={() => setIsPreviewExpanded(true)}
                className="rounded-lg p-2 text-gray-600 hover:bg-stone-100"
              >
                <TbLayoutSidebarFilled size={20} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 flex flex-col">
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm flex flex-col flex-1 overflow-hidden">
            <div className="p-4 border-b border-stone-100 bg-stone-50/50">
              <div className="relative max-w-sm">
                <TbSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                <input
                  type="text"
                  placeholder="Find lead..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>
            <div className="flex-1 overflow-auto divide-y divide-stone-50">
              {loading ? (
                <div className="p-10 text-center">
                  <TbLoader className="animate-spin text-stone-200 mx-auto" size={32} />
                </div>
              ) : filteredLeads.length === 0 ? (
                <div className="p-10 text-center text-stone-400 text-sm italic">No leads found</div>
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
                      "w-full p-4 text-left hover:bg-stone-50 transition-colors flex items-center justify-between group",
                      selectedLead?.id === lead.id ? "bg-blue-50 hover:bg-blue-50" : ""
                    )}
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-stone-900 truncate text-sm">{lead.name}</p>
                      <p className="text-xs text-stone-500 truncate">{lead.company}</p>
                    </div>
                    <TbChevronRight
                      className={cn(
                        "text-stone-300 group-hover:translate-x-1 transition-transform",
                        selectedLead?.id === lead.id ? "text-blue-600" : ""
                      )}
                    />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Aside Panel */}
      <aside
        className={`flex min-h-0 h-full flex-col bg-white rounded-xl overflow-hidden transition-all duration-200 ease-in-out ${
          isPreviewExpanded && (filteredLeads.length > 0 || selectedLead) ? "w-[55%] ml-2" : "w-0"
        }`}
      >
        {isPreviewExpanded && (filteredLeads.length > 0 || selectedLead) && (
          <div className="flex h-full flex-1 flex-col overflow-hidden">
            <div className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-5">
              <p className="-mb-px flex self-stretch items-center border-b-2 border-blue-600 text-md font-medium tracking-tight text-black">
                Email Composer
              </p>
              <button onClick={() => setIsPreviewExpanded(false)} className="text-gray-600 hover:text-gray-900">
                <TbLayoutSidebarRightFilled size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-auto flex flex-col">
              {!selectedLead ? (
                <div className="flex-1 flex flex-col items-center justify-center text-stone-400 p-10 text-center">
                  <TbMail size={64} className="mb-4 opacity-10" />
                  <h3 className="text-lg font-bold text-stone-800 mb-2">Ready to reach out?</h3>
                  <p className="max-w-xs text-sm">
                    Select a lead from the list to start composing a personalized outreach message.
                  </p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Lead header + controls */}
                  <div className="p-5 border-b border-stone-100 space-y-3 bg-stone-50/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center font-bold text-lg shrink-0">
                          {selectedLead.name.charAt(0)}
                        </div>
                        <div>
                          <h2 className="text-base font-bold text-stone-900 leading-none">{selectedLead.name}</h2>
                          <p className="text-xs text-stone-500 font-medium mt-1">{selectedLead.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={handleGenerateDraft}
                        disabled={generating}
                        className="flex items-center gap-2 text-indigo-600 font-bold hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-all border border-indigo-100 text-xs disabled:opacity-50 shrink-0"
                      >
                        {generating ? <TbLoader className="animate-spin" /> : <TbBulb />}
                        AI Draft
                      </button>
                    </div>

                    {/* Template picker */}
                    <div className="flex items-center gap-2">
                      <TbTemplate size={15} className="text-stone-400 shrink-0" />
                      <select
                        value={selectedTemplateId}
                        onChange={(e) => handleTemplateLoad(e.target.value)}
                        className="flex-1 text-xs rounded-lg border border-stone-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-stone-700"
                      >
                        <option value="">Load a template (optional)...</option>
                        {templates.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Composer */}
                  <div className="flex-1 p-6 overflow-auto flex flex-col gap-5">
                    <div>
                      <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">
                        Subject Line
                      </label>
                      <input
                        type="text"
                        value={composer.subject}
                        onChange={(e) => setComposer({ ...composer, subject: e.target.value })}
                        placeholder="e.g. Scaling operations at {{company}}"
                        className="w-full px-3 py-2.5 text-sm font-bold rounded-lg border border-stone-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none placeholder:text-stone-300 transition-colors bg-white"
                      />
                    </div>
                    <div className="flex-1 flex flex-col min-h-0">
                      <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">
                        Email Body
                      </label>
                      <textarea
                        value={composer.body}
                        onChange={(e) => setComposer({ ...composer, body: e.target.value })}
                        placeholder="Type your message here or generate an AI draft..."
                        className="flex-1 w-full p-4 text-stone-700 leading-relaxed rounded-lg border border-stone-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none resize-none placeholder:text-stone-300 text-sm min-h-[320px] bg-white"
                      />
                    </div>
                  </div>

                  <div className="p-5 border-t border-stone-100 bg-stone-50/50 flex items-center justify-between">
                    <div className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">
                      {composer.body.length > 0 && `~${Math.ceil(composer.body.length / 5)} words`}
                    </div>
                    <button
                      onClick={handleSend}
                      disabled={sending || !composer.body || !composer.subject}
                      className={cn(
                        "flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all shadow-md active:scale-95 disabled:opacity-30 text-sm",
                        sent ? "bg-emerald-600 text-white" : "bg-stone-900 text-white hover:bg-stone-800"
                      )}
                    >
                      {sending ? (
                        <TbLoader className="animate-spin" size={18} />
                      ) : sent ? (
                        <TbCheck size={18} />
                      ) : (
                        <TbSend size={18} />
                      )}
                      {sent ? "Sent" : "Send Email"}
                    </button>
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
