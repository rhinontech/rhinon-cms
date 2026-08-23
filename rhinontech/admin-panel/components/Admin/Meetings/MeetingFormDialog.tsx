"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fromLocalInput, toLocalInput, type MeetingEvent } from "./types";

interface Props {
  /** Existing event to edit, or null to create a new one. */
  event: MeetingEvent | null;
  /** Prefilled start for a new event (the day the user clicked). */
  defaultDate?: Date | null;
  onClose: () => void;
  onSaved: () => void;
}

function defaultStartEnd(date: Date | null | undefined): { start: string; end: string } {
  const base = date ? new Date(date) : new Date();
  // Default to the next clean half-hour on the chosen day.
  if (date) base.setHours(10, 0, 0, 0);
  else base.setMinutes(base.getMinutes() < 30 ? 30 : 60, 0, 0);
  const end = new Date(base.getTime() + 30 * 60 * 1000);
  return { start: toLocalInput(base.toISOString()), end: toLocalInput(end.toISOString()) };
}

export function MeetingFormDialog({ event, defaultDate, onClose, onSaved }: Props) {
  const isEdit = Boolean(event);
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [attendees, setAttendees] = useState("");
  const [addMeet, setAddMeet] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (event) {
      setSummary(event.summary === "(no title)" ? "" : event.summary);
      setDescription(event.description || "");
      setLocation(event.location || "");
      setStart(toLocalInput(event.start));
      setEnd(toLocalInput(event.end));
      setAttendees(event.attendees.map((a) => a.email).join(", "));
      setAddMeet(Boolean(event.meetLink));
    } else {
      const { start: s, end: e } = defaultStartEnd(defaultDate);
      setSummary("");
      setDescription("");
      setLocation("");
      setStart(s);
      setEnd(e);
      setAttendees("");
      setAddMeet(true);
    }
  }, [event, defaultDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const startIso = fromLocalInput(start);
    const endIso = fromLocalInput(end);

    if (!summary.trim()) return toast.error("Give the meeting a title");
    if (!startIso || !endIso) return toast.error("Pick a valid start and end time");
    if (new Date(endIso) <= new Date(startIso)) return toast.error("End time must be after the start time");

    const emails = attendees
      .split(/[,\s]+/)
      .map((a) => a.trim())
      .filter(Boolean);
    const invalid = emails.find((a) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a));
    if (invalid) return toast.error(`"${invalid}" isn't a valid email`);

    setSaving(true);
    try {
      const payload = {
        summary: summary.trim(),
        description: description.trim() || null,
        location: location.trim() || null,
        startTime: startIso,
        endTime: endIso,
        attendees: emails,
      };

      if (isEdit) {
        await apiFetch(`/meetings/${event!.id}`, { method: "PATCH", body: JSON.stringify(payload) });
        toast.success("Meeting updated");
      } else {
        await apiFetch("/meetings", { method: "POST", body: JSON.stringify({ ...payload, addMeet }) });
        toast.success("Meeting created");
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Couldn't save the meeting");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit meeting" : "New meeting"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="summary">Title</Label>
            <Input id="summary" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Discovery call" autoFocus />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="start">Starts</Label>
              <Input id="start" type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end">Ends</Label>
              <Input id="end" type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="attendees">Attendees</Label>
            <Input
              id="attendees"
              value={attendees}
              onChange={(e) => setAttendees(e.target.value)}
              placeholder="someone@example.com, another@example.com"
            />
            <p className="text-[11px] text-muted-foreground">Google emails them the invite automatically.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="location">Location</Label>
            <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Optional" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Notes</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Optional" />
          </div>

          {!isEdit && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={addMeet}
                onChange={(e) => setAddMeet(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 accent-blue-600"
              />
              Add a Google Meet link
            </label>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : isEdit ? "Save changes" : "Create meeting"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
