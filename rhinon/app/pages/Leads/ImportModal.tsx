"use client";

import { useState } from "react";
import { UploadCloud, FileSpreadsheet, ArrowRight, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function ImportModal() {
  const [step, setStep] = useState<"upload" | "mapping" | "success">("upload");
  const [isOpen, setIsOpen] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length) {
      setStep("mapping");
    }
  };

  const handleSimulateUpload = () => {
    setStep("mapping");
  };

  const handleConfirmMapping = () => {
    setStep("success");
    setTimeout(() => {
      setIsOpen(false);
      // Reset after closing
      setTimeout(() => setStep("upload"), 500); 
    }, 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-medium rounded-xl">
          Import Leads
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-slate-950 border-slate-800 text-slate-200">
        <DialogHeader>
          <DialogTitle className="text-xl">Import Leads via CSV</DialogTitle>
          <DialogDescription className="text-slate-400">
            Upload a spreadsheet to bulk import contacts into Rhinon CMS.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {step === "upload" && (
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all rounded-xl p-12 flex flex-col items-center justify-center text-center cursor-pointer"
              onClick={handleSimulateUpload}
            >
              <div className="h-12 w-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-4">
                <UploadCloud size={24} className="text-slate-400" />
              </div>
              <h3 className="font-medium text-slate-200 mb-1">Click to upload or drag & drop</h3>
              <p className="text-sm text-slate-500">CSV, XLS, or XLSX files (max 10MB)</p>
            </div>
          )}

          {step === "mapping" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-800 bg-slate-900/50">
                <FileSpreadsheet className="text-emerald-400" size={20} />
                <div className="text-sm">
                  <p className="font-medium">q3_leads_export.csv</p>
                  <p className="text-slate-500">2,400 rows detected</p>
                </div>
              </div>

              <div className="mt-6 border border-slate-800 rounded-lg overflow-hidden">
                <div className="grid grid-cols-[1fr_24px_1fr] items-center gap-2 p-3 bg-slate-900/80 border-b border-slate-800 text-xs font-medium text-slate-400">
                  <div>CSV Column</div>
                  <div></div>
                  <div>Rhinon Field</div>
                </div>
                <div className="divide-y divide-slate-800/50">
                  {["First Name", "Last Name", "Company", "Email Address"].map((csvCol, i) => (
                    <div key={csvCol} className="grid grid-cols-[1fr_24px_1fr] items-center gap-2 p-3 text-sm">
                      <div className="font-mono text-slate-300 bg-slate-900 px-2 py-1 rounded truncate">{csvCol}</div>
                      <ArrowRight size={14} className="text-slate-600 justify-self-center" />
                      <select className="bg-slate-900 border border-slate-800 rounded px-2 py-1 outline-none text-slate-300 w-full focus:border-cyan-500">
                        <option>Map to field...</option>
                        <option selected={i === 0 || i === 1}>Name</option>
                        <option selected={i === 2}>Company</option>
                        <option selected={i === 3}>Email</option>
                        <option>Title</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="py-12 flex flex-col items-center justify-center text-center animate-in zoom-in-95">
              <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                <CheckCircle2 size={32} className="text-emerald-500" />
              </div>
              <h3 className="text-xl font-semibold text-slate-200 mb-2">Import Successful</h3>
              <p className="text-slate-400">2,400 leads have been added to the database.</p>
            </div>
          )}
        </div>

        {step !== "success" && (
          <DialogFooter className="sm:justify-between border-t border-slate-800 pt-4 mt-2">
            <Button
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            >
              Cancel
            </Button>
            {step === "mapping" && (
              <Button onClick={handleConfirmMapping} className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-medium">
                Confirm & Import
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
