"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  checkSlugAvailability,
  duplicateEvent,
} from "@/services/Events/eventServices";
import { useNotification } from "@/helpers/NotificationContext";

export interface DuplicateEventSource {
  id: number | string;
  eventTitle: string;
  eventSlug: string;
  eventStartDate: string;
  eventEndDate: string;
  eventStartTime?: string | null;
  eventEndTime?: string | null;
}

interface DuplicateEventDialogProps {
  event: DuplicateEventSource | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDuplicated: () => void;
  successDescription?: string;
}

const toDateInput = (value?: string | null) => (value ? value.slice(0, 10) : "");

export default function DuplicateEventDialog({
  event,
  open,
  onOpenChange,
  onDuplicated,
  successDescription = "",
}: DuplicateEventDialogProps) {
  const { showNotification } = useNotification();

  const [eventTitle, setEventTitle] = useState("");
  const [eventSlug, setEventSlug] = useState("");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventStartTime, setEventStartTime] = useState("");
  const [eventEndTime, setEventEndTime] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [slugAvailable, setSlugAvailable] = useState<null | boolean>(null);
  const [slugMessage, setSlugMessage] = useState("");
  const [slugLoading, setSlugLoading] = useState(false);

  useEffect(() => {
    if (!open || !event) return;

    setEventTitle(event.eventTitle || "");
    setEventSlug(event.eventSlug ? `${event.eventSlug}-copy` : "");
    setEventStartDate(toDateInput(event.eventStartDate));
    setEventEndDate(toDateInput(event.eventEndDate));
    setEventStartTime(event.eventStartTime || "");
    setEventEndTime(event.eventEndTime || "");
    setIsPublished(false);
    setSlugAvailable(null);
    setSlugMessage("");
  }, [open, event]);

  useEffect(() => {
    if (!open) return;

    if (!eventSlug || eventSlug.trim() === "") {
      setSlugAvailable(null);
      setSlugMessage("");
      return;
    }

    const timer = setTimeout(async () => {
      setSlugLoading(true);
      try {
        const res = await checkSlugAvailability(eventSlug);
        setSlugAvailable(res.available);
        setSlugMessage(res.message);
      } catch {
        setSlugAvailable(null);
        setSlugMessage("Error checking slug availability");
      } finally {
        setSlugLoading(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [open, eventSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    if (slugAvailable === false) {
      showNotification("error", "URL Not Available", "Please choose another slug.");
      return;
    }

    try {
      setSubmitting(true);
      await duplicateEvent(String(event.id), {
        eventTitle,
        eventSlug,
        eventStartDate,
        eventEndDate,
        eventStartTime,
        eventEndTime,
        isPublished,
      });

      showNotification(
        "success",
        "Event Duplicated Successfully",
        successDescription || "Draft copy has been created."
      );
      onOpenChange(false);
      onDuplicated();
    } catch (err: any) {
      showNotification("error", "Failed to Duplicate", err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Duplicate Event</DialogTitle>
          <DialogDescription>
            Create a copy of this event with new dates and URL.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="dup-title">Event Title</Label>
            <Input
              id="dup-title"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dup-slug">Event URL Slug</Label>
            <Input
              id="dup-slug"
              value={eventSlug}
              onChange={(e) => setEventSlug(e.target.value)}
              required
            />
            {slugLoading && (
              <p className="text-xs text-muted-foreground">Checking availability...</p>
            )}
            {!slugLoading && slugMessage && (
              <p className={`text-xs ${slugAvailable ? "text-green-600" : "text-red-500"}`}>
                {slugMessage}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="dup-start-date">Start Date</Label>
              <Input
                id="dup-start-date"
                type="date"
                value={eventStartDate}
                onChange={(e) => setEventStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dup-end-date">End Date</Label>
              <Input
                id="dup-end-date"
                type="date"
                value={eventEndDate}
                onChange={(e) => setEventEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="dup-start-time">Start Time</Label>
              <Input
                id="dup-start-time"
                value={eventStartTime}
                onChange={(e) => setEventStartTime(e.target.value)}
                placeholder="e.g. 7:00 PM"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dup-end-time">End Time</Label>
              <Input
                id="dup-end-time"
                value={eventEndTime}
                onChange={(e) => setEventEndTime(e.target.value)}
                placeholder="e.g. 8:30 PM"
              />
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <Label className="text-sm font-medium">Publish immediately?</Label>
              <p className="text-xs text-muted-foreground">
                Leave disabled to keep as draft
              </p>
            </div>
            <Switch checked={isPublished} onCheckedChange={setIsPublished} />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || slugAvailable === false}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Duplicate Event
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
