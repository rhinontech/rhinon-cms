"use client";

import { useCallback, useEffect, useState } from "react";
import {
  TbTemplate,
  TbPlus,
  TbTrash,
  TbBulb,
  TbLayoutSidebarFilled,
  TbLayoutSidebarRightFilled,
  TbCopy,
  TbLoader,
  TbSparkles,
  TbCheck,
  TbPhoto,
  TbBrandLinkedin,
  TbMail,
  TbWand,
  TbX,
  TbEye,
  TbRefresh,
} from "react-icons/tb";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { useSideNav } from "@/context/SideNavContext";

type TemplateChannel =
  | "Email"
  | "Cold Email"
  | "LinkedIn Post"
  | "LinkedIn Video"
  | "LinkedIn Article"
  | "LinkedIn DM"
  | "LinkedIn Connection";

const SOCIAL_CHANNELS: TemplateChannel[] = [
  "LinkedIn Post",
  "LinkedIn Video",
  "LinkedIn Article",
  "LinkedIn DM",
  "LinkedIn Connection",
];
const EMAIL_CHANNELS: TemplateChannel[] = ["Email", "Cold Email"];
const ALL_CHANNELS: TemplateChannel[] = [...EMAIL_CHANNELS, ...SOCIAL_CHANNELS];

const isSocial = (ch?: string) => !!ch && SOCIAL_CHANNELS.includes(ch as TemplateChannel);

const CHANNEL_COLORS: Record<string, string> = {
  Email: "bg-blue-50 text-blue-600 border-blue-100",
  "Cold Email": "bg-sky-50 text-sky-600 border-sky-100",
  "LinkedIn Post": "bg-indigo-50 text-indigo-600 border-indigo-100",
  "LinkedIn Video": "bg-violet-50 text-violet-600 border-violet-100",
  "LinkedIn Article": "bg-purple-50 text-purple-600 border-purple-100",
  "LinkedIn DM": "bg-cyan-50 text-cyan-600 border-cyan-100",
  "LinkedIn Connection": "bg-teal-50 text-teal-600 border-teal-100",
};

interface Template {
  id: string;
  name: string;
  channel: TemplateChannel;
  subject: string;
  body: string;
  imageUrl: string;
  aiInstructions: string;
  visibility?: "PUBLIC" | "CONNECTIONS";
  mediaTitle?: string;
  mediaDescription?: string;
  articleUrl?: string;
}

type PanelMode = "view" | "create" | "edit" | "ai-generate";
type ChannelFilter = "All" | "Email" | "LinkedIn";

