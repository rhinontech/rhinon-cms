"use client";

import React, { useState } from "react";
import { TbSettings, TbCheck } from "react-icons/tb";

export default function AutomationSettingsGlobalPage() {
  const [concurrentLimit, setConcurrentLimit] = useState(1);
  const [retryFailedSteps, setRetryFailedSteps] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <TbSettings className="text-foreground/85" /> Automation Global Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Configure system-wide limits and behavior for workflow execution.</p>
      </div>

      <form onSubmit={handleSave} className="bg-card p-6 rounded-2xl border border-border shadow-2xs space-y-6">
        <div>
          <label className="block text-sm font-bold text-foreground mb-1">
            Concurrent Workflow Limit per Lead
          </label>
          <p className="text-xs text-muted-foreground mb-3">
            Controls how many workflows a single lead can be enrolled in simultaneously. By default, a lead can only be in 1 workflow at a time.
          </p>
          <input
            type="number"
            min={1}
            max={10}
            value={concurrentLimit}
            onChange={(e) => setConcurrentLimit(parseInt(e.target.value) || 1)}
            className="w-48 rounded-xl border border-border px-4 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div className="pt-4 border-t border-border flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-foreground">Auto-retry failed email steps</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Automatically retry email sending up to 3 times if temporary SMTP / provider rate limits occur.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={retryFailedSteps}
              onChange={(e) => setRetryFailedSteps(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="flex items-center gap-1.5 px-6 py-2.5 text-sm font-semibold text-primary-foreground bg-primary rounded-xl hover:bg-primary/90 transition-all shadow-xs"
          >
            {saved ? <><TbCheck size={16} /> Saved</> : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
