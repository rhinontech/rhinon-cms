"use client";

import { Suspense } from "react";
import Events from "@/components/Admin/Content/Event/Events";

export default function ContentEventsPage() {
  // Events reads ?view= with useSearchParams, which needs a Suspense boundary.
  return (
    <Suspense>
      <Events />
    </Suspense>
  );
}
