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
} from "lucide-react";
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
}

function getLeadId(lead: Lead) {
  return (lead as any)._id || lead.id;
}

function toggleArrayValue(values: string[], nextValue: string) {
  return values.includes(nextValue)
    ? values.filter((value) => value !== nextValue)
    : [...values, nextValue];
}

export function CampaignWizard({
  defaultChannel = "Email",
  triggerLabel = "New Campaign",
  buttonClassName,
  onCreated,
}: CampaignWizardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);

  const [name, setName] = useState("");
  const [channel, setChannel] = useState(defaultChannel);
  const [templateId, setTemplateId] = useState("");
  const [dailyLimit, setDailyLimit] = useState(50);
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [audienceGroupName, setAudienceGroupName] = useState("");
  const [objective, setObjective] = useState("");
  const [notes, setNotes] = useState("");
  const [launchMode, setLaunchMode] = useState<"Draft" | "Active">("Draft");

  const [leadSearch, setLeadSearch] = useState("");
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);

  const resetForm = () => {
    setName("");
    setChannel(defaultChannel);
    setTemplateId("");
    setDailyLimit(50);
    setStartDate(format(new Date(), "yyyy-MM-dd"));
    setAudienceGroupName("");
    setObjective("");
    setNotes("");
    setLaunchMode("Draft");
    setLeadSearch("");
    setSelectedCompanies([]);
    setSelectedSources([]);
    setSelectedStatuses([]);
    setSelectedLeadIds([]);
  };

  useEffect(() => {
    if (!isOpen) {
      const timeout = window.setTimeout(resetForm, 150);
      return () => window.clearTimeout(timeout);
    }

    setChannel(defaultChannel);
  }, [defaultChannel, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

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
  }, [isOpen]);

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

  const selectedAudienceSize = selectedLeadIds.length;

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
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: normalizedName,
          channel,
          templateId,
          stage: launchMode,
          dailyLimit,
          startDate: new Date(startDate).toISOString(),
          audienceGroupName,
          objective,
          notes,
          targetCompanies: selectedCompanies,
          sourceFilters: selectedSources,
          statusFilters: selectedStatuses,
          autoEnrollMatchingLeads: false,
          selectedLeadIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to create campaign.");
      }

      toast.success(`Campaign created with ${selectedAudienceSize} live leads.`);
      onCreated?.(data);
      setIsOpen(false);
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

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "bg-cyan-500 text-white hover:bg-cyan-600",
          buttonClassName,
        )}
      >
        <Rocket size={15} className="mr-2" />
        {triggerLabel}
      </Button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="right"
          className="w-full lg:w-[60vw] max-w-full lg:max-w-[60vw] border-border bg-card p-0 shadow-2xl"
        >
          <SheetHeader className="border-b border-border bg-[linear-gradient(135deg,rgba(6,182,212,0.10),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent)] px-6 py-6">
            <div className="pr-10">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-500">
                  <Rocket size={26} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <SheetTitle className="text-2xl font-bold text-foreground">Campaign Builder</SheetTitle>
                    <Badge variant="outline" className="border-cyan-500/20 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                      Right Drawer
                    </Badge>
                  </div>
                  <SheetDescription className="mt-1 max-w-2xl text-sm leading-relaxed">
                    Build campaigns from live leads, target specific companies, create audience groups, and launch with a real cohort instead of placeholder data.
                  </SheetDescription>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border bg-card/80 p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    <Users size={13} />
                    Live Leads
                  </div>
                  <p className="mt-3 text-3xl font-black text-foreground">{leads.length}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Available in the current database right now.</p>
                </div>
                <div className="rounded-2xl border border-border bg-card/80 p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    <Building2 size={13} />
                    Target Companies
                  </div>
                  <p className="mt-3 text-3xl font-black text-foreground">{matchingCompanyCount}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Companies currently matching your filters.</p>
                </div>
                <div className="rounded-2xl border border-border bg-card/80 p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    <Layers3 size={13} />
                    Selected Cohort
                  </div>
                  <p className="mt-3 text-3xl font-black text-foreground">{selectedAudienceSize}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Leads queued for this campaign group.</p>
                </div>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto bg-background p-6 custom-scrollbar">
            {isLoading ? (
              <div className="flex h-full min-h-[420px] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
                  <p className="text-sm text-muted-foreground">Loading live lead pool...</p>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
                <div className="space-y-6">
                  <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                      <Target size={16} className="text-cyan-500" />
                      Campaign Blueprint
                    </div>
                    <div className="mt-5 space-y-4">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                          Campaign Name
                        </label>
                        <Input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Q2 SaaS founders outbound"
                          className="h-10 bg-secondary/60"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                          Audience Group
                        </label>
                        <Input
                          value={audienceGroupName}
                          onChange={(e) => setAudienceGroupName(e.target.value)}
                          placeholder="Founders - Product led SaaS"
                          className="h-10 bg-secondary/60"
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
                          className="min-h-[96px] w-full rounded-xl border border-border bg-secondary/60 px-3 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                      <FileText size={16} className="text-violet-500" />
                      Messaging & Cadence
                    </div>
                    <div className="mt-5 space-y-4">
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
                          Template
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
                            Daily Limit
                          </label>
                          <Input
                            type="number"
                            min={1}
                            value={dailyLimit}
                            onChange={(e) => setDailyLimit(Number(e.target.value) || 0)}
                            className="h-10 bg-secondary/60"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                            Start Date
                          </label>
                          <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="h-10 bg-secondary/60"
                          />
                        </div>
                      </div>

                      <div className="rounded-2xl border border-violet-500/15 bg-violet-500/5 p-4">
                        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">
                          <Sparkles size={13} />
                          AI Instruction Snapshot
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                          {selectedTemplate?.aiInstructions || "Choose a template to see how the AI will shape the outreach."}
                        </p>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                      <Send size={16} className="text-emerald-500" />
                      Launch Behavior
                    </div>
                    <div className="mt-5 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setLaunchMode("Draft")}
                          className={cn(
                            "rounded-2xl border px-4 py-4 text-left transition-all",
                            launchMode === "Draft"
                              ? "border-cyan-500/30 bg-cyan-500/10"
                              : "border-border bg-secondary/40 hover:bg-secondary/70",
                          )}
                        >
                          <p className="text-sm font-semibold text-foreground">Save as Draft</p>
                          <p className="mt-1 text-xs text-muted-foreground">Create the campaign and review before activation.</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setLaunchMode("Active")}
                          className={cn(
                            "rounded-2xl border px-4 py-4 text-left transition-all",
                            launchMode === "Active"
                              ? "border-emerald-500/30 bg-emerald-500/10"
                              : "border-border bg-secondary/40 hover:bg-secondary/70",
                          )}
                        >
                          <p className="text-sm font-semibold text-foreground">Activate Now</p>
                          <p className="mt-1 text-xs text-muted-foreground">Send selected leads straight into the execution queue.</p>
                        </button>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                          Internal Notes
                        </label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Notes for this campaign, handoff context, exclusions, or messaging constraints."
                          className="min-h-[110px] w-full rounded-xl border border-border bg-secondary/60 px-3 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                        />
                      </div>
                    </div>
                  </section>
                </div>

                <div className="space-y-6">
                  <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                          <Users size={16} className="text-cyan-500" />
                          Live Lead Pool
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Filter in real time, choose companies, and build the exact cohort for this campaign.
                        </p>
                      </div>
                      <Badge variant="outline" className="border-border bg-secondary text-foreground">
                        {filteredLeads.length} matching
                      </Badge>
                    </div>

                    <div className="mt-5 space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
                        <Input
                          value={leadSearch}
                          onChange={(e) => setLeadSearch(e.target.value)}
                          placeholder="Search by lead, company, title, or email"
                          className="h-10 bg-secondary/60 pl-9"
                        />
                      </div>

                      <div className="grid gap-4 xl:grid-cols-2">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                            <Building2 size={13} />
                            Companies
                          </div>
                          <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto pr-1 custom-scrollbar">
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

                      <div className="flex flex-wrap items-center gap-2">
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
                      </div>

                      <div className="overflow-hidden rounded-2xl border border-border">
                        <div className="max-h-[380px] overflow-auto custom-scrollbar">
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
                                      <TableCell className="max-w-[220px]">
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
                  </section>

                  <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                          <Layers3 size={16} className="text-amber-500" />
                          Selected Cohort
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          This group will be attached to the campaign when you create it.
                        </p>
                      </div>
                      <Badge variant="outline" className="border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        {selectedAudienceSize} selected
                      </Badge>
                    </div>

                    <div className="mt-5 grid gap-4 lg:grid-cols-2">
                      <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                          <Building2 size={13} />
                          Companies In Cohort
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {Object.entries(selectedCompanyPreview).length > 0 ? (
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
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-border bg-secondary/30 p-4">
                      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                        <Mail size={13} />
                        Lead Preview
                      </div>
                      <div className="mt-3 space-y-3">
                        {selectedLeads.length > 0 ? (
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
                  </section>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-border bg-secondary/30 px-6 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Campaign Summary</p>
                <p className="mt-1 truncate text-sm text-foreground">
                  {name.trim() || "Untitled campaign"} • {selectedAudienceSize} selected leads • {selectedCompanies.length || matchingCompanyCount} target companies in view
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isCreating} className="border-border">
                  Cancel
                </Button>
                <Button onClick={handleCreateCampaign} disabled={isCreating || isLoading} className="bg-cyan-500 text-white hover:bg-cyan-600">
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
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
