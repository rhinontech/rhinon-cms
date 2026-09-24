"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, X, Upload } from "lucide-react";
import {
  checkSlugAvailability,
  createEvents,
  uploadEventImage,
} from "@/services/Events/eventServices";
import { useNotification } from "@/helpers/NotificationContext";

export interface IEvent {
  id: number | string;
  eventTitle: string;
  eventSubtitle?: string;
  eventStartDate: string;
  eventEndDate: string;
  eventStartTime?: string;
  eventEndTime?: string;
  eventType: "Teardown" | "Hackathon" | "Workshop";
  ctaType: "Join Waitlist" | "Register Now";
  speakers: {
    name: string;
    designation: string;
    company: string;
  }[];
  tags: string[];
  isPublished: boolean;
  numberOfAttendees: number;
  eventCreativeUrl: string;
  eventSlug: string;
  canAcceptResponse: boolean;
  locationType?: string;
  location?: string;
  eventCategory?: string;
}

interface AddEventDialogProps {
  onSubmit?: (event: any) => void;
  pageRefresh: () => void;
  onClose?: () => void;
}

export function AddEventDialog({ onSubmit, pageRefresh, onClose }: AddEventDialogProps) {
  const { showNotification } = useNotification();

  const [loading, setLoading] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Form Fields
  const [eventTitle, setEventTitle] = useState("");
  const [eventSubtitle, setEventSubtitle] = useState("");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventStartTime, setEventStartTime] = useState("");
  const [eventEndTime, setEventEndTime] = useState("");
  const [eventType, setEventType] = useState<"Workshop" | "Teardown" | "Hackathon">("Workshop");
  const [eventCategory, setEventCategory] = useState("Normal");
  const [locationType, setLocationType] = useState("Online");
  const [location, setLocation] = useState("");
  const [eventSlug, setEventSlug] = useState("");
  const [eventCreativeUrl, setEventCreativeUrl] = useState("");
  const [numberOfAttendees, setNumberOfAttendees] = useState(0);
  const [speakers, setSpeakers] = useState<{ name: string; company: string; designation: string }[]>([
    { name: "", company: "", designation: "" },
  ]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  // Slug check
  const [slugAvailable, setSlugAvailable] = useState<null | boolean>(null);
  const [slugMessage, setSlugMessage] = useState("");
  const [slugLoading, setSlugLoading] = useState(false);

  // Auto-slug from title
  const handleTitleChange = (val: string) => {
    setEventTitle(val);
    if (!eventSlug || eventSlug.startsWith(val.slice(0, -1).toLowerCase().replace(/\s+/g, "-"))) {
      const generated = val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-");
      setEventSlug(generated);
    }
  };

  // Debounced Slug check
  useEffect(() => {
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
        setSlugMessage("Error checking slug");
      } finally {
        setSlugLoading(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [eventSlug]);

  // Speaker handlers
  const handleSpeakerChange = (index: number, field: string, val: string) => {
    const updated = [...speakers];
    updated[index] = { ...updated[index], [field]: val };
    setSpeakers(updated);
  };

  const addSpeaker = () => {
    setSpeakers([...speakers, { name: "", company: "", designation: "" }]);
  };

  const removeSpeaker = (index: number) => {
    if (speakers.length > 1) {
      setSpeakers(speakers.filter((_, i) => i !== index));
    }
  };

  // Tag handlers
  const addTag = () => {
    const trimmed = newTag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Banner file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingBanner(true);
      const res = await uploadEventImage(file);
      setEventCreativeUrl(res.fileUrl);
      showNotification("success", "Banner Uploaded", "Image uploaded successfully");
    } catch {
      showNotification("error", "Upload Failed", "Could not upload image");
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!eventTitle.trim() || !eventStartDate || !eventEndDate || !eventSlug.trim()) {
      showNotification("error", "Validation Error", "Please fill in title, dates and slug.");
      return;
    }

    if (slugAvailable === false) {
      showNotification("error", "URL Not Available", "Please choose a different slug.");
      return;
    }

    try {
      setLoading(true);
      const eventData = {
        eventTitle,
        eventSubtitle,
        eventStartDate,
        eventEndDate,
        eventStartTime,
        eventEndTime,
        eventType,
        eventCategory,
        locationType,
        location,
        eventSlug,
        eventCreativeUrl,
        numberOfAttendees: Number(numberOfAttendees) || 0,
        speakers: speakers.filter((s) => s.name.trim()),
        tags,
        ctaType: eventType === "Workshop" ? "Join Waitlist" : "Register Now",
        isPublished: false,
        canAcceptResponse: false,
      };

      const res = await createEvents(eventData);
      showNotification("success", "Event Added Successfully", "Draft event created.");
      pageRefresh();
      if (onSubmit) onSubmit(res.newEvent || res);
      if (onClose) onClose();
    } catch (err: any) {
      console.error("Event creation failed:", err);
      showNotification("error", "Creation Failed", err.message || "Could not create event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="eventTitle">Event Name *</Label>
          <Input
            id="eventTitle"
            value={eventTitle}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="e.g. Generative AI for Product Managers"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="eventSubtitle">Event Subtitle</Label>
          <Input
            id="eventSubtitle"
            value={eventSubtitle}
            onChange={(e) => setEventSubtitle(e.target.value)}
            placeholder="e.g. Master LLMs and prompt engineering"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label>Event Type</Label>
          <Select
            value={eventType}
            onValueChange={(val: any) => setEventType(val)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Workshop">Workshop</SelectItem>
              <SelectItem value="Teardown">Teardown</SelectItem>
              <SelectItem value="Hackathon">Hackathon</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={eventCategory} onValueChange={setEventCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Normal">Normal</SelectItem>
              <SelectItem value="Community">Community</SelectItem>
              <SelectItem value="MicroCertificate">MicroCertificate</SelectItem>
              <SelectItem value="GenAiMicroCertificate">GenAiMicroCertificate</SelectItem>
              <SelectItem value="Claude">Claude</SelectItem>
              <SelectItem value="ClaudeOneDay">ClaudeOneDay</SelectItem>
              <SelectItem value="InternalCohort">InternalCohort</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Event URL Slug *</Label>
          <Input
            value={eventSlug}
            onChange={(e) => setEventSlug(e.target.value)}
            placeholder="e.g. gen-ai-workshop"
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-1.5">
          <Label>Start Date *</Label>
          <Input
            type="date"
            value={eventStartDate}
            onChange={(e) => setEventStartDate(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label>End Date *</Label>
          <Input
            type="date"
            value={eventEndDate}
            onChange={(e) => setEventEndDate(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label>Start Time</Label>
          <Input
            value={eventStartTime}
            onChange={(e) => setEventStartTime(e.target.value)}
            placeholder="7:00 PM"
          />
        </div>
        <div className="space-y-1.5">
          <Label>End Time</Label>
          <Input
            value={eventEndTime}
            onChange={(e) => setEventEndTime(e.target.value)}
            placeholder="8:30 PM"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Location Type</Label>
          <Select value={locationType} onValueChange={setLocationType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Online">Online / Zoom</SelectItem>
              <SelectItem value="Offline">In-Person</SelectItem>
              <SelectItem value="Hybrid">Hybrid</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Meeting Link / Location</Label>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Zoom link or venue address"
          />
        </div>
      </div>

      {/* Banner Upload */}
      <div className="space-y-2">
        <Label>Event Banner Image</Label>
        <div className="flex items-center gap-4">
          {eventCreativeUrl && (
            <img
              src={eventCreativeUrl}
              alt="Banner preview"
              className="h-20 w-32 object-cover rounded-lg border"
            />
          )}
          <div className="flex-1 space-y-2">
            <Input
              value={eventCreativeUrl}
              onChange={(e) => setEventCreativeUrl(e.target.value)}
              placeholder="Paste banner URL or upload an image file"
            />
            <div>
              <input
                type="file"
                id="add-banner-file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploadingBanner}
                onClick={() => document.getElementById("add-banner-file")?.click()}
              >
                {uploadingBanner ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Upload Banner File
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Speakers */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Speakers</Label>
          <Button type="button" size="sm" variant="outline" onClick={addSpeaker}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Speaker
          </Button>
        </div>

        {speakers.map((spk, idx) => (
          <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 border rounded-lg bg-muted/10 items-end">
            <div className="space-y-1">
              <Label className="text-xs">Name</Label>
              <Input
                value={spk.name}
                onChange={(e) => handleSpeakerChange(idx, "name", e.target.value)}
                placeholder="Speaker Name"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Company</Label>
              <Input
                value={spk.company}
                onChange={(e) => handleSpeakerChange(idx, "company", e.target.value)}
                placeholder="Company"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Designation</Label>
                <Input
                  value={spk.designation}
                  onChange={(e) => handleSpeakerChange(idx, "designation", e.target.value)}
                  placeholder="Designation"
                />
              </div>
              {speakers.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 text-red-500 shrink-0"
                  onClick={() => removeSpeaker(idx)}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex gap-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Type tag and press Enter"
          />
          <Button type="button" onClick={addTag}>
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {tags.map((t, i) => (
            <Badge key={i} variant="secondary" className="px-3 py-1 text-xs gap-1.5">
              {t}
              <button
                type="button"
                onClick={() => removeTag(t)}
                className="hover:text-red-500 font-bold"
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-3 border-t">
        {onClose && (
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading || uploadingBanner || slugAvailable === false}>
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Create Event
        </Button>
      </div>
    </form>
  );
}
