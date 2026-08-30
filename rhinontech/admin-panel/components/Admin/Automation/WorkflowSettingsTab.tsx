"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TbSettings } from "react-icons/tb";
import { WorkflowItem } from "@/types/automation";

interface WorkflowSettingsTabProps {
  workflow: WorkflowItem;
  onSave: (updated: { name: string; description: string }) => void;
  roleSlug: string;
}

export function WorkflowSettingsTab({ workflow, onSave, roleSlug }: WorkflowSettingsTabProps) {
  const [name, setName] = useState(workflow.name);
  const [description, setDescription] = useState(workflow.description || "");
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, description });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="p-6 max-w-5xl">
      <form onSubmit={handleSubmit} className="bg-card p-6 rounded-2xl border border-border shadow-2xs space-y-6">
        <div>
          <label className="block text-xs font-bold text-foreground/85 mb-1">Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-foreground/85 mb-1">Description</label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            placeholder="Add internal notes or describe what this workflow accomplishes..."
          />
        </div>

        {/* Concurrent Workflow Limit Banner */}
        <div className="p-4 rounded-xl bg-muted/40 border border-border flex items-start gap-3">
          <TbSettings size={20} className="text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-xs text-foreground/70">
            <h5 className="font-bold text-foreground mb-0.5">Concurrent workflow limit</h5>
            <p className="leading-relaxed">
              The number of workflows a single lead can be active in at once is configured system-wide. By default a lead can only be in one workflow at a time — raise it in settings to let leads run through multiple workflows simultaneously.{" "}
              <Link href={`/${roleSlug}/automation/settings`} className="underline font-semibold text-indigo-600 dark:text-indigo-300">
                Open workflow settings
              </Link>.
            </p>
          </div>
        </div>

        <div>
          <button
            type="submit"
            className="px-6 py-2.5 text-sm font-semibold text-primary-foreground bg-primary rounded-xl hover:bg-primary/90 transition-all shadow-xs"
          >
            {isSaved ? "Saved ✓" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
