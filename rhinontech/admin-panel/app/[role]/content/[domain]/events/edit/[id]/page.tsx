"use client";

import { useParams } from "next/navigation";
import EventEditor from "@/components/Admin/Content/Event/Editor/EventEditor";

export default function EditEventRoute() {
  const params = useParams();
  return <EventEditor eventId={params.id as string} />;
}
