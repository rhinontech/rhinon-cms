"use client";

import React, { useState, useEffect } from "react";
import { TbListCheck, TbBolt, TbEye, TbPencil, TbUsers, TbX, TbCheck, TbInfoCircle } from "react-icons/tb";
import { WorkflowTriggerType } from "@/types/automation";
import { apiFetch } from "@/lib/api";

interface ContactGroupItem {
  id: string;
  name: string;
  memberCount?: number;
}

interface WorkflowTriggerTabProps {
  triggerType: WorkflowTriggerType;
  onTypeChange: (type: WorkflowTriggerType) => void;
  allowReEnrollment: boolean;
  onReEnrollmentChange: (allow: boolean) => void;
  watchedSources?: string[];
  onSourcesChange?: (sources: string[]) => void;
  batchSize?: number;
  onBatchSizeChange?: (batchSize: number) => void;
}

export function WorkflowTriggerTab({
  triggerType,
  onTypeChange,
  allowReEnrollment,
  onReEnrollmentChange,
  watchedSources = [],
  onSourcesChange,
  batchSize = 100,
  onBatchSizeChange,
}: WorkflowTriggerTabProps) {
  const [selectedType, setSelectedType] = useState<WorkflowTriggerType>(triggerType);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contactGroups, setContactGroups] = useState<ContactGroupItem[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [selectedSources, setSelectedSources] = useState<string[]>(watchedSources);
  const [localBatchSize, setLocalBatchSize] = useState<number | string>(batchSize);
  const [isBatchSizeSaved, setIsBatchSizeSaved] = useState<boolean>(false);

  useEffect(() => {
    setSelectedType(triggerType);
  }, [triggerType]);

  useEffect(() => {
    setSelectedSources(watchedSources);
  }, [watchedSources]);

  useEffect(() => {
    setLocalBatchSize(batchSize);
  }, [batchSize]);

  const handleSaveBatchSize = () => {
    const parsed = typeof localBatchSize === "number" ? localBatchSize : parseInt(String(localBatchSize), 10);
    const numVal = isNaN(parsed) || parsed < 1 ? 1 : Math.min(10000, parsed);
    setLocalBatchSize(numVal);
    if (onBatchSizeChange) {
      onBatchSizeChange(numVal);
    }
    setIsBatchSizeSaved(true);
    setTimeout(() => setIsBatchSizeSaved(false), 2000);
  };

  const handleSelectType = (type: WorkflowTriggerType) => {
    setSelectedType(type);
    onTypeChange(type);
  };

  const openRecipientsModal = async () => {
    setIsModalOpen(true);
    try {
      setLoadingGroups(true);
      const res = await apiFetch<ContactGroupItem[]>("/contact-groups");
      if (Array.isArray(res)) {
        setContactGroups(res);
      }
    } catch (err) {
      console.error("Failed to load contact groups:", err);
      // Fallback default groups if endpoint fails
      setContactGroups([
        { id: "cg-1", name: "User Signups", memberCount: 1450 },
        { id: "cg-2", name: "Newsletter Subscribers", memberCount: 3200 },
        { id: "cg-3", name: "Meta Ads Leads", memberCount: 890 },
      ]);
    } finally {
      setLoadingGroups(false);
    }
  };

  const toggleSourceSelection = (sourceName: string) => {
    if (selectedSources.includes(sourceName)) {
      setSelectedSources(selectedSources.filter((s) => s !== sourceName));
    } else {
      setSelectedSources([...selectedSources, sourceName]);
    }
  };

  const handleSaveRecipients = () => {
    if (onSourcesChange) {
      onSourcesChange(selectedSources);
    }
    setIsModalOpen(false);
  };

  const handleBatchSizeChangeInternal = (val: number) => {
    setLocalBatchSize(val);
    if (onBatchSizeChange) {
      onBatchSizeChange(val);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Trigger Type Selection Section */}
      <div className="bg-card p-6 rounded-2xl border border-border shadow-2xs space-y-4">
        <h3 className="text-base font-bold text-foreground flex items-center gap-1.5">
          Trigger type <TbInfoCircle size={16} className="text-muted-foreground" />
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Static List */}
          <div
            onClick={() => handleSelectType("static_list")}
            className={`cursor-pointer rounded-xl p-5 border-2 transition-all ${
              selectedType === "static_list"
                ? "border-primary bg-muted/40 shadow-xs"
                : "border-border hover:border-border bg-card"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <TbListCheck size={20} className="text-foreground/85" />
              <h4 className="text-sm font-bold text-foreground">Static list</h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Manual one-time bulk run. Pick recipients, hit Run, leads enroll.
            </p>
          </div>

          {/* Card 2: When a new lead arrives */}
          <div
            onClick={() => handleSelectType("realtime_lead")}
            className={`cursor-pointer rounded-xl p-5 border-2 transition-all ${
              selectedType === "realtime_lead"
                ? "border-primary bg-muted/40 shadow-xs"
                : "border-border hover:border-border bg-card"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <TbBolt size={20} className="text-amber-500 dark:text-amber-400" />
              <h4 className="text-sm font-bold text-foreground">When a new lead arrives</h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Real-time auto-enroll when a lead is created from watched sources.
            </p>
          </div>
        </div>
      </div>

      {/* Static List Details */}
      {selectedType === "static_list" && (
        <div className="bg-card p-6 rounded-2xl border border-border shadow-2xs space-y-6">
          <p className="text-xs text-foreground/70">
            <span className="font-semibold text-foreground">Static list:</span> enrolls the leads matching this filter when you click Run. A one-time bulk send (no auto-enroll).
          </p>

          {/* Recipient Filter Box */}
          <div className="p-5 rounded-xl bg-muted/40 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-card border border-border rounded-lg text-foreground/70 mt-0.5">
                <TbUsers size={20} />
              </div>
              <div>
                <h5 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  Recipient filter <TbInfoCircle size={14} className="text-muted-foreground" />
                </h5>
                <p className="text-xs text-foreground/70 mt-1 font-medium">
                  {selectedSources.length > 0
                    ? `Selected (${selectedSources.length}): ${selectedSources.join(", ")}`
                    : "No sources selected yet"}
                </p>
              </div>
            </div>

            <button
              onClick={openRecipientsModal}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-card border border-border rounded-xl hover:bg-muted/40 text-foreground shadow-2xs transition-all shrink-0"
            >
              <TbPencil size={15} /> Select recipients
            </button>
          </div>

          {/* Batch Size */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              Batch size (per minute) <TbInfoCircle size={14} className="text-muted-foreground" />
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={10000}
                value={localBatchSize}
                onChange={(e) => setLocalBatchSize(e.target.value)}
                className="w-48 px-3.5 py-2 text-sm font-medium border border-border rounded-xl focus:ring-2 focus:ring-ring focus:outline-none bg-card"
              />
              <button
                type="button"
                onClick={handleSaveBatchSize}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 ${
                  isBatchSizeSaved
                    ? "bg-emerald-100 dark:bg-emerald-400/15 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-400/30"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs"
                }`}
              >
                {isBatchSizeSaved ? (
                  <>
                    <TbCheck size={14} /> Saved ✓
                  </>
                ) : (
                  "Save"
                )}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Maximum number of leads enrolled per minute. Helps avoid SES throttling.
            </p>
          </div>
        </div>
      )}

      {/* Auto-enrollment Details */}
      {selectedType === "realtime_lead" && (
        <div className="bg-card p-6 rounded-2xl border border-border shadow-2xs space-y-6">
          {/* Green Alert Banner */}
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-400/10 border border-emerald-200 dark:border-emerald-400/25 text-xs text-emerald-800 dark:text-emerald-200 space-y-1">
            <h5 className="font-bold flex items-center gap-1.5 text-emerald-900 dark:text-emerald-200">
              <TbBolt size={16} /> Auto-enrolls when a new lead arrives
            </h5>
            <p className="leading-relaxed">
              When a lead is created from any of the watched sources and matches the filter, the workflow runs for them automatically. No Run button needed.
            </p>
          </div>

          {/* Watched Landing Page Forms */}
          <div className="space-y-3">
            <div>
              <h5 className="text-sm font-bold text-foreground">Select Rhinon Labs Landing Page Forms</h5>
              <p className="text-xs text-muted-foreground mt-0.5">
                Choose which website form submission(s) will trigger this automation workflow:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Form 1: Contact Us Form */}
              <div
                onClick={() => {
                  const formKey = "Contact Us Form";
                  const nextSources = selectedSources.includes(formKey)
                    ? selectedSources.filter((s) => s !== formKey)
                    : [...selectedSources, formKey];
                  setSelectedSources(nextSources);
                  if (onSourcesChange) onSourcesChange(nextSources);
                }}
                className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedSources.includes("Contact Us Form")
                    ? "border-emerald-600 bg-emerald-50/40 dark:bg-emerald-400/10 shadow-xs"
                    : "border-border hover:border-border bg-card"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedSources.includes("Contact Us Form")}
                  onChange={() => {}}
                  className="mt-0.5 rounded text-emerald-600 dark:text-emerald-300 focus:ring-emerald-500"
                />
                <div>
                  <h6 className="text-sm font-bold text-foreground">📩 Contact Us Form</h6>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Triggers when a visitor submits the main Contact Us form on rhinontech.com
                  </p>
                </div>
              </div>

              {/* Form 2: Schedule a Call Form */}
              <div
                onClick={() => {
                  const formKey = "Schedule a Call Form";
                  const nextSources = selectedSources.includes(formKey)
                    ? selectedSources.filter((s) => s !== formKey)
                    : [...selectedSources, formKey];
                  setSelectedSources(nextSources);
                  if (onSourcesChange) onSourcesChange(nextSources);
                }}
                className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedSources.includes("Schedule a Call Form")
                    ? "border-emerald-600 bg-emerald-50/40 dark:bg-emerald-400/10 shadow-xs"
                    : "border-border hover:border-border bg-card"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedSources.includes("Schedule a Call Form")}
                  onChange={() => {}}
                  className="mt-0.5 rounded text-emerald-600 dark:text-emerald-300 focus:ring-emerald-500"
                />
                <div>
                  <h6 className="text-sm font-bold text-foreground">📅 Schedule a Call Form</h6>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Triggers when a lead schedules a demo or call on rhinontech.com
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Re-enrollment Toggle */}
          <div className="pt-2 border-t border-border flex items-start justify-between gap-4">
            <div>
              <h5 className="text-sm font-bold text-foreground">Allow re-enrollment after completion</h5>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                A lead currently in this workflow is never re-enrolled while their run is still in progress — that's locked regardless of this setting. This toggle only controls what happens AFTER their previous run has ended.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={allowReEnrollment}
                onChange={(e) => onReEnrollmentChange(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </div>
      )}

      {/* Select Recipients Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/50 p-4">
          <div className="bg-card w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">Select Recipient Contact Groups / Sources</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground/70 hover:bg-muted"
              >
                <TbX size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <p className="text-xs text-muted-foreground">
                Select contact groups or lead sources to include as target recipients for this workflow.
              </p>

              {loadingGroups ? (
                <div className="py-8 text-center text-xs text-muted-foreground">Loading contact groups...</div>
              ) : contactGroups.length > 0 ? (
                <div className="space-y-2">
                  {contactGroups.map((group) => {
                    const isSelected = selectedSources.includes(group.name);
                    return (
                      <div
                        key={group.id}
                        onClick={() => toggleSourceSelection(group.name)}
                        className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? "border-primary bg-muted/40 font-medium"
                            : "border-border hover:border-border bg-card"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                              isSelected ? "bg-primary border-primary text-primary-foreground" : "border-border bg-card"
                            }`}
                          >
                            {isSelected && <TbCheck size={14} />}
                          </div>
                          <span className="text-sm text-foreground">{group.name}</span>
                        </div>
                        {group.memberCount !== undefined && (
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md font-mono">
                            {group.memberCount} leads
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-muted-foreground">No contact groups found.</div>
              )}
            </div>

            <div className="px-6 py-4 bg-muted/40 border-t border-border flex items-center justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-foreground/85 bg-card border border-border rounded-xl hover:bg-muted/40"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRecipients}
                className="px-4 py-2 text-xs font-semibold text-primary-foreground bg-primary rounded-xl hover:bg-primary/90 shadow-2xs"
              >
                Save Selection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
