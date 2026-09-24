"use client";

import { useParams } from "next/navigation";
import EditEventPage from "@/components/Admin/Content/Event/EditEvent/EditEvent";

export default function EditEventRoute() {
  const params = useParams();
  const id = params.id as string;
  return <EditEventPage eventId={id} />;
}
