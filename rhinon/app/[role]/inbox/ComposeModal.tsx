"use client";

import { useState, useEffect } from "react";
import { Loader2, Send, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useSession } from "@/components/session-provider";

interface ComposeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialData?: {
    to?: string;
    subject?: string;
    body?: string;
    fromEmail?: string;
  };
}

export function ComposeModal({ isOpen, onOpenChange, onSuccess, initialData }: ComposeModalProps) {
  const { user } = useSession();
  const [loading, setLoading] = useState(false);
  const [identities, setIdentities] = useState<any[]>([]);
  const [fromEmail, setFromEmail] = useState("");
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    if (isOpen && initialData) {
      if (initialData.to) setTo(initialData.to);
      if (initialData.subject) setSubject(initialData.subject);
      if (initialData.body) setBody(initialData.body);
      if (initialData.fromEmail) setFromEmail(initialData.fromEmail);
    } else if (!isOpen) {
      // Clear data when closing unless it's a successful send (which handles it)
      // but only if it's NOT a reply being opened next.
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    if (user?.roleSlug === "admin") {
      fetchIdentities();
    } else if (user?.email) {
      setFromEmail(user.email);
    }
  }, [user]);

  const fetchIdentities = async () => {
    try {
      const res = await fetch("/api/admin/outreach-identities");
      const data = await res.json();
      if (data.emails) {
        setIdentities(data.emails);
        // Default to the first secondary identity or admin email
        const defaultEmail = data.emails.find((e: any) => e.type === "primary")?.email || "admin@rhinonlabs.com";
        setFromEmail(defaultEmail);
      }
    } catch (err) {
      console.error("Failed to fetch identities:", err);
    }
  };

  const handleSend = async () => {
    if (!to || !subject || !body) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/inbox/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, body, fromEmail }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Email sent successfully!");
        onOpenChange(false);
        if (onSuccess) onSuccess();
        setTo("");
        setSubject("");
        setBody("");
      } else {
        toast.error(data.error || "Failed to send email");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-card border-border">
        <DialogHeader className="border-b border-border pb-4">
          <DialogTitle className="flex items-center justify-between">
            <span>New Message</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {user?.roleSlug === "admin" && identities.length > 0 && (
            <div className="flex items-center gap-4">
              <Label className="w-16 text-right text-muted-foreground">From</Label>
              <Select value={fromEmail} onValueChange={(val) => setFromEmail(val || "")}>
                <SelectTrigger className="flex-1 bg-secondary border-border focus:ring-cyan-500/50">
                  <SelectValue placeholder="Select Sender Identity" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {identities.map((id) => (
                    <SelectItem key={id._id || id.email} value={id.email}>
                      {id.email} {id.type === "primary" ? "(Primary)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center gap-4">
            <Label className="w-16 text-right text-muted-foreground">To</Label>
            <Input 
              value={to} 
              onChange={(e) => setTo(e.target.value)} 
              placeholder="recipient@example.com" 
              className="flex-1 bg-secondary border-border focus:ring-cyan-500/50" 
            />
          </div>

          <div className="flex items-center gap-4">
            <Label className="w-16 text-right text-muted-foreground">Subject</Label>
            <Input 
              value={subject} 
              onChange={(e) => setSubject(e.target.value)} 
              placeholder="Subject" 
              className="flex-1 bg-secondary border-border font-medium focus:ring-cyan-500/50" 
            />
          </div>

          <div className="pt-2">
            <Textarea 
              value={body} 
              onChange={(e) => setBody(e.target.value)} 
              placeholder="Write your message here..." 
              className="min-h-[250px] bg-secondary border-border resize-none focus:ring-cyan-500/50 p-4" 
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-muted-foreground">
            Discard
          </Button>
          <Button onClick={handleSend} disabled={loading} className="bg-cyan-500 hover:bg-cyan-600 text-white gap-2 font-bold px-6">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send size={16} />}
            Send Message
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
