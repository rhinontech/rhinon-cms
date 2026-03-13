import { LeadsTable } from "@/app/pages/Leads/LeadsTable";
import { ImportModal } from "@/app/pages/Leads/ImportModal";
import { Users } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lead Management | Rhinon CMS",
};

export default function LeadsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500">
            <Users size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Lead Management</h1>
            <p className="text-sm text-slate-400">View, import, and manage your contacts</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ImportModal />
        </div>
      </div>

      <LeadsTable />
    </div>
  );
}
