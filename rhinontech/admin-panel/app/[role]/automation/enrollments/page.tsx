"use client";

import React, { useState, useEffect } from "react";
import { WorkflowEnrollmentsTab } from "@/components/Admin/Automation/WorkflowEnrollmentsTab";
import { WorkflowEnrollment } from "@/types/automation";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

export default function EnrollmentsGlobalPage() {
  const [enrollments, setEnrollments] = useState<WorkflowEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGlobalEnrollments = async () => {
    try {
      setLoading(true);
      const res = await apiFetch<{ success: boolean; data: WorkflowEnrollment[] }>("/workflows/enrollments/all");
      if (res.success && Array.isArray(res.data)) {
        setEnrollments(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch global enrollments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalEnrollments();
  }, []);

  const handleCancelAll = async () => {
    try {
      const res = await apiFetch<{ success: boolean; message: string }>("/workflows/cancel-all-enrollments", {
        method: "POST",
      });
      if (res.success) {
        toast.success("Cancelled all running enrollments");
        fetchGlobalEnrollments();
      }
    } catch (err: any) {
      console.error("Failed to cancel running enrollments:", err);
      toast.error(err.message || "Failed to cancel running enrollments");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Global Workflow Enrollments</h1>
        <p className="text-sm text-gray-500 mt-1">Live tracking log of all lead enrollments across all workflows.</p>
      </div>

      <WorkflowEnrollmentsTab
        enrollments={enrollments}
        onRefresh={fetchGlobalEnrollments}
        onCancelAll={handleCancelAll}
      />
    </div>
  );
}

