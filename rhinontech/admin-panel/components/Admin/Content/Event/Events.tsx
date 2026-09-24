"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Plus,
  Calendar,
  MapPin,
  Clock,
  Eye,
  Edit,
  Trash2,
  Copy,
  Pencil,
  Search,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { IEvent } from "./types";
import DuplicateEventDialog from "./EventCommonComponents/DuplicateEventDialog";
import {
  deleteEvents,
  getAllEvents,
  updateEventPublishStatus,
} from "@/services/Events/eventServices";
import { useNotification } from "@/helpers/NotificationContext";
import { formatDateRange, formatTimeRange } from "@/utils/events";

export default function Events() {
  const router = useRouter();
  const pathname = usePathname();
  const { showNotification } = useNotification();

  const [events, setEvents] = useState<IEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<IEvent | null>(null);

  // Delete State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);

  // Publish Toggle State
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedEventStatus, setSelectedEventStatus] = useState<boolean>(false);

  // Duplicate State
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [eventToDuplicate, setEventToDuplicate] = useState<any | null>(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await getAllEvents();
      const list = res.events || res.data || (Array.isArray(res) ? res : []);
      setEvents(list);
    } catch (err: any) {
      console.error("Failed to load events:", err);
      showNotification("error", "Error", err.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteEvents(id);
      showNotification("success", "Event Deleted", "Event was permanently removed.");
      setDeleteDialogOpen(false);
      setEventToDelete(null);
      fetchEvents();
    } catch (err: any) {
      showNotification("error", "Delete Failed", err.message || "Could not delete event");
    }
  };

  const handlePublishToggle = async (id: string, nextStatus: boolean) => {
    try {
      await updateEventPublishStatus(id, nextStatus);
      showNotification(
        "success",
        nextStatus ? "Event Published" : "Event Set to Draft",
        `Event status updated.`
      );
      setPublishDialogOpen(false);
      setSelectedEventId(null);
      fetchEvents();
    } catch (err: any) {
      showNotification("error", "Update Failed", err.message);
    }
  };

  const filteredEvents = events.filter((e) => {
    const q = searchTerm.toLowerCase();
    return (
      e.eventTitle.toLowerCase().includes(q) ||
      (e.eventSubtitle && e.eventSubtitle.toLowerCase().includes(q)) ||
      (e.eventSlug && e.eventSlug.toLowerCase().includes(q)) ||
      (e.eventType && e.eventType.toLowerCase().includes(q))
    );
  });

  const getManageUrl = (id: string | number) => {
    return `${pathname}/manage-events/${id}`;
  };

  const getEditUrl = (id: string | number) => {
    return `${pathname}/edit/${id}`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-muted/10">
      {/* Top Header */}
      <div className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-card px-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Events</h1>
          <p className="text-xs text-muted-foreground">Manage workshops, hackathons, and teardown sessions</p>
        </div>

        <div className="flex items-center gap-3">
          {/* The full-page editor replaced the old create dialog. */}
          <Button size="sm" className="gap-2 bg-primary text-primary-foreground" onClick={() => router.push(`${pathname}/new`)}>
            <Plus className="w-4 h-4" /> Add Event
          </Button>
        </div>
      </div>

      {/* Main Container */}
      <div className="p-6 max-w-7xl mx-auto w-full space-y-4">
        {/* Search Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search events by title, slug, type..."
              className="pl-9 bg-card"
            />
          </div>
          <div className="text-xs text-muted-foreground">
            Total: <span className="font-semibold text-foreground">{events.length}</span> events
          </div>
        </div>

        {/* Events Table Card */}
        <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead className="text-center">Response</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Loading events...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center text-muted-foreground text-sm">
                    {searchTerm ? "No events matching your search." : "No events created yet. Click 'Add Event' to get started."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredEvents.map((event) => (
                  <TableRow
                    key={event.id}
                    className="hover:bg-muted/40 cursor-pointer"
                    onClick={() => setSelectedEvent(event)}
                  >
                    {/* Title & Subtitle */}
                    <TableCell>
                      <div className="space-y-0.5 max-w-xs">
                        <div className="font-semibold text-sm text-foreground truncate">
                          {event.eventTitle}
                        </div>
                        {event.eventSubtitle && (
                          <div className="text-xs text-muted-foreground truncate">
                            {event.eventSubtitle}
                          </div>
                        )}
                        <div className="text-[11px] text-muted-foreground font-mono">
                          /{event.eventSlug}
                        </div>
                      </div>
                    </TableCell>

                    {/* Type */}
                    <TableCell>
                      <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                        {event.eventType}
                      </Badge>
                    </TableCell>

                    {/* Category */}
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {event.eventCategory || "Normal"}
                      </Badge>
                    </TableCell>

                    {/* Date & Time */}
                    <TableCell className="text-xs space-y-0.5">
                      <div className="font-medium text-foreground">
                        {formatDateRange(event.eventStartDate, event.eventEndDate)}
                      </div>
                      {(event.eventStartTime || event.eventEndTime) && (
                        <div className="text-muted-foreground">
                          {formatTimeRange(event.eventStartTime, event.eventEndTime)}
                        </div>
                      )}
                    </TableCell>

                    {/* Accept Response */}
                    <TableCell className="text-center">
                      {event.canAcceptResponse ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          Open
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Closed
                        </Badge>
                      )}
                    </TableCell>

                    {/* Publish Status Toggle */}
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        {event.isPublished ? (
                          <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Published
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                            Draft
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedEventId(String(event.id));
                            setSelectedEventStatus(Boolean(event.isPublished));
                            setPublishDialogOpen(true);
                          }}
                          className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                          title="Change publish status"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => router.push(getManageUrl(event.id))}
                          title="Manage Event"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => router.push(getEditUrl(event.id))}
                          title="Edit Event"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            setEventToDuplicate(event);
                            setDuplicateDialogOpen(true);
                          }}
                          title="Duplicate Event"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                          onClick={() => {
                            setEventToDelete(String(event.id));
                            setDeleteDialogOpen(true);
                          }}
                          title="Delete Event"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Side Details Drawer (Sheet) */}
      <Sheet open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <SheetContent className="w-[420px] sm:w-[540px] overflow-y-auto">
          {selectedEvent && (
            <div className="space-y-6 pt-4">
              <SheetHeader>
                <SheetTitle className="text-left text-lg font-bold">
                  {selectedEvent.eventTitle}
                </SheetTitle>
              </SheetHeader>

              {selectedEvent.eventCreativeUrl && (
                <div className="rounded-xl overflow-hidden border">
                  <img
                    src={selectedEvent.eventCreativeUrl}
                    alt={selectedEvent.eventTitle}
                    className="w-full h-44 object-cover"
                  />
                </div>
              )}

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>{formatDateRange(selectedEvent.eventStartDate, selectedEvent.eventEndDate)}</span>
                </div>
                {(selectedEvent.eventStartTime || selectedEvent.eventEndTime) && (
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>{formatTimeRange(selectedEvent.eventStartTime, selectedEvent.eventEndTime)}</span>
                  </div>
                )}
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>{selectedEvent.locationType || "Online"} {selectedEvent.location ? `(${selectedEvent.location})` : ""}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Type & Tags
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    {selectedEvent.eventType}
                  </Badge>
                  <Badge variant="secondary">
                    {selectedEvent.eventCategory || "Normal"}
                  </Badge>
                  {(selectedEvent.tags || []).map((t, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>

              {selectedEvent.speakers && selectedEvent.speakers.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Speakers
                  </div>
                  <div className="divide-y divide-border border rounded-lg p-2 bg-muted/20">
                    {selectedEvent.speakers.map((spk, idx) => (
                      <div key={idx} className="py-2 flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground">{spk.name}</span>
                        <span className="text-muted-foreground">{spk.designation} at {spk.company}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t">
                <Button
                  className="flex-1"
                  onClick={() => {
                    const id = selectedEvent.id;
                    setSelectedEvent(null);
                    router.push(getManageUrl(id));
                  }}
                >
                  Manage Event
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const id = selectedEvent.id;
                    setSelectedEvent(null);
                    router.push(getEditUrl(id));
                  }}
                >
                  Edit Details
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this event and remove all registrations and settings associated with it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (eventToDelete) handleDelete(eventToDelete);
              }}
            >
              Delete Event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Publish Toggle Alert Dialog */}
      <AlertDialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Event Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {selectedEventStatus ? "unpublish this event and set it to Draft" : "publish this event live to users"}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedEventId) handlePublishToggle(selectedEventId, !selectedEventStatus);
              }}
              className={selectedEventStatus ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-green-600 hover:bg-green-700 text-white"}
            >
              {selectedEventStatus ? "Set to Draft" : "Publish Event"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Duplicate Dialog */}
      <DuplicateEventDialog
        event={eventToDuplicate}
        open={duplicateDialogOpen}
        onOpenChange={setDuplicateDialogOpen}
        onDuplicated={fetchEvents}
      />
    </div>
  );
}