export function TemplatesPage() {
  const { isExpanded: isSubNavExpanded } = useSideNav();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [panelMode, setPanelMode] = useState<PanelMode>("view");
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(true);
  const [saving, setSaving] = useState(false);
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("All");

  const emptyForm = {
    name: "",
    channel: "Email" as TemplateChannel,
    subject: "",
    body: "",
    imageUrl: "",
    aiInstructions: "",
    visibility: "PUBLIC" as "PUBLIC" | "CONNECTIONS",
    mediaTitle: "",
    mediaDescription: "",
    articleUrl: "",
  };
  const [form, setForm] = useState(emptyForm);

  // AI generate state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiChannel, setAiChannel] = useState<TemplateChannel>("Email");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiPreview, setAiPreview] = useState<Partial<Template> | null>(null);

  // Image generation state
  const [imgPrompt, setImgPrompt] = useState("");
  const [imgGenerating, setImgGenerating] = useState(false);
  const [imgError, setImgError] = useState("");

  const fetchTemplates = useCallback(async () => {
    try {
      const data = await apiFetch<Template[]>("/campaigns/templates");
      setTemplates(data);
      if (!selectedTemplate && data.length > 0) setSelectedTemplate(data[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedTemplate]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (panelMode === "create") {
        await apiFetch("/campaigns/templates", { method: "POST", body: JSON.stringify(form) });
      } else {
        await apiFetch(`/campaigns/templates/${selectedTemplate?.id}`, { method: "PUT", body: JSON.stringify(form) });
      }
      setPanelMode("view");
      fetchTemplates();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAiTemplate = async () => {
    if (!aiPreview) return;
    setSaving(true);
    try {
      await apiFetch("/campaigns/templates", {
        method: "POST",
        body: JSON.stringify({ ...aiPreview, channel: aiChannel }),
      });
      setAiPreview(null);
      setAiPrompt("");
      setPanelMode("view");
      fetchTemplates();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);
    setAiPreview(null);
    try {
      const data = await apiFetch<any>("/campaigns/templates/generate", {
        method: "POST",
        body: JSON.stringify({ prompt: aiPrompt, channel: aiChannel }),
      });
      setAiPreview({ ...data, channel: aiChannel });
    } catch (err: any) {
      alert("AI generation failed: " + err.message);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleGenerateImage = async (target: "form" | "ai-preview") => {
    const prompt = imgPrompt.trim();
    if (!prompt) return;
    setImgGenerating(true);
    setImgError("");
    try {
      const data = await apiFetch<{ url: string }>("/ai/images/generate", {
        method: "POST",
        body: JSON.stringify({ prompt }),
      });
      if (target === "form") {
        setForm((f) => ({ ...f, imageUrl: data.url }));
      } else {
        setAiPreview((p) => p ? { ...p, imageUrl: data.url } : p);
      }
      setImgPrompt("");
    } catch (err: any) {
      setImgError(err.message || "Image generation failed");
    } finally {
      setImgGenerating(false);
    }
  };

  const startCreate = () => {
    setForm(emptyForm);
    setImgPrompt("");
    setImgError("");
    setPanelMode("create");
    setIsPreviewExpanded(true);
  };

  const startAiGenerate = () => {
    setAiPrompt("");
    setAiPreview(null);
    setImgPrompt("");
    setImgError("");
    setPanelMode("ai-generate");
    setIsPreviewExpanded(true);
  };

  const startEdit = () => {
    if (!selectedTemplate) return;
    setForm({
      name: selectedTemplate.name,
      channel: selectedTemplate.channel || "Email",
      subject: selectedTemplate.subject || "",
      body: selectedTemplate.body,
      imageUrl: selectedTemplate.imageUrl || "",
      aiInstructions: selectedTemplate.aiInstructions || "",
      visibility: selectedTemplate.visibility || "PUBLIC",
      mediaTitle: selectedTemplate.mediaTitle || "",
      mediaDescription: selectedTemplate.mediaDescription || "",
      articleUrl: selectedTemplate.articleUrl || "",
    });
    setImgPrompt("");
    setImgError("");
    setPanelMode("edit");
    setIsPreviewExpanded(true);
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
      fetchTemplates();
    } catch {
      alert("Duplicate failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    try {
      await apiFetch(`/campaigns/templates/${id}`, { method: "DELETE" });
      if (selectedTemplate?.id === id) setSelectedTemplate(null);
      fetchTemplates();
    } catch {
      alert("Delete failed");
    }
  };

  const filteredTemplates = templates.filter((t) => {
    if (channelFilter === "Email") return EMAIL_CHANNELS.includes(t.channel);
    if (channelFilter === "LinkedIn") return SOCIAL_CHANNELS.includes(t.channel);
    return true;
  });

  const panelVisible =
    isPreviewExpanded && (templates.length > 0 || panelMode === "create" || panelMode === "ai-generate");

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      <main
        className={cn(
          "flex h-full min-h-0 w-full flex-col overflow-hidden bg-stone-50",
          isSubNavExpanded ? "rounded-r-xl" : "rounded-xl"
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          <div className="flex items-center gap-3">
            <SubNavToggle />
            <div>
              <h1 className="text-base font-semibold tracking-tight text-gray-900">Templates</h1>
              <p className="text-xs text-gray-500">Reusable content templates for email & LinkedIn campaigns.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={startAiGenerate}
              className="inline-flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 text-violet-600 px-3 py-1.5 text-xs font-medium hover:bg-violet-100 transition-colors"
            >
              <TbSparkles size={14} /> AI Generate
            </button>
            <button
              onClick={startCreate}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-stone-100"
            >
              New Template <TbPlus size={14} />
            </button>
            {!panelVisible && (
              <button onClick={() => setIsPreviewExpanded(true)} className="rounded-lg p-2 text-gray-600 hover:bg-stone-100">
                <TbLayoutSidebarFilled size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Channel filter tabs */}
        <div className="flex items-center gap-1 px-4 pt-3 pb-0 border-b border-stone-100">
          {(["All", "Email", "LinkedIn"] as ChannelFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setChannelFilter(f)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 text-xs font-bold border-b-2 -mb-px transition-all",
                channelFilter === f
                  ? "border-stone-900 text-stone-900"
                  : "border-transparent text-stone-400 hover:text-stone-600"
              )}
            >
              {f === "LinkedIn" && <TbBrandLinkedin size={13} />}
              {f === "Email" && <TbMail size={13} />}
              {f}
              <span className="ml-1 bg-stone-100 text-stone-500 rounded-full px-1.5 py-0.5 text-[9px] font-bold">
                {f === "All"
                  ? templates.length
                  : f === "Email"
                  ? templates.filter((t) => EMAIL_CHANNELS.includes(t.channel)).length
                  : templates.filter((t) => SOCIAL_CHANNELS.includes(t.channel)).length}
              </span>
            </button>
          ))}
        </div>

        {/* Template list */}
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-1 gap-2">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl border border-stone-100 bg-white animate-pulse" />
              ))
            ) : filteredTemplates.length === 0 ? (
              <div className="py-20 text-center text-sm text-gray-400">
                No {channelFilter === "All" ? "" : channelFilter} templates yet.
              </div>
            ) : (
              filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => {
                    setSelectedTemplate(template);
                    setPanelMode("view");
                    setIsPreviewExpanded(true);
                  }}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white cursor-pointer hover:bg-stone-50 transition-colors group",
                    selectedTemplate?.id === template.id && "border-stone-900 ring-1 ring-stone-900 bg-stone-50/50"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn("p-2 rounded-lg text-lg border", CHANNEL_COLORS[template.channel] || "bg-stone-50 text-stone-400 border-stone-100")}>
                      {isSocial(template.channel) ? <TbBrandLinkedin size={18} /> : <TbMail size={18} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-900 text-sm">{template.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={cn("text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border", CHANNEL_COLORS[template.channel] || "bg-stone-100 text-stone-500 border-stone-200")}>
                          {template.channel}
                        </span>
                        {template.imageUrl && (
                          <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-0.5">
                            <TbPhoto size={10} /> Image
                          </span>
                        )}
                        {!isSocial(template.channel) && template.subject && (
                          <span className="text-xs text-stone-400 truncate max-w-[180px]">{template.subject}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={(e) => { e.stopPropagation(); handleDuplicate(template); }} className="p-1.5 text-stone-300 hover:text-stone-700 rounded" title="Duplicate">
                      <TbCopy size={17} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(template.id); }} className="p-1.5 text-stone-300 hover:text-red-600 rounded" title="Delete">
                      <TbTrash size={17} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Aside Panel */}
      <aside className={`flex min-h-0 h-full flex-col bg-white rounded-xl overflow-hidden transition-all duration-200 ease-in-out ${panelVisible ? "w-[46%] ml-2" : "w-0"}`}>
        {panelVisible && (
          <div className="flex h-full flex-1 flex-col overflow-hidden">
            {/* Panel Header */}
            <div className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-5">
              <p className="-mb-px flex self-stretch items-center border-b-2 border-stone-900 text-sm font-bold tracking-tight text-black">
                {panelMode === "create" ? "New Template" : panelMode === "edit" ? "Edit Template" : panelMode === "ai-generate" ? "AI Generate" : "Template Details"}
              </p>
              <div className="flex items-center gap-2">
                {panelMode === "view" && selectedTemplate && (
                  <>
                    <button onClick={() => handleDuplicate(selectedTemplate)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 flex items-center gap-1">
                      <TbCopy size={13} /> Duplicate
                    </button>
                    <button onClick={startEdit} className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100">
                      Edit
                    </button>
                  </>
                )}
                <button onClick={() => setIsPreviewExpanded(false)} className="text-gray-600 hover:text-gray-900">
                  <TbLayoutSidebarRightFilled size={20} />
                </button>
              </div>
            </div>

            {/* Panel Body */}
            <div className="flex-1 overflow-auto">

              {/* ── AI Generate mode ── */}
              {panelMode === "ai-generate" && (
                <div className="p-5 flex flex-col gap-5">
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Describe what you need. AI will write the template body and AI instructions for you.
                  </p>

                  {/* Channel selector for AI gen */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-stone-500 uppercase tracking-widest">Channel</label>
                    <select
                      value={aiChannel}
                      onChange={(e) => setAiChannel(e.target.value as TemplateChannel)}
                      className="w-full px-3 py-2 rounded-lg border border-stone-200 focus:ring-2 focus:ring-stone-900 focus:outline-none text-sm bg-white"
                    >
                      <optgroup label="Email">
                        <option value="Email">Email</option>
                        <option value="Cold Email">Cold Email</option>
                      </optgroup>
                      <optgroup label="LinkedIn">
                        <option value="LinkedIn Post">LinkedIn Post</option>
                        <option value="LinkedIn Article">LinkedIn Article</option>
                        <option value="LinkedIn Video">LinkedIn Video</option>
                        <option value="LinkedIn DM">LinkedIn DM</option>
                        <option value="LinkedIn Connection">LinkedIn Connection</option>
                      </optgroup>
                    </select>
                  </div>

                  <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
                    Your prompt
                    <textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder={isSocial(aiChannel)
                        ? "e.g. A thought leadership post about how AI is changing data analytics for mid-size companies"
                        : "e.g. A follow-up email for SaaS founders who haven't replied to our first outreach. Short and friendly."}
                      className="w-full px-3 py-2.5 rounded-lg border border-stone-200 focus:ring-2 focus:ring-stone-900 focus:outline-none resize-none text-sm h-28 bg-white"
                    />
                  </label>

                  <button
                    onClick={handleAiGenerate}
                    disabled={aiGenerating || !aiPrompt.trim()}
                    className="flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
                  >
                    {aiGenerating ? <TbLoader className="animate-spin" size={16} /> : <TbSparkles size={16} />}
                    {aiGenerating ? "Generating..." : "Generate Template"}
                  </button>

                  {aiPreview && (
                    <div className="flex flex-col gap-4 border-t pt-5">
                      <p className="text-[10px] font-bold text-violet-500 uppercase tracking-widest flex items-center gap-1">
                        <TbCheck size={13} /> Preview — Edit then save
                      </p>

                      <div className="space-y-3">
                        <EditableField label="Name" value={aiPreview.name || ""} onChange={(v) => setAiPreview({ ...aiPreview, name: v })} />
                        {!isSocial(aiChannel) && (
                          <EditableField label="Subject" value={aiPreview.subject || ""} onChange={(v) => setAiPreview({ ...aiPreview, subject: v })} />
                        )}
                        <div className="rounded-lg border border-gray-100 p-3">
                          <p className="text-[10px] text-gray-400 mb-1 font-semibold uppercase">Body</p>
                          <textarea
                            value={aiPreview.body || ""}
                            onChange={(e) => setAiPreview({ ...aiPreview, body: e.target.value })}
                            className="w-full text-sm text-stone-700 leading-relaxed border-none outline-none resize-none bg-transparent h-40"
                          />
                        </div>
                        {aiPreview.aiInstructions && (
                          <div className="rounded-xl border border-violet-100 p-3 bg-violet-50/30">
                            <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                              <TbBulb size={11} /> AI Instructions
                            </p>
                            <textarea
                              value={aiPreview.aiInstructions}
                              onChange={(e) => setAiPreview({ ...aiPreview, aiInstructions: e.target.value })}
                              className="w-full text-xs text-stone-600 italic leading-relaxed border-none outline-none resize-none bg-transparent h-16"
                            />
                          </div>
                        )}

                        {/* AI image generation for preview */}
                        <ImageGeneratorField
                          currentUrl={aiPreview.imageUrl || ""}
                          prompt={imgPrompt}
                          onPromptChange={setImgPrompt}
                          onGenerate={() => handleGenerateImage("ai-preview")}
                          onClear={() => setAiPreview({ ...aiPreview, imageUrl: "" })}
                          generating={imgGenerating}
                          error={imgError}
                        />
                      </div>

                      <div className="flex items-center justify-end gap-3 border-t pt-4">
                        <button onClick={() => setAiPreview(null)} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                          Regenerate
                        </button>
                        <button onClick={handleSaveAiTemplate} disabled={saving} className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-60">
                          {saving ? "Saving..." : "Save Template"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── View mode ── */}
              {panelMode === "view" && selectedTemplate && (
                <div className="p-5 space-y-4">
                  <div>
                    <h2 className="text-lg font-bold text-stone-900 mb-1">{selectedTemplate.name}</h2>
                    <span className={cn("text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border inline-flex items-center gap-1", CHANNEL_COLORS[selectedTemplate.channel])}>
                      {isSocial(selectedTemplate.channel) && <TbBrandLinkedin size={11} />}
                      {selectedTemplate.channel}
                    </span>
                  </div>

                  {selectedTemplate.imageUrl && (
                    <div className="rounded-xl overflow-hidden border border-stone-100">
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-3 pt-3 pb-2">Attached Image</p>
                      <img src={selectedTemplate.imageUrl} alt="Template" className="w-full object-cover max-h-52" />
                    </div>
                  )}

                  {!isSocial(selectedTemplate.channel) && selectedTemplate.subject && (
                    <div className="rounded-lg border border-stone-100 p-3">
                      <p className="text-[10px] text-stone-400 mb-1 font-semibold uppercase">Subject Line</p>
                      <p className="text-sm font-medium text-stone-900">{selectedTemplate.subject}</p>
                    </div>
                  )}

                  {isSocial(selectedTemplate.channel) && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg border border-stone-100 p-3">
                        <p className="text-[10px] text-stone-400 mb-1 font-semibold uppercase">Visibility</p>
                        <p className="text-sm font-medium text-stone-900">{selectedTemplate.visibility || "PUBLIC"}</p>
                      </div>
                      {selectedTemplate.articleUrl && (
                        <div className="rounded-lg border border-stone-100 p-3">
                          <p className="text-[10px] text-stone-400 mb-1 font-semibold uppercase">Article URL</p>
                          <p className="text-xs font-medium text-blue-600 truncate">{selectedTemplate.articleUrl}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="rounded-lg border border-stone-100 p-3">
                    <p className="text-[10px] text-stone-400 mb-2 font-semibold uppercase">
                      {isSocial(selectedTemplate.channel) ? "Seed Content" : "Message Body"}
                    </p>
                    <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap line-clamp-12">
                      {selectedTemplate.body}
                    </p>
                  </div>

                  {selectedTemplate.aiInstructions && (
                    <div className="rounded-xl border border-violet-100 p-4 bg-violet-50/30">
                      <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                        <TbBulb /> AI Instructions
                      </p>
                      <p className="text-xs text-stone-600 italic leading-relaxed">{selectedTemplate.aiInstructions}</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Create / Edit form ── */}
              {(panelMode === "create" || panelMode === "edit") && (
                <form onSubmit={handleSave} className="flex-1 flex flex-col p-5 space-y-4 pb-8">
                  {/* Template name */}
                  <FormInput label="Template Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required placeholder="e.g. LinkedIn Thought Leadership" />

                  {/* Channel */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">Channel</label>
                    <select
                      value={form.channel}
                      onChange={(e) => setForm({ ...form, channel: e.target.value as TemplateChannel })}
                      className="w-full px-3 py-2 rounded-lg border border-stone-200 focus:ring-2 focus:ring-stone-900 focus:outline-none text-sm bg-white"
                    >
                      <optgroup label="Email">
                        <option value="Email">Email</option>
                        <option value="Cold Email">Cold Email</option>
                      </optgroup>
                      <optgroup label="LinkedIn">
                        <option value="LinkedIn Post">LinkedIn Post</option>
                        <option value="LinkedIn Article">LinkedIn Article</option>
                        <option value="LinkedIn Video">LinkedIn Video</option>
                        <option value="LinkedIn DM">LinkedIn DM</option>
                        <option value="LinkedIn Connection">LinkedIn Connection</option>
                      </optgroup>
                    </select>
                  </div>

                  {/* Email-only fields */}
                  {!isSocial(form.channel) && (
                    <FormInput label="Subject Line" value={form.subject} onChange={(v) => setForm({ ...form, subject: v })} placeholder="Scaling {{lead.company}}'s potential" />
                  )}

                  {/* Social-only fields */}
                  {isSocial(form.channel) && (
                    <div className="space-y-3 p-3 rounded-xl border border-indigo-100 bg-indigo-50/20">
                      <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1">
                        <TbBrandLinkedin size={12} /> LinkedIn Options
                      </p>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-700">Visibility</label>
                        <select value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value as "PUBLIC" | "CONNECTIONS" })} className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
                          <option value="PUBLIC">Public (Anyone)</option>
                          <option value="CONNECTIONS">Connections Only</option>
                        </select>
                      </div>
                      {form.channel === "LinkedIn Article" && (
                        <FormInput label="Article URL (optional)" value={form.articleUrl} onChange={(v) => setForm({ ...form, articleUrl: v })} placeholder="https://your-blog.com/post" />
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <FormInput label="Media Title" value={form.mediaTitle} onChange={(v) => setForm({ ...form, mediaTitle: v })} placeholder="Post headline" />
                        <FormInput label="Media Description" value={form.mediaDescription} onChange={(v) => setForm({ ...form, mediaDescription: v })} placeholder="Short alt-text" />
                      </div>
                    </div>
                  )}

                  {/* Body */}
                  <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                    {isSocial(form.channel) ? "Seed Content" : "Body"}
                    <textarea
                      required
                      value={form.body}
                      onChange={(e) => setForm({ ...form, body: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-stone-900 bg-white resize-none h-44 text-sm"
                      placeholder={isSocial(form.channel)
                        ? "Key talking points, themes, or a draft post the AI will expand..."
                        : "Hi {{lead.name}}, I noticed {{lead.company}} is..."}
                    />
                  </label>

                  {/* AI Instructions */}
                  <label className="flex flex-col gap-1 text-sm font-medium text-violet-600">
                    <span className="flex items-center gap-1"><TbBulb size={14} /> AI Instructions</span>
                    <textarea
                      value={form.aiInstructions}
                      onChange={(e) => setForm({ ...form, aiInstructions: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-violet-100 outline-none focus:ring-2 focus:ring-violet-300 bg-violet-50/30 resize-none h-20 text-xs italic"
                      placeholder={isSocial(form.channel)
                        ? "Tell the AI the tone, hashtags to include, length target..."
                        : "Guide the AI on how to personalize per lead..."}
                    />
                  </label>

                  {/* Image */}
                  <ImageGeneratorField
                    currentUrl={form.imageUrl}
                    prompt={imgPrompt}
                    onPromptChange={setImgPrompt}
                    onGenerate={() => handleGenerateImage("form")}
                    onClear={() => setForm({ ...form, imageUrl: "" })}
                    generating={imgGenerating}
                    error={imgError}
                    manualUrl
                    onManualUrl={(v) => setForm({ ...form, imageUrl: v })}
                  />

                  <div className="flex items-center justify-end gap-3 border-t pt-4 mt-auto">
                    <button type="button" onClick={() => setPanelMode("view")} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                      Cancel
                    </button>
                    <button type="submit" disabled={saving} className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-60 transition-colors">
                      {saving ? "Saving..." : panelMode === "create" ? "Save Template" : "Update Template"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────

function EditableField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="rounded-lg border border-gray-100 p-3">
      <p className="text-[10px] text-gray-400 mb-1 font-semibold uppercase">{label}</p>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full text-sm font-medium text-stone-900 border-none outline-none bg-transparent" />
    </div>
  );
}

function ImageGeneratorField({
  currentUrl,
  prompt,
  onPromptChange,
  onGenerate,
  onClear,
  generating,
  error,
  manualUrl,
  onManualUrl,
}: {
  currentUrl: string;
  prompt: string;
  onPromptChange: (v: string) => void;
  onGenerate: () => void;
  onClear: () => void;
  generating: boolean;
  error: string;
  manualUrl?: boolean;
  onManualUrl?: (v: string) => void;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-3 space-y-3">
      <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest flex items-center gap-1">
        <TbPhoto size={12} /> Image <span className="text-stone-300 font-normal normal-case tracking-normal">optional</span>
      </p>

      {currentUrl ? (
        <div className="relative group rounded-lg overflow-hidden border border-stone-200">
          <img src={currentUrl.startsWith("data:") ? currentUrl : currentUrl} alt="Preview" className="w-full object-cover max-h-44" />
          <button
            type="button"
            onClick={onClear}
            className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white hover:bg-red-600 transition-colors"
          >
            <TbX size={14} />
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              placeholder="Describe an image to generate with AI..."
              className="flex-1 px-3 py-2 rounded-lg border border-stone-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-violet-400"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), onGenerate())}
            />
            <button
              type="button"
              onClick={onGenerate}
              disabled={generating || !prompt.trim()}
              className="px-3 py-2 rounded-lg bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 disabled:opacity-50 flex items-center gap-1.5 shrink-0"
            >
              {generating ? <TbLoader className="animate-spin" size={13} /> : <TbWand size={13} />}
              {generating ? "Generating..." : "Generate"}
            </button>
          </div>
          {error && <p className="text-[10px] text-red-500 font-medium">{error}</p>}
          {manualUrl && onManualUrl && (
            <input
              type="url"
              placeholder="Or paste an image URL..."
              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-stone-900"
              onBlur={(e) => e.target.value && onManualUrl(e.target.value)}
            />
          )}
        </div>
      )}
    </div>
  );
}

function FormInput({
  label,
  value,
  onChange,
  required,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
      {label}
      <input
        required={required}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg border border-stone-200 outline-none focus:ring-2 focus:ring-stone-900 bg-white text-sm"
      />
    </label>
  );
}
