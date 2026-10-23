"use client";

import React, { useState, useEffect } from "react";
import { TbX, TbTrash, TbCopy, TbSend } from "react-icons/tb";
import { WorkflowNode, NodeConfig } from "@/types/automation";
import { apiFetch } from "@/lib/api";
import { EmailBodyEditor } from "@/components/Admin/Outreach/shared/EmailBodyEditor";

import { NativeSelect } from "@/components/ui/native-select";
interface NodeConfigDrawerProps {
  node: WorkflowNode | null;
  onClose: () => void;
  onSave: (nodeId: string, updatedConfig: NodeConfig, label?: string) => void;
  onDelete: (nodeId: string) => void;
}

/** An address this person may send from: their own, or a shared one assigned to them. */
interface SenderOption {
  address: string;
  name: string | null;
  shared: boolean;
}

export function NodeConfigDrawer({ node, onClose, onSave, onDelete }: NodeConfigDrawerProps) {
  const [senders, setSenders] = useState<SenderOption[]>([]);
  const [config, setConfig] = useState<NodeConfig>({
    fromEmail: "",
    fromName: "", // empty: the workspace's own name
    subject: "",
    emailBody: "",
    delayHours: 6,
    delayDays: 1,
    conditionType: "email_opened",
  });
  const [label, setLabel] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  // Same list the Inbox composer offers: the user's own address first, then any
  // shared addresses (hello@, support@) assigned to them in Team → Email addresses.
  useEffect(() => {
    apiFetch<SenderOption[]>("/inbox/addresses").then(setSenders).catch(() => setSenders([]));
  }, []);
  const ownAddress = senders.find((s) => !s.shared)?.address ?? senders[0]?.address ?? "";

  useEffect(() => {
    if (node) {
      const initialConfig = node.data.config || {
        fromEmail: ownAddress,
        fromName: "", // empty: the workspace's own name
        subject: "",
        emailBody: "",
        delayHours: 6,
        delayDays: 1,
        conditionType: "email_opened",
      };
      // Only addresses this user may send from are offered, so clamp anything else
      // (an unset placeholder, or a value left behind by a different user) back to
      // their own address instead of silently sending from a stale one.
      if (senders.length && !senders.some((s) => s.address === initialConfig.fromEmail)) {
        initialConfig.fromEmail = ownAddress;
      }
      setConfig(initialConfig);
      setLabel(node.data.label || "");
      setIsSaved(false);
    }
  }, [node, senders, ownAddress]);

  if (!node) return null;

  const handleSave = () => {
    onSave(node.id, config, label);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-[500px] max-w-full bg-card shadow-2xl border-l border-border flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <h3 className="text-lg font-bold text-foreground capitalize">{label || node.type.replace("_", " ")}</h3>
          <p className="text-xs text-muted-foreground">Edit the fields below, then click Save.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${isSaved ? "bg-emerald-100 dark:bg-emerald-400/15 text-emerald-700 dark:text-emerald-300" : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
          >
            {isSaved ? "Saved ✓" : "Save"}
          </button>
          {node.type !== "trigger" && node.type !== "exit" && (
            <button
              onClick={() => onDelete(node.id)}
              className="p-1.5 text-muted-foreground hover:text-rose-600 dark:hover:text-rose-300 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-400/10 transition-colors"
              title="Delete node"
            >
              <TbTrash size={18} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground/70 rounded-lg hover:bg-muted transition-colors"
          >
            <TbX size={20} />
          </button>
        </div>
      </div>

      {/* Content Form Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Node Label / Name */}
        <div>
          <label className="block text-xs font-semibold text-foreground/85 mb-1">Step Name</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            placeholder="e.g. Welcome Email"
          />
        </div>

        {/* Send Email Specific Fields */}
        {node.type === "send_email" && (
          <>
            <div>
              <label className="block text-xs font-semibold text-foreground/85 mb-1">From email</label>
              <NativeSelect
                value={config.fromEmail || ownAddress}
                onChange={(e) => setConfig({ ...config, fromEmail: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-card font-medium text-foreground focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              >
                {senders.map((s) => (
                  <option key={s.address} value={s.address}>
                    {s.address} {s.shared ? "(shared)" : "(you)"}
                  </option>
                ))}
              </NativeSelect>
              <p className="text-[11px] text-muted-foreground mt-1">Your own address, or a shared one assigned to you in Team → Email addresses.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground/85 mb-1">From name</label>
              <input
                type="text"
                value={config.fromName || "Rhinon Tech"}
                onChange={(e) => setConfig({ ...config, fromName: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                placeholder="Rhinon Tech Team"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground/85 mb-1">Subject</label>
              <input
                type="text"
                value={config.subject || ""}
                onChange={(e) => setConfig({ ...config, subject: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                placeholder="e.g. Welcome to Rhinon Tech!"
              />
              <p className="text-[11px] text-muted-foreground mt-1">Personalize with {"{{name}}"}, {"{{email}}"}, {"{{phone}}"}</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-foreground/85">Email body</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(config.emailBody || "")}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground border border-border px-2 py-0.5 rounded"
                  >
                    <TbCopy size={12} /> Copy
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground border border-border px-2 py-0.5 rounded"
                  >
                    <TbSend size={12} /> Send test
                  </button>
                </div>
              </div>

              <EmailBodyEditor
                value={config.emailBody || ""}
                onChange={(html) => setConfig({ ...config, emailBody: html })}
                placeholder="Hi {{name}},&#10;&#10;Welcome to Rhinon Tech! We are excited to work with you..."
                minHeight="220px"
              />
            </div>
          </>
        )}

        {/* Wait Node Specific Fields */}
        {node.type === "wait" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground/85 mb-1">Delay Duration</label>
              <div className="flex gap-3">
                <input
                  type="number"
                  min={1}
                  value={
                    config.delayUnit === "minutes" || (!config.delayUnit && config.delayMinutes)
                      ? config.delayMinutes || config.delayValue || 30
                      : config.delayUnit === "days" || (!config.delayUnit && config.delayDays)
                        ? config.delayDays || config.delayValue || 1
                        : config.delayHours || config.delayValue || 6
                  }
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    const currentUnit =
                      config.delayUnit ||
                      (config.delayMinutes ? "minutes" : config.delayDays ? "days" : "hours");
                    setConfig({
                      ...config,
                      delayValue: val,
                      delayUnit: currentUnit,
                      delayMinutes: currentUnit === "minutes" ? val : undefined,
                      delayHours: currentUnit === "hours" ? val : undefined,
                      delayDays: currentUnit === "days" ? val : undefined,
                    });
                  }}
                  className="w-1/2 rounded-lg border border-border px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
                <NativeSelect
                  value={
                    config.delayUnit ||
                    (config.delayMinutes ? "minutes" : config.delayDays ? "days" : "hours")
                  }
                  onChange={(e) => {
                    const unit = e.target.value as "minutes" | "hours" | "days";
                    const currentVal =
                      config.delayValue ||
                      (unit === "minutes"
                        ? config.delayMinutes || 30
                        : unit === "days"
                          ? config.delayDays || 1
                          : config.delayHours || 6);

                    setConfig({
                      ...config,
                      delayUnit: unit,
                      delayValue: currentVal,
                      delayMinutes: unit === "minutes" ? currentVal : undefined,
                      delayHours: unit === "hours" ? currentVal : undefined,
                      delayDays: unit === "days" ? currentVal : undefined,
                    });
                  }}
                  className="w-1/2 rounded-lg border border-border px-3 py-2 text-sm bg-card focus:border-indigo-500 outline-none"
                >
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </NativeSelect>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5">
                The workflow will pause for this duration before executing the next step.
              </p>
            </div>
          </div>
        )}

        {/* Manual touch steps — both create a task and advance immediately */}
        {(node.type === "call_task" || node.type === "linkedin_step") && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground/85 mb-1">Task title</label>
              <input
                value={config.title || ""}
                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                placeholder={node.type === "call_task" ? "Call {{name}} about pricing" : "Connect with {{name}} on LinkedIn"}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none bg-card font-medium text-foreground"
              />
              <p className="text-[11px] text-muted-foreground mt-1.5">
                Merge tags like <code>{"{{name}}"}</code> and <code>{"{{company}}"}</code> work here.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground/85 mb-1">Notes</label>
              <textarea
                value={config.notes || ""}
                onChange={(e) => setConfig({ ...config, notes: e.target.value })}
                placeholder="What should the rep cover?"
                className="w-full h-20 resize-none rounded-lg border border-border px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none bg-card text-foreground"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground/85 mb-1">Due in (days)</label>
                <input
                  type="number"
                  min={0}
                  value={config.dueInDays ?? 1}
                  onChange={(e) => setConfig({ ...config, dueInDays: Number(e.target.value) })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none bg-card font-medium text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground/85 mb-1">Priority</label>
                <NativeSelect
                  value={config.priority || "Medium"}
                  onChange={(e) => setConfig({ ...config, priority: e.target.value as NodeConfig["priority"] })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none bg-card font-medium text-foreground"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </NativeSelect>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Assigned to the lead&apos;s owner, or to whoever created this workflow if the lead has none.
              The sequence moves to the next step straight away — it does not wait for the task to be done.
            </p>
          </div>
        )}

        {/* A/B split */}
        {node.type === "ab_split" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground/85 mb-1">
                Share taking variant A — {config.splitPercent ?? 50}%
              </label>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={config.splitPercent ?? 50}
                onChange={(e) => setConfig({ ...config, splitPercent: Number(e.target.value) })}
                className="w-full accent-fuchsia-600"
              />
              <div className="flex justify-between text-[11px] font-semibold text-muted-foreground mt-1">
                <span className="text-fuchsia-600 dark:text-fuchsia-300">A · {config.splitPercent ?? 50}%</span>
                <span className="text-indigo-600 dark:text-indigo-300">B · {100 - (config.splitPercent ?? 50)}%</span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              The branch is picked once per lead and remembered, so a retry can never send the same
              lead down both paths. Connect the A and B handles to the two variants you want to compare.
            </p>
          </div>
        )}

        {/* If / Then Node Specific Fields */}
        {node.type === "if_then" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground/85 mb-1">Condition Rule</label>
              <NativeSelect
                value={config.conditionType || "email_opened"}
                onChange={(e) => setConfig({ ...config, conditionType: e.target.value as NodeConfig["conditionType"] })}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none bg-card font-medium text-foreground"
              >
                <option value="email_opened">Previous email was opened</option>
                <option value="link_clicked">Link inside previous email was clicked</option>
              </NativeSelect>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground/85 mb-1">Waiting Time before checking</label>
              <div className="flex gap-3">
                <input
                  type="number"
                  min={1}
                  value={
                    config.checkDelayUnit === "minutes" || (!config.checkDelayUnit && config.checkDelayMinutes)
                      ? config.checkDelayMinutes || config.checkDelayValue || 30
                      : config.checkDelayUnit === "days" || (!config.checkDelayUnit && config.checkDelayDays)
                        ? config.checkDelayDays || config.checkDelayValue || 1
                        : config.checkDelayHours || config.checkDelayValue || 24
                  }
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    const currentUnit =
                      config.checkDelayUnit ||
                      (config.checkDelayMinutes ? "minutes" : config.checkDelayDays ? "days" : "hours");
                    setConfig({
                      ...config,
                      checkDelayValue: val,
                      checkDelayUnit: currentUnit,
                      checkDelayMinutes: currentUnit === "minutes" ? val : undefined,
                      checkDelayHours: currentUnit === "hours" ? val : undefined,
                      checkDelayDays: currentUnit === "days" ? val : undefined,
                    });
                  }}
                  className="w-1/2 rounded-lg border border-border px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
                <NativeSelect
                  value={
                    config.checkDelayUnit ||
                    (config.checkDelayMinutes ? "minutes" : config.checkDelayDays ? "days" : "hours")
                  }
                  onChange={(e) => {
                    const unit = e.target.value as "minutes" | "hours" | "days";
                    const currentVal =
                      config.checkDelayValue ||
                      (unit === "minutes"
                        ? config.checkDelayMinutes || 30
                        : unit === "days"
                          ? config.checkDelayDays || 1
                          : config.checkDelayHours || 24);

                    setConfig({
                      ...config,
                      checkDelayUnit: unit,
                      checkDelayValue: currentVal,
                      checkDelayMinutes: unit === "minutes" ? currentVal : undefined,
                      checkDelayHours: unit === "hours" ? currentVal : undefined,
                      checkDelayDays: unit === "days" ? currentVal : undefined,
                    });
                  }}
                  className="w-1/2 rounded-lg border border-border px-3 py-2 text-sm bg-card focus:border-indigo-500 outline-none"
                >
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </NativeSelect>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                The workflow will pause for this duration to give the recipient time to interact. If they open/click during this window, they take the <span className="font-semibold text-emerald-600 dark:text-emerald-300">YES</span> path; otherwise, they take the <span className="font-semibold text-rose-600 dark:text-rose-300">NO</span> path.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
