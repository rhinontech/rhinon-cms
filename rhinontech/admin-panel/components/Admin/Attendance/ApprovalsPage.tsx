"use client";

import { useCallback, useEffect, useState } from "react";
import {
  TbCheck,
  TbX,
  TbClock,
  TbUser,
  TbFileText,
  TbAlertCircle,
  TbChevronRight,
  TbLayoutSidebarFilled,
  TbLayoutSidebarRightFilled,
  TbSearch,
  TbCircleCheck
} from "react-icons/tb";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { useSideNav } from "@/context/SideNavContext";

interface Request {
  id: string;
  userId: string;
  userName: string;
  type: "Regularization" | "Overtime" | "Shift Change";
  date: string;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  details: {
    originalTime?: string;
    requestedTime: string;
  };
}

export function ApprovalsPage() {
  const { isExpanded: isSubNavExpanded } = useSideNav();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      const data = await apiFetch<Request[]>("/attendance/requests");
      setRequests(data.filter(r => r.status === "Pending"));
      if (data.length > 0) setSelectedRequest(data[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAction = async (id: string, status: "Approved" | "Rejected") => {
    setProcessing(id);
    try {
      await apiFetch(`/attendance/requests/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status })
      });
      setRequests(prev => prev.filter(r => r.id !== id));
      setSelectedRequest(null);
    } catch (err) {
      alert("Action failed");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      <main className={cn("flex h-full min-h-0 w-full flex-col overflow-hidden bg-card border-r", isSubNavExpanded ? "rounded-r-xl" : "rounded-xl")}>
        <div className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border glass-header px-5">
          <div className="flex items-center gap-3">
            <SubNavToggle />
            <span className="text-lg font-semibold tracking-tight">Pending Approvals</span>
          </div>
          <div className="flex items-center gap-2">
            {!isPreviewExpanded && (
              <button onClick={() => setIsPreviewExpanded(true)} className="rounded-lg p-2 text-foreground/70 hover:bg-muted transition-all">
                <TbLayoutSidebarFilled size={20} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {loading ? (
            <div className="p-20 text-center text-muted-foreground/70 italic">Loading requests...</div>
          ) : requests.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <TbCircleCheck size={64} className="text-green-200" />
              <div>
                <p className="text-lg font-bold text-foreground">All caught up!</p>
                <p className="text-sm text-muted-foreground">No pending regularization or overtime requests.</p>
              </div>
            </div>
          ) : requests.map(req => (
            <div
              key={req.id}
              onClick={() => { setSelectedRequest(req); setIsPreviewExpanded(true); }}
              className={cn(
                "p-4 rounded-2xl border border-border transition-all cursor-pointer flex items-center justify-between group",
                selectedRequest?.id === req.id ? "bg-muted/40 border-border ring-1 ring-border" : "bg-card hover:bg-muted/40"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "p-3 rounded-xl",
                  req.type === "Regularization" ? "bg-blue-50 dark:bg-blue-400/10 text-blue-600 dark:text-blue-300" : "bg-green-50 dark:bg-green-400/10 text-green-600 dark:text-green-300"
                )}>
                  {req.type === "Regularization" ? <TbClock size={20} /> : <TbFileText size={20} />}
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm">{req.userName}</h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{req.type} for {new Date(req.date).toLocaleDateString()}</p>
                </div>
              </div>
              <TbChevronRight className={cn("text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-1 transition-all", selectedRequest?.id === req.id && "text-foreground")} />
            </div>
          ))}
        </div>
      </main>

      {/* Aside Panel */}
      <aside className={cn(
        "flex min-h-0 h-full flex-col bg-card rounded-xl overflow-hidden transition-all duration-200 ease-in-out",
        isPreviewExpanded && selectedRequest ? "w-[42%] ml-1.5" : "w-0"
      )}>
        {selectedRequest && (
          <div className="flex h-full flex-col">
            <div className="sticky top-0 w-full flex items-center justify-between h-16 px-5 border-b bg-card z-10">
              <div className="flex items-center gap-4 self-stretch">
                <p className="flex self-stretch items-center text-md font-medium tracking-tight border-b-2 border-blue-600 text-foreground -mb-px">Request Details</p>
              </div>
              <button onClick={() => setIsPreviewExpanded(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <TbLayoutSidebarRightFilled size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-5 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
                  {selectedRequest.userName.charAt(0)}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground leading-tight">{selectedRequest.userName}</h2>
                  <p className="text-xs text-muted-foreground">Employee Request</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground mb-1">Date of Request</p>
                  <p className="font-semibold text-foreground">{new Date(selectedRequest.date).toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>

                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground mb-1">Requested Action</p>
                  <p className="font-semibold text-foreground">Update clock-in to <span className="text-blue-600 dark:text-blue-300">{selectedRequest.details.requestedTime}</span></p>
                </div>

                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground mb-2">Reason provided</p>
                  <p className="text-sm text-foreground/70 leading-relaxed font-medium">"{selectedRequest.reason}"</p>
                </div>
              </div>

              <div className="pt-6 border-t flex flex-col gap-3">
                <button
                  onClick={() => handleAction(selectedRequest.id, "Approved")}
                  disabled={!!processing}
                  className="w-full py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-colors shadow-lg active:scale-95 flex items-center justify-center gap-2"
                >
                  {processing === selectedRequest.id ? <TbClock className="animate-spin" /> : <TbCheck />}
                  Approve Request
                </button>
                <button
                  onClick={() => handleAction(selectedRequest.id, "Rejected")}
                  disabled={!!processing}
                  className="w-full py-3 bg-card text-red-600 dark:text-red-300 border border-red-100 dark:border-red-400/20 rounded-xl font-bold text-sm hover:bg-red-50 dark:hover:bg-red-400/10 transition-colors active:scale-95 flex items-center justify-center gap-2"
                >
                  <TbX />
                  Decline
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
