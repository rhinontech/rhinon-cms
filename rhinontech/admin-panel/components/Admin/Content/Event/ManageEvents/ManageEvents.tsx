"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import Overview, { IGuest } from "./Tabs/Overview";
import Guest, { BulkAction } from "./Tabs/Guest";
import { EventReferrals } from "../EventCommonComponents/Referrals/Referrals";
import ReminderEmailV2 from "../EventCommonComponents/ReminderEmailV2/ReminderEmailV2";
import CertificateTemplate from "../EventCommonComponents/CertificateTemplate/CertificateTemplate";
import EventResponse from "../EventCommonComponents/EventResponse/EventResponse";
import type { IEvent } from "../types";
import {
  eventGuestStatus,
  getAllGuests,
  getEventById,
  sendEmailNotification,
} from "@/services/Events/eventServices";
import { useNotification } from "@/helpers/NotificationContext";

interface ManageEventPageProps {
  eventId?: string;
}

export default function ManageEventPage({ eventId }: ManageEventPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { showNotification } = useNotification();

  const id = eventId || pathname.split("/").pop();

  const [event, setEvent] = useState<IEvent | null>(null);
  const [guests, setGuests] = useState<IGuest[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [selectedGuests, setSelectedGuests] = useState<(string | number)[]>([]);

  const fetchEventData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await getEventById(id);
      const ev = res.event || res.data || res;
      setEvent(ev);

      const guestRes = await getAllGuests({ eventId: id });
      setGuests(guestRes.registrations || []);
    } catch (err: any) {
      console.error("Error loading event data:", err);
      showNotification("error", "Failed to Load", err.message || "Could not fetch event.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventData();
  }, [id]);

  const handleAcceptGuest = async (guestId: any) => {
    try {
      await eventGuestStatus({
        userIds: [guestId],
        eventId: id || "",
        status: "Approved",
      });

      await sendEmailNotification({
        type: "Approved",
        userIds: [guestId],
        eventId: id || "",
      });

      showNotification("success", "Guest Approved", "Confirmation notification sent.");
      setGuests((prev) =>
        prev.map((g) => (g.id === guestId ? { ...g, guestType: "Approved" } : g))
      );
    } catch (err: any) {
      showNotification("error", "Error", err.message || "Failed to approve guest");
    }
  };

  const handleDeclineGuest = async (guestId: any) => {
    try {
      await eventGuestStatus({
        userIds: [guestId],
        eventId: id || "",
        status: "Declined",
      });

      await sendEmailNotification({
        type: "Declined",
        userIds: [guestId],
        eventId: id || "",
      });

      showNotification("info", "Guest Declined", "Status updated.");
      setGuests((prev) =>
        prev.map((g) => (g.id === guestId ? { ...g, guestType: "Declined" } : g))
      );
    } catch (err: any) {
      showNotification("error", "Error", err.message || "Failed to decline guest");
    }
  };

  const handleBulkAccept = async (action: BulkAction) => {
    let targetIds: (string | number)[] = [];
    if (action === "APPROVE_ALL") {
      targetIds = guests.filter((g) => g.guestType === "Waitlist").map((g) => g.id);
    } else if (action === "APPROVE_PROFESSIONALS") {
      targetIds = guests
        .filter((g) => g.guestType === "Waitlist" && g.userType === "Professional")
        .map((g) => g.id);
    } else if (action === "APPROVE_STUDENTS") {
      targetIds = guests
        .filter((g) => g.guestType === "Waitlist" && g.userType === "Student")
        .map((g) => g.id);
    }

    if (targetIds.length === 0) {
      showNotification("info", "No Guests", "No waitlisted guests match the selection.");
      return;
    }

    try {
      await eventGuestStatus({
        userIds: targetIds,
        eventId: id || "",
        status: "Approved",
      });

      showNotification("success", "Bulk Approved", `${targetIds.length} guests approved.`);
      setGuests((prev) =>
        prev.map((g) => (targetIds.includes(g.id) ? { ...g, guestType: "Approved" } : g))
      );
      setSelectedGuests([]);
    } catch (err: any) {
      showNotification("error", "Bulk Action Failed", err.message);
    }
  };

  const handleBulkDecline = async (action: BulkAction) => {
    let targetIds: (string | number)[] = [];
    if (action === "DECLINE_ALL") {
      targetIds = guests.filter((g) => g.guestType === "Waitlist").map((g) => g.id);
    } else if (action === "DECLINE_PROFESSIONALS") {
      targetIds = guests
        .filter((g) => g.guestType === "Waitlist" && g.userType === "Professional")
        .map((g) => g.id);
    } else if (action === "DECLINE_STUDENTS") {
      targetIds = guests
        .filter((g) => g.guestType === "Waitlist" && g.userType === "Student")
        .map((g) => g.id);
    }

    if (targetIds.length === 0) {
      showNotification("info", "No Guests", "No waitlisted guests match the selection.");
      return;
    }

    try {
      await eventGuestStatus({
        userIds: targetIds,
        eventId: id || "",
        status: "Declined",
      });

      showNotification("info", "Bulk Declined", `${targetIds.length} guests declined.`);
      setGuests((prev) =>
        prev.map((g) => (targetIds.includes(g.id) ? { ...g, guestType: "Declined" } : g))
      );
      setSelectedGuests([]);
    } catch (err: any) {
      showNotification("error", "Bulk Action Failed", err.message);
    }
  };

  const getApprovalStatusBadge = (status: IGuest["guestType"]) => {
    switch (status) {
      case "Approved":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Approved</Badge>;
      case "Declined":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Declined</Badge>;
      default:
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">Waitlist</Badge>;
    }
  };

  const getTimeAgo = (dateString?: string | Date) => {
    if (!dateString) return "Recently";
    const date = new Date(dateString);
    const diff = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diff < 60) return `${Math.max(1, diff)} min ago`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours} hr ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  };

  if (loading || !event) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-sm text-muted-foreground">Loading event management...</span>
      </div>
    );
  }

  const publicUrl = `/events/${event.eventSlug}`;

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
          <h1 className="text-lg font-semibold tracking-tight truncate max-w-md">
            {event.eventTitle}
          </h1>
        </div>

        <a href={publicUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="gap-1.5">
            Public Page <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </a>
      </div>

      {/* Main Tabs Container */}
      <div className="max-w-7xl mx-auto w-full p-6 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-card border p-1 rounded-xl w-full justify-start overflow-x-auto">
            <TabsTrigger value="overview" className="rounded-lg">
              Overview
            </TabsTrigger>
            <TabsTrigger value="guests" className="rounded-lg">
              Guests ({guests.length})
            </TabsTrigger>
            <TabsTrigger value="referrals" className="rounded-lg">
              Referrals
            </TabsTrigger>
            <TabsTrigger value="reminder-email" className="rounded-lg">
              Reminder Email
            </TabsTrigger>
            <TabsTrigger value="certificate-template" className="rounded-lg">
              Certificate Template
            </TabsTrigger>
            {event.eventType === "Workshop" ? (
              <TabsTrigger value="feedbacks" className="rounded-lg">
                Feedbacks
              </TabsTrigger>
            ) : (
              <TabsTrigger value="submissions" className="rounded-lg">
                Submissions
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview">
            <Overview
              guests={guests}
              events={event}
              handleAcceptGuest={handleAcceptGuest}
              handleDeclineGuest={handleDeclineGuest}
              getApprovalStatusBadge={getApprovalStatusBadge}
              getTimeAgo={getTimeAgo}
              setActiveTab={setActiveTab}
            />
          </TabsContent>

          <TabsContent value="guests">
            <Guest
              guests={guests}
              handleAcceptGuest={handleAcceptGuest}
              handleDeclineGuest={handleDeclineGuest}
              getApprovalStatusBadge={getApprovalStatusBadge}
              getTimeAgo={getTimeAgo}
              handleBulkAccept={handleBulkAccept}
              handleBulkDecline={handleBulkDecline}
              selectedGuests={selectedGuests}
              setSelectedGuests={setSelectedGuests}
            />
          </TabsContent>

          <TabsContent value="referrals">
            <EventReferrals eventId={event.id} />
          </TabsContent>

          <TabsContent value="reminder-email">
            <ReminderEmailV2 />
          </TabsContent>

          <TabsContent value="certificate-template">
            <CertificateTemplate />
          </TabsContent>

          <TabsContent value="feedbacks">
            <EventResponse eventId={event.id} type="feedback" eventType={event.eventType} />
          </TabsContent>

          <TabsContent value="submissions">
            <EventResponse eventId={event.id} type="submission" eventType={event.eventType} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
