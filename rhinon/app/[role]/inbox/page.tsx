"use client";

import { useEffect, useState } from "react";
import {
  Inbox,
  Search,
  Filter,
  RefreshCcw,
  Mail,
  User as UserIcon,
  Calendar,
  ChevronRight,
  MoreVertical,
  Star,
  Reply,
  Trash2,
  Archive,
  ExternalLink,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { EmailHtmlPreview } from "@/components/email-html-preview";
import { format } from "date-fns";
import { ComposeModal } from "./ComposeModal";
import { useSession } from "@/components/session-provider";

export default function InboxPage() {
  const [emails, setEmails] = useState<any[]>([]);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [replyData, setReplyData] = useState<any>(null);

  const { user, loading: userLoading } = useSession();
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'sent' | 'received'>('received');

  useEffect(() => {
    if (user) {
      fetchEmails(user.activeIdentityEmail);
    }
  }, [user?.activeIdentityEmail]);

  const fetchEmails = async (email?: string) => {
    const target = email || user?.activeIdentityEmail || "";
    if (!target) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/inbox?email=${encodeURIComponent(target)}`);
      const data = await res.json();
      if (data.emails) {
        setEmails(data.emails);
        if (data.emails.length > 0 && !selectedId) {
          setSelectedId(data.emails[0]._id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch emails:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = () => {
    if (!selectedEmail) return;

    const replyTo = selectedEmail.fromEmail || selectedEmail.from;
    const reSubject = selectedEmail.subject.startsWith("Re:")
      ? selectedEmail.subject
      : `Re: ${selectedEmail.subject}`;

    setReplyData({
      to: replyTo,
      subject: reSubject,
      body: `\n\n--- On ${format(new Date(selectedEmail.receivedAt), "MMM d, yyyy")} ${selectedEmail.from} wrote ---\n> ${selectedEmail.snippet}`,
      fromEmail: user?.activeIdentityEmail
    });
    setIsComposeOpen(true);
  };

  const filteredEmails = emails.filter(e => {
    if (filter === 'all') return true;
    if (filter === 'sent') return e.direction === 'outbound';
    if (filter === 'received') return e.direction === 'inbound' || !e.direction;
    return true;
  });

  const selectedEmail = filteredEmails.find(e => e._id === selectedId) ||
    (filteredEmails.length > 0 ? filteredEmails[0] : null);

  return (
    <div className="flex h-full w-full overflow-hidden rounded-2xl border border-border bg-card/50 backdrop-blur-sm self-start">
      {/* Sidebar / List */}
      <div className="flex w-80 flex-col border-r border-border bg-card/30">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold flex items-center gap-2">
              <Inbox size={18} className="text-cyan-500" />
              Inbox
            </h1>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => fetchEmails()} disabled={loading} className="h-8 w-8">
                <RefreshCcw size={14} className={cn(loading && "animate-spin")} />
              </Button>
              <Button size="sm" onClick={() => setIsComposeOpen(true)} className="h-8 px-3 bg-cyan-500 hover:bg-cyan-600 text-white gap-2 font-bold shadow-sm shadow-cyan-500/20">
                <Plus size={14} /> New
              </Button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
            <Input placeholder="Search messages..." className="pl-9 h-9 bg-secondary border-border" />
          </div>

          <div className="flex bg-secondary/30 p-1 rounded-xl w-full">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                "flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all",
                filter === 'all' ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/20" : "text-muted-foreground hover:text-foreground"
              )}
            >
              All
            </button>
            <button
              onClick={() => setFilter('received')}
              className={cn(
                "flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all",
                filter === 'received' ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/20" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Received
            </button>
            <button
              onClick={() => setFilter('sent')}
              className={cn(
                "flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all",
                filter === 'sent' ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/20" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Sent
            </button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-0.5 p-2">
            {filteredEmails.length === 0 && !loading ? (
              <div className="py-12 text-center text-muted-foreground">
                <Mail className="mx-auto mb-3 opacity-20" size={32} />
                <p className="text-xs font-medium">No {filter} messages</p>
              </div>
            ) : (
              filteredEmails.map((email) => (
                <button
                  key={email._id}
                  onClick={() => setSelectedId(email._id)}
                  className={cn(
                    "flex w-full flex-col gap-1 rounded-xl p-3 text-left transition-all hover:bg-secondary",
                    selectedId === email._id ? "bg-cyan-500/10 border border-cyan-500/20" : "border border-transparent"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground line-clamp-1">{email.from}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(email.receivedAt), "MMM d")}
                    </span>
                  </div>
                  <span className={cn("text-xs font-medium line-clamp-1", !email.isRead && "text-cyan-400")}>
                    {email.subject || "(No Subject)"}
                  </span>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-tight opacity-70">
                    {email.snippet || "No content preview available..."}
                  </p>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Detail View */}
      <div className="flex flex-1 flex-col bg-card/10">
        {selectedEmail ? (
          <>
            {/* Toolbar */}
            <div className="flex items-center justify-between border-b border-border p-3 px-6 bg-card/40">
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={handleReply} className="h-8 gap-2 font-bold text-xs bg-secondary hover:bg-secondary/80 border-border">
                  <Reply size={14} /> Reply
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <Archive size={16} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-rose-500">
                  <Trash2 size={16} />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                  <Star size={16} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                  <MoreVertical size={16} />
                </Button>
              </div>
            </div>

            {/* Email Header */}
            <div className="p-8 pb-12 flex flex-col min-h-full">
              <div className="mb-8 flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
                    <UserIcon size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground mb-1">
                      {selectedEmail.subject || "(No Subject)"}
                    </h2>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-bold text-cyan-500">{selectedEmail.from}</span>
                      <span className="text-muted-foreground">&lt;{selectedEmail.fromEmail || selectedEmail.from}&gt;</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className={cn(
                    "mb-2 border-cyan-500/30 text-cyan-500 bg-cyan-500/5",
                    selectedEmail.direction === "outbound" && "border-amber-500/30 text-amber-500 bg-amber-500/5"
                  )}>
                    {selectedEmail.direction === "outbound" ? "Sent" : "Received"}
                  </Badge>
                  <p className="text-xs text-muted-foreground flex items-center justify-end gap-1.5">
                    <Calendar size={12} />
                    {format(new Date(selectedEmail.receivedAt), "MMMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>
              <ScrollArea className="flex-1 h-0 bg-card/5">

                {/* Email Content */}
                <div className="flex-1 max-w-none text-foreground bg-secondary/20 rounded-2xl p-8 border border-border/50 leading-relaxed shadow-inner">
                  {selectedEmail.htmlBody ? (
                    <EmailHtmlPreview
                      html={selectedEmail.htmlBody}
                      title={selectedEmail.subject || "Email Preview"}
                    />
                  ) : (
                    <p className="whitespace-pre-wrap">{selectedEmail.snippet || "No content available."}</p>
                  )}
                  <div className="mt-8 pt-8 border-t border-border flex items-center justify-between opacity-50">
                    <p className="text-[10px] font-medium tracking-widest uppercase">
                      Reference: {selectedEmail.messageId}
                    </p>
                    <Button variant="link" className="text-[10px] h-auto p-0 gap-1 text-cyan-500">
                      View Original <ExternalLink size={10} />
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center p-12">
            <div className="h-20 w-20 rounded-full bg-secondary/50 flex items-center justify-center mb-6 border border-border">
              <Inbox size={40} className="text-muted-foreground/30" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Select a message</h3>
            <p className="max-w-xs text-sm text-muted-foreground mt-2">
              Select an email from the left sidebar to read its content. Your custom inbox pulls directly from AWS SES.
            </p>
          </div>
        )}
      </div>

      <ComposeModal
        isOpen={isComposeOpen}
        onOpenChange={setIsComposeOpen}
        onSuccess={() => setTimeout(() => fetchEmails(), 1000)}
        initialData={replyData}
      />
    </div>
  );
}
