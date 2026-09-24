"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Users, Loader2 } from "lucide-react";
import {
  getEventReferals,
  getEventReferalsDetails,
} from "@/services/Events/eventServices";

interface ReferralsProps {
  eventId: string | number;
  getApprovalStatusBadge?: (status: any) => React.ReactNode;
}

interface ReferralSummary {
  id: string;
  name: string;
  email: string;
  phone: string;
  referralCode: string;
  memberCount: number;
  type: string;
}

interface RefereeMember {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export function EventReferrals({ eventId }: ReferralsProps) {
  const [referrals, setReferrals] = useState<ReferralSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [referees, setReferees] = useState<RefereeMember[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    const fetchReferrals = async () => {
      try {
        setLoading(true);
        const res = await getEventReferals(eventId);
        setReferrals(res.data || []);
      } catch (err) {
        console.error("Failed to load referrals:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReferrals();
  }, [eventId]);

  const viewReferees = async (code: string) => {
    setSelectedCode(code);
    setDialogOpen(true);
    try {
      setDetailsLoading(true);
      const res = await getEventReferalsDetails(eventId, code);
      setReferees(res.referredMembers || []);
    } catch {
      setReferees([]);
    } finally {
      setDetailsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Loading referrals...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referrer Name</TableHead>
                <TableHead>Email & Phone</TableHead>
                <TableHead>Referral Code</TableHead>
                <TableHead>Total Referees</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referrals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center text-muted-foreground text-sm">
                    No referrals tracked for this event yet.
                  </TableCell>
                </TableRow>
              ) : (
                referrals.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium text-foreground">
                      {r.name || "Anonymous Referrer"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div>{r.email || "No email"}</div>
                      {r.phone && <div>{r.phone}</div>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {r.referralCode}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                        {r.memberCount} joined
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => viewReferees(r.referralCode)}
                        className="gap-1.5 text-xs"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Referees
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Referees Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Referred by: {selectedCode}
            </DialogTitle>
          </DialogHeader>

          {detailsLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : referees.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No individual member records found.
            </div>
          ) : (
            <div className="divide-y divide-border max-h-80 overflow-y-auto">
              {referees.map((member, i) => (
                <div key={i} className="py-2.5 flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium text-foreground">{member.name || "Member"}</div>
                    <div className="text-xs text-muted-foreground">{member.email}</div>
                  </div>
                  {member.phone && (
                    <span className="text-xs text-muted-foreground">{member.phone}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
export default EventReferrals;
