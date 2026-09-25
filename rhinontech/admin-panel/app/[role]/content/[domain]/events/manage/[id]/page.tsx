"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import EventManage from "@/components/Admin/Content/Event/Manage/EventManage";

export default function ManageEventRoute() {
  const params = useParams();
  // EventManage reads ?tab= with useSearchParams, which needs a Suspense boundary.
  return (
    <Suspense>
      <EventManage eventId={params.id as string} />
    </Suspense>
  );
}
