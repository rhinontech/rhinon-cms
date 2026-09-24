"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  X,
  Calendar,
  User,
  Loader2,
  ArrowLeft,
  Upload,
  ImageIcon,
} from "lucide-react";
import { WorkshopEventForm } from "./Components/WorkshopEventForm";
import { TeardownEventForm } from "./Components/TeardownEventForm";
import {
  checkSlugAvailability,
  getEventById,
  updateEvents,
  uploadEventImage,
} from "@/services/Events/eventServices";
import { useNotification } from "@/helpers/NotificationContext";

interface Speaker {
  name: string;
  company: string;
  designation: string;
  photoUrl?: string;
}

interface EditEventPageProps {
  eventId?: string;
}

export default function EditEventPage({ eventId }: EditEventPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { showNotification } = useNotification();

  // Extract ID from prop or pathname
  const id = eventId || pathname.split("/").pop();

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Form State
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
  const [speakers, setSpeakers] = useState<Speaker[]>([
    { name: "", company: "", designation: "", photoUrl: "" },
  ]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [eventDetails, setEventDetails] = useState<any>({});

  // Slug check
  const [slugAvailable, setSlugAvailable] = useState<null | boolean>(null);
  const [slugMessage, setSlugMessage] = useState("");
  const [slugLoading, setSlugLoading] = useState(false);
  const initialSlug = useRef("");

  // Fetch Event Details
  useEffect(() => {
    if (!id) return;
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const res = await getEventById(id);
        const data = res.event || res.data || res;
        if (!data) return;

        setEventTitle(data.eventTitle || "");
        setEventSubtitle(data.eventSubtitle || "");
        setEventStartDate(data.eventStartDate ? data.eventStartDate.slice(0, 10) : "");
        setEventEndDate(data.eventEndDate ? data.eventEndDate.slice(0, 10) : "");
        setEventStartTime(data.eventStartTime || "");
        setEventEndTime(data.eventEndTime || "");
        setEventType(data.eventType || "Workshop");
        setEventCategory(data.eventCategory || "Normal");
        setLocationType(data.locationType || "Online");
        setLocation(data.location || "");
        setEventSlug(data.eventSlug || "");
        initialSlug.current = data.eventSlug || "";
        setEventCreativeUrl(data.eventCreativeUrl || "");
        setNumberOfAttendees(data.numberOfAttendees || 0);
        setSpeakers(
          data.speakers && data.speakers.length > 0
            ? data.speakers
            : [{ name: "", company: "", designation: "", photoUrl: "" }]
        );
        setTags(data.tags || []);
        setEventDetails(data.eventDetails || {});
      } catch (err: any) {
        console.error("Failed to load event:", err);
        showNotification("error", "Error loading event", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  // Debounced Slug check
  useEffect(() => {
    if (!eventSlug || eventSlug.trim() === "" || eventSlug === initialSlug.current) {
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
  const handleSpeakerChange = (index: number, field: keyof Speaker, val: string) => {
    const updated = [...speakers];
    updated[index] = { ...updated[index], [field]: val };
    setSpeakers(updated);
  };

  const addSpeaker = () => {
    setSpeakers([...speakers, { name: "", company: "", designation: "", photoUrl: "" }]);
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

  // Banner Upload
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  // Submit Handler
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!id) return;

    if (!eventTitle.trim() || !eventStartDate || !eventEndDate || !eventSlug.trim()) {
      showNotification("error", "Validation Error", "Please fill in all required fields.");
      return;
    }

    if (slugAvailable === false) {
      showNotification("error", "URL Conflict", "Please use an available URL slug.");
      return;
    }

    try {
      setUpdating(true);
      const completeData = {
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
        speakers,
        tags,
        eventDetails: Object.keys(eventDetails).length > 0 ? eventDetails : {},
        ctaType: eventType === "Workshop" ? "Join Waitlist" : "Register Now",
      };

      await updateEvents(id, completeData);
      initialSlug.current = eventSlug;
      showNotification("success", "Updated Successfully", "Event details saved.");
    } catch (err: any) {
      console.error("Update failed:", err);
      showNotification("error", "Update Failed", err.message || "Could not save event");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-sm text-muted-foreground">Loading event...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/10 pb-16">
      {/* Top Header */}
      <div className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-card px-6">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <div className="h-4 w-px bg-border" />
          <h1 className="text-lg font-semibold tracking-tight">Edit Event</h1>
          <span className="text-sm text-muted-foreground">({eventTitle})</span>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleSubmit()}
            disabled={updating || uploadingBanner}
            size="sm"
            className="bg-primary text-primary-foreground"
          >
            {updating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto w-full p-6 space-y-6">
        {/* Basic Event Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Event Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="eventTitle">Event Title *</Label>
                <Input
                  id="eventTitle"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="e.g. AI-Powered Product Management Workshop"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="eventSubtitle">Event Subtitle</Label>
                <Input
                  id="eventSubtitle"
                  value={eventSubtitle}
                  onChange={(e) => setEventSubtitle(e.target.value)}
                  placeholder="e.g. Master modern LLM workflows in 2 days"
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
                <Label>Event Category</Label>
                <Select
                  value={eventCategory}
                  onValueChange={setEventCategory}
                >
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
                <Label>URL Slug *</Label>
                <Input
                  value={eventSlug}
                  onChange={(e) => setEventSlug(e.target.value)}
                  placeholder="e.g. ai-product-management"
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
                  placeholder="9:00 PM"
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
                <Label>Location / Meeting Link</Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Zoom link or Bangalore Campus"
                />
              </div>
            </div>

            {/* Banner Creative */}
            <div className="space-y-2 pt-2">
              <Label>Event Creative / Banner URL</Label>
              <div className="flex items-center gap-4">
                {eventCreativeUrl ? (
                  <div className="relative h-28 w-44 rounded-lg overflow-hidden border">
                    <img
                      src={eventCreativeUrl}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-28 w-44 rounded-lg border border-dashed flex flex-col items-center justify-center text-muted-foreground">
                    <ImageIcon className="w-8 h-8 mb-1" />
                    <span className="text-xs">No banner</span>
                  </div>
                )}

                <div className="space-y-2 flex-1">
                  <Input
                    value={eventCreativeUrl}
                    onChange={(e) => setEventCreativeUrl(e.target.value)}
                    placeholder="https://... image banner URL"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="banner-file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleBannerUpload}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploadingBanner}
                      onClick={() => document.getElementById("banner-file")?.click()}
                    >
                      {uploadingBanner ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      Upload Image File
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Speakers Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Speakers & Instructors
            </CardTitle>
            <Button type="button" size="sm" variant="outline" onClick={addSpeaker}>
              <Plus className="w-4 h-4 mr-1" /> Add Speaker
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {speakers.map((spk, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 border rounded-lg bg-muted/10 items-end"
              >
                <div className="space-y-1">
                  <Label className="text-xs">Speaker Name</Label>
                  <Input
                    value={spk.name}
                    onChange={(e) => handleSpeakerChange(index, "name", e.target.value)}
                    placeholder="e.g. Alex Johnson"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Company</Label>
                  <Input
                    value={spk.company}
                    onChange={(e) => handleSpeakerChange(index, "company", e.target.value)}
                    placeholder="e.g. Google"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Designation / Role</Label>
                  <Input
                    value={spk.designation}
                    onChange={(e) => handleSpeakerChange(index, "designation", e.target.value)}
                    placeholder="e.g. Lead Product Manager"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    value={spk.photoUrl || ""}
                    onChange={(e) => handleSpeakerChange(index, "photoUrl", e.target.value)}
                    placeholder="Photo URL"
                    className="text-xs"
                  />
                  {speakers.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-500 h-9 w-9 p-0 shrink-0"
                      onClick={() => removeSpeaker(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Tags Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Event Tags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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
                placeholder="Add a tag and press Enter (e.g. Product, AI, Design)"
              />
              <Button type="button" onClick={addTag}>
                Add Tag
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {tags.map((tag, i) => (
                <Badge key={i} variant="secondary" className="px-3 py-1.5 text-sm gap-2">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-red-500 font-bold"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Event Type Specific Form Sections */}
        {eventType === "Workshop" && (
          <WorkshopEventForm
            eventDetails={eventDetails}
            setEventDetails={setEventDetails}
          />
        )}

        {(eventType === "Teardown" || eventType === "Hackathon") && (
          <TeardownEventForm
            eventDetails={eventDetails}
            setEventDetails={setEventDetails}
            eventType={eventType}
          />
        )}

        {/* Bottom Save Bar */}
        <div className="sticky bottom-4 flex justify-end gap-3 p-4 bg-card border rounded-xl shadow-lg">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={updating}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleSubmit()}
            disabled={updating || uploadingBanner}
            className="bg-primary text-primary-foreground min-w-32"
          >
            {updating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
