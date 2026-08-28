"use client";

import React, { useState } from "react";
import { WorkflowEnrollmentsTab } from "@/components/Admin/Automation/WorkflowEnrollmentsTab";
import { initialEnrollments } from "@/lib/automationStore";
import { WorkflowEnrollment } from "@/types/automation";

export default function EnrollmentsGlobalPage() {
  const [enrollments, setEnrollments] = useState<WorkflowEnrollment[]>(initialEnrollments);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Global Workflow Enrollments</h1>
        <p className="text-sm text-muted-foreground mt-1">Live tracking log of all lead enrollments across all workflows.</p>
      </div>

      <WorkflowEnrollmentsTab
        enrollments={enrollments}
        onRefresh={() => setEnrollments([...enrollments])}
        onCancelAll={() =>
          setEnrollments((prev) =>
            prev.map((e) => (e.status === "active" ? { ...e, status: "cancelled" } : e))
          )
        }
      />
    </div>
  );
}
