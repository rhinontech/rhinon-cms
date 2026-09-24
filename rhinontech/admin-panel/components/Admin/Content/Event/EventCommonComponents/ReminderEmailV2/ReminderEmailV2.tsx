"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Send, Clock, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { useNotification } from "@/helpers/NotificationContext";

export default function ReminderEmailV2() {
  const { showNotification } = useNotification();
  const [subject, setSubject] = useState("Reminder: Upcoming Session Starting Soon");
  const [template, setTemplate] = useState(
    "Hi {{name}},\n\nThis is a quick reminder that our session is scheduled for today. Make sure to join on time!\n\nLink: {{meetingLink}}\n\nBest regards,\nThe Team"
  );
  const [sending, setSending] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    showNotification("success", "Template Saved", "Reminder email template has been saved.");
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSendTest = () => {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      showNotification("success", "Test Email Sent", "Check your inbox for the preview.");
    }, 1000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" />
            Automated Reminder Email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Email Subject</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Reminder subject..."
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Email Body</Label>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>Variables:</span>
                <Badge variant="outline" className="text-[10px] py-0 cursor-pointer" onClick={() => setTemplate((t) => t + " {{name}}")}>
                  {"{{name}}"}
                </Badge>
                <Badge variant="outline" className="text-[10px] py-0 cursor-pointer" onClick={() => setTemplate((t) => t + " {{meetingLink}}")}>
                  {"{{meetingLink}}"}
                </Badge>
              </div>
            </div>
            <Textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              rows={8}
              className="font-mono text-xs"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={sending}
              onClick={handleSendTest}
            >
              <Send className="w-3.5 h-3.5 mr-1.5" /> Send Test Email
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              className="gap-1.5"
            >
              {saved && <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />}
              {saved ? "Saved" : "Save Reminder"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
