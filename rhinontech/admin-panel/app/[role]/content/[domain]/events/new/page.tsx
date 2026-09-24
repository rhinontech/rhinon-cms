"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddEventDialog } from "@/components/Admin/Content/Event/AddEventDialog";

export default function NewEventRoute() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen bg-muted/10 pb-16">
      <div className="sticky top-0 z-10 flex h-16 items-center border-b bg-card px-6">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Events
        </Button>
      </div>

      <div className="max-w-4xl mx-auto w-full p-6">
        <Card>
          <CardHeader>
            <CardTitle>Create New Event</CardTitle>
          </CardHeader>
          <CardContent>
            <AddEventDialog
              pageRefresh={() => router.back()}
              onClose={() => router.back()}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
