"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock3,
  FileText,
  Filter,
  Layers3,
  Mail,
  Rocket,
  Search,
  Send,
  Sparkles,
  Target,
  Users,
  Upload,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import Papa from "papaparse";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Campaign, Lead, Template } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CampaignWizardProps {
  defaultChannel?: string;
  triggerLabel?: string;
  buttonClassName?: string;
  onCreated?: (campaign: Campaign) => void;
  // Controlled modes for editing
  initialCampaign?: Campaign;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function getLeadId(lead: Lead) {
  return (lead as any)._id || lead.id;
}

function toggleArrayValue(values: string[], nextValue: string) {
  return values.includes(nextValue)
    ? values.filter((value) => value !== nextValue)
    : [...values, nextValue];
}

const STEPS = [
  { id: 1, label: "Blueprint", icon: Target },
  { id: 2, label: "Launch & Messaging", icon: Send },
  { id: 3, label: "Audience Source", icon: Users },
  { id: 4, label: "Review & Create", icon: Rocket },
];

export function CampaignWizard({
  defaultChannel = "Email",
  triggerLabel = "New Campaign",
  buttonClassName,
  onCreated,
  initialCampaign,
  open,
  onOpenChange,
}: CampaignWizardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [currentStep, setCurrentStep] = useState(1);

  const [name, setName] = useState("");
  const [channel, setChannel] = useState(defaultChannel);
  const [templateId, setTemplateId] = useState("");
  const [dailyLimit, setDailyLimit] = useState(50);
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [audienceGroupName, setAudienceGroupName] = useState("");
  const [objective, setObjective] = useState("");
  const [notes, setNotes] = useState("");
  const [launchMode, setLaunchMode] = useState<"Publish Now" | "Schedule" | "Draft">("Draft");

  const [leadSearch, setLeadSearch] = useState("");
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);

  const [audienceSource, setAudienceSource] = useState<"database" | "csv">("database");
  const [csvLeads, setCsvLeads] = useState<any[]>([]);

  const resetForm = () => {
    setName("");
    setChannel(defaultChannel);
    setTemplateId("");
    setDailyLimit(50);
    setStartDate(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    setAudienceGroupName("");
    setObjective("");
    setNotes("");
    setLaunchMode("Draft");
    setLeadSearch("");
    setSelectedCompanies([]);
    setSelectedSources([]);
    setSelectedStatuses([]);
    setSelectedLeadIds([]);
    setAudienceSource("database");
    setCsvLeads([]);
    setCurrentStep(1);
  };

  const isControlled = open !== undefined;
  const actualIsOpen = isControlled ? open : isOpen;
  const setActualIsOpen = (val: boolean) => {
    if (!isControlled) setIsOpen(val);
    if (onOpenChange) onOpenChange(val);
  };

  // Hydrate form if editing
  useEffect(() => {
    if (initialCampaign && actualIsOpen) {
      setName(initialCampaign.name || "");
      setChannel(initialCampaign.channel || defaultChannel);
      setTemplateId(initialCampaign.templateId ? String(initialCampaign.templateId) : "");
      setDailyLimit(initialCampaign.dailyLimit || 50);

      const incomingDate = new Date(initialCampaign.startDate || Date.now());
      setStartDate(format(incomingDate, "yyyy-MM-dd'T'HH:mm"));

      setAudienceGroupName(initialCampaign.audienceGroupName || "");
      setObjective(initialCampaign.objective || "");
      setNotes(initialCampaign.notes || "");

      if (initialCampaign.stage === "Draft") {
        setLaunchMode("Draft");
      } else {
        setLaunchMode(incomingDate > new Date() ? "Schedule" : "Publish Now");
      }

      setSelectedLeadIds(initialCampaign.leadIds?.map(String) || []);
    } else if (!actualIsOpen) {
      const timeout = window.setTimeout(resetForm, 150);
      return () => window.clearTimeout(timeout);
    }
  }, [initialCampaign, actualIsOpen, defaultChannel]);

  useEffect(() => {
    if (!actualIsOpen) return;

    const fetchBuilderData = async () => {
      setIsLoading(true);
      try {
        const [templatesRes, leadsRes] = await Promise.all([
          fetch("/api/templates"),
          fetch("/api/leads", { cache: "no-store" }),
        ]);

        const [templatesData, leadsData] = await Promise.all([
          templatesRes.json(),
          leadsRes.json(),
        ]);

        setTemplates(Array.isArray(templatesData) ? templatesData : []);
        setLeads(Array.isArray(leadsData) ? leadsData : []);
      } catch (error) {
        console.error("Failed to load campaign builder data:", error);
        toast.error("Failed to load live leads for the campaign builder.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBuilderData();
  }, [actualIsOpen]);

  const compatibleTemplates = templates.filter(
    (template) => template.channel === channel || (channel === "Email" && template.channel === "Cold Email"),
  );

  useEffect(() => {
    if (!compatibleTemplates.some((template) => ((template as any)._id || template.id) === templateId)) {
      setTemplateId(compatibleTemplates.length > 0 ? ((compatibleTemplates[0] as any)._id || compatibleTemplates[0].id) : "");
    }
  }, [compatibleTemplates, templateId]);

  const companyCounts = leads.reduce<Record<string, number>>((acc, lead) => {
    const companyName = lead.company || "Unknown";
    acc[companyName] = (acc[companyName] || 0) + 1;
    return acc;
  }, {});

  const companyOptions = Object.entries(companyCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([companyName, count]) => ({ companyName, count }));

  const sourceOptions = Array.from(new Set(leads.map((lead) => lead.source || "Manual"))).sort();
  const statusOptions = Array.from(new Set(leads.map((lead) => lead.status))).sort();

  const normalizedLeadSearch = leadSearch.trim().toLowerCase();

  const filteredLeads = leads.filter((lead) => {
    const leadCompany = lead.company || "Unknown";
    const leadSource = lead.source || "Manual";

    const matchesSearch =
      !normalizedLeadSearch ||
      [lead.name, lead.company, lead.title, lead.email]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedLeadSearch));

    const matchesCompanies = selectedCompanies.length === 0 || selectedCompanies.includes(leadCompany);
    const matchesSources = selectedSources.length === 0 || selectedSources.includes(leadSource);
    const matchesStatuses = selectedStatuses.length === 0 || selectedStatuses.includes(lead.status);

    return matchesSearch && matchesCompanies && matchesSources && matchesStatuses;
  });

  const filteredLeadIds = filteredLeads.map((lead) => getLeadId(lead));
  const filteredLeadIdSet = new Set(filteredLeadIds);
  const selectedLeadIdSet = new Set(selectedLeadIds);
  const selectedLeads = leads.filter((lead) => selectedLeadIdSet.has(getLeadId(lead)));
  const allVisibleSelected = filteredLeadIds.length > 0 && filteredLeadIds.every((id) => selectedLeadIdSet.has(id));
  const matchingCompanyCount = new Set(filteredLeads.map((lead) => lead.company || "Unknown")).size;
  const selectedCompanyPreview = selectedLeads.reduce<Record<string, number>>((acc, lead) => {
    const companyName = lead.company || "Unknown";
    acc[companyName] = (acc[companyName] || 0) + 1;
    return acc;
  }, {});

  const selectedAudienceSize = audienceSource === "csv" ? csvLeads.length : selectedLeadIds.length;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = results.data.map((row: any) => ({
          email: row.email || row.Email || row.EMAIL,
          name: row.name || row.Name || row.NAME || row.first_name || row.firstName || "",
          company: row.company || row.Company || row.COMPANY || "",
          title: row.title || row.Title || row.TITLE || "",
        })).filter(r => r.email);

        if (parsed.length === 0) {
          toast.error("No valid emails found in the CSV. Make sure you have an 'email' column.");
        } else {
          setCsvLeads(parsed);
          toast.success(`Successfully loaded ${parsed.length} leads from CSV.`);
        }
      },
      error: (err) => {
        toast.error("Failed to parse CSV file");
        console.error(err);
      }
    });
  };

  const handleToggleLead = (leadId: string) => {
    setSelectedLeadIds((current) => toggleArrayValue(current, leadId));
  };

  const handleToggleAllVisible = () => {
    if (filteredLeadIds.length === 0) return;

    setSelectedLeadIds((current) => {
      if (allVisibleSelected) {
        return current.filter((leadId) => !filteredLeadIdSet.has(leadId));
      }

      return Array.from(new Set([...current, ...filteredLeadIds]));
    });
  };

  const handleCreateCampaign = async () => {
    const normalizedName = name.trim();

    if (!normalizedName) {
      toast.error("Campaign name is required.");
      return;
    }

    if (!templateId) {
      toast.error("Select a template before creating the campaign.");
      return;
    }

    if (selectedAudienceSize === 0) {
      toast.error("Select at least one lead for this campaign.");
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch(initialCampaign ? `/api/campaigns/${(initialCampaign as any)._id || initialCampaign.id}` : "/api/campaigns", {
        method: initialCampaign ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: normalizedName,
          channel,
          templateId,
          stage: launchMode === "Draft" ? "Draft" : "Active",
          dailyLimit: Math.min(Number(dailyLimit), 50),
          startDate: launchMode === "Publish Now" ? new Date().toISOString() : new Date(startDate).toISOString(),
          audienceGroupName,
          objective,
          notes,
          targetCompanies: selectedCompanies,
          sourceFilters: selectedSources,
          statusFilters: selectedStatuses,
          autoEnrollMatchingLeads: false,
          selectedLeadIds: audienceSource === "csv" ? [] : selectedLeadIds,
          csvLeads: audienceSource === "csv" ? csvLeads : [],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to create campaign.");
      }

      toast.success(`Campaign created with ${selectedAudienceSize} live leads.`);
      onCreated?.(data);
      setActualIsOpen(false);
    } catch (error: any) {
      console.error("Failed to create campaign:", error);
      toast.error(error.message || "Failed to create campaign.");
    } finally {
      setIsCreating(false);
    }
  };

  const selectedTemplate = compatibleTemplates.find(
    (template) => ((template as any)._id || template.id) === templateId,
  );

  const canGoNext = () => {
    if (currentStep === 1) return name.trim().length > 0;
    if (currentStep === 2) return !!templateId;
    if (currentStep === 3) return selectedAudienceSize > 0;
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && !name.trim()) {
      toast.error("Please enter a campaign name before continuing.");
      return;
    }
    if (currentStep === 2 && !templateId) {
      toast.error("Please select a template before continuing.");
      return;
    }
    if (currentStep === 3 && selectedAudienceSize === 0) {
      toast.error("Please select at least one lead before continuing.");
      return;
    }
    setCurrentStep((s) => Math.min(s + 1, STEPS.length));
  };

  const handleBack = () => setCurrentStep((s) => Math.max(s - 1, 1));

  return (
    <>
      {!isControlled && (
        <Button
          onClick={() => setActualIsOpen(true)}
          className={cn(
            "bg-cyan-500 text-white hover:bg-cyan-600",
            buttonClassName,
          )}
        >
          <Rocket size={15} className="mr-2" />
          {triggerLabel}
        </Button>
      )}

      <Sheet open={actualIsOpen} onOpenChange={setActualIsOpen}>
        <SheetContent
          side="right"
          className="w-full lg:w-[56vw] max-w-full lg:max-w-[56vw] border-border bg-card p-0 shadow-2xl flex flex-col"
        >
          {/* Header */}
          <SheetHeader className="border-b border-border bg-[linear-gradient(135deg,rgba(6,182,212,0.10),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent)] px-6 py-5 shrink-0">
            <div className="pr-10">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-500">
                  <Rocket size={20} />
                </div>
                <div>
                  <SheetTitle className="text-xl font-bold text-foreground">Campaign Builder</SheetTitle>
                  <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                    Build and launch campaigns step by step
                  </SheetDescription>
                </div>
              </div>

              {/* Step indicators */}
              <div className="mt-5 flex items-center gap-0">
                {STEPS.map((step, idx) => {
                  const Icon = step.icon;
                  const isActive = currentStep === step.id;
                  const isCompleted = currentStep > step.id;
                  return (
                    <div key={step.id} className="flex items-center flex-1 last:flex-none">
                      <button
                        type="button"
                        onClick={() => isCompleted && setCurrentStep(step.id)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap",
                          isActive
                            ? "bg-cyan-500/15 text-cyan-500 border border-cyan-500/25"
                            : isCompleted
                            ? "text-emerald-500 hover:bg-emerald-500/10 cursor-pointer"
                            : "text-muted-foreground cursor-default",
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black shrink-0",
                            isActive
                              ? "bg-cyan-500 text-white"
                              : isCompleted
                              ? "bg-emerald-500 text-white"
                              : "bg-secondary text-muted-foreground",
                          )}
                        >
                          {isCompleted ? "✓" : step.id}
                        </div>
                        <span className="hidden sm:inline">{step.label}</span>
                      </button>
                      {idx < STEPS.length - 1 && (
                        <div
                          className={cn(
                            "h-px flex-1 mx-1 transition-all",
                            isCompleted ? "bg-emerald-500/40" : "bg-border",
                          )}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </SheetHeader>

          {/* Step Content */}
          <div className="flex-1 overflow-y-auto bg-background p-6 custom-scrollbar">
            {isLoading ? (
              <div className="flex h-full min-h-[420px] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
                  <p className="text-sm text-muted-foreground">Loading live lead pool...</p>
                </div>
              </div>
            ) : (
              <>
                {/* ── STEP 1: Campaign Blueprint ── */}
                {currentStep === 1 && (
                  <div className="max-w-xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div>
                      <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <Target size={18} className="text-cyan-500" />
                        Campaign Blueprint
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Set the name, audience group, and objective for this campaign.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-5">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                          Campaign Name <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Q2 SaaS founders outbound"
                          className="h-11 bg-secondary/60"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                          Audience Group Name
                        </label>
                        <Input
                          value={audienceGroupName}
                          onChange={(e) => setAudienceGroupName(e.target.value)}
                          placeholder="Founders - Product led SaaS"
                          className="h-11 bg-secondary/60"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                          Campaign Objective
                        </label>
                        <textarea
                          value={objective}
                          onChange={(e) => setObjective(e.target.value)}
                          placeholder="Book discovery calls with SaaS co-founders handling product and analytics."
                          className="min-h-[110px] w-full rounded-xl border border-border bg-secondary/60 px-3 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── STEP 2: Launch Behavior + Messaging & Cadence ── */}
                {currentStep === 2 && (
                  <div className="max-w-xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div>
                      <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <Send size={18} className="text-emerald-500" />
                        Launch & Messaging
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Choose your channel, template, launch mode, and cadence settings.
                      </p>
                    </div>

                    {/* Launch Behavior */}
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                        <Send size={15} className="text-emerald-500" />
                        Launch Behavior
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {([
                          { mode: "Publish Now", desc: "Actively begin processing and dispatching now.", color: "emerald" },
                          { mode: "Schedule", desc: "Set a future time for the engine to activate.", color: "violet" },
                          { mode: "Draft", desc: "Save campaign structure to edit or launch later.", color: "cyan" },
                        ] as const).map(({ mode, desc, color }) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setLaunchMode(mode)}
                            className={cn(
                              "rounded-2xl border px-3 py-4 text-left transition-all",
                              launchMode === mode
                                ? `border-${color}-500/30 bg-${color}-500/10`
                                : "border-border bg-secondary/40 hover:bg-secondary/70",
                            )}
                          >
                            <p className="text-sm font-semibold text-foreground">{mode}</p>
                            <p className="mt-1 text-[10px] text-muted-foreground leading-tight">{desc}</p>
                          </button>
                        ))}
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                          Internal Notes
                        </label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Notes for this campaign, handoff context, exclusions, or messaging constraints."
                          className="min-h-[90px] w-full rounded-xl border border-border bg-secondary/60 px-3 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                        />
                      </div>
                    </div>

                    {/* Messaging & Cadence */}
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                        <FileText size={15} className="text-violet-500" />
                        Messaging &amp; Cadence
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                          Channel
                        </label>
                        <Select value={channel} onValueChange={(value) => value && setChannel(value)}>
                          <SelectTrigger className="h-10 bg-secondary/60">
                            <SelectValue placeholder="Choose channel" />
                          </SelectTrigger>
                          <SelectContent align="start" className="border-border bg-card">
                            <SelectItem value="Email">Email</SelectItem>
                            <SelectItem value="Cold Email">Cold Email</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                          Template <span className="text-red-500">*</span>
                        </label>
                        <Select value={templateId} onValueChange={(value) => value && setTemplateId(value)}>
                          <SelectTrigger className="h-10 bg-secondary/60">
                            <SelectValue placeholder="Choose template">
                              {selectedTemplate?.name || "Choose template"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent align="start" className="border-border bg-card">
                            {compatibleTemplates.length > 0 ? (
                              compatibleTemplates.map((template) => (
                                <SelectItem key={(template as any)._id || template.id} value={(template as any)._id || template.id}>
                                  {template.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-template" disabled>
                                No templates available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                            Daily Limit (Max 50)
                          </label>
                          <Input
                            type="number"
                            min={1}
                            max={50}
                            value={dailyLimit}
                            onChange={(e) => {
                              const v = Number(e.target.value) || 0;
                              setDailyLimit(v > 50 ? 50 : v);
                            }}
                            className="h-10 bg-secondary/60"
                          />
                        </div>
                        {launchMode === "Schedule" && (
                          <div className="space-y-2">
                            <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                              Start Date &amp; Time
                            </label>
                            <Input
                              type="datetime-local"
                              value={startDate}
                              onChange={(e) => setStartDate(e.target.value)}
                              className="h-10 bg-secondary/60"
                            />
                          </div>
                        )}
                      </div>

                      {selectedTemplate?.aiInstructions && (
                        <div className="rounded-2xl border border-violet-500/15 bg-violet-500/5 p-4">
                          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">
                            <Sparkles size={13} />
                            AI Instruction Snapshot
                          </div>
                          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                            {selectedTemplate.aiInstructions}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── STEP 3: Audience Source ── */}
                {currentStep === 3 && (
                  <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div>
                      <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <Users size={18} className="text-cyan-500" />
                        Audience Source
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Filter from the live database or upload a targeted CSV list.
                      </p>
                    </div>

                    {/* Source toggle */}
                    <div className="flex bg-secondary/60 rounded-lg p-1 w-full max-w-xs">
                      <button
                        onClick={() => setAudienceSource("database")}
                        className={cn("px-4 py-2 rounded-md text-sm font-semibold transition-all flex-1", audienceSource === "database" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                      >
                        Live Database
                      </button>
                      <button
                        onClick={() => setAudienceSource("csv")}
                        className={cn("px-4 py-2 rounded-md text-sm font-semibold transition-all flex-1", audienceSource === "csv" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                      >
                        Upload CSV
                      </button>
                    </div>

                    {audienceSource === "csv" ? (
                      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                        <div className="border border-dashed border-border rounded-xl p-10 flex flex-col items-center justify-center text-center bg-secondary/10">
                          <Upload size={32} className="text-muted-foreground mb-4" />
                          <h3 className="text-sm font-bold text-foreground">Upload CSV Target List</h3>
                          <p className="text-xs text-muted-foreground mt-1 mb-6 max-w-xs">
                            Your CSV must include an &apos;email&apos; column. Optionally include &apos;name&apos;, &apos;company&apos;, and &apos;title&apos;.
                          </p>
                          <Input type="file" accept=".csv" onChange={handleFileUpload} className="max-w-xs cursor-pointer" />
                          {csvLeads.length > 0 && (
                            <Badge variant="outline" className="mt-4 border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
                              {csvLeads.length} leads loaded successfully
                            </Badge>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{filteredLeads.length} leads matching current filters</span>
                          <Badge variant="outline" className="border-border bg-secondary text-foreground">
                            {filteredLeads.length} matching
                          </Badge>
                        </div>

                        {/* Search */}
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
                          <Input
                            value={leadSearch}
                            onChange={(e) => setLeadSearch(e.target.value)}
                            placeholder="Search by lead, company, title, or email"
                            className="h-10 bg-secondary/60 pl-9"
                          />
                        </div>

                        {/* Filters */}
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                              <Building2 size={13} />
                              Companies
                            </div>
                            <div className="flex max-h-28 flex-wrap gap-2 overflow-y-auto pr-1 custom-scrollbar">
                              {companyOptions.map(({ companyName, count }) => (
                                <button
                                  key={companyName}
                                  type="button"
                                  onClick={() => setSelectedCompanies((current) => toggleArrayValue(current, companyName))}
                                  className={cn(
                                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                                    selectedCompanies.includes(companyName)
                                      ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                                      : "border-border bg-secondary/50 text-muted-foreground hover:text-foreground",
                                  )}
                                >
                                  {companyName}
                                  <span className="ml-2 text-[10px] opacity-70">{count}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                                <Filter size={13} />
                                Sources
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {sourceOptions.map((source) => (
                                  <button
                                    key={source}
                                    type="button"
                                    onClick={() => setSelectedSources((current) => toggleArrayValue(current, source))}
                                    className={cn(
                                      "rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                                      selectedSources.includes(source)
                                        ? "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400"
                                        : "border-border bg-secondary/50 text-muted-foreground hover:text-foreground",
                                    )}
                                  >
                                    {source}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                                <Clock3 size={13} />
                                Readiness
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {statusOptions.map((status) => (
                                  <button
                                    key={status}
                                    type="button"
                                    onClick={() => setSelectedStatuses((current) => toggleArrayValue(current, status))}
                                    className={cn(
                                      "rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                                      selectedStatuses.includes(status)
                                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                        : "border-border bg-secondary/50 text-muted-foreground hover:text-foreground",
                                    )}
                                  >
                                    {status}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Bulk actions */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <Button
                            onClick={handleToggleAllVisible}
                            disabled={filteredLeads.length === 0}
                            className="bg-cyan-500 text-white hover:bg-cyan-600"
                          >
                            <CheckCircle2 size={14} className="mr-2" />
                            {allVisibleSelected ? "Clear Matching Leads" : `Select Matching Leads (${filteredLeads.length})`}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setSelectedLeadIds([])}
                            disabled={selectedAudienceSize === 0}
                            className="border-border"
                          >
                            Clear Selection
                          </Button>
                          {selectedAudienceSize > 0 && (
                            <Badge variant="outline" className="border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                              {selectedAudienceSize} selected
                            </Badge>
                          )}
                        </div>

                        {/* Lead table */}
                        <div className="overflow-hidden rounded-2xl border border-border">
                          <div className="max-h-[360px] overflow-auto custom-scrollbar">
                            <Table>
                              <TableHeader>
                                <TableRow className="border-border bg-secondary/50 hover:bg-secondary/50">
                                  <TableHead className="w-12">Pick</TableHead>
                                  <TableHead>Lead</TableHead>
                                  <TableHead>Company</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Source</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filteredLeads.length > 0 ? (
                                  filteredLeads.slice(0, 12).map((lead) => {
                                    const leadId = getLeadId(lead);
                                    const isSelected = selectedLeadIdSet.has(leadId);

                                    return (
                                      <TableRow
                                        key={leadId}
                                        className="cursor-pointer border-border hover:bg-secondary/40"
                                        onClick={() => handleToggleLead(leadId)}
                                      >
                                        <TableCell>
                                          <Checkbox
                                            checked={isSelected}
                                            onClick={(event) => event.stopPropagation()}
                                            onCheckedChange={() => handleToggleLead(leadId)}
                                            aria-label={`Select ${lead.name}`}
                                          />
                                        </TableCell>
                                        <TableCell className="max-w-[200px]">
                                          <div className="min-w-0">
                                            <p className="truncate font-semibold text-foreground">{lead.name}</p>
                                            <p className="truncate text-xs text-muted-foreground">{lead.title || "Target prospect"}</p>
                                          </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{lead.company}</TableCell>
                                        <TableCell>
                                          <Badge variant="outline" className="border-border bg-secondary text-foreground">
                                            {lead.status}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{lead.source || "Manual"}</TableCell>
                                      </TableRow>
                                    );
                                  })
                                ) : (
                                  <TableRow className="border-border hover:bg-transparent">
                                    <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                                      No live leads match these filters.
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── STEP 4: Review & Create ── */}
                {currentStep === 4 && (
                  <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div>
                      <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <Layers3 size={18} className="text-amber-500" />
                        Review &amp; Create
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Review your campaign before launching. This cohort will be attached when you create it.
                      </p>
                    </div>

                    {/* Summary cards */}
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-border bg-card/80 p-4 shadow-sm">
                        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                          <Users size={13} />
                          Selected Cohort
                        </div>
                        <p className="mt-3 text-3xl font-black text-foreground">{selectedAudienceSize}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Leads queued for this campaign.</p>
                      </div>
                      <div className="rounded-2xl border border-border bg-card/80 p-4 shadow-sm">
                        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                          <Building2 size={13} />
                          Companies
                        </div>
                        <p className="mt-3 text-3xl font-black text-foreground">
                          {audienceSource === "csv" ? "CSV" : Object.keys(selectedCompanyPreview).length}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">Unique companies in cohort.</p>
                      </div>
                      <div className="rounded-2xl border border-border bg-card/80 p-4 shadow-sm">
                        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                          <Send size={13} />
                          Launch Mode
                        </div>
                        <p className="mt-3 text-xl font-black text-foreground">{launchMode}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Daily limit: {dailyLimit} leads/day.</p>
                      </div>
                    </div>

                    {/* Companies in cohort */}
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                        <Layers3 size={15} className="text-amber-500" />
                        Selected Cohort
                        <Badge variant="outline" className="ml-auto border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          {selectedAudienceSize} selected
                        </Badge>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-2">
                        <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                            <Building2 size={13} />
                            Companies In Cohort
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {audienceSource === "csv" ? (
                              <Badge variant="outline" className="border-border bg-card text-foreground">
                                Various Companies (CSV)
                              </Badge>
                            ) : Object.entries(selectedCompanyPreview).length > 0 ? (
                              Object.entries(selectedCompanyPreview).map(([companyName, count]) => (
                                <Badge key={companyName} variant="outline" className="border-border bg-card text-foreground">
                                  {companyName} · {count}
                                </Badge>
                              ))
                            ) : (
                              <p className="text-sm text-muted-foreground">No leads selected yet.</p>
                            )}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                            <Calendar size={13} />
                            Launch Snapshot
                          </div>
                          <div className="mt-3 space-y-2 text-sm">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-muted-foreground">Starts</span>
                              <span className="font-semibold text-foreground">{format(new Date(startDate), "MMM d, yyyy")}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-muted-foreground">Daily limit</span>
                              <span className="font-semibold text-foreground">{dailyLimit} leads</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-muted-foreground">Mode</span>
                              <span className="font-semibold text-foreground">{launchMode}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-muted-foreground">Template</span>
                              <span className="font-semibold text-foreground truncate max-w-[160px]">{selectedTemplate?.name || "—"}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Lead preview */}
                      <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                          <Mail size={13} />
                          Lead Preview
                        </div>
                        <div className="mt-3 space-y-3">
                          {audienceSource === "csv" ? (
                            csvLeads.length > 0 ? (
                              csvLeads.slice(0, 6).map((lead, idx) => (
                                <div key={idx} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2.5">
                                  <div className="min-w-0">
                                    <p className="truncate font-semibold text-foreground">{lead.name || lead.email}</p>
                                    <p className="truncate text-xs text-muted-foreground">{lead.company || "No Company"} • {lead.email}</p>
                                  </div>
                                  <Badge variant="outline" className="border-border bg-secondary text-foreground">
                                    CSV Upload
                                  </Badge>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-muted-foreground">Upload a CSV to view lead preview.</p>
                            )
                          ) : selectedLeads.length > 0 ? (
                            selectedLeads.slice(0, 6).map((lead) => (
                              <div key={getLeadId(lead)} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2.5">
                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-foreground">{lead.name}</p>
                                  <p className="truncate text-xs text-muted-foreground">{lead.company} • {lead.title}</p>
                                </div>
                                <Badge variant="outline" className="border-border bg-secondary text-foreground">
                                  {lead.status}
                                </Badge>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">Select leads from the live pool to populate this campaign group.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Navigation */}
          <div className="border-t border-border bg-secondary/30 px-6 py-4 shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 hidden sm:block">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Step {currentStep} of {STEPS.length} — {STEPS[currentStep - 1].label}
                </p>
                <p className="mt-0.5 truncate text-sm text-foreground">
                  {name.trim() || "Untitled campaign"}
                  {selectedAudienceSize > 0 && ` • ${selectedAudienceSize} leads selected`}
                </p>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <Button
                  variant="outline"
                  onClick={() => setActualIsOpen(false)}
                  disabled={isCreating}
                  className="border-border"
                >
                  Cancel
                </Button>

                {currentStep > 1 && (
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={isCreating}
                    className="border-border gap-1"
                  >
                    <ChevronLeft size={15} />
                    Back
                  </Button>
                )}

                {currentStep < STEPS.length ? (
                  <Button
                    onClick={handleNext}
                    className="bg-cyan-500 text-white hover:bg-cyan-600 gap-1"
                  >
                    Next
                    <ChevronRight size={15} />
                  </Button>
                ) : (
                  <Button
                    onClick={handleCreateCampaign}
                    disabled={isCreating || isLoading}
                    className="bg-cyan-500 text-white hover:bg-cyan-600"
                  >
                    {isCreating ? (
                      <>
                        <div className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Rocket size={15} className="mr-2" />
                        Create Campaign
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
