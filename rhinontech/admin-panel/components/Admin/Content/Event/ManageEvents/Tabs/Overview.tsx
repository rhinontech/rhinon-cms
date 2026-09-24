"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  MapPin,
  Calendar,
  Clock,
  Copy,
  CopyCheck,
  Users,
  Check,
  X,
  ExternalLink,
} from "lucide-react";
import { IEvent } from "../../AddEventDialog";
import { formatDateRange, formatTimeRange } from "@/utils/events";
import { toggleEventAcceptResponse } from "@/services/Events/eventServices";
import { useNotification } from "@/helpers/NotificationContext";

export interface IGuest {
  id: string | number;
  name: string;
  phone?: string | null;
  email?: string | null;
  linkedin?: string | null;
  role?: string | null;
  userType?: string | null;
  eventType?: string | null;
  guestType: "Approved" | "Waitlist" | "Declined";
  eventName?: string | null;
  userId?: string | number | null;
  createdAt?: string | Date;
  user?: {
    fullName?: string;
    email?: string;
    avatarUrl?: string;
  };
}

interface OverviewProps {
  guests: IGuest[];
  events: IEvent;
  handleAcceptGuest: (guestId: any) => void;
  handleDeclineGuest: (guestId: any) => void;
  getApprovalStatusBadge: (status: IGuest["guestType"]) => React.ReactNode;
  getTimeAgo: (dateString: string | Date | undefined) => string;
  setActiveTab: (tab: string) => void;
}

export default function Overview({
  guests,
  events,
  handleAcceptGuest,
  handleDeclineGuest,
  getApprovalStatusBadge,
  getTimeAgo,
  setActiveTab,
}: OverviewProps) {
  const { showNotification } = useNotification();
  const [copied, setCopied] = useState(false);
  const [canAcceptResponse, setCanAcceptResponse] = useState(
    events.canAcceptResponse || false
  );
  const [toggling, setToggling] = useState(false);

  const totalRegistered = guests.length;
  const approvedCount = guests.filter((g) => g.guestType === "Approved").length;
  const waitlistCount = guests.filter((g) => g.guestType === "Waitlist").length;
  const declinedCount = guests.filter((g) => g.guestType === "Declined").length;

  const publicUrl = typeof window !== "undefined"
    ? `${window.location.origin}/events/${events.eventSlug}`
    : `/events/${events.eventSlug}`;

  const copyEventUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    showNotification("success", "Link Copied", "Public event URL copied to clipboard.");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleResponse = async (val: boolean) => {
    try {
      setToggling(true);
      await toggleEventAcceptResponse(events.id, { canAcceptResponse: val });
      setCanAcceptResponse(val);
      showNotification(
        "success",
        val ? "Responses Open" : "Responses Closed",
        `Event is now ${val ? "accepting" : "no longer accepting"} responses.`
      );
    } catch {
      showNotification("error", "Error", "Failed to update response acceptance");
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-5 items-start">
                {events.eventCreativeUrl ? (
                  <img
                    src={events.eventCreativeUrl}
                    alt={events.eventTitle}
                    className="w-full sm:w-48 h-32 object-cover rounded-xl border shrink-0"
                  />
                ) : (
                  <div className="w-full sm:w-48 h-32 rounded-xl bg-muted flex items-center justify-center text-muted-foreground text-sm shrink-0">
                    No Banner
                  </div>
                )}

                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex flex-wrap gap-2 items-center">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      {events.eventType}
                    </Badge>
                    <Badge variant="outline">
                      {events.eventCategory || "Normal"}
                    </Badge>
                    {events.isPublished ? (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        Published
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Draft</Badge>
                    )}
                  </div>

                  <h2 className="text-xl font-bold tracking-tight text-foreground truncate">
                    {events.eventTitle}
                  </h2>
                  {events.eventSubtitle && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {events.eventSubtitle}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      <span>{formatDateRange(events.eventStartDate, events.eventEndDate)}</span>
                    </div>
                    {(events.eventStartTime || events.eventEndTime) && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <span>{formatTimeRange(events.eventStartTime, events.eventEndTime)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      <span>{events.locationType || "Online"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-foreground">{totalRegistered}</div>
                <div className="text-xs text-muted-foreground font-medium mt-1">Total Registered</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
                <div className="text-xs text-muted-foreground font-medium mt-1">Approved Guests</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-amber-600">{waitlistCount}</div>
                <div className="text-xs text-muted-foreground font-medium mt-1">Waitlisted</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-500">{declinedCount}</div>
                <div className="text-xs text-muted-foreground font-medium mt-1">Declined</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Action Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Event Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Accept Responses</Label>
                  <p className="text-xs text-muted-foreground">
                    {canAcceptResponse ? "Registration is OPEN" : "Registration is CLOSED"}
                  </p>
                </div>
                <Switch
                  checked={canAcceptResponse}
                  disabled={toggling}
                  onCheckedChange={handleToggleResponse}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Public Event Link</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full justify-between gap-2 text-xs"
                    onClick={copyEventUrl}
                  >
                    <span className="truncate">{publicUrl}</span>
                    {copied ? <CopyCheck className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                    <Button type="button" variant="outline" size="sm" className="h-9 w-9 p-0">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                </div>
              </div>

              <Button
                type="button"
                className="w-full"
                onClick={() => setActiveTab("guests")}
              >
                <Users className="w-4 h-4 mr-2" />
                Manage Guests ({guests.length})
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Registrations Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4" />
            Recent Registrations
          </CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab("guests")}
            className="text-xs text-primary"
          >
            View All ({guests.length})
          </Button>
        </CardHeader>
        <CardContent>
          {guests.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No registrations yet for this event.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {guests.slice(0, 5).map((guest) => {
                const guestName = guest.name || guest.user?.fullName || "Guest";
                const guestEmail = guest.email || guest.user?.email || "No email";
                return (
                  <div
                    key={guest.id}
                    className="py-3 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={guest.user?.avatarUrl || undefined} />
                        <AvatarFallback>{guestName.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="font-medium text-sm text-foreground truncate">
                          {guestName}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {guestEmail} • {getTimeAgo(guest.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {getApprovalStatusBadge(guest.guestType)}

                      {guest.guestType === "Waitlist" && (
                        <div className="flex items-center gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 text-green-600 hover:bg-green-50"
                            onClick={() => handleAcceptGuest(guest.id)}
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                            onClick={() => handleDeclineGuest(guest.id)}
                            title="Decline"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
