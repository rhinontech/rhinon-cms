"use client";

import React, { useState, useEffect } from "react";
import { TbX, TbTrash, TbCopy, TbSend } from "react-icons/tb";
import { WorkflowNode, NodeConfig } from "@/types/automation";
import { apiFetch } from "@/lib/api";

interface NodeConfigDrawerProps {
  node: WorkflowNode | null;
  onClose: () => void;
  onSave: (nodeId: string, updatedConfig: NodeConfig, label?: string) => void;
  onDelete: (nodeId: string) => void;
}

export function NodeConfigDrawer({ node, onClose, onSave, onDelete }: NodeConfigDrawerProps) {
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");
  const [config, setConfig] = useState<NodeConfig>({
    fromEmail: "",
    fromName: "Rhinon Tech",
    subject: "",
    emailBody: "",
    delayHours: 6,
    delayDays: 1,
    conditionType: "email_opened",
  });
  const [label, setLabel] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    apiFetch<{ companyEmail?: string; email?: string }>("/auth/me")
      .then((user) => {
        const mail = user.companyEmail || user.email || "";
        if (mail) {
          setCurrentUserEmail(mail);
          setConfig((prev) => ({
            ...prev,
            fromEmail: prev.fromEmail && prev.fromEmail !== "user.email" && prev.fromEmail !== "noreply@rhinontech.com" ? prev.fromEmail : mail,
          }));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (node) {
      const initialConfig = node.data.config || {
        fromEmail: currentUserEmail || "user.email",
        fromName: "Rhinon Tech",
        subject: "",
        emailBody: "",
        delayHours: 6,
        delayDays: 1,
        conditionType: "email_opened",
      };
      if (currentUserEmail && (!initialConfig.fromEmail || initialConfig.fromEmail === "user.email" || initialConfig.fromEmail === "noreply@rhinontech.com")) {
        initialConfig.fromEmail = currentUserEmail;
      }
      setConfig(initialConfig);
      setLabel(node.data.label || "");
      setIsSaved(false);
    }
  }, [node, currentUserEmail]);

  if (!node) return null;

  const handleSave = () => {
    const finalConfig = {
      ...config,
      fromEmail: currentUserEmail || config.fromEmail || "user.email",
    };
    onSave(node.id, finalConfig, label);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-[500px] max-w-full bg-white shadow-2xl border-l border-gray-200 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h3 className="text-lg font-bold text-gray-900 capitalize">{label || node.type.replace("_", " ")}</h3>
          <p className="text-xs text-gray-500">Edit the fields below, then click Save.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              isSaved ? "bg-emerald-100 text-emerald-700" : "bg-gray-900 text-white hover:bg-gray-800"
            }`}
          >
            {isSaved ? "Saved ✓" : "Save"}
          </button>
          {node.type !== "trigger" && node.type !== "exit" && (
            <button
              onClick={() => onDelete(node.id)}
              className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
              title="Delete node"
            >
              <TbTrash size={18} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <TbX size={20} />
          </button>
        </div>
      </div>

      {/* Content Form Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Node Label / Name */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Step Name</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            placeholder="e.g. Welcome Email"
          />
        </div>

        {/* Send Email Specific Fields */}
        {node.type === "send_email" && (
          <>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">From email</label>
              <input
                type="text"
                readOnly
                value={currentUserEmail || config.fromEmail || "Loading email..."}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 font-medium cursor-not-allowed outline-none"
              />
              <p className="text-[11px] text-gray-400 mt-1">Automatically set to logged-in user's email address.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">From name</label>
              <input
                type="text"
                value={config.fromName || "Rhinon Tech"}
                onChange={(e) => setConfig({ ...config, fromName: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                placeholder="Rhinon Tech Team"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Subject</label>
              <input
                type="text"
                value={config.subject || ""}
                onChange={(e) => setConfig({ ...config, subject: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                placeholder="e.g. Welcome to Rhinon Tech!"
              />
              <p className="text-[11px] text-gray-400 mt-1">Personalize with {"{{name}}"}, {"{{email}}"}, {"{{phone}}"}</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-gray-700">Email body</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(config.emailBody || "")}
                    className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-900 border border-gray-200 px-2 py-0.5 rounded"
                  >
                    <TbCopy size={12} /> Copy
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-900 border border-gray-200 px-2 py-0.5 rounded"
                  >
                    <TbSend size={12} /> Send test
                  </button>
                </div>
              </div>

              <textarea
                rows={8}
                value={config.emailBody || ""}
                onChange={(e) => setConfig({ ...config, emailBody: e.target.value })}
                className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-sans"
                placeholder="Hi {{name}},&#10;&#10;Welcome to Rhinon Tech! We are excited to work with you..."
              />
            </div>
          </>
        )}

        {/* Wait Node Specific Fields */}
        {node.type === "wait" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Delay Duration</label>
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
                  className="w-1/2 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
                <select
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
                  className="w-1/2 rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-indigo-500 outline-none"
                >
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </select>
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5">
                The workflow will pause for this duration before executing the next step.
              </p>
            </div>
          </div>
        )}

        {/* If / Then Node Specific Fields */}
        {node.type === "if_then" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Condition Rule</label>
              <select
                value={config.conditionType || "email_opened"}
                onChange={(e) => setConfig({ ...config, conditionType: e.target.value as NodeConfig["conditionType"] })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none bg-white font-medium text-gray-800"
              >
                <option value="email_opened">Previous email was opened</option>
                <option value="link_clicked">Link inside previous email was clicked</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Waiting Time before checking</label>
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
                  className="w-1/2 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
                <select
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
                  className="w-1/2 rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-indigo-500 outline-none"
                >
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </select>
              </div>
              <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">
                The workflow will pause for this duration to give the recipient time to interact. If they open/click during this window, they take the <span className="font-semibold text-emerald-600">YES</span> path; otherwise, they take the <span className="font-semibold text-rose-600">NO</span> path.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
