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
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare, FileCheck } from "lucide-react";
import { getFeedbacks } from "@/services/Events/eventServices";

interface EventResponseProps {
  eventId: string | number;
  type: "feedback" | "submission";
  eventType?: string;
}

export default function EventResponse({
  eventId,
  type,
}: EventResponseProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;
    const fetchResponses = async () => {
      try {
        setLoading(true);
        const res = await getFeedbacks(eventId);
        setData(res.data || []);
      } catch {
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResponses();
  }, [eventId]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Loading responses...</span>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Attendee</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>{type === "feedback" ? "Feedback Rating & Comments" : "Submission Link"}</TableHead>
              <TableHead>Submitted At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-40 text-center text-muted-foreground text-sm">
                  {type === "feedback" ? (
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <MessageSquare className="w-8 h-8 opacity-40 mb-1" />
                      <span>No feedback submissions recorded yet.</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <FileCheck className="w-8 h-8 opacity-40 mb-1" />
                      <span>No project submissions recorded yet.</span>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium text-foreground">
                    {item.name || "Attendee"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <div>{item.email || "No email"}</div>
                    {item.phone && <div>{item.phone}</div>}
                  </TableCell>
                  <TableCell>
                    {item.feedbackData ? (
                      <div className="text-xs space-y-1">
                        {item.feedbackData.rating && (
                          <Badge variant="outline">Rating: {item.feedbackData.rating}/5</Badge>
                        )}
                        {item.feedbackData.comments && (
                          <p className="text-muted-foreground line-clamp-2">{item.feedbackData.comments}</p>
                        )}
                        {item.feedbackData.submissionUrl && (
                          <a
                            href={item.feedbackData.submissionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline block"
                          >
                            {item.feedbackData.submissionUrl}
                          </a>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Empty response</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {item.feedbackSubmittedAt
                      ? new Date(item.feedbackSubmittedAt).toLocaleString()
                      : "Recently"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
