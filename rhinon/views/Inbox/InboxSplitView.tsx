"use client";

import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { Search, Sparkles, Send, CheckCircle2, ChevronRight, MoreVertical, Archive, Clock, Inbox as InboxIcon } from "lucide-react";
import { Lead } from "@/lib/types";
import { dummyLeads, dummyCampaigns } from "@/lib/dummy-data";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// Fake inbox data that combines a lead and their latest message
const inboxItems = dummyLeads.filter(l => l.status === "Replied" || l.status === "Interested" || l.status === "Bounced").map(lead => ({
  id: `msg_${lead.id}`,
  lead,
  subject: "Re: Scaling operations",
  preview: lead.status === "Interested"
    ? "Thanks for reaching out. We are actually evaluating vendors right now. Let's talk Tuesday."
    : "I'll pass this along to our engineering director. She handles this now.",
  date: new Date(lead.lastActivityAt || new Date()).toISOString(),
  read: lead.status === "Interested" ? false : true,
}));

export function InboxSplitView() {
  const [selectedItem, setSelectedItem] = useState(inboxItems[0]);
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftContent, setDraftContent] = useState("");

  const activeCampaign = dummyCampaigns.find(c => c.id === selectedItem?.lead.campaignId);

  const handleAiDraft = () => {
    setIsDrafting(true);
    setTimeout(() => {
      setDraftContent(`Hi ${selectedItem.lead.name.split(" ")[0]},\n\nTuesday works perfectly. Does 10:00 AM PST fit your schedule? I'll send over a calendar invite.\n\nBest,\nAlex`);
      setIsDrafting(false);
    }, 1500);
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] border border-slate-800 rounded-xl overflow-hidden bg-slate-950">

      {/* PANE 1: Conversation List */}
      <div className="w-[350px] flex flex-col border-r border-slate-800 bg-slate-900/30">
        <div className="p-4 border-b border-slate-800 h-16 flex items-center justify-between">
          <div className="font-semibold text-slate-200">Inbox</div>
          <Badge className="bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20">{inboxItems.filter(i => !i.read).length} Unread</Badge>
        </div>
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <Input placeholder="Search messages..." className="pl-9 h-9 bg-slate-900 border-slate-800 rounded-lg text-sm" />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="flex flex-col">
            {inboxItems.map(item => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`p-4 border-b border-slate-800/50 cursor-pointer transition-colors ${selectedItem?.id === item.id ? "bg-slate-800/80" : "hover:bg-slate-900/80"
                  }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-sm ${!item.read ? "font-bold text-slate-100" : "font-medium text-slate-300"}`}>
                    {item.lead.name}
                  </span>
                  <span className="text-xs text-slate-500">
                    {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-medium mb-1 truncate">{item.subject}</div>
                <div className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{item.preview}</div>
                <div className="mt-3 flex gap-2">
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border-slate-700 ${item.lead.status === "Interested" ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-900 text-slate-400"
                    }`}>
                    {item.lead.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* PANE 2: Message Thread & Composer */}
      {selectedItem ? (
        <div className="flex-1 flex flex-col min-w-0">
          <div className="h-16 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 border border-slate-800">
                <AvatarFallback className="bg-slate-800 text-slate-300 text-xs">
                  {selectedItem.lead.name.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-sm font-semibold text-slate-200">{selectedItem.lead.name}</div>
                <div className="text-xs text-slate-500">{selectedItem.lead.email}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-200 h-8 w-8"><Clock size={16} /></Button>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-200 h-8 w-8"><Archive size={16} /></Button>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-200 h-8 w-8"><MoreVertical size={16} /></Button>
            </div>
          </div>

          <ScrollArea className="flex-1 bg-slate-950 p-6">
            <div className="space-y-6 max-w-3xl mx-auto">
              {/* Fake Sent Original Message */}
              <div className="pr-12">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-sm text-slate-300">Alex Mercer (You)</span>
                  <span className="text-xs text-slate-500">{format(new Date(selectedItem.lead.addedAt), "MMM d, h:mm a")}</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-sm p-4 text-sm text-slate-300">
                  <p>Hi {selectedItem.lead.name.split(" ")[0]},</p>
                  <p className="mt-2">I noticed {selectedItem.lead.company} is expanding rapidly right now. We help companies like yours automate outbound sales with AI.</p>
                  <p className="mt-2">Worth a quick chat next week?</p>
                </div>
              </div>

              {/* Inbound Reply */}
              <div className="pl-12">
                <div className="flex items-center justify-end gap-2 mb-2">
                  <span className="text-xs text-slate-500">{format(new Date(selectedItem.date), "MMM d, h:mm a")}</span>
                  <span className="font-medium text-sm text-cyan-400">{selectedItem.lead.name}</span>
                </div>
                <div className="bg-cyan-950/30 border border-cyan-900/50 rounded-2xl rounded-tr-sm p-4 text-sm text-slate-200 shadow-inner">
                  {selectedItem.preview}
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* AI Composer block */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/30">
            <div className="max-w-3xl mx-auto bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-sm focus-within:ring-1 focus-within:ring-cyan-500/50 focus-within:border-cyan-500/50 transition-all">
              <div className="px-4 py-3 border-b border-slate-800/60 bg-slate-900/50 flex justify-between items-center">
                <span className="text-xs font-medium text-slate-400">Reply to {selectedItem.lead.name.split(" ")[0]}</span>
                {draftContent === "" && (
                  <Button
                    size="sm"
                    onClick={handleAiDraft}
                    disabled={isDrafting}
                    className="h-7 text-xs bg-violet-600 hover:bg-violet-700 text-white"
                  >
                    {isDrafting ? "Drafting..." : <><Sparkles size={12} className="mr-1" /> AI Draft Reply</>}
                  </Button>
                )}
              </div>
              <textarea
                placeholder="Type your reply or use AI to draft a response..."
                className="w-full bg-transparent p-4 text-sm text-slate-200 outline-none resize-none min-h-[120px]"
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
              />
              <div className="px-4 py-3 bg-slate-900/30 flex justify-between items-center border-t border-slate-800/60">
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400"><PaperclipIcon size={16} /></Button>
                </div>
                <Button className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-medium h-8">
                  <Send size={14} className="mr-2" /> Send Reply
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 bg-slate-950 border-l border-slate-800">
          <InboxIcon size={48} className="mb-4 opacity-20" />
          <p>Select a message to view the thread</p>
        </div>
      )}

      {/* PANE 3: Contextual Lead Sidebar */}
      {selectedItem && (
        <div className="w-[300px] border-l border-slate-800 bg-slate-900/30 flex flex-col hidden lg:flex">
          <div className="p-4 border-b border-slate-800 h-16 flex items-center">
            <span className="font-semibold text-slate-200">Lead Context</span>
          </div>

          <ScrollArea className="flex-1 p-6">
            <div className="flex flex-col items-center text-center pb-6 border-b border-slate-800">
              <Avatar className="h-16 w-16 mb-4 border-2 border-slate-800 ring-2 ring-slate-950">
                <AvatarFallback className="bg-slate-800 text-slate-300 text-lg">
                  {selectedItem.lead.name.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <h3 className="font-semibold text-slate-200 text-lg">{selectedItem.lead.name}</h3>
              <p className="text-cyan-400 text-sm mt-1 font-medium">{selectedItem.lead.title}</p>
              <p className="text-slate-500 text-sm mt-0.5">{selectedItem.lead.company}</p>
            </div>

            <div className="py-6 border-b border-slate-800 space-y-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Campaign</div>
              {activeCampaign ? (
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                  <div className="font-medium text-slate-300 text-sm">{activeCampaign.name}</div>
                  <Badge variant="outline" className="mt-2 bg-slate-900 text-slate-400 border-slate-700">{activeCampaign.channel}</Badge>
                </div>
              ) : (
                <div className="text-sm text-slate-500">No active campaign</div>
              )}
            </div>

            <div className="py-6 space-y-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Contact Info</div>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-slate-500">Email</div>
                  <div className="text-sm text-slate-300 mt-0.5">{selectedItem.lead.email}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">LinkedIn</div>
                  <div className="text-sm text-cyan-400 mt-0.5 hover:underline cursor-pointer">View Profile</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Enrolled</div>
                  <div className="text-sm text-slate-300 mt-0.5">{format(new Date(selectedItem.lead.addedAt), "MMMM d, yyyy")}</div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

function PaperclipIcon({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}
