"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ArrowRight, ArrowLeft, Send, CheckCircle2, Rocket, FileText, Settings, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Template } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SocialPublishWizardProps {
  defaultChannel?: string;
}

export function SocialPublishWizard({ defaultChannel = "LinkedIn Post" }: SocialPublishWizardProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [isDeploying, setIsDeploying] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);

  // Post Form State
  const [name, setName] = useState("");
  const [channel, setChannel] = useState(defaultChannel);
  const [templateId, setTemplateId] = useState("");
  const [publishDate, setPublishDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [publishTime, setPublishTime] = useState(format(new Date(), "HH:mm"));
  
  // New social fields
  const [visibility, setVisibility] = useState<"PUBLIC" | "CONNECTIONS">("PUBLIC");
  const [articleUrl, setArticleUrl] = useState("");
  const [mediaTitle, setMediaTitle] = useState("");
  const [mediaDescription, setMediaDescription] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");

  useEffect(() => {
    setChannel(defaultChannel);
  }, [defaultChannel, isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/templates")
        .then(res => res.json())
        .then(data => {
          setTemplates(data);
          const validTemplates = data.filter((t: Template) => t.channel === channel);
          if (validTemplates.length > 0) {
            setTemplateId((validTemplates[0] as any)._id || validTemplates[0].id);
          } else {
            setTemplateId("");
          }
        });
    }
  }, [isOpen, channel]);

  useEffect(() => {
    if (templateId && templates.length > 0) {
      const selected = templates.find(t => ((t as any)._id || t.id) === templateId);
      if (selected) {
        console.log("Wizard Inheriting Metadata from Template:", selected.name);
        if (selected.visibility) setVisibility(selected.visibility);
        if (selected.articleUrl) setArticleUrl(selected.articleUrl);
        if (selected.mediaTitle) setMediaTitle(selected.mediaTitle);
        if (selected.mediaDescription) setMediaDescription(selected.mediaDescription);
        setMediaUrl(selected.mediaUrl || "");
      }
    }
  }, [templateId, templates]);

  const steps = [
    { id: 1, name: "Content", icon: FileText },
    { id: 2, name: "Publishing", icon: Settings },
  ];

  const handleNext = () => setStep((s) => Math.min(2, s + 1));
  const handlePrev = () => setStep((s) => Math.max(1, s - 1));

  const handleLaunch = async () => {
    if (!name || !templateId) {
      toast.error("Please provide a name and select a template.");
      return;
    }

    if (channel === "LinkedIn Article" && !articleUrl) {
      toast.info("No external URL provided. This article will be hosted on rhinonlabs.com automatically.");
    }



    setIsDeploying(true);
    try {
      const scheduledDate = new Date(`${publishDate}T${publishTime}`).toISOString();
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          channel,
          templateId,
          stage: "Active", // Or "Scheduled" if added to backend
          dailyLimit: 1, // It's a single post, not a drip campaign
          startDate: scheduledDate,
          leadsTotal: 0, 
          leadsProcessed: 0,
          visibility,
          articleUrl,
          mediaTitle,
          mediaDescription,
          mediaUrl,
        }),
      });

      if (res.ok) {
        toast.success("Social Post Scheduled Successfully!");
        setIsDeploying(false);
        setIsOpen(false);
        setTimeout(() => setStep(1), 500);
        window.location.reload(); 
      } else {
        throw new Error("Failed to schedule post");
      }
    } catch (error) {
      console.error("Error launching post:", error);
      toast.error("Failed to schedule post.");
      setIsDeploying(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-medium">
          New Social Post
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl bg-card border-border text-foreground p-0 overflow-hidden outline-none">
        {/* Wizard Header / Progress */}
        <div className="bg-secondary/30 border-b border-border p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex gap-3 items-center text-foreground w-full sm:w-auto justify-center sm:justify-start">
             <div className="h-10 w-10 bg-cyan-500/10 rounded-xl border border-cyan-500/20 flex items-center justify-center">
               <Rocket className="text-cyan-500" size={18} />
             </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">Social Post Planner</h2>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mt-0.5">Broadcast Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {steps.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div className={cn(
                  "flex items-center justify-center rounded-full h-7 w-7 text-xs font-bold transition-all shadow-sm",
                  step === s.id
                    ? "bg-cyan-500 text-slate-950 ring-2 ring-cyan-500/20 ring-offset-1 ring-offset-background"
                    : step > s.id
                      ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                      : "bg-secondary text-muted-foreground border border-border"
                )}>
                  {step > s.id ? <CheckCircle2 size={14} /> : s.id}
                </div>
                {i < steps.length - 1 && (
                  <div className={cn(
                    "w-6 h-0.5 mx-1 rounded-full",
                    step > s.id ? "bg-emerald-500/50" : "bg-border"
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Wizard Content Area */}
        <div className="p-8 min-h-[360px]">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div>
                <h3 className="text-lg font-bold text-foreground mb-1">Content Selection</h3>
                <p className="text-xs font-medium text-muted-foreground">
                  Choose the template containing your social media content and generation instructions.
                </p>
              </div>

              <div className="space-y-5 max-w-lg">
                <div className="space-y-1.5 border border-border bg-secondary/30 rounded-xl p-4">
                   <div className="flex items-center gap-2 text-xs font-bold text-cyan-500 uppercase tracking-widest mb-3">
                    <Settings size={14} /> Post Basic Info
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Post Title</label>
                    <Input 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Q3 Scalability Announcement" 
                      className="bg-card border-border h-9" 
                    />
                  </div>
                  <div className="space-y-1.5 mt-3">
                    <Select value={channel} onValueChange={(val) => setChannel(val || "")}>
                      <SelectTrigger className="bg-card border-border h-9">
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border text-foreground">
                        <SelectItem value="LinkedIn Post">LinkedIn Post</SelectItem>
                        <SelectItem value="LinkedIn Video">LinkedIn Video</SelectItem>
                        <SelectItem value="LinkedIn Article">LinkedIn Article</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 mt-3">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Visibility</label>
                    <Select value={visibility} onValueChange={(val) => setVisibility(val as any)}>
                      <SelectTrigger className="bg-card border-border h-9">
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border text-foreground">
                        <SelectItem value="PUBLIC">Public (Anyone)</SelectItem>
                        <SelectItem value="CONNECTIONS">My Connections Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {channel === "LinkedIn Article" && (
                   <div className="space-y-1.5 border border-border bg-secondary/30 rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 uppercase tracking-widest mb-3">
                      <Rocket size={14} /> Article Link
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase">Target URL</label>
                      <Input 
                        value={articleUrl}
                        onChange={(e) => setArticleUrl(e.target.value)}
                        placeholder="https://your-blog.com/post" 
                        className="bg-card border-border h-9 text-xs" 
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5 border border-border bg-secondary/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-widest mb-3">
                    <CheckCircle2 size={14} /> Media Metadata (Optional)
                  </div>
                  
                  {mediaUrl && (
                    <div className="mb-4 rounded-lg overflow-hidden border border-border bg-black/20 aspect-video flex items-center justify-center relative group">
                      <img src={mediaUrl} alt="Preview" className="w-full h-full object-contain" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => setMediaUrl("")}
                          className="h-7 text-[10px] font-bold"
                        >
                          Remove Image
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase">Media Title</label>
                      <Input 
                        value={mediaTitle}
                        onChange={(e) => setMediaTitle(e.target.value)}
                        placeholder="Image/Article Title" 
                        className="bg-card border-border h-9 text-[11px]" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase">Description</label>
                      <Input 
                        value={mediaDescription}
                        onChange={(e) => setMediaDescription(e.target.value)}
                        placeholder="Short alt-text" 
                        className="bg-card border-border h-9 text-[11px]" 
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 border border-border bg-secondary/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-violet-500 uppercase tracking-widest mb-3">
                    <Sparkles size={14} /> Content Source
                  </div>
                  {templates.filter(t => t.channel === channel).length === 0 ? (
                    <div className="py-4 text-center">
                      <p className="text-xs text-muted-foreground italic mb-3">No templates available for {channel}.</p>
                      <Button 
                        size="sm"
                        onClick={() => window.location.href = `/app/admin/templates/${channel.toLowerCase().replace(" ", "-")}/new`}
                        className="bg-violet-600 hover:bg-violet-700 text-white h-8 text-xs font-bold"
                      >
                        Create New Template
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Select value={templateId} onValueChange={(val) => setTemplateId(val || "")}>
                        <SelectTrigger className="bg-card border-border h-9">
                          <SelectValue placeholder="Select pre-built template" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border text-foreground">
                          {templates.filter(t => t.channel === channel).map(t => (
                            <SelectItem key={(t as any)._id || t.id} value={(t as any)._id || t.id}>{t.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {templateId && (
                         <div className="mt-3 p-3 rounded-lg bg-card border border-border shadow-inner">
                          <p className="text-[11px] text-muted-foreground italic line-clamp-3 leading-relaxed">
                            {templates.find(t => ((t as any)._id || t.id) === templateId)?.aiInstructions || "Template selected. No AI instructions provided."}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div>
                <h3 className="text-lg font-bold text-foreground mb-1">Scheduling & Publishing</h3>
                <p className="text-xs font-medium text-muted-foreground">
                  Determine when this post should go live. The AI engine will generate the final content right before publishing.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 max-w-lg mt-8">
                <div className="border border-border bg-secondary/30 p-5 rounded-xl flex flex-col justify-center gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Publish Date</label>
                    <Input 
                      type="date" 
                      value={publishDate}
                      onChange={(e) => setPublishDate(e.target.value)}
                      className="bg-card border-border text-foreground h-10 font-medium" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Publish Time</label>
                    <Input 
                      type="time" 
                      value={publishTime}
                      onChange={(e) => setPublishTime(e.target.value)}
                      className="bg-card border-border text-foreground h-10 font-medium" 
                    />
                  </div>
                </div>

                <div className="border border-cyan-500/20 bg-cyan-500/5 p-5 rounded-xl flex flex-col items-center justify-center text-center">
                  <div className="h-12 w-12 rounded-full bg-cyan-500/20 flex items-center justify-center mb-3">
                    <Send size={20} className="text-cyan-500 translate-x-0.5" />
                  </div>
                  <h4 className="font-bold text-foreground text-sm">Deployment Ready</h4>
                  <p className="text-[10px] text-muted-foreground mt-1 max-w-[150px] leading-relaxed">
                    Once scheduled, this post will jump straight into the Active queue.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer */}
        <div className="bg-secondary/30 p-5 border-t border-border flex justify-between items-center rounded-b-xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={step === 1 ? () => setIsOpen(false) : handlePrev}
            className="text-muted-foreground hover:text-foreground h-9 font-bold text-xs"
            disabled={isDeploying}
          >
            {step === 1 ? "Cancel" : <><ArrowLeft size={14} className="mr-2" /> Back</>}
          </Button>

          {step < 2 ? (
            <Button 
              size="sm"
              onClick={handleNext} 
              className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold h-9 text-xs px-5 shadow-glow-sm"
              disabled={step === 1 && (!templateId || !name)}
            >
               Next Step <ArrowRight size={14} className="ml-2" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleLaunch}
              disabled={isDeploying}
              className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold h-9 text-xs px-6 shadow-glow-sm min-w-[140px]"
            >
              {isDeploying ? (
                <span className="flex items-center gap-2">
                  <div className="h-3 w-3 animate-spin border-2 border-slate-950 border-t-transparent rounded-full" /> Scheduling...
                </span>
              ) : (
                <span className="flex items-center">Schedule Post <Send size={14} className="ml-2" /></span>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
