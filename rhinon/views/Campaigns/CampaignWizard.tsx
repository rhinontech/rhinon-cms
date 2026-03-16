"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ArrowRight, ArrowLeft, Send, CheckCircle2, Rocket, Users, Target, FileText, Settings, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Template } from "@/lib/types";

interface CampaignWizardProps {
  defaultChannel?: string;
}

export function CampaignWizard({ defaultChannel = "Email" }: CampaignWizardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [isDeploying, setIsDeploying] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);

  // Campaign Form State
  const [name, setName] = useState("");
  const [channel, setChannel] = useState(defaultChannel);
  const [templateId, setTemplateId] = useState("");
  const [dailyLimit, setDailyLimit] = useState(50);
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));

  useEffect(() => {
    setChannel(defaultChannel);
  }, [defaultChannel, isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/templates")
        .then(res => res.json())
        .then(data => {
          setTemplates(data);
          // Set initial template based on current channel
          const validTemplates = data.filter((t: Template) => t.channel === channel || (channel === "Email" && t.channel === "Cold Email"));
          if (validTemplates.length > 0) {
            setTemplateId((validTemplates[0] as any)._id || validTemplates[0].id);
          } else {
            setTemplateId("");
          }
        });
    }
  }, [isOpen]);

  useEffect(() => {
    // When channel changes, ensure we select a valid template if one exists
    const validTemplates = templates.filter(t => t.channel === channel || (channel === "Email" && t.channel === "Cold Email"));
    if (validTemplates.length > 0) {
      setTemplateId((validTemplates[0] as any)._id || validTemplates[0].id);
    } else {
      setTemplateId("");
    }
  }, [channel, templates]);

  const steps = [
    { id: 1, name: "Setup", icon: Target },
    { id: 2, name: "Audience", icon: Users },
    { id: 3, name: "Messaging", icon: FileText },
    { id: 4, name: "Execution", icon: Settings },
    { id: 5, name: "Launch", icon: Rocket },
  ];

  const handleNext = () => setStep((s) => Math.min(5, s + 1));
  const handlePrev = () => setStep((s) => Math.max(1, s - 1));

  const handleLaunch = async () => {
    setIsDeploying(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          channel,
          templateId: templateId || null,
          stage: "Active",
          dailyLimit,
          startDate: new Date(startDate).toISOString(),
          leadsTotal: 500, // Placeholder for selected leads count
        }),
      });

      if (res.ok) {
        setIsDeploying(false);
        setIsOpen(false);
        setTimeout(() => setStep(1), 500);
        window.location.reload(); // Quick way to refresh the board
      }
    } catch (error) {
      console.error("Error launching campaign:", error);
      setIsDeploying(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-medium">
          New Campaign
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-3xl bg-slate-950 border-slate-800 text-slate-200 p-0 overflow-hidden hide-close outline-none">
        {/* Wizard Header / Progress */}
        <div className="bg-slate-900 border-b border-slate-800 p-6 flex items-center justify-between">
          <div className="flex gap-2 items-center text-slate-300">
            <Rocket className="text-cyan-500" size={20} />
            <h2 className="font-semibold text-lg">Campaign Orchestrator</h2>
          </div>

          <div className="flex items-center gap-1 hidden sm:flex">
            {steps.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div className={`flex items-center justify-center rounded-full h-8 w-8 text-xs font-medium transition-colors ${step === s.id
                  ? "bg-cyan-500 text-slate-950"
                  : step > s.id
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-slate-800 text-slate-500"
                  }`}>
                  {step > s.id ? <CheckCircle2 size={16} /> : s.id}
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-8 h-[2px] mx-1 ${step > s.id ? "bg-emerald-500/50" : "bg-slate-800"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Wizard Content Area */}
        <div className="p-8 min-h-[400px] max-h-[60vh] overflow-y-auto">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div>
                <h3 className="text-xl font-medium mb-1">
                  {channel === "Email" ? "Email Campaign Setup" : "Social Campaign Setup"}
                </h3>
                <p className="text-sm text-slate-500">
                  {channel === "Email" 
                    ? "Define the core objective and parameters for your outbound email sequence." 
                    : "Configure your LinkedIn content propagation strategy."}
                </p>
              </div>

              <div className="space-y-4 max-w-lg">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Campaign Name</label>
                  <Input 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={channel === "Email" ? "e.g. Q3 Enterprise Expansion" : "e.g. Weekly Thought Leadership Series"} 
                    className="bg-slate-900 border-slate-800" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Primary Channel</label>
                  <Select value={channel} onValueChange={(val) => setChannel(val || "Email")}>
                    <SelectTrigger className="bg-slate-900 border-slate-800 h-11">
                      <SelectValue placeholder="Select channel" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-950 border-slate-800 text-slate-200">
                      <SelectItem value="Email">Email Business Outbound</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {channel !== "Email" && (
                  <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-xs text-cyan-400 flex items-start gap-2">
                    <Sparkles size={14} className="min-w-[14px] mt-0.5" />
                    <p>Social campaigns currently support broad propagation to your connections and followers based on specialized templates.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div>
                <h3 className="text-xl font-medium mb-1">Target Audience</h3>
                <p className="text-sm text-slate-500">Select the leads that will be enrolled in this campaign.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="border border-cyan-500/50 bg-cyan-500/5 rounded-xl p-5 cursor-pointer flex flex-col items-center justify-center text-center gap-3 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent group-hover:opacity-100 opacity-50 transition-opacity" />
                  <Users size={32} className="text-cyan-400" />
                  <div>
                    <div className="font-medium text-slate-200">Select Existing Leads</div>
                    <div className="text-xs text-slate-400 mt-1">Filter from CRM</div>
                  </div>
                </div>

                <div className="border border-slate-800 hover:border-slate-700 bg-slate-900 rounded-xl p-5 cursor-pointer flex flex-col items-center justify-center text-center gap-3 transition-colors">
                  <div className="p-2 bg-slate-800 rounded-full"><Rocket size={20} className="text-slate-400" /></div>
                  <div>
                    <div className="font-medium text-slate-300">Upload New Cohort</div>
                    <div className="text-xs text-slate-500 mt-1">Import via CSV</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 border border-slate-800 rounded-lg overflow-hidden bg-slate-900/50">
                <div className="p-3 border-b border-slate-800 text-sm font-medium">Selected Cohort Summary</div>
                <div className="p-4 flex items-center justify-between text-sm">
                  <span className="text-slate-400">Total Leads Selected:</span>
                  <span className="text-slate-200 font-semibold">500 Leads (Demo)</span>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div>
                <h3 className="text-xl font-medium mb-1">Messaging Strategy</h3>
                <p className="text-sm text-slate-500">Attach a template to guide the AI generation process.</p>
              </div>

              {templates.filter(t => t.channel === channel || (channel === "Email" && t.channel === "Cold Email")).length === 0 ? (
                <div className="p-8 border border-slate-800 rounded-xl bg-slate-900/50 text-center flex flex-col items-center justify-center">
                  <div className="p-3 bg-slate-800 rounded-full mb-4">
                    <FileText size={24} className="text-slate-400" />
                  </div>
                  <h4 className="text-lg font-medium text-slate-200 mb-2">No Templates Found</h4>
                  <p className="text-sm text-slate-500 max-w-sm mb-6">
                    You don't have any active templates for the <span className="font-medium text-slate-300">{channel}</span> channel. Create one to proceed.
                  </p>
                  <Button 
                    onClick={() => window.location.href = "/app/admin/templates/new"}
                    className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-medium"
                  >
                    Create New Template
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 max-w-lg">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Select Base Template</label>
                    <Select value={templateId} onValueChange={(val) => setTemplateId(val || "")}>
                      <SelectTrigger className="bg-slate-900 border-slate-800">
                        <SelectValue placeholder="Select a template" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                        {templates.filter(t => t.channel === channel || (channel === "Email" && t.channel === "Cold Email")).map(t => (
                          <SelectItem key={(t as any)._id || t.id} value={(t as any)._id || t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {templateId && (
                    <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-xs text-violet-400 font-medium mb-2 flex items-center gap-1"><Sparkles size={12} /> AI Instructions Review</div>
                      <p className="text-sm text-slate-300 italic line-clamp-4">
                        {templates.find(t => ((t as any)._id || t.id) === templateId)?.aiInstructions || "No additional instructions provided."}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div>
                <h3 className="text-xl font-medium mb-1">Execution Settings</h3>
                <p className="text-sm text-slate-500">Configure sending limits and schedules.</p>
              </div>

              <div className="grid grid-cols-2 gap-6 max-w-lg">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Daily Send Limit</label>
                  <Input 
                    type="number" 
                    value={dailyLimit}
                    onChange={(e) => setDailyLimit(parseInt(e.target.value))}
                    className="bg-slate-900 border-slate-800" 
                  />
                  <p className="text-xs text-slate-500">Max leads processed per day to protect domain reputation.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Start Date</label>
                  <Input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-slate-900 border-slate-800 text-slate-300" 
                  />
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 text-center py-6">
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4 shadow-glow">
                <Rocket size={40} className="text-cyan-400" />
              </div>
              <h3 className="text-2xl font-semibold">Ready for Liftoff</h3>
              <p className="text-slate-400 max-w-md mx-auto">
                The AI engine will begin processing <span className="text-slate-200 font-medium">selected leads</span> at a rate of {dailyLimit} per day starting immediately.
              </p>

              <div className="mt-8 bg-slate-900 border border-slate-800 rounded-xl p-4 max-w-sm mx-auto text-left flex flex-col gap-2 text-sm text-slate-300">
                <div className="flex justify-between"><span className="text-slate-500">Name</span>{name}</div>
                <div className="flex justify-between"><span className="text-slate-500">Template</span>{templates.find(t => ((t as any)._id || t.id) === templateId)?.name}</div>
                <div className="flex justify-between"><span className="text-slate-500">Channel</span>{channel}</div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer */}
        <div className="bg-slate-900/50 p-4 border-t border-slate-800 flex justify-between rounded-b-lg">
          <Button
            variant="ghost"
            onClick={step === 1 ? () => setIsOpen(false) : handlePrev}
            className="text-slate-400 hover:text-white"
            disabled={isDeploying}
          >
            {step === 1 ? "Cancel" : <><ArrowLeft size={16} className="mr-2" /> Back</>}
          </Button>

          {step < 5 ? (
            <Button 
              onClick={handleNext} 
              className="bg-slate-800 hover:bg-slate-700 text-slate-200"
              disabled={step === 3 && !templateId}
            >
              Continue <ArrowRight size={16} className="ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleLaunch}
              disabled={isDeploying}
              className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-medium min-w-[140px]"
            >
              {isDeploying ? (
                <span className="flex items-center gap-2 animate-pulse">
                  Deploying... <Send size={16} className="animate-bounce" />
                </span>
              ) : (
                <span className="flex items-center">Launch Campaign <Rocket size={16} className="ml-2" /></span>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
