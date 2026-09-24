"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Check,
  X,
  ChevronDown,
  Linkedin,
  Phone,
  Mail,
  GraduationCap,
  Briefcase,
} from "lucide-react";
import { IGuest } from "./Overview";

export type BulkAction =
  | "APPROVE_ALL"
  | "APPROVE_PROFESSIONALS"
  | "APPROVE_STUDENTS"
  | "DECLINE_ALL"
  | "DECLINE_PROFESSIONALS"
  | "DECLINE_STUDENTS";

interface GuestProps {
  guests: IGuest[];
  handleAcceptGuest: (guestId: any) => void;
  handleDeclineGuest: (guestId: any) => void;
  getApprovalStatusBadge: (status: IGuest["guestType"]) => React.ReactNode;
  getTimeAgo: (dateString: string | Date | undefined) => string;
  handleBulkReschedule?: () => void;
  handleBulkAccept: (action: BulkAction) => void;
  handleBulkDecline: (action: BulkAction) => void;
  selectedGuests: (string | number)[];
  setSelectedGuests: React.Dispatch<React.SetStateAction<(string | number)[]>>;
}

export default function Guest({
  guests,
  handleAcceptGuest,
  handleDeclineGuest,
  getApprovalStatusBadge,
  getTimeAgo,
  handleBulkAccept,
  handleBulkDecline,
  selectedGuests,
  setSelectedGuests,
}: GuestProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filteredGuests = guests.filter((g) => {
    const nameMatch = (g.name || g.user?.fullName || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const emailMatch = (g.email || g.user?.email || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesSearch = nameMatch || emailMatch;

    if (statusFilter === "ALL") return matchesSearch;
    return matchesSearch && g.guestType === statusFilter;
  });

  const toggleSelectAll = () => {
    if (selectedGuests.length === filteredGuests.length) {
      setSelectedGuests([]);
    } else {
      setSelectedGuests(filteredGuests.map((g) => g.id));
    }
  };

  const toggleSelect = (id: string | number) => {
    if (selectedGuests.includes(id)) {
      setSelectedGuests(selectedGuests.filter((gId) => gId !== id));
    } else {
      setSelectedGuests([...selectedGuests, id]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Filter and Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email..."
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Tabs */}
          <div className="inline-flex rounded-lg border bg-muted p-1 text-xs">
            {["ALL", "Waitlist", "Approved", "Declined"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-md transition-all font-medium ${
                  statusFilter === status
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {status} ({status === "ALL" ? guests.length : guests.filter((g) => g.guestType === status).length})
              </button>
            ))}
          </div>

          {/* Bulk Approve Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="text-green-600 gap-1.5">
                Bulk Approve <ChevronDown className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleBulkAccept("APPROVE_ALL")}>
                Approve All Waitlisted
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkAccept("APPROVE_PROFESSIONALS")}>
                Approve All Professionals
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkAccept("APPROVE_STUDENTS")}>
                Approve All Students
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Bulk Decline Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="text-red-600 gap-1.5">
                Bulk Decline <ChevronDown className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleBulkDecline("DECLINE_ALL")}>
                Decline All Waitlisted
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkDecline("DECLINE_PROFESSIONALS")}>
                Decline All Professionals
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkDecline("DECLINE_STUDENTS")}>
                Decline All Students
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Guests Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={
                      filteredGuests.length > 0 &&
                      selectedGuests.length === filteredGuests.length
                    }
                    onChange={toggleSelectAll}
                    className="rounded"
                  />
                </TableHead>
                <TableHead>Guest</TableHead>
                <TableHead>User Type & Role</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGuests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center text-muted-foreground text-sm">
                    No guests found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredGuests.map((guest) => {
                  const guestName = guest.name || guest.user?.fullName || "Guest";
                  const guestEmail = guest.email || guest.user?.email || "";
                  const isSelected = selectedGuests.includes(guest.id);

                  return (
                    <TableRow key={guest.id} className={isSelected ? "bg-muted/40" : ""}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(guest.id)}
                          className="rounded"
                        />
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={guest.user?.avatarUrl} />
                            <AvatarFallback>{guestName.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="font-medium text-sm text-foreground truncate">
                              {guestName}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {guestEmail}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            {guest.userType === "Professional" ? (
                              <Badge variant="outline" className="text-xs gap-1 py-0 bg-blue-50 text-blue-700 border-blue-200">
                                <Briefcase className="w-3 h-3" /> Professional
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs gap-1 py-0 bg-purple-50 text-purple-700 border-purple-200">
                                <GraduationCap className="w-3 h-3" /> Student
                              </Badge>
                            )}
                          </div>
                          {guest.role && (
                            <div className="text-xs text-muted-foreground truncate">
                              {guest.role}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-0.5 text-xs text-muted-foreground">
                          {guest.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3 h-3" />
                              <span>{guest.phone}</span>
                            </div>
                          )}
                          {guest.linkedin && (
                            <a
                              href={guest.linkedin.startsWith("http") ? guest.linkedin : `https://${guest.linkedin}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-primary hover:underline"
                            >
                              <Linkedin className="w-3 h-3" />
                              <span>Profile</span>
                            </a>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">
                        {getTimeAgo(guest.createdAt)}
                      </TableCell>

                      <TableCell>
                        {getApprovalStatusBadge(guest.guestType)}
                      </TableCell>

                      <TableCell className="text-right">
                        {guest.guestType === "Waitlist" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 text-green-600 hover:bg-green-50"
                              onClick={() => handleAcceptGuest(guest.id)}
                              title="Approve Guest"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                              onClick={() => handleDeclineGuest(guest.id)}
                              title="Decline Guest"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No actions</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
