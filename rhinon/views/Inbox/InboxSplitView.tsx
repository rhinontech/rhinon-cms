"use client";

import { useState, useEffect } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  Search, Sparkles, Send, Archive, Clock, Inbox as InboxIcon, MoreVertical,
} from "lucide-react";
import { Lead, Campaign } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSession } from "@/components/session-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function InboxSplitView() {
  const { user } = useSession();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [inboundEmails, setInboundEmails] = useState<any[]>([]);
  const [outreachIdentities, setOutreachIdentities] = useState<any[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftContent, setDraftContent] = useState("");

  // Initialize selected email from user or param
  useEffect(() => {
    if (user && !selectedEmail) {
      setSelectedEmail(user.activeIdentityEmail || user.email);
    }
  }, [user, selectedEmail]);

  // Fetch admin-only list of all outreach accounts
  useEffect(() => {
    if (user?.capabilities.includes("manage_mailboxes")) {
      fetch("/api/admin/outreach-identities")
        .then(res => res.json())
        .then(data => setOutreachIdentities(data.emails || []));
    }
  }, [user]);

  useEffect(() => {
    if (!selectedEmail) return;

    const fetchData = async () => {
      try {
        const [leadsRes, campaignsRes, inboxRes] = await Promise.all([
          fetch("/api/leads"),
          fetch("/api/campaigns"),
          fetch(`/api/inbox?email=${selectedEmail}`)
        ]);
        const [leadsData, campaignsData, inboxData] = await Promise.all([
          leadsRes.json(),
          campaignsRes.json(),
          inboxRes.json()
        ]);
        setLeads(leadsData);
        setCampaigns(campaignsData);
        setInboundEmails(inboxData.emails || []);
      } catch (error) {
        console.error("Error fetching inbox data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedEmail]);

  const inboxItems = leads
    .filter((l) => l.status === "Replied" || l.status === "Interested" || l.status === "Bounced")
    .map((lead) => ({
      id: `msg_${(lead as any)._id || lead.id}`,
      lead,
      subject: "Re: Scaling operations",
      preview:
        lead.status === "Interested"
          ? "Thanks for reaching out. We are actually evaluating vendors right now. Let's talk Tuesday."
          : "I'll pass this along to our engineering director. She handles this now.",
      date: new Date(lead.lastActivityAt || new Date()).toISOString(),
      read: lead.status === "Interested" ? false : true,
    }));

  useEffect(() => {
    if (!selectedItem && inboxItems.length > 0) {
      setSelectedItem(inboxItems[0]);
    }
  }, [inboxItems, selectedItem]);

  const activeCampaign = campaigns.find((c) => (c as any)._id === selectedItem?.lead.campaignId || c.id === selectedItem?.lead.campaignId);

  const handleAiDraft = () => {
    if (!selectedItem) return;
    setIsDrafting(true);
    
    // Find the name of the sender for the selected inbox
    const senderName = outreachIdentities.find(u => u.email === selectedEmail)?.displayName || user?.name || "Rhinon Admin";
    
    setTimeout(() => {
      setDraftContent(
        `Hi ${selectedItem.lead.name.split(" ")[0]},\n\nTuesday works perfectly. Does 10:00 AM PST fit your schedule? I'll send over a calendar invite.\n\nBest,\n${senderName.split(" ")[0]}`,
      );
      setIsDrafting(false);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 shadow-glow-sm shrink-0">
          <InboxIcon size={28} className="text-cyan-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inbox</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage replies and ongoing conversations.</p>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-16rem)] lg:h-[calc(100vh-16rem)] border border-border rounded-xl overflow-hidden bg-card relative">

      {/* ── Pane 1: Conversation List ─────────────── */}
      <div className={cn(
        "w-full lg:w-[320px] shrink-0 flex flex-col border-r border-border bg-secondary/30 h-full",
        selectedItem ? "hidden lg:flex" : "flex"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-border h-15 flex items-center justify-between gap-4">
          {user?.capabilities.includes("manage_mailboxes") && outreachIdentities.length > 0 ? (
            <Select value={selectedEmail} onValueChange={(val) => val && setSelectedEmail(val)}>
              <SelectTrigger className="h-8 w-full max-w-[240px] bg-secondary border-border text-[11px] font-bold">
                <SelectValue placeholder="Select Inbox" />
              </SelectTrigger>
              <SelectContent align="start" className="w-80 max-w-[calc(100vw-2rem)]">
                {outreachIdentities.map(id => (
                  <SelectItem key={id.email} value={id.email} className="text-xs">
                    {id.displayName} ({id.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="font-bold text-foreground">Inbox</span>
          )}
          <Badge className="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/25 hover:bg-cyan-500/15 text-[11px] shrink-0">
            {inboxItems.filter((i) => !i.read).length} Unread
          </Badge>
        </div>
        {/* Search */}
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
            <Input
              placeholder="Search messages..."
              className="pl-9 h-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground text-sm"
            />
          </div>
        </div>
        {/* List */}
        <ScrollArea className="flex-1">
          {inboxItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className={cn(
                "p-4 border-b border-border/60 cursor-pointer transition-colors",
                selectedItem?.id === item.id
                  ? "bg-secondary/80"
                  : "hover:bg-secondary/50",
              )}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={cn(
                  "text-sm",
                  !item.read ? "font-bold text-foreground" : "font-medium text-foreground/80",
                )}>
                  {item.lead.name}
                </span>
                <span className="text-[11px] text-muted-foreground shrink-0 ml-2">
                  {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                </span>
              </div>
              <div className="text-xs text-foreground/70 font-medium mb-1 truncate">{item.subject}</div>
              <div className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{item.preview}</div>
              <div className="mt-2.5">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] px-1.5 py-0",
                    item.lead.status === "Interested"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                      : "bg-secondary text-muted-foreground border-border",
                  )}
                >
                  {item.lead.status}
                </Badge>
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* ── Pane 2: Message Thread & Composer ────── */}
      {selectedItem ? (
        <div className="flex-1 flex flex-col min-w-0 h-full">
          {/* Thread header */}
          <div className="h-14 border-b border-border bg-secondary/20 flex items-center justify-between px-4 sm:px-5">
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-8 w-8 -ml-1 text-muted-foreground"
                onClick={() => setSelectedItem(null)}
              >
                <MoreVertical size={18} className="rotate-90" />
              </Button>
              <Avatar className="h-8 w-8 border border-border">
                <AvatarFallback className="bg-secondary text-muted-foreground text-xs font-bold">
                  {selectedItem.lead.name.split(" ").map((n: string) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-sm font-semibold text-foreground">{selectedItem.lead.name}</div>
                <div className="text-xs text-muted-foreground">{selectedItem.lead.email}</div>
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"><Clock size={15} /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"><Archive size={15} /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"><MoreVertical size={15} /></Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 bg-background p-6">
            <div className="space-y-6 max-w-3xl mx-auto">
              {/* Sent */}
              <div className="pr-12">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-sm text-foreground">Alex Mercer (You)</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(selectedItem.lead.addedAt), "MMM d, h:mm a")}
                  </span>
                </div>
                <div className="bg-card border border-border rounded-2xl rounded-tl-sm p-4 text-sm text-foreground">
                  <p>Hi {selectedItem.lead.name.split(" ")[0]},</p>
                  <p className="mt-2">
                    I noticed {selectedItem.lead.company} is expanding rapidly right now. We help companies like yours automate outbound sales with AI.
                  </p>
                  <p className="mt-2">Worth a quick chat next week?</p>
                </div>
              </div>

              {/* Inbound reply */}
              <div className="pl-12">
                <div className="flex items-center justify-end gap-2 mb-2">
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(selectedItem.date), "MMM d, h:mm a")}
                  </span>
                  <span className="font-semibold text-sm text-cyan-600 dark:text-cyan-400">
                    {selectedItem.lead.name}
                  </span>
                </div>
                <div className="bg-cyan-500/8 border border-cyan-500/20 rounded-2xl rounded-tr-sm p-4 text-sm text-foreground">
                  {selectedItem.preview}
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Composer */}
          <div className="p-4 border-t border-border bg-secondary/20">
            <div className="max-w-3xl mx-auto bg-card border border-border rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-cyan-500/40 focus-within:border-cyan-500/40 transition-all">
              <div className="px-4 py-2.5 border-b border-border bg-secondary/40 flex justify-between items-center">
                <span className="text-xs font-medium text-muted-foreground">
                  Reply to {selectedItem.lead.name.split(" ")[0]}
                </span>
                {draftContent === "" && (
                  <Button
                    size="sm"
                    onClick={handleAiDraft}
                    disabled={isDrafting}
                    className="h-7 text-xs bg-violet-600 hover:bg-violet-700 text-white"
                  >
                    {isDrafting ? "Drafting..." : <><Sparkles size={11} className="mr-1" /> AI Draft</>}
                  </Button>
                )}
              </div>
              <textarea
                placeholder="Type your reply or use AI to draft a response..."
                className="w-full bg-transparent p-4 text-sm text-foreground outline-none resize-none min-h-[110px] placeholder:text-muted-foreground"
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
              />
              <div className="px-4 py-2.5 bg-secondary/30 flex justify-end items-center border-t border-border">
                <Button className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold h-8">
                  <Send size={13} className="mr-2" /> Send Reply
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-background">
          <InboxIcon size={40} className="mb-4 opacity-20" />
          <p className="text-sm">Select a message to view the thread</p>
        </div>
      )}

      {/* ── Pane 3: Lead Context Sidebar ─────────── */}
      {selectedItem && (
        <div className="w-[280px] shrink-0 border-l border-border bg-secondary/20 hidden lg:flex flex-col">
          <div className="p-4 border-b border-border h-14 flex items-center">
            <span className="font-bold text-foreground text-sm">Lead Context</span>
          </div>
          <ScrollArea className="flex-1 p-5">
            {/* Avatar & name */}
            <div className="flex flex-col items-center text-center pb-5 border-b border-border">
              <Avatar className="h-14 w-14 mb-3 border-2 border-border">
                <AvatarFallback className="bg-secondary text-foreground text-base font-bold">
                  {selectedItem.lead.name.split(" ").map((n: string) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <h3 className="font-bold text-foreground">{selectedItem.lead.name}</h3>
              <p className="text-cyan-600 dark:text-cyan-400 text-xs mt-1 font-medium">{selectedItem.lead.title}</p>
              <p className="text-muted-foreground text-xs mt-0.5">{selectedItem.lead.company}</p>
            </div>

            {/* Campaign */}
            <div className="py-5 border-b border-border">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Campaign</p>
              {activeCampaign ? (
                <div className="bg-secondary border border-border rounded-lg p-3">
                  <div className="font-semibold text-foreground text-sm">{activeCampaign.name}</div>
                  <Badge variant="outline" className="mt-2 bg-card text-muted-foreground border-border text-[11px]">
                    {activeCampaign.channel}
                  </Badge>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No active campaign</p>
              )}
            </div>

            {/* Contact info */}
            <div className="py-5 space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Contact Info</p>
              {[
                { label: "Email", val: selectedItem.lead.email },
                { label: "LinkedIn", val: "View Profile", link: true },
                { label: "Enrolled", val: format(new Date(selectedItem.lead.addedAt), "MMMM d, yyyy") },
              ].map(({ label, val, link }) => (
                <div key={label}>
                  <p className="text-[10px] text-muted-foreground font-medium">{label}</p>
                  <p className={cn(
                    "text-sm mt-0.5",
                    link
                      ? "text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
                      : "text-foreground",
                  )}>
                    {val}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
    </div>
  );
}
