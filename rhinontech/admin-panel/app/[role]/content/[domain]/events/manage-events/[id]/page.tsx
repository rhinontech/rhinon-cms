"use client";

import { useParams } from "next/navigation";
import ManageEventPage from "@/components/Admin/Content/Event/ManageEvents/ManageEvents";

export default function ManageEventsRoute() {
  const params = useParams();
  const id = params.id as string;
  return <ManageEventPage eventId={id} />;
}
